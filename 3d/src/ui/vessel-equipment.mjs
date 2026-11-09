export function bindVesselEquipment({ $, getState, isPlaying, save, toast }) {
  const switches = [
    ['radarSwitch', 'radar', 'Radar'],
    ['navSwitch', 'navigation', 'Navigatie'],
    ['deckSwitch', 'deck', 'Deklicht'],
    ['cabinSwitch', 'cabin', 'Stuurhuislicht'],
  ];
  function render() {
    const s = getState(),
      e = s.equipment;
    for (const [id, key, label] of switches) {
      $(id).textContent = label + (e[key] ? ' aan' : ' uit');
      $(id).setAttribute('aria-pressed', String(e[key]));
    }
    $('boomSwitch').textContent =
      'Giek: ' +
      (s.phase === 'bunker'
        ? 'bunkeren'
        : !s.moored || (!e.boomSide && !e.boomRaised)
          ? 'geborgen'
          : e.boomSide < 0
            ? 'bakboord'
            : e.boomSide > 0
              ? 'stuurboord'
              : 'omhoog');
  }
  for (const [id, key] of switches)
    $(id).onclick = () => {
      if (!isPlaying()) return;
      const e = getState().equipment;
      e[key] = !e[key];
      render();
      save();
    };
  $('boomSwitch').onclick = () => {
    if (!isPlaying()) return;
    const s = getState(),
      e = s.equipment;
    if (s.phase === 'bunker')
      return toast('De giek staat over het zeeschip tot het bunkeren klaar is.');
    if (!s.moored) return toast('Maak eerst vast om de bunkergiek te bedienen.');
    // Rest → raised → port → starboard → rest, also usable with touch.
    if (!e.boomRaised) {
      e.boomRaised = true;
      e.boomSide = 0;
    } else if (e.boomSide === 0) e.boomSide = -1;
    else if (e.boomSide === -1) e.boomSide = 1;
    else {
      e.boomSide = 0;
      e.boomRaised = false;
    }
    render();
    save();
  };
  render();
  return { render };
}
