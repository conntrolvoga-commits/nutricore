"use strict";
// Backend de suscripciones de Mar Vital (Stripe Checkout). Sin dependencias: Node 18+.
// El acceso premium solo se concede tras confirmar el pago con la API de Stripe; la app nunca ve datos de tarjeta.
const http=require("http"),crypto=require("crypto"),fs=require("fs");
const E=process.env;
const CFG={
 key:E.STRIPE_SECRET_KEY,whsec:E.STRIPE_WEBHOOK_SECRET,
 prices:{monthly:E.STRIPE_PRICE_MONTHLY,yearly:E.STRIPE_PRICE_YEARLY}, // price_... de 5 USD/mes y 20 USD/año
 appUrl:(E.APP_URL||"http://localhost:8080/marvital/").replace(/\/?$/,"/"),
 tokenSecret:E.TOKEN_SECRET,api:E.STRIPE_API_BASE||"https://api.stripe.com",
 data:E.DATA_FILE||"./subscriptions.json",port:+E.PORT||8787,origin:E.ALLOWED_ORIGIN||"*"};
for(const k of ["key","whsec","tokenSecret"])if(!CFG[k]){console.error("Falta configuración: "+k);process.exit(1)}

/* Almacén simple en archivo. En producción, sustituir por una base de datos. */
const load=()=>{try{return JSON.parse(fs.readFileSync(CFG.data,"utf8"))}catch(e){return{}}};
const save=d=>fs.writeFileSync(CFG.data,JSON.stringify(d,null,1));

const form=(o,p="",out=[])=>{for(const[k,v]of Object.entries(o)){const n=p?`${p}[${k}]`:k;typeof v==="object"?form(v,n,out):out.push(encodeURIComponent(n)+"="+encodeURIComponent(v))}return out.join("&")};
async function stripe(method,path,body){
 const r=await fetch(CFG.api+path,{method,headers:{authorization:"Bearer "+CFG.key,"content-type":"application/x-www-form-urlencoded"},body:body?form(body):undefined});
 const j=await r.json();if(!r.ok)throw new Error("Stripe: "+(j.error&&j.error.message||r.status));return j}

const sign=p=>{const b=Buffer.from(JSON.stringify(p)).toString("base64url");return b+"."+crypto.createHmac("sha256",CFG.tokenSecret).update(b).digest("base64url")};
const unsign=t=>{const[b,s]=String(t||"").split(".");if(!b||!s)return null;const e=crypto.createHmac("sha256",CFG.tokenSecret).update(b).digest("base64url");
 const A=Buffer.from(s),B=Buffer.from(e);if(A.length!==B.length||!crypto.timingSafeEqual(A,B))return null;try{return JSON.parse(Buffer.from(b,"base64url"))}catch(e){return null}};

const subEnd=s=>(s.current_period_end??(s.items&&s.items.data[0]&&s.items.data[0].current_period_end))*1000;
const OK=new Set(["active","trialing"]);
function record(s){const d=load();d[s.id]={customer:s.customer,status:s.status,until:subEnd(s),plan:s.items&&s.items.data[0]&&s.items.data[0].price.id===CFG.prices.yearly?"yearly":"monthly"};save(d);return d[s.id]}
const grant=r=>OK.has(r.status)&&r.until>Date.now()?{validated:true,until:r.until,plan:r.plan}:{validated:false};

function verifyWebhook(raw,header){ // Stripe-Signature: t=...,v1=...
 const p=Object.fromEntries(String(header||"").split(",").map(x=>x.split("=")));
 if(!p.t||!p.v1||Math.abs(Date.now()/1000-p.t)>300)return false;
 const e=crypto.createHmac("sha256",CFG.whsec).update(p.t+"."+raw).digest("hex"),A=Buffer.from(p.v1),B=Buffer.from(e);
 return A.length===B.length&&crypto.timingSafeEqual(A,B)}

const read=req=>new Promise((res,rej)=>{let b="";req.on("data",c=>{b+=c;if(b.length>1e5){rej(new Error("grande"));req.destroy()}});req.on("end",()=>res(b))});
const send=(res,c,o)=>{res.writeHead(c,{"content-type":"application/json","access-control-allow-origin":CFG.origin,"access-control-allow-headers":"content-type","access-control-allow-methods":"GET,POST,OPTIONS"});res.end(JSON.stringify(o))};

const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,"http://x");
 if(req.method==="OPTIONS")return send(res,204,{});
 try{
  if(req.method==="POST"&&u.pathname==="/api/checkout"){
   const{plan}=JSON.parse(await read(req)||"{}");const price=CFG.prices[plan];
   if(!price)return send(res,400,{error:"plan inválido"});
   const s=await stripe("POST","/v1/checkout/sessions",{mode:"subscription",line_items:{0:{price,quantity:1}},
    success_url:CFG.appUrl+"?session_id={CHECKOUT_SESSION_ID}",cancel_url:CFG.appUrl});
   return send(res,200,{url:s.url})}
  if(req.method==="POST"&&u.pathname==="/api/webhook"){
   const raw=await read(req);
   if(!verifyWebhook(raw,req.headers["stripe-signature"]))return send(res,400,{error:"firma inválida"});
   const ev=JSON.parse(raw),o=ev.data.object;
   if(ev.type.startsWith("customer.subscription."))record(o);
   if(ev.type==="checkout.session.completed"&&o.subscription)record(await stripe("GET","/v1/subscriptions/"+o.subscription));
   return send(res,200,{received:true})}
  if(req.method==="GET"&&u.pathname==="/api/status"){ // tras volver de Checkout
   const id=u.searchParams.get("session_id");if(!/^cs_[A-Za-z0-9_]+$/.test(id||""))return send(res,400,{error:"sesión inválida"});
   const s=await stripe("GET","/v1/checkout/sessions/"+id+"?expand[]=subscription");
   if(s.status!=="complete"||!s.subscription)return send(res,200,{validated:false});
   const g=grant(record(s.subscription));
   return send(res,200,g.validated?{...g,token:sign({sub:s.subscription.id})}:g)}
  if(req.method==="POST"&&u.pathname==="/api/verify"){ // al abrir la app
   const t=unsign(JSON.parse(await read(req)||"{}").token);if(!t)return send(res,200,{validated:false});
   const r=load()[t.sub]||record(await stripe("GET","/v1/subscriptions/"+t.sub));return send(res,200,grant(r))}
  if(req.method==="POST"&&u.pathname==="/api/portal"){ // cancelar / gestionar
   const t=unsign(JSON.parse(await read(req)||"{}").token),r=t&&load()[t.sub];if(!r)return send(res,401,{error:"no autorizado"});
   const p=await stripe("POST","/v1/billing_portal/sessions",{customer:r.customer,return_url:CFG.appUrl});return send(res,200,{url:p.url})}
  send(res,404,{error:"no encontrado"});
 }catch(e){console.error(e.message);send(res,500,{error:"error del servidor"})}
});
if(require.main===module)server.listen(CFG.port,()=>console.log("Mar Vital API en :"+CFG.port));
module.exports={server,verifyWebhook};
