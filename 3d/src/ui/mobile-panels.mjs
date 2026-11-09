export function bindMobilePanels($, { openChart } = {}) {
  // Mobile panels are opt-in; navigation controls remain available.
  let mobilePanel = '';
  function toggleMobile(panel) {
    mobilePanel = mobilePanel === panel ? '' : panel;
    for (const [name, id, button] of [
      ['mission', 'missionPanel', 'missionToggle'],
      ['menu', 'harborPanel', 'menuToggle'],
    ]) {
      const open = mobilePanel === name;
      $(id).classList.toggle('mobileOpen', open);
      $(button).setAttribute('aria-expanded', String(open));
    }
    $('missionToggle').textContent = mobilePanel === 'mission' ? '⌃' : '⌄';
  }
  $('missionToggle').onclick = () => toggleMobile('mission');
  // A phone has no room for a thumbnail chart: the button opens the big one at once.
  $('mapToggle').onclick = () => {
    if (mobilePanel) toggleMobile(mobilePanel);
    openChart?.();
  };
  $('menuToggle').onclick = () => toggleMobile('menu');
  // A choice from the harbour menu puts the menu away again, so the water is back.
  const menu = $('harborPanel');
  menu.addEventListener?.('click', (e) => {
    const button = e.target?.closest?.('button');
    if (mobilePanel === 'menu' && button && !button.closest?.('details')) toggleMobile('menu');
  });
  return { close: () => mobilePanel && toggleMobile(mobilePanel) };
}
