// Prueba local contra un Stripe simulado. Ejecutar: node test.js
const http=require("http"),crypto=require("crypto");
const mock=http.createServer((q,r)=>{r.setHeader("content-type","application/json");
 if(q.url.startsWith("/v1/checkout/sessions/cs_ok"))return r.end(JSON.stringify({status:"complete",subscription:{id:"sub_1",customer:"cus_1",status:"active",current_period_end:Math.floor(Date.now()/1000)+86400*30,items:{data:[{price:{id:"price_y"}}]}}}));
 if(q.url.startsWith("/v1/checkout/sessions/cs_unpaid"))return r.end(JSON.stringify({status:"open",subscription:null}));
 if(q.url==="/v1/oauth2/token")return r.end(JSON.stringify({access_token:"at"}));
 if(q.url==="/v1/billing/subscriptions")return r.end(JSON.stringify({id:"I-NEW123456",links:[{rel:"approve",href:"https://paypal.test/approve"}]}));
 if(q.url==="/v1/billing/subscriptions/I-ACTIVE123456")return r.end(JSON.stringify({status:"ACTIVE",plan_id:"P-Y",billing_info:{next_billing_time:new Date(Date.now()+864e5*30).toISOString()}}));
 if(q.url==="/v1/billing/subscriptions/I-OTHERPLAN12")return r.end(JSON.stringify({status:"ACTIVE",plan_id:"P-OTRO",billing_info:{next_billing_time:new Date(Date.now()+864e5).toISOString()}}));
 if(q.url==="/v1/billing/subscriptions/I-ACTIVE123456/cancel"){global.ppCancelled=true;return r.end()}
 if(q.url==="/v1/checkout/sessions")return r.end(JSON.stringify({url:"https://checkout.stripe.test/c"}));
 if(q.url==="/v1/billing_portal/sessions")return r.end(JSON.stringify({url:"https://portal.stripe.test/p"}));
 r.statusCode=404;r.end("{}")}).listen(0,()=>{
 const sp=mock.address().port;
 Object.assign(process.env,{STRIPE_SECRET_KEY:"sk_test",STRIPE_WEBHOOK_SECRET:"whsec_t",TOKEN_SECRET:"s",STRIPE_PRICE_MONTHLY:"price_m",STRIPE_PRICE_YEARLY:"price_y",STRIPE_API_BASE:"http://127.0.0.1:"+sp,PAYPAL_CLIENT_ID:"c",PAYPAL_SECRET:"s",PAYPAL_PLAN_MONTHLY:"P-M",PAYPAL_PLAN_YEARLY:"P-Y",PAYPAL_API_BASE:"http://127.0.0.1:"+sp,DATA_FILE:"/tmp/mv-test-subs.json"});
 const{server}=require("./server");server.listen(0,async()=>{
  const b="http://127.0.0.1:"+server.address().port,J=(p,o)=>fetch(b+p,o).then(r=>r.json());
  const post=(p,x)=>J(p,{method:"POST",body:JSON.stringify(x)});let ok=true;const chk=(n,c)=>{console.log(c?"OK  ":"FAIL",n);if(!c)ok=false};
  chk("checkout devuelve url",(await post("/api/checkout",{plan:"monthly"})).url.includes("stripe"));
  chk("plan inválido rechazado",(await post("/api/checkout",{plan:"x"})).error);
  chk("sesión sin pagar no desbloquea",(await J("/api/status?session_id=cs_unpaid")).validated===false);
  const st=await J("/api/status?session_id=cs_ok");chk("sesión pagada desbloquea",st.validated&&st.token&&st.plan==="yearly");
  chk("verify con token válido",(await post("/api/verify",{token:st.token})).validated);
  chk("verify con token manipulado",(await post("/api/verify",{token:st.token+"x"})).validated===false);
  chk("portal con token",(await post("/api/portal",{token:st.token})).url.includes("portal"));
  const body=JSON.stringify({type:"customer.subscription.deleted",data:{object:{id:"sub_1",customer:"cus_1",status:"canceled",current_period_end:Math.floor(Date.now()/1000)+10,items:{data:[{price:{id:"price_y"}}]}}}});
  const t=Math.floor(Date.now()/1000),sig=crypto.createHmac("sha256","whsec_t").update(t+"."+body).digest("hex");
  const w=await fetch(b+"/api/webhook",{method:"POST",headers:{"stripe-signature":`t=${t},v1=${sig}`},body});chk("webhook firmado aceptado",w.status===200);
  chk("webhook sin firma rechazado",(await fetch(b+"/api/webhook",{method:"POST",headers:{"stripe-signature":`t=${t},v1=00`},body})).status===400);
  chk("cancelación revoca acceso",(await post("/api/verify",{token:st.token})).validated===false);
  chk("paypal checkout devuelve aprobación",(await post("/api/paypal/checkout",{plan:"yearly"})).url.includes("paypal"));
  chk("paypal plan inválido",(await post("/api/paypal/checkout",{plan:"x"})).error);
  chk("paypal id malformado rechazado",(await J("/api/paypal/status?subscription_id=../x")).error);
  chk("paypal plan ajeno no desbloquea",(await J("/api/paypal/status?subscription_id=I-OTHERPLAN12")).validated===false);
  const pp=await J("/api/paypal/status?subscription_id=I-ACTIVE123456");chk("paypal activa desbloquea",pp.validated&&pp.plan==="yearly"&&pp.token);
  chk("paypal verify",(await post("/api/verify",{token:pp.token})).validated);
  chk("paypal cancelar",(await post("/api/paypal/cancel",{token:pp.token})).cancelled&&global.ppCancelled);
  console.log(ok?"TODO OK":"HAY FALLOS");process.exit(ok?0:1)})});
