const BASE = "https://dripclientofficial.dev";
const cors = origin => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin"
});
const json = (obj,status=200,origin="*") => new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json",...cors(origin)}});
async function sign(payload, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const body = btoa(JSON.stringify(payload)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const sig = await crypto.subtle.sign("HMAC",key,enc.encode(body));
  const bytes = String.fromCharCode(...new Uint8Array(sig));
  return body+"."+btoa(bytes).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
}
async function verify(token,secret){
  try{
    const [body,sig]=token.split(".");
    const expected=await sign(JSON.parse(atob(body.replace(/-/g,"+").replace(/_/g,"/"))),secret);
    return expected===token;
  }catch{return false}
}
async function drip(path,env,method="GET",body=null,extra={}) {
  const headers={"Accept":"application/json"};
  if(env.DRIP_API_KEY) headers.Authorization=`Bearer ${env.DRIP_API_KEY}`;
  if(body){headers["Content-Type"]="application/json";headers["Idempotency-Key"]=crypto.randomUUID()}
  const r=await fetch(BASE+path,{method,headers,body:body?JSON.stringify(body):undefined});
  const d=await r.json();
  if(!r.ok) throw new Error(d.error?.message||`Drip API error ${r.status}`);
  return d.data;
}
export default {
 async fetch(req,env){
  const origin=req.headers.get("Origin")||"";
  const allowed=env.ALLOWED_ORIGIN||"";
  if(req.method==="OPTIONS") return new Response(null,{headers:cors(allowed)});
  if(origin!==allowed) return json({error:{message:"Origin tidak diizinkan"}},403,allowed||"*");
  const url=new URL(req.url), path=url.pathname;
  try{
   if(path==="/api/login"&&req.method==="POST"){
    const {username,password}=await req.json();
    if(username!==env.ADMIN_USER||password!==env.ADMIN_PASSWORD) return json({error:{message:"Username atau password salah"}},401,allowed);
    const token=await sign({admin:true,exp:Date.now()+8*60*60*1000},env.SESSION_SECRET);
    return json({data:{token}},200,allowed);
   }
   if(path==="/api/products"&&req.method==="GET"){
    const d=await drip("/api/v1/products",env);
    return json({data:d},200,allowed);
   }
   const auth=(req.headers.get("Authorization")||"").replace(/^Bearer /,"");
   if(!auth||!await verify(auth,env.SESSION_SECRET)) return json({error:{message:"Silakan login admin"}},401,allowed);
   const [payload]=auth.split(".");
   const claims=JSON.parse(atob(payload.replace(/-/g,"+").replace(/_/g,"/")));
   if(!claims.admin||claims.exp<Date.now()) return json({error:{message:"Sesi admin kedaluwarsa"}},401,allowed);
   if(path==="/api/balance"&&req.method==="GET") return json({data:await drip("/api/v1/balance",env)},200,allowed);
   if(path==="/api/orders"&&req.method==="POST"){
    const {sku,quantity}=await req.json();
    if(typeof sku!=="string"||!sku||!Number.isInteger(quantity)||quantity<1||quantity>50) return json({error:{message:"SKU atau jumlah tidak valid"}},400,allowed);
    return json({data:await drip("/api/v1/orders",env,"POST",{sku,quantity})},200,allowed);
   }
   return json({error:{message:"Endpoint tidak ditemukan"}},404,allowed);
  }catch(e){return json({error:{message:e.message||"Kesalahan server"}},502,allowed)}
 }
};