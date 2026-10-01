let products=[],filter="All",cart=[];
try{cart=JSON.parse(localStorage.getItem("dtfCart")||"[]");if(!Array.isArray(cart))cart=[]}catch{cart=[]}
const grid=document.querySelector("#products"),filters=document.querySelector("#filters");
const status=document.createElement("div");status.id="catalogStatus";status.className="catalogStatus";grid.before(status);

function money(n){return "$"+Number(n).toFixed(2)}
function setStatus(msg,kind=""){status.className="catalogStatus "+kind;status.textContent=msg}
function buildFilters(){
 const types=["All",...new Set(products.map(p=>p.type))];
 filters.innerHTML="";
 types.forEach(x=>{const b=document.createElement("button");b.textContent=x;b.className=x===filter?"active":"";b.onclick=()=>{filter=x;buildFilters();render()};filters.appendChild(b)});
}
function render(){
 grid.innerHTML="";
 const rows=products.filter(p=>(filter==="All"||p.type===filter)&&p.img&&p.variants.length);
 if(!rows.length){grid.innerHTML='<div class="catalogEmpty">New pieces are coming soon. Check back shortly.</div>';return}
 rows.forEach(p=>{
   const a=document.createElement("article");a.className="product";
   a.innerHTML='<div class="pic" style="background-image:url(\''+p.img+'\')"><span class="type">'+p.type+'</span></div><div class="productInfo"><h3>'+p.name+'</h3><p>'+p.type+' • original DTF quote/graphic design</p><div class="priceRow"><strong>'+money(p.price)+'</strong><button>CHOOSE OPTIONS</button></div></div>';
   a.querySelector("button").onclick=()=>openProduct(p);a.querySelector(".pic").onclick=()=>openProduct(p);grid.appendChild(a);
 });
}
function openProduct(p){
 const modal=document.querySelector("#productModal"),img=document.querySelector("#modalImg"),thumbs=document.querySelector("#modalThumbs"),sel=document.querySelector("#variantSelect");
 document.querySelector("#modalType").textContent=p.type;document.querySelector("#modalName").textContent=p.name;document.querySelector("#modalPrice").textContent=money(p.price);
 const images=(p.images||[]).filter(x=>x&&x.src);img.src=images[0]?.src||p.img;thumbs.innerHTML="";
 images.slice(0,6).forEach((x,i)=>{const b=document.createElement("button");b.className=i===0?"active":"";b.innerHTML='<img src="'+x.src+'" alt="">';b.onclick=()=>{img.src=x.src;[...thumbs.children].forEach(y=>y.classList.toggle("active",y===b))};thumbs.appendChild(b)});
 sel.innerHTML="";p.variants.forEach(v=>{const o=document.createElement("option");o.value=v.id;o.textContent=v.title;o.dataset.price=v.price_cents;sel.appendChild(o)});
 const add=document.querySelector("#modalAdd");add.disabled=!p.variants.length;add.textContent="ADD TO BAG";add.onclick=()=>{const v=p.variants.find(x=>String(x.id)===sel.value);if(v){addToCart(p,v);closeProduct()}};
 modal.classList.add("open");document.querySelector("#productShade").classList.add("open");document.body.classList.add("locked");
}
function closeProduct(){document.querySelector("#productModal").classList.remove("open");document.querySelector("#productShade").classList.remove("open");document.body.classList.remove("locked")}
function saveCart(){localStorage.setItem("dtfCart",JSON.stringify(cart))}
function addToCart(p,v){cart.push({product:p,variant:v});saveCart();document.querySelector("#count").textContent=cart.length;drawCart();openCart()}
function drawCart(){document.querySelector("#cartItems").innerHTML=cart.map((x,i)=>'<div class="cartItem"><span>'+x.product.name+'<br><small>'+x.variant.title+'</small></span><span>'+money(x.variant.price_cents/100)+'　<a href="#" data-r="'+i+'">×</a></span></div>').join("");document.querySelector("#subtotal").textContent=money(cart.reduce((a,x)=>a+x.variant.price_cents/100,0));document.querySelectorAll("[data-r]").forEach(a=>a.onclick=e=>{e.preventDefault();cart.splice(+a.dataset.r,1);saveCart();document.querySelector("#count").textContent=cart.length;drawCart()})}
function openCart(){document.querySelector("#drawer").classList.add("open");document.querySelector("#shade").classList.add("open")}
function closeCart(){document.querySelector("#drawer").classList.remove("open");document.querySelector("#shade").classList.remove("open")}
document.querySelector("#cartBtn").onclick=openCart;document.querySelector("#closeCart").onclick=closeCart;document.querySelector("#shade").onclick=closeCart;document.querySelector("#closeProduct").onclick=closeProduct;document.querySelector("#productShade").onclick=closeProduct;
document.querySelector("#checkout").onclick=()=>{if(!cart.length)return;saveCart();location.href="/checkout.html"};

document.querySelector("#count").textContent=cart.length;drawCart();
setStatus("Loading the DTF collection…","working");
render();

fetch("/api/store/catalog",{cache:"no-store"}).then(r=>r.json()).then(d=>{
 if(!d.ok)throw Error("catalog unavailable");
 products=(d.products||[]).map(x=>({id:x.id,name:x.name,type:x.category,price:x.price_cents/100,img:x.mockup,images:x.images||[],printifyId:x.id,variants:(x.variants||[]).filter(v=>v.is_available)}));
 filter="All";buildFilters();render();
 if(products.length===40)status.remove();
 else if(d.refreshing)setStatus("The collection is being updated. Please check back shortly.","working");
 else status.remove();
}).catch(()=>{setStatus("The collection is being updated. Please check back shortly.","working");render()});
