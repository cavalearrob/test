const http=require('http'),fs=require('fs'),path=require('path'),https=require('https');
const root=__dirname,port=process.env.PORT||8080;
function json(res,code,obj){res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(obj))}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function printifyOnce(apiPath,method='GET',body){return new Promise((resolve,reject)=>{const token=process.env.PRINTIFY_API_TOKEN;if(!token)return reject(new Error('PRINTIFY_API_TOKEN missing'));const r=https.request({hostname:'api.printify.com',path:'/v1'+apiPath,method,headers:{Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json;charset=utf-8','User-Agent':'DTF-Azure-Store'}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>{try{resolve({status:x.statusCode,data:JSON.parse(d||'{}')})}catch(e){resolve({status:x.statusCode,data:d})}})});r.setTimeout(20000,()=>r.destroy(new Error('Printify request timed out')));r.on('error',reject);if(body)r.write(JSON.stringify(body));r.end()})}
async function printify(apiPath,method='GET',body){let r;for(let i=0;i<3;i++){r=await printifyOnce(apiPath,method,body);if(![500,502,503,504].includes(r.status))return r;if(i<2)await sleep(800*(i+1))}return r}
const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost'),p=u.pathname;
 if(p==='/api/health')return json(res,200,{ok:true,printifyTokenConfigured:!!process.env.PRINTIFY_API_TOKEN});
 if(p==='/api/printify/shops'){const r=await printify('/shops.json');return json(res,r.status,r.data)}
 if(p==='/api/printify/providers'){const r=await printify('/catalog/print_providers.json');return json(res,r.status,r.data)}
 if(p.startsWith('/api/printify/blueprint/')){const id=p.split('/').pop();if(!/^\\d+$/.test(id))return json(res,400,{error:'invalid blueprint id'});const r=await printify('/catalog/blueprints/'+id+'.json');return json(res,r.status,r.data)}
 if(p==='/api/printify/dtf-candidates'){const ids=[6,18,77,407,411,1398];const results=[];for(const id of ids){const r=await printify('/catalog/blueprints/'+id+'.json');results.push({id,status:r.status,title:r.data&&r.data.title,brand:r.data&&r.data.brand,model:r.data&&r.data.model,error:r.status>=400?r.data:undefined})}return json(res,200,{ok:results.some(x=>x.status===200),results})}
 if(p==='/api/printify/cost-probe'){
  if(u.searchParams.get('run')!=='1')return json(res,200,{ok:true,ready:true,message:'Add ?run=1 to run a temporary six-product cost probe. Probe products and image are deleted/archived after costs are read.'});
  const img=await printify('/uploads/images.json','POST',{file_name:'dtf-cost-probe.jpeg',url:'https://dirty-thoughts-fashion-g7dhfpawe6esfef7.centralus-01.azurewebsites.net/IMG_2953.jpeg'});
  if(img.status>=400)return json(res,img.status,{ok:false,stage:'upload_probe_image',error:img.data});
  const configs=[
   {category:'T-Shirts',blueprint:6,provider:99,price:2899,position:'front'},
   {category:'Tank Tops',blueprint:18,provider:99,price:2799,position:'front'},
   {category:'Crop Tops',blueprint:411,provider:99,price:2699,position:'front'},
   {category:'Hoodies',blueprint:77,provider:99,price:5499,position:'front'},
   {category:'Sweatpants',blueprint:1398,provider:39,price:4999,position:'left_leg_front'},
   {category:'Panties',blueprint:407,provider:14,price:2499,position:'front'}
  ];
  const results=[];
  for(const cfg of configs){
   let createdId=null;
   try{
    const vr=await printify('/catalog/blueprints/'+cfg.blueprint+'/print_providers/'+cfg.provider+'/variants.json?show-out-of-stock=0');
    const variants=Array.isArray(vr.data)?vr.data:(Array.isArray(vr.data?.variants)?vr.data.variants:[]);
    const allUsable=variants.filter(v=>(v.placeholders||[]).some(ph=>ph.position===cfg.position));
    const usable=allUsable.slice(0,100);
    if(!usable.length){results.push({...cfg,ok:false,error:'No usable in-stock variants'});continue}
    const body={title:'DTF COST PROBE - '+cfg.category,description:'Temporary cost probe; safe to delete.',blueprint_id:cfg.blueprint,print_provider_id:cfg.provider,variants:usable.map(v=>({id:v.id,price:cfg.price,is_enabled:true})),print_areas:[{variant_ids:usable.map(v=>v.id),placeholders:[{position:cfg.position,images:[{id:img.data.id,x:0.5,y:0.5,scale:0.18,angle:0}]}]}]};
    const cr=await printify('/shops/6647970/products.json','POST',body);
    if(cr.status>=400){results.push({...cfg,ok:false,stage:'create',error:cr.data});continue}
    createdId=cr.data.id;
    const costs=(cr.data.variants||[]).map(v=>v.cost).filter(Number.isFinite);
    const ship=await printify('/catalog/blueprints/'+cfg.blueprint+'/print_providers/'+cfg.provider+'/shipping.json');
    const profiles=Array.isArray(ship.data?.profiles)?ship.data.profiles:[];
    const us=profiles.filter(x=>(x.countries||[]).includes('US')).map(x=>({first_item_cents:x.first_item?.cost,additional_item_cents:x.additional_items?.cost,variant_count:(x.variant_ids||[]).length}));
    results.push({category:cfg.category,blueprint_id:cfg.blueprint,provider_id:cfg.provider,ok:true,variant_count:(cr.data.variants||[]).length,min_cost_cents:costs.length?Math.min(...costs):null,max_cost_cents:costs.length?Math.max(...costs):null,retail_price_cents:cfg.price,us_shipping:us});
   }catch(e){results.push({...cfg,ok:false,error:e.message})}
   finally{if(createdId)await printify('/shops/6647970/products/'+createdId+'.json','DELETE')}
  }
  await printify('/uploads/'+img.data.id+'/archive.json','POST',{});
  return json(res,200,{ok:results.every(x=>x.ok),note:'Temporary probe products were deleted and the probe image was archived.',results});
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