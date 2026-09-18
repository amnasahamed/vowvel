export const LANDING_SECTIONS = ['designs', 'how-it-works', 'pricing', 'faq-refunds'] as const;
export type LandingSection = typeof LANDING_SECTIONS[number];

export function isLandingSection(value: string): value is LandingSection {
  return (LANDING_SECTIONS as readonly string[]).includes(value);
}

export function parseLocationHash(hash: string): {route: string; section: LandingSection | null} {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw || raw === '/') return {route: '/', section: null};
  const pathOnly = raw.split('?')[0];
  const sectionKey = pathOnly.replace(/^\/+/, '');
  if (isLandingSection(sectionKey)) return {route: '/', section: sectionKey};
  if (raw.startsWith('/')) return {route: raw, section: null};
  return {route: '/', section: null};
}

export function readAppLocation(hash: string, pathname = '/'): {route: string; section: LandingSection | null} {
  if ((!hash || hash === '#') && pathname.startsWith('/invitation/')) {
    const slug = pathname.split('/')[2];
    if (slug) return {route: `/invite/${slug}`, section: null};
  }
  const fromHash = parseLocationHash(hash);
  if (fromHash.section) return fromHash;
  if (fromHash.route !== '/') return fromHash;
  const pathSection = pathname.replace(/^\/+|\/+$/g, '');
  if (isLandingSection(pathSection)) return {route: '/', section: pathSection};
  return fromHash;
}

export function goToLandingSection(id: LandingSection) {
  const scroll = () => document.getElementById(id)?.scrollIntoView({behavior: 'smooth'});
  const {route} = readAppLocation(location.hash, location.pathname);
  if (route === '/') {
    scroll();
    if (location.hash !== `#${id}`) {
      history.replaceState(null, '', `#${id}`);
      dispatchEvent(new Event('hashchange'));
    }
    return;
  }
  location.hash = id;
}
