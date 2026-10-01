const {buildProducts,buildMensProducts,repairProducts,BUILD_VERSION}=require('./build-products');
const http=require('http'),fs=require('fs'),path=require('path'),https=require('https');
const Stripe=require('stripe');
const root=__dirname,port=process.env.PORT||8080;
function json(res,code,obj){res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(obj))}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function readRaw(req,limit=1024*1024){return new Promise((resolve,reject)=>{let chunks=[],size=0;req.on('data',x=>{size+=x.length;if(size>limit){reject(new Error('request too large'));req.destroy();return}chunks.push(x)});req.on('end',()=>resolve(Buffer.concat(chunks)));req.on('error',reject)})}
function stripeClient(){const key=process.env.STRIPE_SECRET_KEY;if(!key)throw new Error('STRIPE_SECRET_KEY missing');return new Stripe(key)}
const SHOP_ID='6647970';
const DEFAULT_SITE='https://dirtythoughtsfashion.com';
function siteUrl(){const configured=String(process.env.PUBLIC_SITE_URL||DEFAULT_SITE).replace(/\/$/,'');return /azurewebsites\.net$/i.test(configured)?DEFAULT_SITE:configured}
function cleanAddress(a={}){
 const out={first_name:String(a.first_name||'').trim(),last_name:String(a.last_name||'').trim(),email:String(a.email||'').trim(),phone:String(a.phone||'').trim(),country:String(a.country||'US').trim().toUpperCase(),region:String(a.region||'').trim(),address1:String(a.address1||'').trim(),address2:String(a.address2||'').trim(),city:String(a.city||'').trim(),zip:String(a.zip||'').trim()};
 for(const k of ['first_name','last_name','email','country','region','address1','city','zip'])if(!out[k])throw new Error('Missing shipping field: '+k);
 if(out.country!=='US')throw new Error('Checkout is currently available for U.S. shipping addresses only.');
 return out;
}
async function validateCart(items){
 if(!Array.isArray(items)||!items.length)throw new Error('Your bag is empty.');
 const grouped=new Map();
 for(const x of items){
  const product_id=String(x.product_id||''),variant_id=Number(x.variant_id),quantity=Math.max(1,Math.min(10,Number(x.quantity)||1));
  if(!/^[a-f0-9]{24}$/i.test(product_id)||!Number.isInteger(variant_id))throw new Error('Invalid cart item.');
  const key=product_id+':'+variant_id,old=grouped.get(key);grouped.set(key,{product_id,variant_id,quantity:Math.min(10,(old?.quantity||0)+quantity)});
 }
 if(grouped.size>30)throw new Error('Please limit checkout to 30 unique items.');
 const valid=[];
 for(const x of grouped.values()){
  const pr=await printify('/shops/'+SHOP_ID+'/products/'+x.product_id+'.json');
  if(pr.status>=400||!String(pr.data?.description||'').includes('[DTF-ORIGINAL-V5]'))throw new Error('A product in your bag is no longer available.');
  const v=(pr.data.variants||[]).find(z=>Number(z.id)===x.variant_id&&z.is_enabled&&z.is_available!==false);
  if(!v)throw new Error('A selected size is no longer available.');
  valid.push({...x,name:String(pr.data.title||'DTF item').split(' — DTF ')[0],variant_title:v.title,price_cents:Number(v.price)});
 }
 return valid;
}
async function findExistingPrintifyOrder(externalId){
 for(let page=1;page<=5;page++){
  const r=await printify('/shops/'+SHOP_ID+'/orders.json?limit=10&page='+page);
  if(r.status>=400)break;
  const rows=r.data?.data||[],hit=rows.find(o=>String(o.metadata?.shop_order_label||o.metadata?.shop_order_id||'')===String(externalId));
  if(hit)return hit;if(rows.length<10)break;
 }
 return null;
}
async function fulfillPaidSession(session){
 if(!session?.livemode)return {ok:true,test_mode:true,message:'Stripe test payment verified; no real Printify order created.'};
 const existing=await findExistingPrintifyOrder(session.id);if(existing)return {ok:true,duplicate:true,printify_order_id:existing.id};
 const md=session.metadata||{},items=Object.keys(md).filter(k=>/^item_\d+$/.test(k)).sort((a,b)=>Number(a.slice(5))-Number(b.slice(5))).map(k=>{const [product_id,variant_id,quantity]=String(md[k]).split('|');return {product_id,variant_id:Number(variant_id),quantity:Number(quantity),external_id:session.id+'-'+k}});
 if(!items.length)throw new Error('Paid Stripe session has no fulfillment items.');
 const address_to={first_name:md.ship_first,last_name:md.ship_last,email:md.ship_email,phone:md.ship_phone||'',country:md.ship_country||'US',region:md.ship_region,address1:md.ship_address1,address2:md.ship_address2||'',city:md.ship_city,zip:md.ship_zip};
 const order=await printify('/shops/'+SHOP_ID+'/orders.json','POST',{external_id:session.id,label:'DTF '+session.id.slice(-10),line_items:items,shipping_method:1,send_shipping_notification:true,address_to});
 if(order.status>=400)throw new Error('Printify order creation failed: '+JSON.stringify(order.data));
 let production=null;
 if(process.env.DTF_AUTO_FULFILL==='1')production=await printify('/shops/'+SHOP_ID+'/orders/'+order.data.id+'/send_to_production.json','POST',{});
 return {ok:true,printify_order_id:order.data.id,production_requested:process.env.DTF_AUTO_FULFILL==='1',production_status:production?.status||null};
}
function printifyOnce(apiPath,method='GET',body){return new Promise((resolve,reject)=>{const token=process.env.PRINTIFY_API_TOKEN;if(!token)return reject(new Error('PRINTIFY_API_TOKEN missing'));const r=https.request({hostname:'api.printify.com',path:'/v1'+apiPath,method,headers:{Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json;charset=utf-8','User-Agent':'DTF-Azure-Store'}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>{try{resolve({status:x.statusCode,data:JSON.parse(d||'{}')})}catch(e){resolve({status:x.statusCode,data:d})}})});r.setTimeout(90000,()=>r.destroy(new Error('Printify request timed out')));r.on('error',reject);if(body)r.write(JSON.stringify(body));r.end()})}
async function printify(apiPath,method='GET',body){let r;for(let i=0;i<3;i++){r=await printifyOnce(apiPath,method,body);if(![500,502,503,504].includes(r.status))return r;if(i<2)await sleep(800*(i+1))}return r}
const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost'),p=u.pathname;
 if(p==='/api/health')return json(res,200,{ok:true,printifyTokenConfigured:!!process.env.PRINTIFY_API_TOKEN,stripeConfigured:!!process.env.STRIPE_SECRET_KEY,stripeWebhookConfigured:!!process.env.STRIPE_WEBHOOK_SECRET,autoFulfill:process.env.DTF_AUTO_FULFILL==='1',buildVersion:BUILD_VERSION||'unknown'});
 if(p==='/api/checkout/config')return json(res,200,{ok:true,stripeConfigured:!!process.env.STRIPE_SECRET_KEY,webhookConfigured:!!process.env.STRIPE_WEBHOOK_SECRET,mode:String(process.env.STRIPE_SECRET_KEY||'').startsWith('sk_live_')?'live':'test',autoFulfill:process.env.DTF_AUTO_FULFILL==='1'});
 if(p==='/api/checkout/session'&&req.method==='POST'){
  if(!process.env.STRIPE_SECRET_KEY)return json(res,503,{ok:false,error:'Payments are not connected yet.'});
  const raw=await readRaw(req);let body;try{body=JSON.parse(raw.toString('utf8')||'{}')}catch{return json(res,400,{ok:false,error:'Invalid checkout request.'})}
  const address=cleanAddress(body.address),items=await validateCart(body.items);
  const shippingReq={line_items:items.map((x,i)=>({product_id:x.product_id,variant_id:x.variant_id,quantity:x.quantity,external_id:'shipping-'+i})),address_to:address};
  const ship=await printify('/shops/'+SHOP_ID+'/orders/shipping.json','POST',shippingReq);
  if(ship.status>=400||!Number.isFinite(Number(ship.data?.standard)))return json(res,400,{ok:false,error:'We could not calculate shipping for that address.',detail:ship.data});
  const shippingCents=Number(ship.data.standard);
  const metadata={fulfillment:'printify',ship_first:address.first_name,ship_last:address.last_name,ship_email:address.email,ship_phone:address.phone,ship_country:address.country,ship_region:address.region,ship_address1:address.address1,ship_address2:address.address2,ship_city:address.city,ship_zip:address.zip};
  items.forEach((x,i)=>metadata['item_'+i]=[x.product_id,x.variant_id,x.quantity].join('|'));
  const stripe=stripeClient();
  const session=await stripe.checkout.sessions.create({
   mode:'payment',customer_email:address.email,
   line_items:items.map(x=>({quantity:x.quantity,price_data:{currency:'usd',unit_amount:x.price_cents,product_data:{name:x.name,description:x.variant_title}}})),
   shipping_options:[{shipping_rate_data:{type:'fixed_amount',fixed_amount:{amount:shippingCents,currency:'usd'},display_name:'Standard shipping'}}],
   automatic_tax:{enabled:process.env.STRIPE_AUTOMATIC_TAX==='1'},
   metadata,
   success_url:siteUrl()+'/success.html?session_id={CHECKOUT_SESSION_ID}',
   cancel_url:siteUrl()+'/checkout.html?canceled=1'
  });
  return json(res,200,{ok:true,url:session.url,shipping_cents:shippingCents,mode:session.livemode?'live':'test'});
 }
 if(p==='/api/checkout/session-status'&&req.method==='GET'){
  if(!process.env.STRIPE_SECRET_KEY)return json(res,503,{ok:false,error:'Payments are not connected yet.'});
  const id=String(u.searchParams.get('id')||'');if(!/^cs_/.test(id))return json(res,400,{ok:false,error:'Invalid session.'});
  const s=await stripeClient().checkout.sessions.retrieve(id);return json(res,200,{ok:true,status:s.status,payment_status:s.payment_status,livemode:s.livemode,customer_email:s.customer_details?.email||s.customer_email||null});
 }
 if(p==='/api/stripe/webhook'&&req.method==='POST'){
  if(!process.env.STRIPE_WEBHOOK_SECRET)return json(res,503,{ok:false,error:'Stripe webhook secret is not configured.'});
  const raw=await readRaw(req);let event;
  try{event=stripeClient().webhooks.constructEvent(raw,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET)}catch(e){return json(res,400,{ok:false,error:'Invalid Stripe webhook signature.'})}
  try{
   const s=event.data.object;
   if((event.type==='checkout.session.completed'&&s.payment_status==='paid')||event.type==='checkout.session.async_payment_succeeded')await fulfillPaidSession(s);
   return json(res,200,{received:true});
  }catch(e){console.error('DTF fulfillment error',e);return json(res,500,{received:true,fulfillment_error:e.message})}
 }
 if(p==='/api/printify/shops'){const r=await printify('/shops.json');return json(res,r.status,r.data)}
 if(p==='/api/printify/providers'){const r=await printify('/catalog/print_providers.json');return json(res,r.status,r.data)}
 if(p.startsWith('/api/printify/blueprint/')){const id=p.split('/').pop();if(!/^\\d+$/.test(id))return json(res,400,{error:'invalid blueprint id'});const r=await printify('/catalog/blueprints/'+id+'.json');return json(res,r.status,r.data)}
 if(p==='/api/printify/dtf-candidates'){const ids=[6,18,77,407,411,1398];const results=[];for(const id of ids){const r=await printify('/catalog/blueprints/'+id+'.json');results.push({id,status:r.status,title:r.data&&r.data.title,brand:r.data&&r.data.brand,model:r.data&&r.data.model,error:r.status>=400?r.data:undefined})}return json(res,200,{ok:results.some(x=>x.status===200),results})}
 if(p==='/api/store/catalog'){
  const r=await printify('/shops/6647970/products.json?limit=50');
  if(r.status>=400)return json(res,r.status,{ok:false,error:r.data});
  const source=((r.data&&r.data.data)||[]).filter(x=>x.title&&x.title.includes(' — DTF '));
  const clean=source.filter(x=>String(x.description||'').includes('[DTF-ORIGINAL-V5]') && (x.print_areas||[]).some(a=>(a.placeholders||[]).some(ph=>(ph.images||[]).some(im=>im.id))));
  const rows=clean.map(x=>{
    const enabled=(x.variants||[]).filter(v=>v.is_enabled);
    const price=enabled.length?Math.min(...enabled.map(v=>v.price)):null;
    const suffix=x.title.split(' — DTF ').pop();
    const category=suffix==='T-Shirt'?'T-Shirts':suffix==='Tank Top'?'Tank Tops':suffix==='Crop Top'?'Crop Tops':suffix==='Hoodie'?'Hoodies':suffix==='Sweatpant'?'Sweatpants':suffix==='Pantie'?'Panties':suffix;
    const black=enabled.find(v=>/^\s*(solid black blend|solid black|black stitching|black)\s*\//i.test(v.title||''))||enabled[0];
    const hero=(x.images||[]).find(im=>black&&(im.variant_ids||[]).includes(black.id)&&im.position!=='back')||(x.images||[]).find(im=>black&&(im.variant_ids||[]).includes(black.id))||(x.images||[]).find(im=>im.is_default)||(x.images||[])[0];
    if(!hero||!hero.src||!enabled.length)return null;
    const gallery=(x.images||[]).filter(im=>black&&(im.variant_ids||[]).includes(black.id)).slice(0,6).map(im=>({src:im.src,position:im.position||null,is_default:!!im.is_default,variant_ids:im.variant_ids||[]}));
    if(!gallery.length)gallery.push({src:hero.src,position:hero.position||null,is_default:!!hero.is_default,variant_ids:hero.variant_ids||[]});
    const productionArtworkIds=[...new Set((x.print_areas||[]).flatMap(a=>(a.placeholders||[]).flatMap(ph=>(ph.images||[]).map(im=>im.id).filter(Boolean))))];
    if(!productionArtworkIds.length)return null;
    return {id:x.id,name:x.title.split(' — DTF ')[0],category,price_cents:price,mockup:hero.src,images:gallery,production_artwork_ids:productionArtworkIds,production_synced:true,variants:enabled.map(v=>({id:v.id,title:v.title,price_cents:v.price,is_available:v.is_available!==false}))};
  }).filter(Boolean);
  return json(res,200,{ok:true,total:source.length,approved_count:clean.length,count:rows.length,refreshing:rows.length<source.length,qc_policy:'manufacturer-mockup-only',products:rows});
 }
 if(p==='/api/printify/repair-artwork'){
  if(u.searchParams.get('run')!=='1')return json(res,200,{ok:true,ready:true,message:'Repairs existing DTF drafts with vector-path typography so logos and slogans render reliably.'});
  const out=await repairProducts(printify,{start:u.searchParams.get('start'),count:u.searchParams.get('count')});return json(res,200,out);
 }
 if(p==='/api/printify/build-mens-drafts'){
  if(u.searchParams.get('run')!=='1')return json(res,200,{ok:true,ready:true,message:'Builds DTF Men — After Hours as Printify drafts from the exact production artwork used for manufacturer mockups.'});
  const out=await buildMensProducts(printify,{start:u.searchParams.get('start'),count:u.searchParams.get('count')});return json(res,200,out);
 }
 if(p==='/api/printify/build-drafts'){
  if(u.searchParams.get('run')!=='1')return json(res,200,{ok:true,ready:true,message:'Add ?run=1 to render artwork and create the 40 DTF products as Printify drafts. Existing matching titles are skipped.'});
  const out=await buildProducts(printify,{start:u.searchParams.get('start'),count:u.searchParams.get('count')});return json(res,200,out);
 }

 if(p==='/api/printify/dtf-analysis'){
  const candidates=[{id:6,category:'T-Shirts'},{id:18,category:'Tank Tops'},{id:411,category:'Crop Tops'},{id:77,category:'Hoodies'},{id:1398,category:'Sweatpants'},{id:407,category:'Panties'}];
  const global=await printify('/catalog/print_providers.json');
  const providerMap=new Map((Array.isArray(global.data)?global.data:[]).map(x=>[x.id,x]));
  const products=[];
  for(const item of candidates){
   const bp=await printify('/catalog/blueprints/'+item.id+'.json');
   const pr=await printify('/catalog/blueprints/'+item.id+'/print_providers.json');
   const providers=[];
   for(const pv of (Array.isArray(pr.data)?pr.data:[])){
    const vr=await printify('/catalog/blueprints/'+item.id+'/print_providers/'+pv.id+'/variants.json');
    if(vr.status!==200)continue;
    const variants=Array.isArray(vr.data)?vr.data:(Array.isArray(vr.data?.variants)?vr.data.variants:[]);
    const costs=variants.map(v=>v.cost).filter(Number.isFinite);
    const sizes=[...new Set(variants.map(v=>v.options?.size).filter(Boolean))];
    const colors=[...new Set(variants.map(v=>v.options?.color).filter(Boolean))];
    const areas=[...new Set(variants.flatMap(v=>(v.placeholders||[]).map(a=>a.position)).filter(Boolean))];
    const meta=providerMap.get(pv.id)||{};
    providers.push({id:pv.id,title:pv.title,country:meta.location?.country||null,region:meta.location?.region||null,decoration_methods:pv.decoration_methods||[],variant_count:variants.length,min_cost_cents:costs.length?Math.min(...costs):null,max_cost_cents:costs.length?Math.max(...costs):null,sizes,colors,print_areas:areas});
   }
   providers.sort((a,b)=>(a.country==='US'?-1:1)-(b.country==='US'?-1:1)||(a.min_cost_cents??999999)-(b.min_cost_cents??999999));
   products.push({category:item.category,blueprint_id:item.id,title:bp.data?.title,brand:bp.data?.brand,model:bp.data?.model,providers});
  }
  return json(res,200,{ok:true,products});
 }
 if(p==='/api/printify/catalog-summary'){const r=await printify('/catalog/blueprints.json');if(r.status>=400)return json(res,200,{ok:false,upstreamStatus:r.status,message:'Printify catalog service returned an error after 3 attempts. Authentication is still connected.',upstream:r.data});const list=Array.isArray(r.data)?r.data:(Array.isArray(r.data?.data)?r.data.data:[]);const words=['shirt','tee','tank','tube','hood','sweat','jog','underwear','pant','brief'];const out=list.filter(x=>words.some(w=>(x.title||'').toLowerCase().includes(w))).map(x=>({id:x.id,title:x.title,brand:x.brand,model:x.model,images:x.images}));return json(res,200,{ok:true,count:out.length,products:out})}
 let filePath=p;if(filePath==='/')filePath='/index.html';const f=path.normalize(path.join(root,filePath));if(!f.startsWith(root))return json(res,403,{error:'forbidden'});fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(d)})
 }catch(e){json(res,500,{ok:false,error:e.message})}}).listen(port,()=>console.log('DTF listening on '+port));