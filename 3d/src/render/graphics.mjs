export function graphicsProfile(
  mode = 'auto',
  { width = 1280, height = 800, dpr = 1, coarse = false, cores = 8 } = {},
) {
  const light =
    mode === 'light' ||
    (mode === 'auto' && (coarse || Math.min(width, height) < 600 || cores <= 4));
  return {
    light,
    pixelRatio: Math.min(dpr, light ? 1.15 : 1.6),
    shadows: !light,
    shadowSize: 1024,
    detailDistance: light ? 430 : 720,
    viewDistance: light ? 1600 : 2300,
    foamCount: light ? 32 : 64,
  };
}
export const GRAPHICS_MODES = ['auto', 'light', 'rich'];
export const GRAPHICS_LABELS = {
  auto: 'Beeld: automatisch',
  light: 'Beeld: zuinig',
  rich: 'Beeld: uitgebreid',
};
