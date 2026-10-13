'use strict';
// Good Company migration: remove prior product listings, not orders, customers, or account settings.
const shop='6647970';
const token=process.env.PRINTIFY_API_TOKEN;
if(!token || token==='None') throw new Error('PRINTIFY_API_TOKEN is not configured');
async function api(path, method='GET') {
  let last;
  for(let n=0;n<5;n++){
    const response=await fetch('https://api.printify.com/v1'+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/json','User-Agent':'GoodCompany-Migration/1.0'}});
    if(response.ok) return response.status===204?{}:await response.json();
    const detail=await response.text();
    last=new Error(method+' '+path+' HTTP '+response.status+': '+detail.slice(0,240));
    if(![429,500,502,503,504].includes(response.status)) break;
    await new Promise(r=>setTimeout(r,1500*(n+1)));
  }
  throw last;
}
async function list() {
 let all=[]; let page=1;
 for(;page<30;page++){
  const result=await api('/shops/'+shop+'/products.json?limit=50&page='+page);
  const items=result.data||[];
  all.push(...items);
  if(!items.length||page>=Number(result.last_page||1))break;
 }
 if(page>=30)throw new Error('Product pagination exceeded safety limit');
 return all;
}
(async()=>{
 const items=await list();
 const legacy=items.filter(x=>!/^Good Company\b/i.test(String(x.title||'')));
 console.log('Found '+items.length+' product listings; deleting '+legacy.length+' old listings; protecting '+(items.length-legacy.length)+' Good Company listings.');
 let deleted=0, errors=[];
 for(const p of legacy){
   try{
     await api('/shops/'+shop+'/products/'+encodeURIComponent(p.id)+'.json','DELETE');
     deleted++;
     console.log('Deleted '+deleted+'/'+legacy.length+': '+p.id+' '+String(p.title||'').slice(0,80));
   }catch(e){console.error('Failed '+p.id+' '+e.message);errors.push({id:p.id,error:e.message});}
 }
 const remaining=await list();
 const stale=remaining.filter(x=>!/^Good Company\b/i.test(String(x.title||'')));
 console.log(JSON.stringify({before:items.length,target:legacy.length,deleted,remaining:remaining.length,legacyRemaining:stale.length,failed:errors.length}));
 if(errors.length||stale.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e.message);process.exitCode=1});
