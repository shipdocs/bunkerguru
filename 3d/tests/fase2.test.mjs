import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, restore, step, createWorldState, act, takeJob } from '../src/game/simulation.mjs';
import { quickJob, berthOf, settle, planTick } from '../src/game/harbor.mjs';
import {
  RANKS,
  rankOf,
  mapUnlocked,
  gainXp,
  newspaper,
  paperDue,
  retirement,
  canRetire,
  xpForJob,
} from '../src/game/career.mjs';
const rnd = (
  (k) => () =>
    (k = (k * 16807) % 2147483647) / 2147483647
)(3);

test('ranks rise with points and unlock harbours in order', () => {
  const s = fresh();
  assert.equal(rankOf(s).name, 'Matroos');
  assert(mapUnlocked(s, 'amsterdam') && mapUnlocked(s, 'training'));
  assert(!mapUnlocked(s, 'rotterdam') && !mapUnlocked(s, 'antwerpen'));
  assert.equal(gainXp(s, 399), null);
  assert.equal(gainXp(s, 1).name, 'Stuurman');
  assert(mapUnlocked(s, 'rotterdam') && !mapUnlocked(s, 'europoort'));
  s.xp = RANKS.at(-1).xp;
  assert(mapUnlocked(s, 'antwerpen'));
  assert.equal(xpForJob({ onTime: true, clean: true }, 3), 275);
});

test('a finished job pays points, a STRAK berthing counts, the paper remembers it', () => {
  const s = fresh();
  quickJob(s, rnd);
  s.phase = 'bunker';
  s.cargo = s.deliver = s.target;
  s.jobAnchors = 3;
  const r = settle(s);
  assert.equal(r.xp, xpForJob(r, 3));
  assert.equal(s.xp, r.xp);
  assert(s.news.some((n) => n.kind === 'strak'));
  // Every third job a new edition with three headlines and the standing.
  assert(!paperDue(s));
  s.jobs = 3;
  assert(paperDue(s));
  const p = newspaper(s, [{ name: 'Bunker Bert', gold: s.gold + 500, jobs: 2 }], rnd);
  assert.equal(p.headlines.length, 3);
  assert.match(p.headlines[0], /STRAK/);
  assert.equal(p.standing[0].name, 'Bunker Bert');
  assert(!paperDue(s));
});

test('old careers get points for jobs already done; retirement gives a title and score', () => {
  const old = { ...fresh(), jobs: 12, gold: 2000 };
  delete old.xp;
  const s = restore(old);
  assert.equal(s.xp, 12 * 150);
  assert.equal(rankOf(s).name, 'Schipper');
  assert(canRetire(s));
  const r = retirement(s);
  assert(r.score > s.xp);
  assert.match(r.title, /Schipper/);
  assert(!canRetire(fresh()));
});

test('ramming a rival is remembered: it races you for your next job', () => {
  const s = fresh(),
    world = createWorldState(s);
  for (const r of world.rivals) Object.assign(r, { mode: 'idle', grudge: 0 });
  world.rivals[1].grudge = 3;
  planTick(s, rnd);
  const cards = [];
  const fx = {
    say() {},
    sound() {},
    radio() {},
    board() {},
    done() {},
    card: (c) => cards.push(c),
  };
  const offer = s.offers.find((o) => !o.taken);
  // rnd that never lets rivals take another job, and always races when angry.
  takeJob(s, world, offer.id, fx, () => 0.2);
  assert.equal(world.rivals[1].racing, true);
  assert.match(cards[0].text, /klap/);
  void act;
  void step;
  void berthOf;
});
