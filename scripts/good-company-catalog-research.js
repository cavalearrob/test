'use strict';
const token=process.env.PRINTIFY_API_TOKEN;if(!token)throw Error('Missing API token');
const h={Authorization:'Bearer '+token,Accept:'application/json','User-Agent':'GoodCompany-Catalog-Research'};
async function get(path){const r=await fetch('https://api.printify.com/v1'+path,{headers:h});if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json()}
async function main(){
 const raw=await get('/catalog/blueprints.json');const items=Array.isArray(raw)?raw:(raw.data||[]);
 const matched=items.filter(x=>/t-shirt|tee|hoodie|sweatshirt/i.test(x.title||'')&&!/kids|youth|baby|toddler/i.test(x.title||''));
 const candidates=[...matched.filter(x=>/oversized|cropped|fitted|women|premium|heavyweight|softstyle|bella|comfort colors/i.test(x.title||'')).slice(0,16),...matched.filter(x=>/unisex|classic/i.test(x.title||'')).slice(0,4)];
 console.log('CATALOG_MATCHES '+JSON.stringify({total:items.length,apparel:matched.length,candidates:candidates.map(x=>({id:x.id,title:x.title,brand:x.brand,model:x.model}))}));
 for(const item of candidates){
   try{
     const providers=await get('/catalog/blueprints/'+item.id+'/print_providers.json');
     for(const p of (Array.isArray(providers)?providers:providers.data||[]).slice(0,3)){
       try{const vr=await get('/catalog/blueprints/'+item.id+'/print_providers/'+p.id+'/variants.json');const vs=Array.isArray(vr)?vr:(vr.variants||vr.data||[]);
       const pos=[...new Set(vs.flatMap(v=>(v.placeholders||[]).map(q=>q.position)))];
       const colors=[...new Set(vs.map(v=>v.options?.color).filter(Boolean))];
       console.log('CANDIDATE '+JSON.stringify({id:item.id,title:item.title,provider:p.id,provider_name:p.title,variant_count:vs.length,areas:pos,colors:colors.slice(0,30),price_floor:Math.min(...vs.map(v=>v.cost).filter(Number.isFinite))}));}catch(e){console.log('PROVIDER_ERROR '+item.id+' '+p.id+' '+e.message)}
     }
   }catch(e){console.log('BLUEPRINT_ERROR '+item.id+' '+e.message)}
 }
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
