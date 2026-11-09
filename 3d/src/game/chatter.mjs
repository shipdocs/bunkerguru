// Radio chatter from the 2D game (engine.js radioChatter), Dutch.
import { MAP, basins } from '../maps/index.mjs';
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const nm = (s) =>
  s
    .split(' ')
    .map((w, i) => (i === 0 && w.length <= 3 ? w : w[0] + w.slice(1).toLowerCase()))
    .join(' ');
export function radioChatter(s, world) {
  const R = MAP.radio || {},
    sector = pick(R.sectors || ['Verkeerspost']);
  const havens = basins.map((b) => b.name).filter(Boolean);
  const place = pick(R.places || havens.map((h) => 'de ' + h)),
    haven = pick(havens.length ? havens : ['haven']);
  const movers = world.traffic.filter((t) => t.axis === 'x'),
    sh = movers.length ? pick(movers) : null;
  const tug = world.traffic.find((t) => t.axis === 'z'),
    riv = world.rivals.length ? pick(world.rivals) : null;
  const cur = s.tideSpeed || 0,
    v = Math.abs(cur).toFixed(1).replace('.', ' komma '),
    eb = cur >= 0;
  const T = [];
  if (sh)
    T.push(() => [
      {
        who: nm(sh.name),
        spk: 0,
        text: `${sector}, ${nm(sh.name)}, ${sh.v > 0 ? 'opvarend' : 'afvarend'} ter hoogte van ${place}, over.`,
      },
      {
        who: sector,
        spk: 1,
        text: `${nm(sh.name)}, ${sector}, begrepen, weinig verkeer, houdt u stuurboordwal aan, uit.`,
      },
    ]);
  T.push(() => [
    {
      who: sector,
      spk: 1,
      text: `Alle schepen, alle schepen, hier ${sector}. ${eb ? 'Ebstroom' : 'Vloedstroom'} ${v} meter per seconde. Uit.`,
    },
  ]);
  if (Math.abs(cur) > 2.8)
    T.push(() => [
      {
        who: sector,
        spk: 1,
        text: `Let op kleine vaartuigen, sterke ${eb ? 'eb' : 'vloed'}stroom op de vaarweg, vaar voorzichtig.`,
      },
    ]);
  if (tug)
    T.push(() => [
      {
        who: nm(tug.name),
        spk: 2,
        text: `${sector}, ${nm(tug.name)}, ik draai de ${R.tugBasin || haven} in met een duwbak, over.`,
      },
      { who: sector, spk: 1, text: `${nm(tug.name)}, prima, dank u.` },
    ]);
  if (riv)
    T.push(() => [
      {
        who: riv.name,
        spk: 3,
        text: pick([
          `Bunkerguru, ${riv.name}. Mooi aangelegd daarnet. Niet dus.`,
          `Hier ${riv.name}. Koffie staat klaar aan de terminal, als je er ooit komt.`,
          `Bunkerguru, let een beetje op je hekgolf, ik lag bijna op de kant!`,
        ]),
      },
    ]);
  T.push(() => [
    {
      who: sector,
      spk: 1,
      text: pick([
        `Alle schepen, wind zuidwest vier, zicht goed. Uit.`,
        `Alle schepen, ter hoogte van ${place} is een roeivereniging aan het trainen, matig uw vaart.`,
        `Alle schepen, de ${haven} is tijdelijk gestremd voor een peilvaartuig.`,
      ]),
    },
  ]);
  return pick(T)();
}
