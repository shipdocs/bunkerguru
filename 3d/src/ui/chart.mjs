import { land, basins } from '../maps/amsterdam.mjs';
import { HARBOR, routePoints, trafficAt, terminals, berths } from '../game/harbor.mjs';
import { target } from '../game/simulation.mjs';
export function createChart(canvas) {
  const W = HARBOR.halfWidth;
  const map = canvas.getContext('2d');
  return function chart(s) {
    const scale = 184 / (W * 2),
      project = (x, z) => [100 + x * scale, 50 + z * scale];
    map.setTransform(3, 0, 0, 3, 0, 0);
    map.clearRect(0, 0, 200, 100);
    map.fillStyle = '#21434a';
    map.fillRect(0, 0, 200, 100);
    for (const l of land) {
      const [x, y] = project(l.x0, l.z0);
      map.fillStyle = l.kind === 'north' ? '#657d65' : '#829084';
      map.fillRect(x, y, (l.x1 - l.x0) * scale, (l.z1 - l.z0) * scale);
    }
    map.strokeStyle = '#c5e4b8';
    map.setLineDash([2, 2]);
    map.beginPath();
    routePoints(s, target(s)).forEach((p, i) => {
      const [x, y] = project(p.x, p.z);
      i ? map.lineTo(x, y) : map.moveTo(x, y);
    });
    map.stroke();
    map.setLineDash([]);
    for (const b of basins) {
      const [x, y] = project((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
      map.save();
      map.translate(x, y);
      map.rotate(-Math.PI / 2);
      map.fillStyle = '#dce7dc';
      map.font = '4px sans-serif';
      map.textAlign = 'center';
      map.fillText(b.name, 0, 0);
      map.restore();
    }
    for (const b of trafficAt(s.clock)) {
      const [x, y] = project(b.x, b.z);
      map.fillStyle = '#e9ab76';
      map.beginPath();
      map.arc(x, y, 1.3, 0, 7);
      map.fill();
    }
    for (const t of [...terminals, ...berths]) {
      const [x, y] = project(t.x, t.z);
      map.fillStyle = t === target(s) ? '#edeca4' : '#90c6ad';
      map.fillRect(x - 1.5, y - 2, 3, 4);
    }
    const [x, y] = project(s.x, s.z);
    map.save();
    map.translate(x, y);
    map.rotate(s.h);
    map.fillStyle = '#ffdd92';
    map.beginPath();
    map.moveTo(0, -3);
    map.lineTo(2, 3);
    map.lineTo(-2, 3);
    map.fill();
    map.restore();
    map.fillStyle = '#eee3c4';
    map.font = '5px sans-serif';
    map.textAlign = 'left';
    map.fillRect(10, 94, 500 * scale, 0.6);
    map.fillText('500 m', 10, 91);
  };
}
