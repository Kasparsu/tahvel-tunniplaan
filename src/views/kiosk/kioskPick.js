/** Where a kiosk pick leads: today's lessons of it ('tana'), or its whole week on one screen ('plaan'). */
export function openPick(router, purpose, type, name, week) {
  if (purpose === 'tana') return router.push({ name: 'kiosk-today', params: { type, name } });
  return router.push({ name: 'kiosk-week', params: { type, name }, query: week ? { week } : {} });
}

/** The home tile a picker sits under; the screens on the way carry it as their title. */
export const PURPOSE_LABEL = { tana: 'Tunnid täna', plaan: 'Tunniplaanid' };
