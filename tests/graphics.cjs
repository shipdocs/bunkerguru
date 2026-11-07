const {test}=require('node:test');
const assert=require('node:assert/strict');
const {resolution,onStreet,organize}=require('../graphics.js');
test('high-density canvas stays sharp within the pixel budget',()=>{
 const phone=resolution(390,844,3);assert.equal(phone.ratio,2);assert.equal(phone.width,780);assert.equal(phone.height,1688);
 const large=resolution(2400,1600,3);assert(large.width*large.height<=6005000);assert(large.ratio>=1&&large.ratio<2);
 assert.equal(resolution(390,844,undefined).ratio,1);
});
test('industrial parcels use buildings off roads and preserve landmarks',()=>{
 const region={kind:'tanks',poly:[{x:0,y:0},{x:960,y:0},{x:960,y:800},{x:0,y:800}]};
 const inside=(p)=>p.x>=0&&p.x<=960&&p.y>=0&&p.y<=800;
 const items=[];for(let x=40;x<950;x+=48)for(let y=40;y<790;y+=48)items.push({type:'house',x,y});
 items.push({type:'tower',x:400,y:400});
 const result=organize(items,[region],(x,y)=>({s:x,n:y}),(s,n)=>({x:s,y:n}),inside);
 assert(result.some(d=>d.type==='block'));assert(result.some(d=>d.type==='tower'));assert(!result.some(d=>d.type==='house'));
 for(const d of result.filter(d=>d.type==='block')){assert(!onStreet(d.lotS,d.lotN,44));assert(inside({x:d.x-34,y:d.y-34})&&inside({x:d.x+34,y:d.y+34}));}
 assert.equal(new Set(result.filter(d=>d.type==='block').map(d=>`${d.x},${d.y}`)).size,result.filter(d=>d.type==='block').length);
});
