export function bindMobilePanels($) {
  // Mobile panels are opt-in; navigation controls remain available.
  let mobilePanel = '';
  function toggleMobile(panel) {
    mobilePanel = mobilePanel === panel ? '' : panel;
    for (const [name, id, button] of [
      ['mission', 'missionPanel', 'missionToggle'],
      ['map', 'chartPanel', 'mapToggle'],
      ['menu', 'harborPanel', 'menuToggle'],
    ]) {
      const open = mobilePanel === name;
      $(id).classList.toggle('mobileOpen', open);
      $(button).setAttribute('aria-expanded', String(open));
    }
    $('missionToggle').textContent = mobilePanel === 'mission' ? '⌃' : '⌄';
  }
  $('missionToggle').onclick = () => toggleMobile('mission');
  $('mapToggle').onclick = () => toggleMobile('map');
  $('menuToggle').onclick = () => toggleMobile('menu');
}
