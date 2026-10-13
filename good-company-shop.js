'use strict';
const grid=document.getElementById('gcProducts'),status=document.getElementById('gcShopStatus'),cartCount=document.getElementById('gcCartCount');
const dialog=document.getElementById('gcProductDialog'),cartDialog=document.getElementById('gcCartDialog');
let products=[],cart=[];try{cart=JSON.parse(localStorage.getItem('dtfCart')||'[]');if(!Array.isArray(cart))cart=[]}catch{cart=[]}
const cash=n=>'$'+(n/100).toFixed(2);
const save=()=>{localStorage.setItem('dtfCart',JSON.stringify(cart));cartCount.textContent=cart.length};
const el=(tag,klass,content)=>{const e=document.createElement(tag);if(klass)e.className=klass;if(content!==undefined)e.textContent=content;return e};
const button=(text,fn)=>{const b=el('button','gcShopBtn',text);b.type='button';b.addEventListener('click',fn);return b};
function showProduct(p){
 dialog.replaceChildren();const wrap=el('div','gcDetail');
 const photo=el('img');photo.src=p.mockup;photo.alt=p.name;photo.loading='lazy';wrap.append(photo);
 const right=el('div','gcDetailInfo'),name=el('h3','',p.name),cost=el('strong','',cash(p.price_cents)),select=el('select','gcVariant');
 p.variants.forEach(v=>{const o=el('option','',v.title+' · '+cash(v.price_cents));o.value=v.id;select.append(o)});
 const price=()=>{const v=p.variants.find(x=>String(x.id)===select.value);cost.textContent=cash(v?.price_cents||p.price_cents)};
 select.addEventListener('change',price);
 const add=button('Add to bag',()=>{const v=p.variants.find(x=>String(x.id)===select.value);if(!v)return;cart.push({product:{id:p.id,printifyId:p.id,name:p.name},variant:v});save();dialog.close();showCart()});
 right.append(button('Close',()=>dialog.close()),name,cost,el('p','','Select a size and color. Made to order; shipping calculated at checkout.'),select,add);
 wrap.append(right);dialog.append(wrap);dialog.showModal();
}
function showCart(){
 cartDialog.replaceChildren();const panel=el('div','gcBag');
 panel.append(button('Close',()=>cartDialog.close()),el('h3','','Your bag'));
 cart.forEach((item,i)=>{const line=el('div','gcBagLine');line.append(el('span','',item.product.name+' — '+item.variant.title),el('span','',cash(item.variant.price_cents)));line.append(button('Remove',()=>{cart.splice(i,1);save();showCart()}));panel.append(line)});
 const total=cart.reduce((n,x)=>n+Number(x.variant.price_cents||0),0);
 panel.append(el('strong','', 'Subtotal '+cash(total)));
 if(cart.length){const a=el('a','gcShopBtn','Checkout securely');a.href='/checkout.html';panel.append(a)}else panel.append(el('p','','Your bag is empty.'));
 cartDialog.append(panel);if(!cartDialog.open)cartDialog.showModal();
}
document.getElementById('gcCartOpen').addEventListener('click',showCart);save();
async function load(){
 status.textContent='Loading the Good Company collection…';
 try{
 const [r,cr]=await Promise.all([fetch('/api/store/catalog',{cache:'no-store'}),fetch('/api/checkout/config',{cache:'no-store'})]);
 const data=await r.json(),config=await cr.json();if(!r.ok||!data.ok)throw Error('Catalog is temporarily unavailable.');
 products=data.products||[];grid.replaceChildren();
 for(const p of products){const card=el('article','gcItem');const img=el('img');img.src=p.mockup;img.alt=p.name;img.loading='lazy';
 const info=el('div','gcItemInfo');info.append(el('small','',p.category),el('h3','',p.name),el('strong','', 'From '+cash(p.price_cents)),button('Choose options',()=>showProduct(p)));card.append(img,info);grid.append(card)}
 const enabled=!!config.checkoutEnabled;
 status.textContent=products.length+' styles in the collection'+(enabled?' · Secure checkout available':' · Checkout opening soon');
 document.getElementById('gcCartOpen').disabled=!enabled;
 if(!enabled){grid.querySelectorAll('button').forEach(b=>b.disabled=true)}
 }catch(e){status.textContent=e.message}
}
load();
