const API = "https://YOUR-WORKER.workers.dev";
let catalog = [];
let token = sessionStorage.getItem("drip_admin_token") || "";
const $ = id => document.getElementById(id);
const money = v => v ? `$${v}` : "Harga tidak tersedia";
function show(id){$(id).classList.remove("hidden")}
function hide(id){$(id).classList.add("hidden")}
async function request(path, opts={}) {
  const headers = {"Content-Type":"application/json", ...(opts.headers||{})};
  if(token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(API + path, {...opts, headers});
  const data = await r.json().catch(()=>({error:{message:"Respons server tidak valid"}}));
  if(!r.ok) throw new Error(data.error?.message || `HTTP ${r.status}`);
  return data.data;
}
function render(items=catalog){
  const q=$("search").value.toLowerCase();
  const list=items.filter(x=>(x.name||"").toLowerCase().includes(q)||(x.category||"").toLowerCase().includes(q));
  $("products").innerHTML=list.map(x=>`<article class="product"><small>${esc(x.category||"DIGITAL")}</small><h3>${esc(x.name||x.apiCode)}</h3><p class="muted">${esc(x.label||"Produk digital")}</p><div class="price">${money(x.priceUsd)}</div><div class="stock">${x.inStock ? `Stok: ${Number(x.stock)||"Tersedia"}` : "Stok tidak tersedia"}</div><small>SKU: ${esc(x.apiCode)}</small></article>`).join("") || '<p class="muted">Produk tidak ditemukan.</p>';
  $("count").textContent=catalog.length;
  $("sku").innerHTML=catalog.map(x=>`<option value="${esc(x.apiCode)}">${esc(x.name)} — ${esc(x.label||x.apiCode)}</option>`).join("");
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function loadProducts(){
  $("status").textContent="Memuat katalog…";
  try { const d=await request("/api/products"); catalog=d.items||[]; render(); $("status").textContent=`${catalog.length} produk tersedia`; }
  catch(e){$("status").textContent="Gagal memuat katalog: "+e.message}
}
$("reload").onclick=loadProducts; $("adminReload").onclick=loadProducts; $("search").oninput=()=>render();
$("adminBtn").onclick=()=> token ? (show("adminModal"),adminInfo()) : show("loginModal");
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>{hide("loginModal");hide("adminModal")});
$("loginForm").onsubmit=async e=>{e.preventDefault();$("loginError").textContent="";try{const f=new FormData(e.target);const d=await request("/api/login",{method:"POST",body:JSON.stringify({username:f.get("username"),password:f.get("password")})});token=d.token;sessionStorage.setItem("drip_admin_token",token);hide("loginModal");show("adminModal");adminInfo()}catch(err){$("loginError").textContent=err.message}};
async function adminInfo(){try{const d=await request("/api/balance");$("balance").textContent=d.balanceUsd?`$${d.balanceUsd}`:"Tidak tersedia"}catch(e){$("balance").textContent="—"}}
$("balanceBtn").onclick=adminInfo;
$("logout").onclick=()=>{token="";sessionStorage.removeItem("drip_admin_token");hide("adminModal")};
$("orderBtn").onclick=async()=>{if(!confirm("Pesanan ini akan memotong saldo wallet API. Lanjutkan hanya jika pembayaran pelanggan sudah diterima."))return; $("orderResult").textContent="Memproses…";try{const d=await request("/api/orders",{method:"POST",body:JSON.stringify({sku:$("sku").value,quantity:Number($("qty").value)})});$("orderResult").textContent=JSON.stringify(d,null,2);adminInfo()}catch(e){$("orderResult").textContent="Gagal: "+e.message}};
loadProducts();