/** Where a kiosk pick leads: today's lessons of it ('tana'), or its whole week on one screen ('plaan'). */
export function openPick(router, purpose, type, name, week) {
  if (purpose === 'tana') return router.push({ name: 'kiosk-today', params: { type, name } });
  return router.push({ name: 'kiosk-week', params: { type, name }, query: week ? { week } : {} });
}

export const PURPOSE_TITLES = {
  group: { tana: 'Hetke tunnid rühmade lõikes', plaan: 'Õpperühmade tunniplaan' },
  room: { tana: 'Hetke tunnid ruumi lõikes', plaan: 'Ruumide tunniplaan' },
};
