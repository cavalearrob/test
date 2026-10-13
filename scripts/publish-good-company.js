'use strict';
/* Explicit owner-authorized Printify publish of current Good Company listings.
   Does not change website checkout or submit orders. */
const SHOP='6647970',T=process.env.PRINTIFY_API_TOKEN;
if(!T)throw Error('Missing PRINTIFY_API_TOKEN');
const headers={Authorization:'Bearer '+T,Accept:'application/json','Content-Type':'application/json'};
async function req(p,method='GET',body){
 for(let i=0;i<3;i++){
 const r=await fetch('https://api.printify.com/v1'+p,{method,headers,body:body?JSON.stringify(body):undefined});
 const tx=await r.text();let data;try{data=JSON.parse(tx)}catch{data={message:tx.slice(0,300)}}
 if(r.ok)return data;
 if([429,500,502,503].includes(r.status)&&i<2){await new Promise(ok=>setTimeout(ok,1500*(i+1)));continue}
 throw Error(r.status+' '+JSON.stringify(data).slice(0,500));
}}
(async()=>{
 let products=[];for(let page=1;page<=10;page++){const d=await req('/shops/'+SHOP+'/products.json?limit=50&page='+page);products.push(...(d.data||[]));if(page>=(d.last_page||1))break}
 const gc=products.filter(p=>p.title?.startsWith('Good Company |'));
 let published=0,already=0,failed=0;const outcomes=[];
 for(const p of gc){
 try{
 const detail=await req('/shops/'+SHOP+'/products/'+p.id+'.json');
 const enabled=(detail.variants||[]).filter(v=>v.is_enabled);
 const areas=[...new Set((detail.print_areas||[]).flatMap(a=>(a.placeholders||[]).map(x=>x.position)))];
 if(!enabled.length||!areas.includes('front')||!areas.includes('back'))throw Error('Missing enabled variants or front/back print areas');
 const costsOk=enabled.every(v=>Number.isFinite(v.cost)&&Number.isFinite(v.price)&&v.price>=v.cost+200);
 if(!costsOk)throw Error('Price not greater than manufacturing cost + $2 reserve on every enabled variant');
 if(detail.is_published){already++;outcomes.push({id:p.id,status:'already_published'});continue}
 const pub=await req('/shops/'+SHOP+'/products/'+p.id+'/publish.json','POST',{title:true,description:true,images:true,variants:true,tags:true,keyFeatures:true,shipping_template:true});
 outcomes.push({id:p.id,status:'publish_requested',response:JSON.stringify(pub).slice(0,220)});
 published++;
 }catch(e){failed++;outcomes.push({id:p.id,status:'failed',error:e.message})}
 }
 console.log('PUBLISH_RESULT '+JSON.stringify({total:gc.length,requested:published,already,failed,outcomes}));
 if(failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
