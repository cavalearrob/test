'use strict';
/* Good Company preproduction: create unpublished Printify sample drafts; NEVER publish or send to production.
   Input artwork from checked-in Good_Company_Uncropped_Printify_Assets.
*/
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const TOKEN=process.env.PRINTIFY_API_TOKEN,SHOP='6647970';
if(!TOKEN)throw Error('PRINTIFY_API_TOKEN missing');
const ROOT=path.join(__dirname,'..','Good_Company_Uncropped_Printify_Assets');
const DRY_RUN=process.env.GC_DRY_RUN!=='0';
const LIMIT=Math.max(1,Math.min(20,Number(process.env.GC_LIMIT||4)));
const DESIGNS=[
 {file:'01_infinity_heart_freedom_to_choose.png',title:'Infinity Heart — Freedom to Choose'},
 {file:'02_swap_keys_key_party_alumni.png',title:'Swap Keys — Key Party Alumni'},
 {file:'03_tricircle_jealousy_never_heard_of_her.png',title:'Tricircle — Jealousy? Never Heard of Her'},
 {file:'05_pineapple_were_the_fun_couple.png',title:'Pineapple — We’re the Fun Couple'},
 {file:'06_triquetra_swap_meet_regular.png',title:'Triquetra — Swap Meet Regular'},
 {file:'04_unicorn_they_found_me.png',title:'Unicorn — They Found Me'},
 {file:'04_unicorn_we_found_him.png',title:'Unicorn — We Found Him'},
];
const STYLES=[
 {name:'Men’s Classic Tee',blueprint:145,provider:39,colors:['Black','Charcoal','Navy','Military Green','White','Natural','Sand'],sizes:['S','M','L','XL','2XL','3XL']},
 {name:'Women’s Fitted Tee',blueprint:88,provider:39,colors:['Black','Navy','White','Azalea','Purple','Dark Heather'],sizes:['S','M','L','XL','2XL']},
 {name:'Oversized Tee',blueprint:1382,provider:39,colors:['Black','Navy','Natural','Dark Grey','Soft Pink','White','Toast'],sizes:['S','M','L','XL','2XL','3XL']},
 {name:'Premium Hoodie',blueprint:1525,provider:39,colors:['Black','Charcoal','Navy','Military Green','Sand','Light Pink','White'],sizes:['S','M','L','XL','2XL','3XL']},
];
const auth={Authorization:'Bearer '+TOKEN,Accept:'application/json','Content-Type':'application/json;charset=utf-8','User-Agent':'GoodCompany-Preproduction'};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function call(p,method='GET',body){
 let last;
 for(let attempt=0;attempt<4;attempt++){
  const res=await fetch('https://api.printify.com/v1'+p,{method,headers:auth,body:body?JSON.stringify(body):undefined});
  const raw=await res.text();let data;try{data=JSON.parse(raw)}catch{data={message:raw.slice(0,500)}}
  if(res.ok)return data;
  last=new Error(method+' '+p+' HTTP '+res.status+' '+JSON.stringify(data).slice(0,500));
  if(![429,500,502,503,504].includes(res.status))break;
  await sleep(1500*(attempt+1));
 }throw last;
}
async function upload(file_name,buffer){const r=await call('/uploads/images.json','POST',{file_name,contents:buffer.toString('base64')});if(!r.id)throw Error('Upload response missing id');return r.id}
async function makeChest(source){
 // Existing left_chest graphics contain large text. Extract only the top emblem region.
 // Inset generously to avoid the clipped-edge bug; this is a provisional supplier PROOF.
 const metadata=await sharp(source).metadata();
 const cap=Math.round(metadata.height*0.43);
 const crop=await sharp(source).extract({left:0,top:0,width:metadata.width,height:cap}).png().toBuffer();
 return sharp(crop).resize({width:850,height:850,fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
}
function selectVariants(vs,style){
 const choices=vs.filter(v=>v.is_available!==false&&style.colors.includes(v.options?.color)&&style.sizes.includes(v.options?.size));
 const colorMap=new Map();
 for(const v of choices){const key=v.options?.color;const a=colorMap.get(key)||[];a.push(v);colorMap.set(key,a)}
 return [...colorMap.values()].flat().slice(0,55);
}
async function listProducts(){
 const data=await call('/shops/'+SHOP+'/products.json?limit=100');
 return data.data||[];
}
(async()=>{
 const existing=new Map((await listProducts()).map(x=>[x.title,x.id]));
 const work=[];for(const d of DESIGNS)for(const s of STYLES)work.push({d,s});
 console.log('PLAN '+JSON.stringify({dry_run:DRY_RUN,total_combinations:work.length,limit:LIMIT,existing:existing.size}));
 let created=0,skipped=0,failures=[];
 const variantsCache=new Map();const uploadCache=new Map();
 for(const {d,s} of work.slice(0,LIMIT)){
  const title='Good Company | '+d.title+' | '+s.name;
  if(existing.has(title)){skipped++;console.log('SKIP '+title);continue}
  try{
   const key=s.blueprint+':'+s.provider;
   if(!variantsCache.has(key)){
     const v=await call('/catalog/blueprints/'+s.blueprint+'/print_providers/'+s.provider+'/variants.json');
     const variants=Array.isArray(v)?v:(v.variants||v.data||[]);
     variantsCache.set(key,selectVariants(variants,s));
   }
   const variants=variantsCache.get(key);
   if(!variants.length)throw Error('No compatible available variants');
   const maxCost=Math.max(...variants.map(x=>Number(x.cost)||0));
   const price=Math.max(3499,Math.ceil(maxCost*2.2/100)*100);
   console.log('VALID '+JSON.stringify({title,blueprint:s.blueprint,provider:s.provider,variants:variants.length,colors:[...new Set(variants.map(x=>x.options?.color))],max_cost_cents:maxCost,price_cents:price}));
   if(DRY_RUN)continue;
   const k=d.file;
   if(!uploadCache.has(k)){
      const back=fs.readFileSync(path.join(ROOT,'back',k));
      const front=await makeChest(fs.readFileSync(path.join(ROOT,'left_chest',k)));
      const backId=await upload('gc-back-'+k,back);
      const frontId=await upload('gc-chest-'+k,front);
      uploadCache.set(k,{backId,frontId});
   }
   const {backId,frontId}=uploadCache.get(k);
   const ids=variants.map(v=>v.id);
   const body={title,description:'[GOOD-COMPANY-PROOF] Good Company collection. Unpublished product draft pending supplier and label proof. Artwork on left chest and back. '+d.title,
      blueprint_id:s.blueprint,print_provider_id:s.provider,
      variants:variants.map(v=>({id:v.id,price,is_enabled:true})),
      print_areas:[{variant_ids:ids,placeholders:[
       {position:'front',images:[{id:frontId,x:.27,y:.21,scale:.24,angle:0}]},
       {position:'back',images:[{id:backId,x:.5,y:.5,scale:.80,angle:0}]}
      ]}]};
   const product=await call('/shops/'+SHOP+'/products.json','POST',body);
   console.log('CREATED '+JSON.stringify({id:product.id,title,variants:variants.length,mockup:product.images?.[0]?.src||null}));
   created++;
  }catch(e){failures.push({title,error:e.message});console.log('FAIL '+title+' :: '+e.message)}
 }
 console.log('RESULT '+JSON.stringify({dry_run:DRY_RUN,created,skipped,failures}));
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1});
