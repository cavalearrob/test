'use strict';
const token=process.env.PRINTIFY_API_TOKEN;if(!token)throw Error('Missing API token');
async function get(p){const r=await fetch('https://api.printify.com/v1'+p,{headers:{Authorization:'Bearer '+token,Accept:'application/json'}});if(!r.ok)throw Error(p+': '+r.status);return r.json()}
(async()=>{
 const raw=await get('/catalog/blueprints.json');const all=Array.isArray(raw)?raw:raw.data||[];
 const subset=all.filter(x=>/hoodie|oversized|boxy|heavyweight/i.test(x.title||'')&&!/kids|youth|baby|toddler|pet |dog |phone|blanket|dress/i.test(x.title||''));
 const picks=[...subset.filter(x=>/hoodie/i.test(x.title||'')&&/women|crop|oversized|premium|unisex|heavyweight|pullover/i.test(x.title||'')).slice(0,14),...subset.filter(x=>/oversized/i.test(x.title||'')&&/tee|shirt/i.test(x.title||'')).slice(0,8)];
 console.log('PICKED '+JSON.stringify(picks.map(x=>({id:x.id,title:x.title,brand:x.brand,model:x.model}))));
 for(const b of picks){try{
 const rawP=await get('/catalog/blueprints/'+b.id+'/print_providers.json');const ps=Array.isArray(rawP)?rawP:rawP.data||[];
 let found=0;for(const p of ps.slice(0,9)){try{
 const rawV=await get('/catalog/blueprints/'+b.id+'/print_providers/'+p.id+'/variants.json');
 const vs=Array.isArray(rawV)?rawV:rawV.variants||rawV.data||[];
 const areas=[...new Set(vs.flatMap(v=>(v.placeholders||[]).map(z=>z.position)))];
 if(!areas.includes('front')||!areas.includes('back'))continue;
 const colors=[...new Set(vs.map(v=>v.options?.color).filter(Boolean))];
 const sizes=[...new Set(vs.map(v=>v.options?.size).filter(Boolean))];
 console.log('BLANK '+JSON.stringify({id:b.id,title:b.title,provider:p.id,name:p.title,areas,neck:areas.includes('neck'),colors:colors.slice(0,28),sizes:sizes.slice(0,16),variants:vs.length}));if(++found>=3)break;
 }catch(e){console.log('PROVIDER_ERROR '+b.id+' '+p.id+' '+e.message)}}
 }catch(e){console.log('ERROR '+b.id+' '+e.message)}}
})().catch(e=>{console.error(e);process.exitCode=1});
