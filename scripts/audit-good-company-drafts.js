'use strict';
const token=process.env.PRINTIFY_API_TOKEN; if(!token)throw Error('missing token');
const shop='6647970';const h={Authorization:'Bearer '+token,Accept:'application/json','User-Agent':'GoodCompany-QA'};
async function get(p){const r=await fetch('https://api.printify.com/v1'+p,{headers:h});const s=await r.text();if(!r.ok)throw Error(r.status+' '+s.slice(0,300));return JSON.parse(s)}
(async()=>{let all=[],pg=1;for(;pg<=10;pg++){const d=await get('/shops/'+shop+'/products.json?limit=50&page='+pg);all.push(...(d.data||[]));if(pg>=Number(d.last_page||1))break;}
const results=all.map(p=>{const enabled=(p.variants||[]).filter(v=>v.is_enabled);const areas=[...new Set((p.print_areas||[]).flatMap(a=>(a.placeholders||[]).map(x=>x.position)))];const prices=[...new Set(enabled.map(v=>v.price))];const costs=enabled.map(v=>v.cost).filter(v=>typeof v==='number');return {id:p.id,title:p.title,visible:p.visible,published:p.is_published,blueprint:p.blueprint_id,provider:p.print_provider_id,colors:[...new Set(enabled.map(v=>v.title?.split(' / ')[0]))].slice(0,12),enabled:enabled.length,areas,prices,known_min_cost:costs.length?Math.min(...costs):null,images:p.images?.length||0,description:(p.description||'').slice(0,85)}});
console.log('AUDIT '+JSON.stringify({total:all.length,products:results}));
const issues=results.filter(x=>!x.areas.includes('front')||!x.areas.includes('back')||x.published===true||x.visible===true||x.prices.length!==1);
console.log('SUMMARY '+JSON.stringify({total:all.length,issues:issues.length,missingNeck:results.filter(x=>!x.areas.includes('neck')).length,pricingUnverified:results.filter(x=>x.known_min_cost===null).length,unicornTitles:results.filter(x=>/Unicorn/.test(x.title)).map(x=>x.title)}))
})().catch(e=>{console.error(e.stack);process.exitCode=1});
