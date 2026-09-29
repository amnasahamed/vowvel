/** Keep purchased-invitation identity only while moving within its editing flow. */
const editableRoute = /^\/(?:create\/(?:conservatory|gulmohar|afterhours|sunday|azure)|preview\/draft)$/;

export function editIdFromRoute(route: string): string | null {
  const [path, query = ''] = route.replace(/^#/, '').split('?');
  if (!editableRoute.test(path)) return null;
  const value = new URLSearchParams(query).get('update');
  return value && /^invitation_[a-zA-Z0-9-]+$/.test(value) ? value : null;
}

export function preserveEditRoute(target: string, source: string): string {
  const path = target.replace(/^#/, '').split('?')[0];
  const id = editIdFromRoute(source);
  if (!id || !editableRoute.test(path)) return target;
  const params = new URLSearchParams(target.split('?')[1] || '');
  // An explicitly selected invitation always wins over the previous one.
  if (!params.has('update')) params.set('update', id);
  return `${path}?${params.toString()}`;
}
