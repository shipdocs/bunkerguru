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
  // Beacon over the destination: a light column, a flag and a pulsing ring, so the
  // place you are heading for is the clearest thing in the harbour.
  const beacon = new T.Group();
  const beamMat = new T.MeshBasicMaterial({
    color: '#7dffc4',
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const beamMesh = new T.Mesh(new T.CylinderGeometry(1.6, 3.2, 70, 12, 1, true), beamMat);
  beamMesh.position.y = 35;
  beacon.add(beamMesh);
  const flagMat = new T.MeshBasicMaterial({ color: '#7dffc4', side: T.DoubleSide });
  const flag = new T.Mesh(new T.PlaneGeometry(14, 8), flagMat);
  flag.position.set(7, 66, 0);
  beacon.add(flag);
  const pole = new T.Mesh(
    new T.CylinderGeometry(0.35, 0.35, 70, 6),
    new T.MeshBasicMaterial({ color: '#f2efe2' }),
  );
  pole.position.y = 35;
  beacon.add(pole);
  const ringMat = new T.MeshBasicMaterial({
    color: '#7dffc4',
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    side: T.DoubleSide,
  });
  const ring = new T.Mesh(new T.RingGeometry(16, 19, 48), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.8;
  beacon.add(ring);
  beacon.visible = false;
  scene.add(beacon);
  let pulse = 0;
  // Smoke from a damaged ship: grey puffs from the funnel, heavier as damage grows.
  const smokeTex = (() => {
    if (typeof document === 'undefined' || !document.createElement) return null;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext?.('2d');
    if (!g?.createRadialGradient) return null;
    const r = g.createRadialGradient(32, 32, 4, 32, 32, 30);
    if (!r) return null;
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  })();
  const smoke = [];
  for (let i = 0; i < 28; i++) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({
        map: smokeTex,
        color: '#55585a',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    sp.visible = false;
    scene.add(sp);
    smoke.push({ sp, life: 0, vx: 0, vz: 0 });
  }
  let smokeIdx = 0,
    smokeTick = 0;
  function updateSmoke(s, dt, paused) {
    smokeTick += dt;
    const heavy = Math.max(0, (s.damage - 35) / 65);
    if (heavy > 0 && !paused && smokeTick > 0.35 - heavy * 0.2) {
      smokeTick = 0;
      const p = smoke[smokeIdx++ % smoke.length];
      const back = vesselProfile.length * 0.33;
      p.sp.position.set(s.x - Math.sin(s.h) * back, 16, s.z + Math.cos(s.h) * back);
      p.life = 1;
      p.vx = (Math.random() - 0.5) * 1.5;
      p.vz = (Math.random() - 0.5) * 1.5;
      p.sp.material.color.set(heavy > 0.6 ? '#2f3133' : '#6b6e70');
      p.sp.visible = true;
    }
    for (const p of smoke) {
      if (p.life <= 0) continue;
      p.life -= dt * 0.22;
      p.sp.position.x += p.vx * dt;
      p.sp.position.z += p.vz * dt;
      p.sp.position.y += dt * 6;
      const sz = 6 + (1 - p.life) * 22;
      p.sp.scale.set(sz, sz, 1);
      p.sp.material.opacity = Math.max(0, p.life) * 0.55;
      p.sp.visible = p.life > 0;
    }
  }
  const zones = {
    update(s) {
      const t = target(s);
      beacon.visible = !!t && !s.moored && s.phase !== 'bunker';
      if (t) {
        beacon.position.set(t.x, 0, t.z);
        const col = t.kind === 'ship' ? '#7dffc4' : '#ffd84a';
        beamMat.color.set(col);
        flagMat.color.set(col);
        ringMat.color.set(col);
      }
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
    pulse += dt;
    if (beacon.visible) {
      const k = (pulse % 1.6) / 1.6;
      ring.scale.setScalar(0.6 + k * 1.2);
      ringMat.opacity = 0.7 * (1 - k);
      flag.rotation.y = Math.sin(pulse * 3) * 0.25;
      // Keep the beacon readable from far away without dominating close up.
      beamMat.opacity = 0.18 + 0.12 * Math.sin(pulse * 2.5) ** 2;
    }
    updateSmoke(s, dt, paused);
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
