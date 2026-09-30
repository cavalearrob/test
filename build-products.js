const sharp=require('sharp');
const fs=require('fs');
const fontkit=require('fontkit');
let _font;
function brandFont(){if(!_font){_font=fontkit.create(fs.readFileSync(require.resolve('@fontsource/inter/files/inter-latin-900-normal.woff2')))}return _font}

const SHOP=6647970;
const slogans=[
"YOUR BOYFRIEND FOLLOWS ME","TIPS ARE MY LOVE LANGUAGE","CONTENT CREATOR — DON'T ASK WHAT KIND","YES, IT'S A REAL JOB.","DTF — DIRTY THOUGHTS FASHION","GOOD GIRLS. DIRTY THOUGHTS.","I'M THE REASON HE CLEARS HIS HISTORY","PAY ME, DON'T PLAY ME","SUBSCRIBE OR STAY CURIOUS","PRETTY EXPENSIVE","TIP FIRST. TALK LATER.","PRIVATE CONTENT. PUBLIC PROBLEM.",
"MY DMS HAVE A COVER CHARGE","NOT YOUR GIRL NEXT DOOR","BAD INFLUENCE","OFF THE CLOCK. STILL A PROBLEM.","I MAKE RENT LOOK EASY","CREATOR MODE: ALWAYS ON","SORRY, I'M BOOKED",
"YOUR FAVORITE BAD DECISION","HANDLE WITH TIPS","DTF AFTER DARK","DON'T FALL IN LOVE","PAID ATTENTION ONLY",
"MAKE IT WORTH MY WHILE","DIRTY THOUGHTS CLUB","TOO HOT FOR YOUR ALGORITHM","VIEW AT YOUR OWN RISK","FANTASY DEPARTMENT","I'M NOT FLIRTING. I'M NETWORKING.",
"PREMIUM ACCESS","GOOD TIPS, BAD IDEAS","EXCLUSIVE CONTENT","MAIN CHARACTER AFTER DARK","YOUR CRUSH SUBSCRIBES","DRESS CODE: EXPENSIVE",
"NO FREE PREVIEWS","DTF SOCIAL CLUB","MEMBERS ONLY ENERGY","DIRTY THOUGHTS — CLEAN FIT"
];
const productIds=["6abc14f6260c88028202a9c1","6abc1500bab7c171c90e2f4c","6abc150f6d4f888f2c043596","6abc151935a61a185c01f3c0","6abc1522c9018c5a7800bcc5","6abc152fa242b654f90d749c","6abc153dc9018c5a7800bccf","6abc154d7816221ec40a02f6","6abc15589b2bbab9840ca4a6","6abc15627816221ec40a030d","6abc189a6c23b4e9610bd171","6abc18a679dbacca490d138c","6abc18b0260c88028202ac30","6abc18c0d83811f59d05ba43","6abc18d61bfd33e859031d3d","6abc18e2bab7c171c90e313d","6abc18ee18395eee87051d79","6abc18f890ce5154a70423a5","6abc19096c23b4e9610bd19c","6abc191ad83811f59d05ba61","6abc19261bfd33e859031d57","6abc1939ecee919a4d0f93d2","6abc195becee919a4d0f93f2","6abc1969ecee919a4d0f9400","6abc19761bfd33e859031d8c","6abc1984c9018c5a7800bec9","6abc1992a242b654f90d775b","6abc19a0c9018c5a7800bef2","6abc19b26e660f7c7d072388","6abc19c6a242b654f90d7781","6abc19d6bd543ded3e01bd7f","6abc19e5f7710e1fdc03d4d0","6abc19fcbd543ded3e01bd9d","6abc1a133ada9325be0e42f5","6abc1a206e660f7c7d0723c2","6abc1a36a242b654f90d77d0","6abc1a44bab7c171c90e3235","6abc1a54a242b654f90d7801","6abc1a69f7710e1fdc03d59a","6abc1a8779dbacca490d1537"];
const plan=[...Array(12).fill('T-Shirts'),...Array(7).fill('Tank Tops'),...Array(5).fill('Crop Tops'),...Array(6).fill('Hoodies'),...Array(5).fill('Sweatpants'),...Array(5).fill('Panties')];
const cfg={
 'T-Shirts':{blueprint:6,provider:99,price:2999,position:'front',colors:['Black'],scale:.68},
 'Tank Tops':{blueprint:18,provider:99,price:2999,position:'front',colors:['Solid Black'],scale:.68},
 'Crop Tops':{blueprint:411,provider:99,price:3299,position:'front',colors:['Solid Black Blend'],scale:.66},
 'Hoodies':{blueprint:77,provider:99,price:5999,position:'front',colors:['Black'],scale:.62},
 'Sweatpants':{blueprint:1398,provider:39,price:5999,position:'left_leg_front',colors:['Black'],scale:.48},
 'Panties':{blueprint:407,provider:14,price:3499,position:'front',colors:['Black stitching'],scale:1}
};
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)}
function lines(text,max=17){
 const words=text.replace(/ — /g,' ').split(/\s+/),out=[];let cur='';
 for(const w of words){if((cur+' '+w).trim().length>max&&cur){out.push(cur);cur=w}else cur=(cur+' '+w).trim()}
 if(cur)out.push(cur);return out.slice(0,5);
}
function vectorText(text,cx,baseline,size,fill,opts={}){
 const font=brandFont(),run=font.layout(text),scale=size/font.unitsPerEm,spacing=opts.spacing||0;
 const width=run.positions.reduce((n,p)=>n+p.xAdvance*scale+spacing,0)-spacing;
 let x=cx-width/2,out='';
 run.glyphs.forEach((g,i)=>{
   const p=run.positions[i],d=g.path.toSVG(),tx=x+p.xOffset*scale,ty=baseline-p.yOffset*scale;
   const sw=opts.strokeWidth?opts.strokeWidth/scale:0;
   out+='<path d="'+d+'" transform="translate('+tx.toFixed(2)+' '+ty.toFixed(2)+') scale('+scale.toFixed(6)+' '+(-scale).toFixed(6)+')" fill="'+fill+'"'+(opts.stroke?' stroke="'+opts.stroke+'" stroke-width="'+sw.toFixed(2)+'" paint-order="stroke"':'')+'/>';
   x+=p.xAdvance*scale+spacing;
 });
 return opts.rotate?'<g transform="rotate('+opts.rotate+' '+cx+' '+baseline+')">'+out+'</g>':out;
}
function artworkSvg(text,index,isAop=false){
 const W=4500,H=5400,pink='#ff1682',white='#ffffff',black='#050505';
 const pantyShort=['EXPENSIVE','NO FREE PREVIEWS','SOCIAL CLUB','MEMBERS ONLY','CLEAN FIT'];
 if(isAop){
   const short=pantyShort[Math.max(0,index-35)]||'BAD IDEA';
   // Mostly-black AOP: small, centered phrase so the garment cut does not crop the design.
   const heart='<path d="M2250 1670 C2100 1480 1770 1510 1770 1815 C1770 2110 2250 2390 2250 2390 C2250 2390 2730 2110 2730 1815 C2730 1510 2400 1480 2250 1670Z" fill="none" stroke="'+pink+'" stroke-width="70"/>';
   return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><rect width="100%" height="100%" fill="'+black+'"/>'+heart+vectorText(short,2250,3300,Math.min(520,3600/Math.max(6,short.length)),white,{spacing:8})+'<path d="M1550 3560 L2950 3560" stroke="'+pink+'" stroke-width="52" stroke-linecap="round"/></svg>';
 }
 const ls=lines(text,index%3===0?15:18),n=ls.length;
 const font=Math.max(360,Math.min(720,Math.floor(2300/Math.max(1,n))));
 const first=2250-((n-1)*font*.82)/2;
 let body=ls.map((l,j)=>vectorText(l,2250,first+j*font*.82,font,j%2?pink:white)).join('');
 const accent=index%3===0
   ?'<path d="M1100 3650 Q2250 4050 3400 3650" fill="none" stroke="'+pink+'" stroke-width="58" stroke-linecap="round"/>'
   :index%3===1
   ?'<path d="M1450 1400 L3050 1400 M1450 3800 L3050 3800" stroke="'+pink+'" stroke-width="46" stroke-linecap="round"/>'
   :'<path d="M1450 1500 C1700 1200 2050 1200 2250 1500 C2450 1200 2800 1200 3050 1500" fill="none" stroke="'+pink+'" stroke-width="48"/>';
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+accent+body+'</svg>';
}
async function renderPng(text,index,isAop){return sharp(Buffer.from(artworkSvg(text,index,isAop))).png({compressionLevel:9,palette:true}).toBuffer()}
function pickVariants(list,c){
 let v=list.filter(x=>x.is_available!==false&&c.colors.includes(x.options?.color));
 if(!v.length)v=list.filter(x=>x.is_available!==false&&/black|dark|navy/i.test(x.options?.color||''));
 return v.slice(0,96);
}
async function buildProducts(printify,opts={}){
 const start=Math.max(0,Number(opts.start)||0),count=Math.max(1,Math.min(10,Number(opts.count)||10)),end=Math.min(slogans.length,start+count);
 const existing=await printify('/shops/'+SHOP+'/products.json?limit=100');
 const existingTitles=new Map(((existing.data&&existing.data.data)||[]).map(p=>[p.title,p]));
 const results=[];
 const variantCache=new Map();
 for(let i=start;i<end;i++){
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
 return {ok:results.every(x=>x.ok),start:start+1,end,created:results.filter(x=>x.ok&&!x.skipped).length,skipped:results.filter(x=>x.skipped).length,failed:results.filter(x=>!x.ok).length,results};
}
async function repairProducts(printify,opts={}){
 const start=Math.max(0,Number(opts.start)||0),count=Math.max(1,Math.min(2,Number(opts.count)||1)),end=Math.min(slogans.length,start+count),results=[];
 const blackName=(t,category)=>{
   if(category==='Panties')return true;
   const color=String(t||'').split('/')[0].trim().toLowerCase();
   return color==='black'||color==='solid black'||color==='solid black blend'||color==='black stitching';
 };
 for(let i=start;i<end;i++){
   const text=slogans[i],category=plan[i],c=cfg[category],id=productIds[i],title=text+' — DTF '+category.replace(/s$/,'');
   if(!id){results.push({index:i+1,title,ok:false,error:'Missing product id'});continue}
   try{
     const pr=await printify('/shops/'+SHOP+'/products/'+id+'.json');
     if(pr.status>=400){results.push({index:i+1,title,ok:false,stage:'fetch',status:pr.status,error:pr.data});continue}
     const variants=pr.data.variants||[],allIds=variants.map(v=>v.id),black=variants.filter(v=>blackName(v.title,category));
     if(!allIds.length||!black.length){results.push({index:i+1,title,ok:false,error:'No black variants available'});continue}
     const png=await renderPng(text,i,category==='Panties');
     const up=await printify('/uploads/images.json','POST',{file_name:'dtf-clean-v4-'+String(i+1).padStart(2,'0')+'-'+slug(text)+'.png',contents:png.toString('base64')});
     if(up.status>=400){results.push({index:i+1,title,ok:false,stage:'upload',status:up.status,error:up.data});continue}
     const placeholders=category==='Panties'
       ?['front','back','gusset'].map(position=>({position,images:[{id:up.data.id,x:.5,y:.5,scale:1,angle:0}]}))
       :[{position:c.position,images:[{id:up.data.id,x:.5,y:.5,scale:c.scale,angle:0}]}];
     const body={
       description:'[DTF-CLEAN-V4] '+text+' — black garment with original quote/graphic artwork. No brand logo on the garment.',
       variants:variants.map(v=>({id:v.id,price:v.price||c.price,is_enabled:blackName(v.title,category)})),
       print_areas:[{variant_ids:allIds,placeholders}]
     };
     const ur=await printify('/shops/'+SHOP+'/products/'+id+'.json','PUT',body);
     if(ur.status>=400){results.push({index:i+1,title,ok:false,stage:'update',status:ur.status,error:ur.data});continue}
     results.push({index:i+1,title,category,ok:true,id,artwork:'clean-v4',black_variants:black.length});
   }catch(e){results.push({index:i+1,title,ok:false,error:e.message})}
 }
 return {ok:results.every(x=>x.ok),start:start+1,end,repaired:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,results};
}
module.exports={buildProducts,repairProducts};