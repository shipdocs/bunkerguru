import { offers, berths, acceptContract, service } from '../game/harbor.mjs';
import { recover } from '../game/simulation.mjs';
export function bindPort({ $, getState, openPort, closePort, resetCareer, save, toast }) {
  function renderPort(tab = 'jobs') {
    $('portStats').textContent =
      '€ ' +
      Math.round(getState().gold) +
      ' · ' +
      getState().jobs +
      ' leveringen · reputatie ' +
      getState().reputation +
      '/100';
    $('portJobs').hidden = tab !== 'jobs';
    $('portService').hidden = tab !== 'service';
    $('tabJobs').classList.toggle('selected', tab === 'jobs');
    $('tabService').classList.toggle('selected', tab === 'service');
    $('offers').replaceChildren();
    for (const c of offers(getState())) {
      const card = document.createElement('article');
      card.className = 'offer';
      const title = document.createElement('h3');
      title.textContent = c.name + ' · ' + berths[c.berth].name;
      const desc = document.createElement('p');
      desc.textContent = c.tonnes + ' ton · € ' + c.reward + ' — ' + c.description;
      const button = document.createElement('button');
      button.className = 'primary';
      button.textContent =
        getState().phase === 'done' ? 'Opdracht aannemen →' : 'Rond eerst je huidige opdracht af';
      button.disabled = getState().phase !== 'done';
      button.onclick = () => {
        if (acceptContract(getState(), c.id)) {
          save();
          closePort();
          toast('Opdracht aangenomen. Laden bij de laadterminal.');
        }
      };
      card.append(title, desc, button);
      $('offers').append(card);
    }
    $('serviceState').textContent =
      'Schade ' +
      Math.round(getState().damage) +
      '% · pomp niveau ' +
      getState().level +
      '/3 · ' +
      (25 + getState().level * 10) +
      ' ton/s';
    $('repair').textContent = 'Schip repareren · € ' + Math.ceil(getState().damage * 3);
    $('buyPump').textContent =
      getState().level >= 3
        ? 'Pomp maximaal verbeterd'
        : 'Pomp upgraden · € ' + 500 * (getState().level + 1);
    $('buyPump').disabled = getState().level >= 3;
    $('careerDetails').textContent = getState().goalClaimed
      ? 'Havendoel gehaald! De bonus van € 1.000 is uitbetaald. Je kunt onbeperkt nieuwe opdrachten varen.'
      : 'Lever vijf opdrachten af om je havenbedrijf te vestigen. Voortgang: ' +
        getState().jobs +
        '/5. Bonus: € 1.000.';
  }
  $('office').onclick = () => openPort('jobs');
  $('maintenance').onclick = () => openPort('service');
  $('tabJobs').onclick = () => renderPort('jobs');
  $('tabService').onclick = () => renderPort('service');
  $('closePort').onclick = closePort;
  $('port').addEventListener('cancel', (e) => {
    e.preventDefault();
    closePort();
  });
  for (const [id, kind] of [
    ['repair', 'repair'],
    ['buyPump', 'pump'],
  ])
    $(id).onclick = () => {
      const message = service(getState(), kind);
      $('serviceMessage').textContent = message;
      save();
      renderPort('service');
    };
  $('tow').onclick = () => {
    recover(getState());
    save();
    closePort();
    toast('Pechhulp: hersteld aan de terminal. Lading vervallen, opdracht herstart.');
  };
  $('restart').onclick = () => {
    $('resetConfirm').hidden = false;
  };
  $('cancelReset').onclick = () => {
    $('resetConfirm').hidden = true;
  };
  $('confirmReset').onclick = () => {
    resetCareer();
    save();
    $('resetConfirm').hidden = true;
    closePort();
    toast('Nieuwe carrière gestart. Laad je eerste 500 ton.');
  };

  $('next').onclick = () => openPort('jobs');
  return renderPort;
}
