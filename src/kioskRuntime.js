/**
 * What a kiosk does on its own: start on its home screen, return there when nobody has touched it
 * for a while, keep the timetable and lunch data fresh, and reload once a night to pick up new app versions.
 */
import { onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useKioskStore } from './stores/kiosk';
import { useLunchStore } from './stores/lunch';
import { useTimetableStore } from './stores/timetable';

const IDLE_MS = 90_000;
const REFRESH_MS = 10 * 60_000;
const RELOAD_HOUR = 4; // a quiet hour for the nightly reload
const ACTIVITY = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

export function useKioskRuntime() {
  const kiosk = useKioskStore();
  const timetable = useTimetableStore();
  const lunch = useLunchStore();
  const router = useRouter();
  const route = useRoute();
  let idle, refresh, reload;

  const goHome = () => {
    // not while someone is changing the settings
    if (route.name !== 'kiosk' && !route.path.startsWith('/seaded')) router.push({ name: 'kiosk' });
  };
  const onActivity = () => {
    clearTimeout(idle);
    idle = setTimeout(goHome, IDLE_MS);
  };

  function start() {
    router.isReady().then(() => route.name === 'timetable' && router.replace({ name: 'kiosk' }));
    ACTIVITY.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    onActivity();
    refresh = setInterval(() => {
      timetable.refresh();
      lunch.load(true);
    }, REFRESH_MS);
    const next = new Date();
    next.setHours(RELOAD_HOUR, 0, 0, 0);
    if (next <= new Date()) next.setDate(next.getDate() + 1);
    reload = setTimeout(() => location.reload(), next - new Date());
  }
  function stop() {
    ACTIVITY.forEach((e) => window.removeEventListener(e, onActivity));
    clearTimeout(idle);
    clearInterval(refresh);
    clearTimeout(reload);
  }

  watch(() => kiosk.settings.enabled, (on) => (on ? start() : stop()), { immediate: true });
  onBeforeUnmount(stop);
}
