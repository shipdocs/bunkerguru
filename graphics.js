// Shared visual rules. Coordinates stay in CSS/world pixels; only the canvas backing store scales.
(function(root) {
  const mod = (v, n) => ((v % n) + n) % n;
  const industrial = kind => ['tanks', 'containers', 'port', 'base'].includes(kind);
  function resolution(width, height, deviceRatio) {
    const ratio = Math.max(1, Math.min(2, Number(deviceRatio) || 1, Math.sqrt(6000000 / Math.max(1, width * height))));
    return { ratio, width: Math.round(width * ratio), height: Math.round(height * ratio) };
  }
  function onStreet(s, n, clearance = 17) { return Math.min(mod(s, 240), 240 - mod(s, 240)) < clearance || Math.min(mod(n, 200), 200 - mod(n, 200)) < clearance; }
  function organize(items, regions, toLocal, toWorld, contains) {
    const used = new Set(), landmarks = items.filter(d => ['tower', 'stadium'].includes(d.type));
    const result = [];
    for (const item of items) {
      if (['crane', 'tower', 'stadium'].includes(item.type)) { result.push(item); continue; }
      const region = regions.find(l => contains(item, l.poly)); if (!region) continue;
      const d = { ...item }, p = toLocal(d.x, d.y), factory = industrial(region.kind);
      if (factory && d.type === 'house') { d.type = 'block'; d.w = 62; d.h = 38; d.col = '#81939b'; }
      const spacing = d.type === 'tank' ? 80 : d.type === 'block' ? 88 : d.type === 'container' ? 40 : 48;
      const s = Math.round(p.s / spacing) * spacing + spacing / 2, n = Math.round(p.n / spacing) * spacing + spacing / 2;

      const point = toWorld(s, n), radius = d.type === 'tank' ? (d.r || 20) + 10 : d.type === 'block' ? 34 : d.type === 'tree' ? 12 : 20;
      if (onStreet(s, n, radius + 10)) continue;
      if (![[0,0],[-radius,-radius],[radius,-radius],[-radius,radius],[radius,radius]].every(([a,b]) => contains(toWorld(s+a,n+b), region.poly))) continue;
      if (landmarks.some(l => Math.hypot(point.x-l.x,point.y-l.y) < (l.type === 'stadium' ? 125 : 50))) continue;
      const key = `${Math.round(s / 24)},${Math.round(n / 24)}`;
      if (used.has(key)) continue; used.add(key);
      Object.assign(d, point, { district: region.kind, lotS: s, lotN: n, parcel: region }); result.push(d);
    }
    return result;
  }
  function districts(ctx, regions, toLocal, toWorld, outline, angle, items) {
    ctx.save();
    for (const l of regions) {
      if (['pillar','dam','park'].includes(l.kind)) continue;
      const points=l.poly.map(p=>toLocal(p.x,p.y));
      const s0=Math.min(...points.map(p=>p.s)),s1=Math.max(...points.map(p=>p.s)),n0=Math.min(...points.map(p=>p.n)),n1=Math.max(...points.map(p=>p.n));
      ctx.save(); outline(l.poly);ctx.clip();const origin=toWorld(0,0);ctx.translate(origin.x,origin.y);ctx.rotate(angle);
      // Roads and service lanes belong to a shared grid, so adjacent parcels join up.
      ctx.strokeStyle='#6f7c7c';ctx.lineWidth=16;ctx.beginPath();
      for(let s=Math.ceil(s0/240)*240;s<s1;s+=240){ctx.moveTo(s,n0);ctx.lineTo(s,n1);}
      for(let n=Math.ceil(n0/200)*200;n<n1;n+=200){ctx.moveTo(s0,n);ctx.lineTo(s1,n);}ctx.stroke();
      ctx.strokeStyle='rgba(237,231,206,.55)';ctx.lineWidth=1;ctx.setLineDash([6,10]);ctx.stroke();ctx.setLineDash([]);
      if(industrial(l.kind)) {
        // Pipe racks and compound edges, deliberately quieter than navigation overlays.
        ctx.strokeStyle='rgba(78,100,107,.35)';ctx.lineWidth=2;ctx.beginPath();
        for(let s=Math.ceil(s0/240)*240+23;s<s1;s+=240){ctx.moveTo(s,n0);ctx.lineTo(s,n1);ctx.moveTo(s+5,n0);ctx.lineTo(s+5,n1);}ctx.stroke();
        ctx.strokeStyle='#84999a';ctx.lineWidth=2;ctx.beginPath();
        for(const d of items || []) if(d.parcel===l && d.type==='tank'){const rack=Math.round(d.lotS/240)*240+23;ctx.moveTo(d.lotS,d.lotN);ctx.lineTo(rack,d.lotN);}ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  function prop(ctx,d,angle,shadow=true) {
    const box=(x,y,w,h,fill)=>{ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);};
    ctx.save();ctx.translate(d.x,d.y);ctx.rotate(angle);
    if(d.type==='house'||d.type==='block'){const w=d.type==='block'?64:30,h=d.type==='block'?42:23;box(-w/2-4,-h/2-4,w+8,h+8,d.type==='block'?'#b0b7b1':'#b9c1a6');}
    if(shadow){ctx.save();ctx.rotate(-angle);ctx.translate(4,5);ctx.rotate(angle);ctx.globalAlpha=.2;ctx.fillStyle='#1a2b35';
      if(d.type==='tank'||d.type==='tree'){ctx.beginPath();ctx.arc(0,0,d.type==='tree'?11:(d.r||20)+3,0,Math.PI*2);ctx.fill();}
      else {const w=d.type==='block'?64:d.type==='crane'?100:30,h=d.type==='block'?42:d.type==='crane'?22:22;ctx.fillRect(-w/2,-h/2,w,h);}ctx.restore();}
    ctx.lineWidth=1.2;ctx.strokeStyle='#43555c';
    if(d.type==='house'||d.type==='block'){
      const warehouse=d.type==='block',w=warehouse?64:30,h=warehouse?42:23,col=warehouse?'#8b9da3':(d.col||'#b96b50');
      box(-w/2,-h/2,w,h,col);box(-w/2,0,w,h/2,warehouse?'#71868e':'#9c5b48');ctx.strokeRect(-w/2,-h/2,w,h);
      ctx.strokeStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.moveTo(-w/2,0);ctx.lineTo(w/2,0);ctx.stroke();
      if(warehouse){for(let x=-22;x<27;x+=12){box(x,-13,7,6,'#bfdae0');box(x,7,7,6,'#a7c6d0');}box(-w/2+3,h/2+2,20,6,'#818f91');}
      else{box(-10,-8,4,5,'#744c3d');box(8,3,4,5,'#d2bda0');}
    }else if(d.type==='tank'){
      const r=d.r||21;ctx.fillStyle='#b4bdb8';ctx.fillRect(-r-5,-r-5,2*r+10,2*r+10);
      ctx.fillStyle='#d8ded8';ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#657b82';ctx.lineWidth=2;ctx.stroke();
      ctx.strokeStyle='#acb9b6';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r-4,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r-4,0);ctx.stroke();ctx.fillStyle='#879c9e';ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();
      box(r,-2,10,4,'#71868a');
    }else if(d.type==='container'){
      const colors=['#457f91','#ad7158','#b5a36b','#687f82'];const c=colors[Math.abs(Math.round(d.x+d.y))%4];
      for(let j=0;j<2;j++){box(-17,-13+j*15,34,12,c);ctx.strokeStyle='#324b58';ctx.strokeRect(-17,-13+j*15,34,12);ctx.strokeStyle='rgba(235,241,225,.25)';ctx.beginPath();for(let x=-12;x<16;x+=5){ctx.moveTo(x,-12+j*15);ctx.lineTo(x,-2+j*15);}ctx.stroke();}
    }else if(d.type==='tree'){
      ctx.fillStyle='#547d63';ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.fill();ctx.fillStyle='#71987a';ctx.beginPath();ctx.arc(-3,-3,7,0,Math.PI*2);ctx.fill();
    }else if(d.type==='crane'){
      // A plan-view gantry rather than a side-on tower pasted over the quay.
      box(-42,-13,64,4,'#657a82');box(-42,9,64,4,'#657a82');box(-29,-18,6,36,'#b6c8c4');box(14,-18,6,36,'#b6c8c4');
      box(-48,-4,105,8,'#537e90');ctx.strokeStyle='#a6c3c8';ctx.beginPath();ctx.moveTo(-46,0);ctx.lineTo(55,0);ctx.stroke();box(15,-7,11,14,'#d8d8bb');box(47,-5,8,10,'#d29b5e');
    }else if(d.type==='tower'){
      const factory=['#c9c9c9','#bbb'].includes(d.col);ctx.fillStyle=factory?'#bac1bb':(d.col||'#a38b75');ctx.fillRect(-15,-15,30,30);ctx.strokeRect(-15,-15,30,30);
      ctx.fillStyle=factory?'#52656a':'#71848c';ctx.beginPath();ctx.arc(0,0,factory?9:7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#dce4d9';ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.moveTo(0,-12);ctx.lineTo(0,12);ctx.stroke();
    }
    ctx.restore();
  }
  root.BunkerGraphics={resolution,onStreet,organize,districts,prop};
  if(typeof module!=='undefined')module.exports=root.BunkerGraphics;
})(typeof window==='undefined'?globalThis:window);
