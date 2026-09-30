const {buildProducts,repairProducts,BUILD_VERSION}=require('./build-products');
const http=require('http'),fs=require('fs'),path=require('path'),https=require('https');
const root=__dirname,port=process.env.PORT||8080;
function json(res,code,obj){res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(obj))}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function printifyOnce(apiPath,method='GET',body){return new Promise((resolve,reject)=>{const token=process.env.PRINTIFY_API_TOKEN;if(!token)return reject(new Error('PRINTIFY_API_TOKEN missing'));const r=https.request({hostname:'api.printify.com',path:'/v1'+apiPath,method,headers:{Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json;charset=utf-8','User-Agent':'DTF-Azure-Store'}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>{try{resolve({status:x.statusCode,data:JSON.parse(d||'{}')})}catch(e){resolve({status:x.statusCode,data:d})}})});r.setTimeout(90000,()=>r.destroy(new Error('Printify request timed out')));r.on('error',reject);if(body)r.write(JSON.stringify(body));r.end()})}
async function printify(apiPath,method='GET',body){let r;for(let i=0;i<3;i++){r=await printifyOnce(apiPath,method,body);if(![500,502,503,504].includes(r.status))return r;if(i<2)await sleep(800*(i+1))}return r}
const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost'),p=u.pathname;
 if(p==='/api/health')return json(res,200,{ok:true,printifyTokenConfigured:!!process.env.PRINTIFY_API_TOKEN,buildVersion:BUILD_VERSION||'unknown'});
 if(p==='/api/printify/shops'){const r=await printify('/shops.json');return json(res,r.status,r.data)}
 if(p==='/api/printify/providers'){const r=await printify('/catalog/print_providers.json');return json(res,r.status,r.data)}
 if(p.startsWith('/api/printify/blueprint/')){const id=p.split('/').pop();if(!/^\\d+$/.test(id))return json(res,400,{error:'invalid blueprint id'});const r=await printify('/catalog/blueprints/'+id+'.json');return json(res,r.status,r.data)}
 if(p==='/api/printify/dtf-candidates'){const ids=[6,18,77,407,411,1398];const results=[];for(const id of ids){const r=await printify('/catalog/blueprints/'+id+'.json');results.push({id,status:r.status,title:r.data&&r.data.title,brand:r.data&&r.data.brand,model:r.data&&r.data.model,error:r.status>=400?r.data:undefined})}return json(res,200,{ok:results.some(x=>x.status===200),results})}
 if(p==='/api/store/catalog'){
  const r=await printify('/shops/6647970/products.json?limit=50');
  if(r.status>=400)return json(res,r.status,{ok:false,error:r.data});
  const source=((r.data&&r.data.data)||[]).filter(x=>x.title&&x.title.includes(' — DTF '));
  const clean=source.filter(x=>String(x.description||'').includes('[DTF-ORIGINAL-V5]'));
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
    return {id:x.id,name:x.title.split(' — DTF ')[0],category,price_cents:price,mockup:hero.src,images:gallery,variants:enabled.map(v=>({id:v.id,title:v.title,price_cents:v.price,is_available:v.is_available!==false}))};
  }).filter(Boolean);
  return json(res,200,{ok:true,total:source.length,approved_count:clean.length,count:rows.length,refreshing:rows.length<source.length,products:rows});
 }
 if(p==='/api/printify/repair-artwork'){
  if(u.searchParams.get('run')!=='1')return json(res,200,{ok:true,ready:true,message:'Repairs existing DTF drafts with vector-path typography so logos and slogans render reliably.'});
  const out=await repairProducts(printify,{start:u.searchParams.get('start'),count:u.searchParams.get('count')});return json(res,200,out);
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