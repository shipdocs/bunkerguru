// A career with an arc (fase 2): ranks earned with every job, harbours unlocked by
// rank, a newspaper that remembers what happened, and a retirement with a title.
// No DOM; the UI reads these values.
export const RANKS = [
  { name: 'Matroos', xp: 0 },
  { name: 'Stuurman', xp: 400 },
  { name: 'Schipper', xp: 1200 },
  { name: 'Kapitein', xp: 2500 },
  { name: 'Havenbaas', xp: 4500 },
  { name: 'Bunkerkoning', xp: 7500 },
];
// Harbours open up as you climb: the Oefenhaven and Amsterdam from the start.
export const MAP_RANK = { training: 0, amsterdam: 0, rotterdam: 1, europoort: 2, antwerpen: 3 };
export const RETIRE_MIN_JOBS = 10;

export const rankIndex = (xp = 0) => RANKS.reduce((i, r, k) => (xp >= r.xp ? k : i), 0);
export const rankOf = (s) => RANKS[rankIndex(s.xp)];
export function nextRank(s) {
  const i = rankIndex(s.xp);
  return i + 1 < RANKS.length ? RANKS[i + 1] : null;
}
export const mapUnlocked = (s, id) => rankIndex(s.xp) >= (MAP_RANK[id] ?? 0);
export const mapRankName = (id) => RANKS[MAP_RANK[id] ?? 0].name;

// Points for one finished job: delivery, timing, a clean hull and the berthing.
export function xpForJob(result, anchors = 0) {
  return 100 + (result.onTime ? 50 : 0) + (result.clean ? 50 : 0) + anchors * 25;
}
// Add points; returns the new rank when this was a promotion.
export function gainXp(s, points) {
  const before = rankIndex(s.xp);
  s.xp = (s.xp || 0) + points;
  const after = rankIndex(s.xp);
  return after > before ? RANKS[after] : null;
}
// The newspaper's notebook: short facts, the newest last, a few dozen at most.
export function addNews(s, kind, text) {
  s.news = s.news || [];
  s.news.push({ kind, text, job: s.jobs });
  if (s.news.length > 40) s.news.splice(0, s.news.length - 40);
}

const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];
// One edition: three headlines from what happened since the last edition, plus the
// standing of the bunker companies. Quiet days still make the paper.
export function newspaper(s, rivals = [], rnd = Math.random) {
  const since = s.paperJobs ?? 0;
  const fresh = (s.news || []).filter((n) => n.job >= since);
  const weight = {
    rank: 6,
    sunk: 5,
    stole: 5,
    ram: 4,
    rammed: 4,
    strak: 3,
    vts: 3,
    record: 3,
    late: 2,
    job: 1,
  };
  const top = fresh
    .slice()
    .sort((a, b) => (weight[b.kind] || 0) - (weight[a.kind] || 0))
    .slice(0, 3)
    .map((n) => n.text);
  const filler = [
    'Drukte op de rivier: zeeschepen wachten op bunkers',
    'Havenmeester: "Vaar met verstand, niet met de telegraaf"',
    'Brandstofprijs stabiel – rederijen tevreden',
    'Meeuwen eisen beter weer',
  ];
  while (top.length < 3) {
    const f = pick(filler, rnd);
    if (!top.includes(f)) top.push(f);
  }
  const standing = [
    { name: 'Jij', gold: Math.round(s.gold), jobs: s.jobs },
    ...rivals.map((r) => ({ name: r.name, gold: Math.round(r.gold), jobs: r.jobs })),
  ].sort((a, b) => b.gold - a.gold);
  s.paperJobs = s.jobs;
  s.paperIssue = (s.paperIssue || 0) + 1;
  return { issue: s.paperIssue, headlines: top, standing, rank: rankOf(s).name };
}
// A new edition after every three jobs.
export const paperDue = (s) => s.jobs > 0 && s.jobs - (s.paperJobs ?? 0) >= 3;

// Retirement: a title and a score for the hall of fame.
export function retirement(s) {
  const reps = Object.values(s.rep || {});
  const rep = reps.length ? reps.reduce((a, b) => a + b, 0) / reps.length : 50;
  const score = Math.round((s.xp || 0) + s.gold / 2 + rep * 10);
  const rank = rankOf(s).name;
  const title =
    rank === 'Bunkerkoning'
      ? 'Bunkerkoning van de Maasmond'
      : rep >= 75
        ? rank + ', geliefd bij alle rederijen'
        : s.gold >= 5000
          ? rank + ' met een gouden kas'
          : rank + ' met zout in het bloed';
  return { score, title, rank, gold: Math.round(s.gold), jobs: s.jobs, rep: Math.round(rep) };
}
export const canRetire = (s) => s.jobs >= RETIRE_MIN_JOBS;
