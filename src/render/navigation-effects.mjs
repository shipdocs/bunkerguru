import * as T from '../../vendor/three.js';
import { terminal, receiver, target } from '../game/simulation.mjs';
import { loadingTerminal, contractOf, routePoints } from '../game/harbor.mjs';
export function createNavigationEffects(scene, mesh, vesselProfile) {
  function zone(t, color) {
    const mat = new T.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.045,
      depthWrite: false,
      side: T.DoubleSide,
    });
    const m = mesh(
      new T.PlaneGeometry(vesselProfile.beam + 16, vesselProfile.length + 20),
      mat,
      t.x,
      0.6,
      t.z,
    );
    m.rotation.x = -Math.PI / 2;
    m.castShadow = false;
    const edge = new T.LineSegments(
      new T.EdgesGeometry(new T.PlaneGeometry(vesselProfile.beam + 16, vesselProfile.length + 20)),
      new T.LineBasicMaterial({ color, transparent: true, opacity: 0.28 }),
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(t.x, 0.7, t.z);
    scene.add(edge);
    return { m, edge };
  }
  const loadZone = zone(terminal, '#dfd994'),
    deliverZone = zone(receiver, '#8ae5c2');
  const line = new T.Line(
    new T.BufferGeometry(),
    new T.LineDashedMaterial({
      color: '#b8e8ca',
      dashSize: 4,
      gapSize: 5,
      transparent: true,
      opacity: 0.65,
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
  // Foam pool, reused instead of creating meshes every frame.
  const foam = [];
  const foamGeo = new T.PlaneGeometry(1, 1);
  for (let i = 0; i < 64; i++) {
    let m = mesh(
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
    if (Math.abs(s.u) > 0.25 && foamTick > 0.08 && !paused) {
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
      f.m.scale.set(3, 2, 1);
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
  function updateRoute(s) {
    const t = target(s);
    mooring.visible = s.moored;
    hose.visible = s.moored && s.pumping;
    const supply = loadingTerminal(s),
      atLoad = Math.hypot(s.x - supply.x, s.z - supply.z) < 30,
      berth = contractOf(s).berth;
    const ax = atLoad ? supply.anchorX : berth.shipX,
      az = atLoad ? supply.z : berth.shipZ,
      heading = atLoad ? 0 : berth.h;
    const pts = [];
    for (const f of [-0.3, 0.3]) {
      const offset = vesselProfile.length * f;
      pts.push(
        new T.Vector3(s.x + Math.sin(s.h) * offset, 3, s.z - Math.cos(s.h) * offset),
        new T.Vector3(ax + Math.sin(heading) * offset, 4, az - Math.cos(heading) * offset),
      );
    }
    mooring.geometry.dispose();
    mooring.geometry = new T.BufferGeometry().setFromPoints(pts);
    hose.geometry.dispose();
    hose.geometry = new T.BufferGeometry().setFromPoints([
      new T.Vector3(s.x, 3, s.z),
      new T.Vector3((s.x + ax) / 2, 1.6, (s.z + az) / 2),
      new T.Vector3(ax, 5, az),
    ]);
    line.geometry.dispose();
    line.geometry = new T.BufferGeometry().setFromPoints(
      routePoints(s, t).map((p) => new T.Vector3(p.x, 0.9, p.z)),
    );
    line.computeLineDistances();
    line.visible = !s.moored && s.phase !== 'done';
  }
  return { loadZone, deliverZone, updateWake, updateRoute };
}
