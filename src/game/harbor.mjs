import { MAP, customers, supplyTerminals, canalTraffic, canalRoute } from '../maps/amsterdam.mjs';
export const HARBOR = MAP;
export const terminals = supplyTerminals;
export const terminal = terminals[0];
export const berths = customers;
export const receiver = berths[0];
export const trafficAt = canalTraffic;
export function loadingTerminal(s) {
  return terminals.reduce(
    (best, t) =>
      Math.hypot(s.x - t.x, s.z - t.z) < Math.hypot(s.x - best.x, s.z - best.z) ? t : best,
    terminal,
  );
}
export const contracts = [
  {
    id: 'regular',
    name: 'Vaste klant',
    tonnes: 500,
    reward: 750,
    limit: 0,
    description: '500 ton als deelpartij. Geen tijdsdruk.',
  },
  {
    id: 'express',
    name: 'Spoedlevering',
    tonnes: 300,
    reward: 700,
    limit: 2400,
    description: '300 ton binnen 40 minuten. Te laat: 25% minder.',
  },
  {
    id: 'small',
    name: 'Korte levering',
    tonnes: 200,
    reward: 400,
    limit: 0,
    description: 'Een kleine partij, rustig manoeuvreren.',
  },
];
export function offers(s) {
  return contracts.map((c, i) => ({ ...c, berth: (s.jobs + i) % berths.length }));
}
export function contractOf(s) {
  const c = contracts.find((c) => c.id === s.contractId) || contracts[0];
  return { ...c, berth: berths[s.berthIndex] || berths[0] };
}
export function acceptContract(s, id) {
  if (s.phase !== 'done') return false;
  const c = offers(s).find((c) => c.id === id);
  if (!c) return false;
  Object.assign(s, {
    contractId: id,
    berthIndex: c.berth,
    target: c.tonnes,
    phase: 'load',
    pumping: false,
    elapsed: 0,
    cargo: 0,
    startDamage: s.damage,
    lastPayout: 0,
  });
  return true;
}
export function settle(s) {
  const c = contractOf(s),
    late = c.limit > 0 && s.elapsed > c.limit,
    clean = s.damage <= s.startDamage;
  const payout = Math.round(c.reward * (late ? 0.75 : 1));
  s.gold += payout;
  s.earned += payout;
  s.jobs++;
  s.reputation = Math.min(100, Math.max(0, s.reputation + (late ? -4 : clean ? 5 : 1)));
  s.lastPayout = payout;
  s.lastLate = late;
  s.lastClean = clean;
  s.phase = 'done';
  s.pumping = false;
  if (s.jobs >= 5 && !s.goalClaimed) {
    s.goalClaimed = true;
    s.gold += 1000;
    s.earned += 1000;
  }
}
export function service(s, kind) {
  if (!s.moored || Math.hypot(s.x - loadingTerminal(s).x, s.z - loadingTerminal(s).z) > 25)
    return 'Onderhoud kan alleen vast aan de laadterminal.';
  if (s.pumping) return 'Stop eerst de overslag.';
  if (kind === 'repair') {
    const cost = Math.ceil(s.damage * 3);
    if (!cost) return 'Het schip is al in goede staat.';
    if (s.gold < cost) return 'Onvoldoende geld voor reparatie. Pechhulp blijft beschikbaar.';
    s.gold -= cost;
    s.damage = 0;
    return 'Schip volledig gerepareerd.';
  }
  if (kind === 'pump') {
    const cost = 500 * (s.level + 1);
    if (s.level >= 3) return 'Je pomp is maximaal verbeterd.';
    if (s.gold < cost) return 'Onvoldoende geld voor deze pomp.';
    s.gold -= cost;
    s.level++;
    return 'Pomp verbeterd naar ' + (25 + s.level * 10) + ' ton per seconde.';
  }
  return 'Onbekende service.';
}
export const routePoints = canalRoute;
