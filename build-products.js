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
const mensSlogans=[
"JUST HERE FOR THE COLLAB","SUPPORTING CAST","SCENE PARTNER","GUEST APPEARANCE","OFF CAMERA","AFTER HOURS DEPARTMENT","PROFESSIONAL PLUS ONE","CONTENT SUPPORT STAFF","HER FAVORITE COSTAR","THE OTHER TALENT","DO NOT DISTURB — PRODUCTION","PRIVATE AUDITIONS","WARDROBE OPTIONAL","GOOD HUSBAND. QUESTIONABLE HOBBIES.","I HOLD THE CAMERA","QUALITY CONTROL","BEHIND THE SCENES","COLLABORATIVE PARTNER","CAST & CREW","NO COMMENT. CHECK THE CREDITS.","NOT THE JEALOUS TYPE","OPEN MINDED DEPARTMENT","HAPPILY COMPLICATED","COMMUNICATION IS FOREPLAY","ASK US ABOUT THE GROUP CHAT"
];
const productIds=["6abc14f6260c88028202a9c1","6abc1500bab7c171c90e2f4c","6abc150f6d4f888f2c043596","6abc151935a61a185c01f3c0","6abc1522c9018c5a7800bcc5","6abc152fa242b654f90d749c","6abc153dc9018c5a7800bccf","6abc154d7816221ec40a02f6","6abc15589b2bbab9840ca4a6","6abc15627816221ec40a030d","6abc189a6c23b4e9610bd171","6abc18a679dbacca490d138c","6abc18b0260c88028202ac30","6abc18c0d83811f59d05ba43","6abc18d61bfd33e859031d3d","6abc18e2bab7c171c90e313d","6abc18ee18395eee87051d79","6abc18f890ce5154a70423a5","6abc19096c23b4e9610bd19c","6abc191ad83811f59d05ba61","6abc19261bfd33e859031d57","6abc1939ecee919a4d0f93d2","6abc195becee919a4d0f93f2","6abc1969ecee919a4d0f9400","6abc19761bfd33e859031d8c","6abc1984c9018c5a7800bec9","6abc1992a242b654f90d775b","6abc19a0c9018c5a7800bef2","6abc19b26e660f7c7d072388","6abc19c6a242b654f90d7781","6abc19d6bd543ded3e01bd7f","6abc19e5f7710e1fdc03d4d0","6abc19fcbd543ded3e01bd9d","6abc1a133ada9325be0e42f5","6abc1a206e660f7c7d0723c2","6abc1a36a242b654f90d77d0","6abc1a44bab7c171c90e3235","6abc1a54a242b654f90d7801","6abc1a69f7710e1fdc03d59a","6abc1a8779dbacca490d1537"];
const plan=[...Array(12).fill('T-Shirts'),...Array(7).fill('Tank Tops'),...Array(5).fill('Crop Tops'),...Array(6).fill('Hoodies'),...Array(5).fill('Sweatpants'),...Array(5).fill('Panties')];
const cfg={
 'T-Shirts':{blueprint:6,provider:99,price:2999,position:'front',colors:['Black'],scale:.68},
 'Tank Tops':{blueprint:18,provider:99,price:2999,position:'front',colors:['Solid Black'],scale:.68},
 'Crop Tops':{blueprint:411,provider:99,price:3299,position:'front',colors:['Solid Black Blend'],scale:.66},
 'Hoodies':{blueprint:77,provider:99,price:5999,position:'front',colors:['Black'],scale:.62},
 'Sweatpants':{blueprint:1398,provider:39,price:5999,position:'left_leg_front',colors:['Black'],scale:2.20},
 'Panties':{blueprint:407,provider:14,price:3499,position:'front',colors:['Black stitching'],scale:1}
};
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)}
function lines(text,max=17){
 const words=text.replace(/ — /g,' ').split(/\s+/),out=[];let cur='';
 for(const w of words){if((cur+' '+w).trim().length>max&&cur){out.push(cur);cur=w}else cur=(cur+' '+w).trim()}
 if(cur)out.push(cur);return out.slice(0,5);
}
function textWidth(text,size,spacing=0){
 const font=brandFont(),run=font.layout(text),scale=size/font.unitsPerEm;
 return run.positions.reduce((n,p)=>n+p.xAdvance*scale+spacing,0)-Math.max(0,spacing);
}
function vectorText(text,cx,baseline,size,fill,opts={}){
 const font=brandFont(),run=font.layout(text),scale=size/font.unitsPerEm,spacing=opts.spacing||0;
 const width=textWidth(text,size,spacing);
 let x=cx-width/2,out='';
 run.glyphs.forEach((g,i)=>{
   const p=run.positions[i],d=g.path.toSVG(),tx=x+p.xOffset*scale,ty=baseline-p.yOffset*scale;
   const sw=opts.strokeWidth?opts.strokeWidth/scale:0;
   out+='<path d="'+d+'" transform="translate('+tx.toFixed(2)+' '+ty.toFixed(2)+') scale('+scale.toFixed(6)+' '+(-scale).toFixed(6)+')" fill="'+fill+'"'+(opts.stroke?' stroke="'+opts.stroke+'" stroke-width="'+sw.toFixed(2)+'" paint-order="stroke"':'')+'/>';
   x+=p.xAdvance*scale+spacing;
 });
 return opts.rotate?'<g transform="rotate('+opts.rotate+' '+cx+' '+baseline+')">'+out+'</g>':out;
}
function fitText(text,cx,baseline,wanted,maxWidth,fill,opts={}){
 let size=wanted,width=textWidth(text,size,opts.spacing||0);
 if(width>maxWidth)size*=maxWidth/width;
 return vectorText(text,cx,baseline,size,fill,opts);
}
function heart(cx,cy,s,fill,stroke='none',sw=0){
 const x=cx,y=cy;
 return '<path d="M '+x+' '+(y+s*.30)+' C '+(x-s*.58)+' '+(y-s*.12)+', '+(x-s*.55)+' '+(y-s*.72)+', '+x+' '+(y-s*.43)+' C '+(x+s*.55)+' '+(y-s*.72)+', '+(x+s*.58)+' '+(y-s*.12)+', '+x+' '+(y+s*.30)+' Z" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
}
function sweatpantsSvg(text,index){
 const W=4500,H=5400,pink='#ff1682',white='#ffffff',cx=2250;
 const ls=lines(text,13),gap=620,first=2050-((ls.length-1)*gap)/2;
 let art=heart(cx,900,250,'none',pink,48)+heart(cx+520,1180,170,pink);
 art+=ls.map((l,j)=>{
   const emphasis=/LOVE|DIRTY|TIPS|PREMIUM|EXCLUSIVE|CRUSH|EXPENSIVE|ACCESS/i.test(l);
   const y=first+j*gap+(j%2?55:0);
   return fitText(l,cx,y,emphasis?760:650,3150,emphasis?pink:white,{spacing:emphasis?-4:1});
 }).join('');
 art+=heart(cx-520,first+ls.length*gap+180,190,pink)+heart(cx+400,first+ls.length*gap+430,300,'none',pink,52);
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+art+'</svg>';
}
function artworkSvg(text,index,isAop=false){
 const W=4500,H=5400,pink='#ff1682',white='#ffffff',black='#050505',cx=2250;
 const pantyShort=['PREMIUM','NO FREE PREVIEWS','DTF SOCIAL CLUB','MEMBERS ONLY','DIRTY THOUGHTS'];
 if(isAop){
   // Panties are an all-over-print product. Keep the actual garment black and
   // confine the DTF mark to a compact center-safe motif so the copy does not
   // run into leg openings, seams, or the gusset on manufacturer mockups.
   const short=pantyShort[Math.max(0,index-35)]||'DTF';
   const mark=heart(cx,2260,330,pink)+fitText(short,cx,3040,360,2050,white,{spacing:3})+
     '<path d="M1650 3300 L2850 3300" stroke="'+pink+'" stroke-width="38" stroke-linecap="round"/>';
   return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><rect width="100%" height="100%" fill="'+black+'"/>'+mark+'</svg>';
 }
 let art='';
 // Restore the original visual language from IMG_2954–IMG_2959:
 // clean centered type, hot-pink hearts/ornaments, no random smile lines.
 if(index===0){
   art=fitText('YOUR BOYFRIEND',cx,2200,620,3200,white)+fitText('FOLLOWS ME',cx,2860,720,3000,pink)+heart(cx,3450,360,pink);
 }else if(index===1){
   art=fitText('TIPS ARE MY',cx,2200,650,3000,white)+fitText('LOVE LANGUAGE',cx,2860,650,3200,white)+heart(cx,3450,360,pink);
 }else if(index===2){
   art=fitText('CONTENT CREATOR',cx,1900,620,3300,white)+
       '<path d="M900 2420 L3600 2420 M1050 2300 L900 2420 L1050 2540 M3450 2300 L3600 2420 L3450 2540" fill="none" stroke="'+pink+'" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/>'+
       heart(cx,2420,230,pink)+fitText("DON'T ASK",cx,3100,610,2800,white)+fitText('WHAT KIND',cx,3690,610,2800,white)+heart(cx,4210,300,pink);
 }else if(index===3){
   art=fitText("YES, IT'S A",cx,2200,650,2900,white)+fitText('REAL JOB',cx,2900,760,2600,pink)+heart(cx,3550,380,'none',pink,55);
 }else if(index===4){
   art=fitText('DTF',cx,2750,1450,2700,pink,{spacing:-10})+fitText('DIRTY THOUGHTS FASHION',cx,3400,330,3000,white,{spacing:8});
 }else{
   const ls=lines(text,16),n=ls.length;
   const gap=n<=2?760:n===3?650:560;
   const first=2500-((n-1)*gap)/2;
   art=ls.map((l,j)=>fitText(l,cx,first+j*gap,j===n-1?690:620,3100,j===n-1&&index%2===0?pink:white,{spacing:2})).join('');
   if(index%4===0)art+=heart(cx,first+n*gap+120,320,pink);
   else if(index%4===1)art+='<path d="M1250 '+(first+n*gap+80)+' L3250 '+(first+n*gap+80)+'" stroke="'+pink+'" stroke-width="50" stroke-linecap="round"/>';
   else if(index%4===2)art+=heart(cx,first+n*gap+100,300,'none',pink,52);
   else art+='<path d="M1450 '+(first+n*gap+80)+' Q2250 '+(first+n*gap+420)+' 3050 '+(first+n*gap+80)+'" fill="none" stroke="'+pink+'" stroke-width="48" stroke-linecap="round"/>';
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+art+'</svg>';
}
async function renderPng(text,index,isAop){
 const svg=plan[index]==='Sweatpants'?sweatpantsSvg(text,index):artworkSvg(text,index,isAop);
 return sharp(Buffer.from(svg)).png({compressionLevel:9,palette:true}).toBuffer()
}
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
async function buildMensProducts(printify,opts={}){
 const start=Math.max(0,Number(opts.start)||0),count=Math.max(1,Math.min(10,Number(opts.count)||5)),end=Math.min(mensSlogans.length,start+count),results=[];
 const c=cfg['T-Shirts'];
 const vr=await printify('/catalog/blueprints/'+c.blueprint+'/print_providers/'+c.provider+'/variants.json?show-out-of-stock=0');
 const list=Array.isArray(vr.data)?vr.data:(vr.data?.variants||[]),variants=pickVariants(list,c);
 if(!variants.length)return {ok:false,error:'No black mens T-shirt variants available'};
 const existing=await printify('/shops/'+SHOP+'/products.json?limit=100');
 const existingTitles=new Map(((existing.data&&existing.data.data)||[]).map(p=>[p.title,p]));
 for(let i=start;i<end;i++){
  const text=mensSlogans[i],title=text+' — DTF Men T-Shirt';
  if(existingTitles.has(title)){results.push({index:i+1,title,ok:true,skipped:true,id:existingTitles.get(title).id});continue}
  try{
   const png=await renderPng(text,100+i,false);
   const up=await printify('/uploads/images.json','POST',{file_name:'dtf-men-'+String(i+1).padStart(2,'0')+'-'+slug(text)+'.png',contents:png.toString('base64')});
   if(up.status>=400){results.push({index:i+1,title,ok:false,stage:'upload',error:up.data});continue}
   const body={title,description:'[DTF-MEN-V1] '+text+' — DTF Men After Hours. Hidden adult humor for creators, costars, performers and partners.',blueprint_id:c.blueprint,print_provider_id:c.provider,variants:variants.map(v=>({id:v.id,price:2999,is_enabled:true})),print_areas:[{variant_ids:variants.map(v=>v.id),placeholders:[{position:'front',images:[{id:up.data.id,x:.5,y:.5,scale:.60,angle:0}]}]}]};
   const cr=await printify('/shops/'+SHOP+'/products.json','POST',body);
   if(cr.status>=400){results.push({index:i+1,title,ok:false,stage:'create',error:cr.data});continue}
   results.push({index:i+1,title,ok:true,id:cr.data.id,production_artwork_id:up.data.id,mockup:cr.data.images?.find(x=>x.is_default)?.src||cr.data.images?.[0]?.src||null});
  }catch(e){results.push({index:i+1,title,ok:false,error:e.message})}
 }
 return {ok:results.every(x=>x.ok),collection:'DTF Men — After Hours',start:start+1,end,created:results.filter(x=>x.ok&&!x.skipped).length,skipped:results.filter(x=>x.skipped).length,failed:results.filter(x=>!x.ok).length,results};
}
async function repairProducts(printify,opts={}){
 const start=Math.max(0,Number(opts.start)||0),count=Math.max(1,Math.min(2,Number(opts.count)||1)),end=Math.min(slogans.length,start+count),results=[];
 const blackName=(t,category)=>{
   if(category==='Panties')return true;
   return /(^|\/|\s)(solid\s+)?black(\s+blend|\s+stitching)?(\s|\/|$)/i.test(String(t||''));
 };
 for(let i=start;i<end;i++){
   const text=slogans[i],category=plan[i],c=cfg[category],id=productIds[i],title=text+' — DTF '+category.replace(/s$/,'');
   if(!id){results.push({index:i+1,title,ok:false,error:'Missing product id'});continue}
   try{
     const pr=await printify('/shops/'+SHOP+'/products/'+id+'.json');
     if(pr.status>=400){results.push({index:i+1,title,ok:false,stage:'fetch',status:pr.status,error:pr.data});continue}
     const variants=pr.data.variants||[],allIds=variants.map(v=>v.id);
     const black=i>=35 ? variants : variants.filter(v=>blackName(v.title,category));
     if(!allIds.length||!black.length){results.push({index:i+1,title,ok:false,error:'No black variants available'});continue}
     const png=await renderPng(text,i,category==='Panties');
     const up=await printify('/uploads/images.json','POST',{file_name:'dtf-original-v5-'+String(i+1).padStart(2,'0')+'-'+slug(text)+'.png',contents:png.toString('base64')});
     if(up.status>=400){results.push({index:i+1,title,ok:false,stage:'upload',status:up.status,error:up.data});continue}
     const imageFor=(position,scale)=>({position,images:[{id:up.data.id,x:.5,y:.5,scale,angle:0}]});
     let printAreas;
     if(category==='Panties'){
       // Front carries the compact branded motif. Back and gusset use a plain
       // black production tile so the slogan is never duplicated/cropped there.
       const plain=await sharp({create:{width:4500,height:5400,channels:4,background:'#050505'}}).png().toBuffer();
       const plainUp=await printify('/uploads/images.json','POST',{file_name:'dtf-panty-black-base.png',contents:plain.toString('base64')});
       if(plainUp.status>=400){results.push({index:i+1,title,ok:false,stage:'upload-base',status:plainUp.status,error:plainUp.data});continue}
       printAreas=[{variant_ids:allIds,placeholders:[
         imageFor('front',1),
         {position:'back',images:[{id:plainUp.data.id,x:.5,y:.5,scale:1,angle:0}]},
         {position:'gusset',images:[{id:plainUp.data.id,x:.5,y:.5,scale:1,angle:0}]}
       ]}];
     }else{
       // Preserve Printify's existing variant grouping. Some Choice products use
       // multiple print-area groups; collapsing them causes API validation 8251.
       const existingAreas=(pr.data.print_areas||[]).filter(a=>Array.isArray(a.variant_ids)&&a.variant_ids.length);
       printAreas=existingAreas.length
         ? existingAreas.map(a=>({variant_ids:a.variant_ids,placeholders:[imageFor(c.position,c.scale)]}))
         : [{variant_ids:allIds,placeholders:[imageFor(c.position,c.scale)]}];
     }
     const body={
       description:'[DTF-ORIGINAL-V5] '+text+' — restored Dirty Thoughts Fashion original-look quote/graphic artwork.',
       variants:variants.map(v=>({id:v.id,price:v.price||c.price,is_enabled:i>=35 ? true : blackName(v.title,category)})),
       print_areas:printAreas
     };
     const ur=await printify('/shops/'+SHOP+'/products/'+id+'.json','PUT',body);
     if(ur.status>=400){results.push({index:i+1,title,ok:false,stage:'update',status:ur.status,error:ur.data});continue}
     results.push({index:i+1,title,category,ok:true,id,artwork:'original-look-v5',black_variants:black.length});
   }catch(e){results.push({index:i+1,title,ok:false,error:e.message})}
 }
 return {ok:results.every(x=>x.ok),start:start+1,end,repaired:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,results};
}

async function rebuildSweatpants(printify){
 const c=cfg['Sweatpants'],results=[],start=30,end=35;
 const vr=await printify('/catalog/blueprints/'+c.blueprint+'/print_providers/'+c.provider+'/variants.json?show-out-of-stock=0');
 const list=Array.isArray(vr.data)?vr.data:(vr.data?.variants||[]),variants=pickVariants(list,c);
 if(!variants.length)return {ok:false,error:'No black sweatpants variants available'};
 for(let i=start;i<end;i++){
  const text=slogans[i],oldId=productIds[i],title=text+' — DTF Sweatpant';
  try{
   if(oldId){const del=await printify('/shops/'+SHOP+'/products/'+oldId+'.json','DELETE');if(del.status>=400&&del.status!==404){results.push({title,ok:false,stage:'delete',status:del.status,error:del.data});continue}}
   const png=await renderPng(text,i,false);
   const up=await printify('/uploads/images.json','POST',{file_name:'dtf-sweatpants-xl-'+String(i+1)+'-'+slug(text)+'.png',contents:png.toString('base64')});
   if(up.status>=400){results.push({title,ok:false,stage:'upload',error:up.data});continue}
   const ids=variants.map(v=>v.id);
   const body={title,description:'[DTF-ORIGINAL-V6] '+text+' — DTF sweatpants with enlarged 2.5x leg artwork.',blueprint_id:c.blueprint,print_provider_id:c.provider,variants:variants.map(v=>({id:v.id,price:c.price,is_enabled:true})),print_areas:[{variant_ids:ids,placeholders:[{position:c.position,images:[{id:up.data.id,x:.5,y:.5,scale:c.scale,angle:0}]}]}]};
   const cr=await printify('/shops/'+SHOP+'/products.json','POST',body);
   if(cr.status>=400){results.push({title,ok:false,stage:'create',error:cr.data});continue}
   results.push({title,ok:true,deleted:oldId,new_id:cr.data.id,mockup:cr.data.images?.find(x=>x.is_default)?.src||cr.data.images?.[0]?.src||null});
  }catch(e){results.push({title,ok:false,error:e.message})}
 }
 return {ok:results.every(x=>x.ok),created:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,results};
}

async function buildReplacementPanties(printify){
 const c=cfg['Panties'],results=[];
 const vr=await printify('/catalog/blueprints/'+c.blueprint+'/print_providers/'+c.provider+'/variants.json?show-out-of-stock=0');
 const list=Array.isArray(vr.data)?vr.data:(vr.data?.variants||[]),variants=pickVariants(list,c);
 if(!variants.length)return {ok:false,error:'No panty variants available'};
 const replacements=[
  {name:'PREMIUM ACCESS',short:'PREMIUM'},
  {name:'NO FREE PREVIEWS',short:'NO PREVIEWS'},
  {name:'DTF SOCIAL CLUB',short:'DTF CLUB'},
  {name:'MEMBERS ONLY ENERGY',short:'MEMBERS ONLY'},
  {name:'DIRTY THOUGHTS — CLEAN FIT',short:'DIRTY THOUGHTS'}
 ];
 for(let j=0;j<replacements.length;j++){
  const r=replacements[j],idx=35+j,title=r.name+' — DTF Pantie V2';
  try{
   const W=4500,H=5400,pink='#ff1682',white='#ffffff',black='#050505',cx=2250;
   const art='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><rect width="100%" height="100%" fill="'+black+'"/>'+heart(cx,2250,220,pink)+fitText(r.short,cx,2800,300,1500,white,{spacing:2})+fitText('DTF',cx,3300,240,800,pink,{spacing:3})+'</svg>';
   const png=await sharp(Buffer.from(art)).png({compressionLevel:9,palette:true}).toBuffer();
   const up=await printify('/uploads/images.json','POST',{file_name:'dtf-panty-v2-'+(j+1)+'-'+slug(r.name)+'.png',contents:png.toString('base64')});
   if(up.status>=400){results.push({title,ok:false,stage:'upload',error:up.data});continue}
   const plain=await sharp({create:{width:4500,height:5400,channels:4,background:black}}).png().toBuffer();
   const base=await printify('/uploads/images.json','POST',{file_name:'dtf-panty-v2-black.png',contents:plain.toString('base64')});
   if(base.status>=400){results.push({title,ok:false,stage:'base',error:base.data});continue}
   const ids=variants.map(v=>v.id);
   const body={title,description:'[DTF-ORIGINAL-V5] [DTF-PANTY-V2] '+r.name+' — compact front-safe DTF underwear artwork.',blueprint_id:c.blueprint,print_provider_id:c.provider,variants:variants.map(v=>({id:v.id,price:c.price,is_enabled:true})),print_areas:[{variant_ids:ids,placeholders:[
    {position:'front',images:[{id:up.data.id,x:.5,y:.5,scale:1,angle:0}]},
    {position:'back',images:[{id:base.data.id,x:.5,y:.5,scale:1,angle:0}]},
    {position:'gusset',images:[{id:base.data.id,x:.5,y:.5,scale:1,angle:0}]}
   ]}]};
   const cr=await printify('/shops/'+SHOP+'/products.json','POST',body);
   if(cr.status>=400){results.push({title,ok:false,stage:'create',error:cr.data});continue}
   results.push({title,ok:true,id:cr.data.id,mockup:cr.data.images?.find(x=>x.is_default)?.src||cr.data.images?.[0]?.src||null});
  }catch(e){results.push({title,ok:false,error:e.message})}
 }
 return {ok:results.every(x=>x.ok),created:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,results};
}

module.exports={buildProducts,buildMensProducts,repairProducts,buildReplacementPanties,rebuildSweatpants,BUILD_VERSION:'original-look-v6-sweatpants-xl'};