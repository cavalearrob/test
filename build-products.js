const sharp=require('sharp');

const SHOP=6647970;
const slogans=[
"YOUR BOYFRIEND FOLLOWS ME","TIPS ARE MY LOVE LANGUAGE","CONTENT CREATOR — DON'T ASK WHAT KIND","YES, IT'S A REAL JOB.","DTF — DIRTY THOUGHTS FASHION","GOOD GIRLS. DIRTY THOUGHTS.","I'M THE REASON HE CLEARS HIS HISTORY","PAY ME, DON'T PLAY ME","SUBSCRIBE OR STAY CURIOUS","PRETTY EXPENSIVE","TIP FIRST. TALK LATER.","PRIVATE CONTENT. PUBLIC PROBLEM.",
"MY DMS HAVE A COVER CHARGE","NOT YOUR GIRL NEXT DOOR","BAD INFLUENCE","OFF THE CLOCK. STILL A PROBLEM.","I MAKE RENT LOOK EASY","CREATOR MODE: ALWAYS ON","SORRY, I'M BOOKED",
"YOUR FAVORITE BAD DECISION","HANDLE WITH TIPS","DTF AFTER DARK","DON'T FALL IN LOVE","PAID ATTENTION ONLY",
"MAKE IT WORTH MY WHILE","DIRTY THOUGHTS CLUB","TOO HOT FOR YOUR ALGORITHM","VIEW AT YOUR OWN RISK","FANTASY DEPARTMENT","I'M NOT FLIRTING. I'M NETWORKING.",
"PREMIUM ACCESS","GOOD TIPS, BAD IDEAS","EXCLUSIVE CONTENT","MAIN CHARACTER AFTER DARK","YOUR CRUSH SUBSCRIBES","DRESS CODE: EXPENSIVE",
"NO FREE PREVIEWS","DTF SOCIAL CLUB","MEMBERS ONLY ENERGY","DIRTY THOUGHTS — CLEAN FIT"
];
const plan=[...Array(12).fill('T-Shirts'),...Array(7).fill('Tank Tops'),...Array(5).fill('Crop Tops'),...Array(6).fill('Hoodies'),...Array(5).fill('Sweatpants'),...Array(5).fill('Panties')];
const cfg={
 'T-Shirts':{blueprint:6,provider:99,price:2999,position:'front',colors:['Black','Dark Heather','Navy','Military Green'],scale:.78},
 'Tank Tops':{blueprint:18,provider:99,price:2999,position:'front',colors:['Solid Black','Solid Midnight Navy','Solid Purple Rush'],scale:.78},
 'Crop Tops':{blueprint:411,provider:99,price:3299,position:'front',colors:['Solid Black Blend','Dark Grey Heather','Heather Deep Teal','Heather True Royal'],scale:.76},
 'Hoodies':{blueprint:77,provider:99,price:5999,position:'front',colors:['Black','Dark Heather','Navy','Military Green','Maroon'],scale:.72},
 'Sweatpants':{blueprint:1398,provider:39,price:5999,position:'left_leg_front',colors:['Black','Navy','Sport Grey'],scale:.68},
 'Panties':{blueprint:407,provider:14,price:3499,position:'front',colors:['Black stitching'],scale:1}
};
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)}
function lines(text,max=17){
 const words=text.replace(/ — /g,' ').split(/\s+/),out=[];let cur='';
 for(const w of words){if((cur+' '+w).trim().length>max&&cur){out.push(cur);cur=w}else cur=(cur+' '+w).trim()}
 if(cur)out.push(cur);return out.slice(0,5);
}
function artworkSvg(text,index,isAop=false){
 const W=4500,H=5400,pink='#ff2b8a',white='#ffffff',black='#0a0a0a';
 if(isAop){
   const safe=esc(text);return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="${black}"/><g font-family="DejaVu Sans,Arial,sans-serif" font-weight="900" text-anchor="middle"><text x="2250" y="700" font-size="300" fill="${pink}">DTF</text><text x="2250" y="1160" font-size="190" fill="${white}">DIRTY THOUGHTS FASHION</text><g transform="rotate(-12 2250 2800)"><text x="2250" y="2400" font-size="330" fill="${white}">${safe}</text><text x="2250" y="3000" font-size="260" fill="${pink}">GOOD GIRLS • DIRTIER THOUGHTS</text></g><text x="2250" y="4700" font-size="180" fill="${white}">WHAT DID YOU THINK DTF MEANT?</text></g></svg>`;
 }
 const ls=lines(text,index%3===0?15:18),n=ls.length;
 const font=Math.max(330,Math.min(760,Math.floor(2500/Math.max(1,n))));
 const start=2450-((n-1)*font*.62)/2;
 const textEls=ls.map((l,j)=>`<text x="2250" y="${Math.round(start+j*font*.82)}" font-size="${font}" fill="${j%2?pink:white}" stroke="${j%2?white:pink}" stroke-width="14" paint-order="stroke">${esc(l)}</text>`).join('');
 const frame=index%4===1?`<rect x="360" y="520" width="3780" height="4300" rx="160" fill="none" stroke="${pink}" stroke-width="38"/>`:'';
 const slash=index%4===2?`<path d="M500 4300 L4000 1050" stroke="${pink}" stroke-width="70" opacity=".28"/>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${frame}${slash}<g font-family="DejaVu Sans,Arial,sans-serif" font-weight="900" text-anchor="middle"><text x="2250" y="900" font-size="300" letter-spacing="35" fill="${pink}">D • T • F</text>${textEls}<text x="2250" y="4720" font-size="150" letter-spacing="12" fill="${white}">DIRTY THOUGHTS FASHION</text><text x="2250" y="5000" font-size="105" letter-spacing="8" fill="${pink}">WHAT DID YOU THINK DTF MEANT?</text></g></svg>`;
}
async function renderPng(text,index,isAop){return sharp(Buffer.from(artworkSvg(text,index,isAop))).png({compressionLevel:9,palette:true}).toBuffer()}
function pickVariants(list,c){
 let v=list.filter(x=>x.is_available!==false&&c.colors.includes(x.options?.color));
 if(!v.length)v=list.filter(x=>x.is_available!==false&&/black|dark|navy/i.test(x.options?.color||''));
 return v.slice(0,96);
}
async function buildProducts(printify){
 const existing=await printify('/shops/'+SHOP+'/products.json?limit=100');
 const existingTitles=new Map(((existing.data&&existing.data.data)||[]).map(p=>[p.title,p]));
 const results=[];
 const variantCache=new Map();
 for(let i=0;i<slogans.length;i++){
   const text=slogans[i],category=plan[i],c=cfg[category],title=text+' — DTF '+category.replace(/s$/,'');
   if(existingTitles.has(title)){const p=existingTitles.get(title);results.push({index:i+1,title,category,ok:true,skipped:true,id:p.id,mockup:p.images?.find(x=>x.is_default)?.src||p.images?.[0]?.src||null});continue}
   const key=c.blueprint+':'+c.provider;
   if(!variantCache.has(key)){
     const vr=await printify('/catalog/blueprints/'+c.blueprint+'/print_providers/'+c.provider+'/variants.json?show-out-of-stock=0');
     const list=Array.isArray(vr.data)?vr.data:(vr.data?.variants||[]);
     variantCache.set(key,pickVariants(list,c));
   }
   const variants=variantCache.get(key);
   if(!variants.length){results.push({index:i+1,title,category,ok:false,error:'No selected variants available'});continue}
   try{
     const png=await renderPng(text,i,category==='Panties');
     const up=await printify('/uploads/images.json','POST',{file_name:'dtf-'+String(i+1).padStart(2,'0')+'-'+slug(text)+'.png',contents:png.toString('base64')});
     if(up.status>=400){results.push({index:i+1,title,category,ok:false,stage:'upload',error:up.data});continue}
     let printAreas;
     if(category==='Panties'){
       const positions=['front','back','gusset'];
       printAreas=[{variant_ids:variants.map(v=>v.id),placeholders:positions.map(position=>({position,images:[{id:up.data.id,x:.5,y:.5,scale:1,angle:0}]}))}];
     }else{
       printAreas=[{variant_ids:variants.map(v=>v.id),placeholders:[{position:c.position,images:[{id:up.data.id,x:.5,y:.5,scale:c.scale,angle:0}]}]}];
     }
     const body={title,description:'Dirty Thoughts Fashion original. '+text+' — creator-owned adult-humor apparel with a bold DTF front graphic. Made to order through our print partner.',blueprint_id:c.blueprint,print_provider_id:c.provider,variants:variants.map(v=>({id:v.id,price:c.price,is_enabled:true})),print_areas:printAreas};
     const cr=await printify('/shops/'+SHOP+'/products.json','POST',body);
     if(cr.status>=400){results.push({index:i+1,title,category,ok:false,stage:'create',error:cr.data});continue}
     results.push({index:i+1,title,category,ok:true,id:cr.data.id,variant_count:(cr.data.variants||[]).filter(v=>v.is_enabled).length,cost_min:Math.min(...(cr.data.variants||[]).filter(v=>v.is_enabled).map(v=>v.cost)),cost_max:Math.max(...(cr.data.variants||[]).filter(v=>v.is_enabled).map(v=>v.cost)),mockup:cr.data.images?.find(x=>x.is_default)?.src||cr.data.images?.[0]?.src||null});
   }catch(e){results.push({index:i+1,title,category,ok:false,error:e.message})}
 }
 return {ok:results.every(x=>x.ok),created:results.filter(x=>x.ok&&!x.skipped).length,skipped:results.filter(x=>x.skipped).length,failed:results.filter(x=>!x.ok).length,results};
}
module.exports={buildProducts};