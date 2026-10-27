"use strict";
// Backend de suscripciones de Mar Vital (Stripe Checkout). Sin dependencias: Node 18+.
// El acceso premium solo se concede tras confirmar el pago con la API de Stripe; la app nunca ve datos de tarjeta.
const http=require("http"),crypto=require("crypto"),fs=require("fs");
const E=process.env;
const CFG={
 key:E.STRIPE_SECRET_KEY,whsec:E.STRIPE_WEBHOOK_SECRET,
 prices:{monthly:E.STRIPE_PRICE_MONTHLY,yearly:E.STRIPE_PRICE_YEARLY}, // price_... de 5 USD/mes y 20 USD/año
 appUrl:(E.APP_URL||"http://localhost:8080/marvital/").replace(/\/?$/,"/"),
 pp:{id:E.PAYPAL_CLIENT_ID,secret:E.PAYPAL_SECRET,plans:{monthly:E.PAYPAL_PLAN_MONTHLY,yearly:E.PAYPAL_PLAN_YEARLY},api:E.PAYPAL_API_BASE||"https://api-m.sandbox.paypal.com"}, // sandbox por defecto
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

/* PayPal Subscriptions. Opcional: se activa si hay PAYPAL_CLIENT_ID. El estado se consulta en vivo a PayPal. */
async function paypal(method,path,body){
 const a=await fetch(CFG.pp.api+"/v1/oauth2/token",{method:"POST",headers:{authorization:"Basic "+Buffer.from(CFG.pp.id+":"+CFG.pp.secret).toString("base64"),"content-type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials"});
 const at=(await a.json()).access_token;if(!at)throw new Error("PayPal: sin token");
 const r=await fetch(CFG.pp.api+path,{method,headers:{authorization:"Bearer "+at,"content-type":"application/json"},body:body?JSON.stringify(body):undefined});
 const t=await r.text(),j=t?JSON.parse(t):{};if(!r.ok)throw new Error("PayPal: "+(j.message||r.status));return j}
const PPID=/^I-[A-Z0-9]{6,40}$/;
async function ppGrant(id){ // ACTIVE = acceso; CANCELLED = acceso hasta el fin del periodo ya pagado (último valor conocido)
 const s=await paypal("GET","/v1/billing/subscriptions/"+id),plans=CFG.pp.plans;
 const plan=s.plan_id===plans.yearly?"yearly":s.plan_id===plans.monthly?"monthly":null;if(!plan)return{validated:false};
 const d=load(),k="pp:"+id;
 if(s.status==="ACTIVE"&&s.billing_info&&s.billing_info.next_billing_time){d[k]={status:"ACTIVE",until:Date.parse(s.billing_info.next_billing_time)+864e5,plan};save(d)}
 else if(s.status==="CANCELLED"&&d[k])d[k].status="CANCELLED",save(d);
 const r=d[k];return r&&r.until>Date.now()&&["ACTIVE","CANCELLED"].includes(r.status)?{validated:true,until:r.until,plan}:{validated:false}}

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
  if(u.pathname==="/api/health")return send(res,200,{ok:true});
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
   if(t.pp)return send(res,200,await ppGrant(t.pp));
   const r=load()[t.sub]||record(await stripe("GET","/v1/subscriptions/"+t.sub));return send(res,200,grant(r))}
  if(req.method==="POST"&&u.pathname==="/api/portal"){ // cancelar / gestionar
   const t=unsign(JSON.parse(await read(req)||"{}").token),r=t&&t.sub&&(load()[t.sub]||record(await stripe("GET","/v1/subscriptions/"+t.sub)));if(!r)return send(res,401,{error:"no autorizado"});
   const p=await stripe("POST","/v1/billing_portal/sessions",{customer:r.customer,return_url:CFG.appUrl});return send(res,200,{url:p.url})}
  if(u.pathname.startsWith("/api/paypal/")&&!CFG.pp.id)return send(res,501,{error:"PayPal no configurado"});
  if(req.method==="POST"&&u.pathname==="/api/paypal/checkout"){
   const{plan}=JSON.parse(await read(req)||"{}"),plan_id=CFG.pp.plans[plan];if(!plan_id)return send(res,400,{error:"plan inválido"});
   const s=await paypal("POST","/v1/billing/subscriptions",{plan_id,application_context:{brand_name:"Mar Vital",user_action:"SUBSCRIBE_NOW",return_url:CFG.appUrl+"?pp=1",cancel_url:CFG.appUrl}});
   const l=(s.links||[]).find(x=>x.rel==="approve");return l?send(res,200,{url:l.href}):send(res,502,{error:"sin enlace de aprobación"})}
  if(req.method==="GET"&&u.pathname==="/api/paypal/status"){
   const id=u.searchParams.get("subscription_id");if(!PPID.test(id||""))return send(res,400,{error:"suscripción inválida"});
   const g=await ppGrant(id);return send(res,200,g.validated?{...g,token:sign({pp:id})}:g)}
  if(req.method==="POST"&&u.pathname==="/api/paypal/cancel"){
   const t=unsign(JSON.parse(await read(req)||"{}").token);if(!t||!t.pp)return send(res,401,{error:"no autorizado"});
   await paypal("POST","/v1/billing/subscriptions/"+t.pp+"/cancel",{reason:"Cancelada por el usuario"});return send(res,200,{cancelled:true})}
  send(res,404,{error:"no encontrado"});
 }catch(e){console.error(e.message);send(res,500,{error:"error del servidor"})}
});
if(require.main===module)server.listen(CFG.port,()=>console.log("Mar Vital API en :"+CFG.port));
module.exports={server,verifyWebhook};
