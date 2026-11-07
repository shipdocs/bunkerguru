const { test } = require('node:test');
const assert = require('node:assert/strict');
const { waterRoute, placeLabel } = require('../navigation.js');
test('route passes around a quay rather than crossing it', () => {
  const clear = (a, b) => { const steps = Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)) || 1; for(let i=0;i<=steps;i++){ const x=a.x+(b.x-a.x)*i/steps,y=a.y+(b.y-a.y)*i/steps;if(x>=180&&x<=300&&y<=300)return false; }return true; };
  const path = waterRoute({x:60,y:100},{x:420,y:100},600,600,clear);
  assert(path.length>2);assert(path.some(p=>p.y>300));for(let i=1;i<path.length;i++)assert(clear(path[i-1],path[i]));
});
test('unreachable destination does not create a route over land', () => {
  const clear=(a,b)=> a.x<180&&b.x<180;
  assert.deepEqual(waterRoute({x:60,y:100},{x:420,y:100},600,600,clear),[]);
});
test('labels stay inside the map and do not overlap', () => {
  const boxes=[],bounds={x:0,y:0,w:200,h:180};
  for(let i=0;i<6;i++)placeLabel(boxes,100,80,100,18,bounds);
  assert(boxes.length>1);
  for(let i=0;i<boxes.length;i++){const a=boxes[i];assert(a.x>=0&&a.y>=0&&a.x+a.w<=200&&a.y+a.h<=180);for(const b of boxes.slice(i+1))assert(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);}
});
