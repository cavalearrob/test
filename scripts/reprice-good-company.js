'use strict';
// Reprice existing Good Company Printify products only. Does NOT publish, change art, or change visibility.
const SHOP='6647970',token=process.env.PRINTIFY_API_TOKEN;
if(!token)throw Error('PRINTIFY_API_TOKEN unavailable');
const DRY_RUN=process.env.GC_PRICE_APPLY!=='1';
const HEADERS={Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json'};
const minimum={145:3499,88:3999,1382:4999,1525:6999};
const money=c=>'$'+(c/100).toFixed(2);
async function request(p,method='GET',body){
 for(let tries=0;tries<4;tries++){
 const r=await fetch('https://api.printify.com/v1'+p,{method,headers:HEADERS,body:body?JSON.stringify(body):undefined});
 const txt=await r.text();let data;try{data=JSON.parse(txt)}catch{data={message:txt.slice(0,200)}}
 if(r.ok)return data;
 if([429,500,502,503,504].includes(r.status)&&tries<3){await new Promise(x=>setTimeout(x,1500*(tries+1)));continue}
 throw Error(method+' '+p+' HTTP '+r.status+' '+JSON.stringify(data).slice(0,400));
 }}
// Round up to dollar-ending .99. Minimum 40% gross margin against Printify manufacturing cost,
// allowing a 4% transaction fee and $2 reserve per piece (shipping is charged separately at checkout).
function priceFor(cost,base){
 if(!Number.isFinite(cost)||cost<=0)throw Error('Missing or zero production cost');
 const needed=Math.ceil((cost+200)/0.56);
 const rounded=Math.ceil((needed+1)/100)*100-1;
 return Math.max(base,rounded);
}
async function main(){
 let all=[];
 for(let page=1;page<=10;page++){
 const r=await request('/shops/'+SHOP+'/products.json?limit=50&page='+page);
 all.push(...r.data);
 if(page>=Number(r.last_page||1))break;
 }
 let changed=0,skipped=0,failed=0,processed=0,details=[];
 for(const entry of all){
 if(!entry.title?.startsWith('Good Company |'))continue;
 const base=minimum[entry.blueprint_id];
 if(!base){console.log('SKIP_UNRECOGNIZED '+entry.title);skipped++;continue}
 const p=await request('/shops/'+SHOP+'/products/'+entry.id+'.json');
 const enabled=p.variants.filter(v=>v.is_enabled);
 if(!enabled.length){console.log('SKIP_EMPTY '+entry.title);skipped++;continue}
 if(!enabled.every(v=>Number.isFinite(v.cost)&&v.cost>0)){console.log('FAIL_COST '+entry.title);failed++;continue}
 const modifications=p.variants.map(v=>{
  if(!v.is_enabled)return {id:v.id,price:v.price,is_enabled:false};
  return {id:v.id,price:priceFor(v.cost,base),is_enabled:true};
 });
 const before=[...new Set(enabled.map(v=>v.price))].sort((a,b)=>a-b);
 const after=[...new Set(modifications.filter(v=>v.is_enabled).map(v=>v.price))].sort((a,b)=>a-b);
 const stats={id:entry.id,style:entry.blueprint_id,title:entry.title,before:before.map(money),after:after.map(money),minimumCost:money(Math.min(...enabled.map(v=>v.cost))),maximumCost:money(Math.max(...enabled.map(v=>v.cost)))};
 if(JSON.stringify(before)===JSON.stringify(after)&&enabled.every(v=>modifications.find(z=>z.id===v.id).price===v.price)){skipped++;details.push({...stats,status:'already_current'});continue}
 if(!DRY_RUN){
  try{
   await request('/shops/'+SHOP+'/products/'+entry.id+'.json','PUT',{variants:modifications});
   const verify=await request('/shops/'+SHOP+'/products/'+entry.id+'.json');
   const map=new Map(modifications.map(v=>[v.id,v.price]));
   const mismatches=verify.variants.filter(v=>v.is_enabled&&map.get(v.id)!==v.price);
   if(mismatches.length)throw Error('post-update verification mismatch '+mismatches.length);
  }catch(e){failed++;console.log('UPDATE_FAIL '+entry.id+' '+e.message);continue}
 }
 processed++;changed++;details.push({...stats,status:DRY_RUN?'planned':'updated'});
 }
 console.log('PRICE_RESULTS '+JSON.stringify({dry_run:DRY_RUN,total:all.length,processed,changed,skipped,failed,minima:minimum,details}));
 if(failed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
