import * as T from '../../vendor/three.js';
import { target } from '../game/simulation.mjs';
import { routePoints, customers, terminalOf } from '../game/harbor.mjs';
import { land } from '../maps/index.mjs';
// Target zone on the water, route, mooring lines, bunker hose and wake foam.
export function createNavigationEffects(scene, mesh, vesselProfile) {
  function zone(color) {
    const geo = new T.PlaneGeometry(1, 1);
    const m = mesh(
      geo,
      new T.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: T.DoubleSide,
      }),
      0,
      0.6,
      0,
    );
    m.rotation.x = -Math.PI / 2;
    m.castShadow = false;
    const edge = new T.LineSegments(
      new T.EdgesGeometry(geo),
      new T.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }),
    );
    edge.rotation.x = -Math.PI / 2;
    scene.add(edge);
    const place = (r) => {
      for (const o of [m, edge]) {
        o.position.set((r.x0 + r.x1) / 2, o === m ? 0.6 : 0.7, (r.z0 + r.z1) / 2);
        o.scale.set(r.x1 - r.x0, r.z1 - r.z0, 1);
      }
    };
    return { m, edge, place, show: (v) => (m.visible = edge.visible = v) };
  }
  const loadZone = zone('#ffe46b'),
    deliverZone = zone('#62e6b0');
  const zones = {
    update(s) {
      const t = target(s);
      loadZone.show(s.phase === 'load');
      deliverZone.show(s.phase === 'sail' || s.phase === 'bunker');
      if (s.phase === 'load') loadZone.place(terminalOf(s));
      if (t && t.kind === 'ship') deliverZone.place(t.zone);
    },
  };
  const line = new T.Line(
    new T.BufferGeometry(),
    new T.LineDashedMaterial({
      color: '#b8e8ca',
      dashSize: 6,
      gapSize: 6,
      transparent: true,
      opacity: 0.75,
    }),
  );
  scene.add(line);
  const mooring = new T.LineSegments(
    new T.BufferGeometry(),
    new T.LineBasicMaterial({ color: '#dbc696' }),
  );
  scene.add(mooring);
  const hose = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: '#e5b85d' }));
  scene.add(hose);
  const foam = [];
  const foamGeo = new T.PlaneGeometry(1, 1);
  for (let i = 0; i < 64; i++) {
    const m = mesh(
      foamGeo,
      new T.MeshBasicMaterial({
        color: '#c8ded2',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      0,
      0.7,
      0,
    );
    m.rotation.x = -Math.PI / 2;
    m.castShadow = false;
    m.visible = false;
    foam.push({ m, life: 0 });
  }
  let foamIdx = 0,
    foamTick = 0;
  function updateWake(s, dt, quality, paused) {
    foamTick += dt;
    const power = Math.abs(s.rpm || 0);
    if ((Math.abs(s.u) > 0.25 || power > 0.12) && foamTick > 0.08 && !paused && !s.moored) {
      foamTick = 0;
      const f = foam[foamIdx++ % quality.foamCount];
      f.life = 1;
      f.m.visible = true;
      f.m.position.set(
        s.x - Math.sin(s.h) * (vesselProfile.length / 2 + 1) + (Math.random() - 0.5) * 3,
        0.75,
        s.z + Math.cos(s.h) * (vesselProfile.length / 2 + 1) + (Math.random() - 0.5) * 3,
      );
      f.m.rotation.z = -s.h;
      f.m.scale.set(3 + power * 4, 2 + power * 2, 1);
    }
    for (const f of foam) {
      if (f.life > 0) {
        f.life -= dt * 0.13;
        f.m.material.opacity = Math.max(0, f.life) * 0.35;
        f.m.scale.x += dt * 1.2;
        f.m.scale.y += dt * 0.7;
        f.m.visible = f.life > 0;
      }
    }
  }
  // Nearest point on a quay or the seagoing ship for each mooring line.
  function anchor(p, s) {
    let best = null;
    const rects =
      s.mooredTo?.kind === 'ship'
        ? customers
            .filter((b) => b.id === s.mooredTo.id)
            .map((b) =>
              b.h
                ? {
                    x0: b.shipX - b.length / 2,
                    x1: b.shipX + b.length / 2,
                    z0: b.shipZ - 13,
                    z1: b.shipZ + 13,
                  }
                : {
                    x0: b.shipX - 13,
                    x1: b.shipX + 13,
                    z0: b.shipZ - b.length / 2,
                    z1: b.shipZ + b.length / 2,
                  },
            )
        : land;
    for (const r of rects) {
      const qx = Math.max(r.x0, Math.min(r.x1, p.x)),
        qz = Math.max(r.z0, Math.min(r.z1, p.z)),
        d = Math.hypot(qx - p.x, qz - p.z);
      if (!best || d < best.d) best = { x: qx, z: qz, d };
    }
    return best || p;
  }
  function updateRoute(s) {
    const t = target(s);
    mooring.visible = s.moored;
    hose.visible = !!s.pumping;
    const pts = [];
    let hoseEnd = null;
    if (s.moored || s.pumping) {
      for (const f of [-0.42, 0.42]) {
        const p = {
          x: s.x + Math.sin(s.h) * vesselProfile.length * f,
          z: s.z - Math.cos(s.h) * vesselProfile.length * f,
        };
        const a = anchor(p, s);
        pts.push(
          new T.Vector3(p.x, 3, p.z),
          new T.Vector3(a.x, s.mooredTo?.kind === 'ship' ? 7 : 4.5, a.z),
        );
      }
      hoseEnd = anchor(
        { x: s.x, z: s.z },
        s.mooredTo
          ? s
          : {
              ...s,
              mooredTo:
                s.phase === 'bunker'
                  ? { kind: 'ship', id: s.job && customers[s.job.berth].id }
                  : null,
            },
      );
    }
    if (s.moored) {
      mooring.geometry.dispose();
      mooring.geometry = new T.BufferGeometry().setFromPoints(pts);
    }
    if (s.pumping && hoseEnd) {
      hose.geometry.dispose();
      hose.geometry = new T.BufferGeometry().setFromPoints([
        new T.Vector3(s.x, 3, s.z),
        new T.Vector3((s.x + hoseEnd.x) / 2, 1.6, (s.z + hoseEnd.z) / 2),
        new T.Vector3(hoseEnd.x, 5, hoseEnd.z),
      ]);
    }
    line.visible = !!t && !s.moored;
    if (line.visible) {
      line.geometry.dispose();
      line.geometry = new T.BufferGeometry().setFromPoints(
        routePoints(s, t).map((p) => new T.Vector3(p.x, 0.9, p.z)),
      );
      line.computeLineDistances();
    }
  }
  return { zones, updateWake, updateRoute };
}
