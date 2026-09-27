import { createRouter, createWebHashHistory } from 'vue-router';
import TimetableView from './views/TimetableView.vue';
import FreeRoomsView from './views/FreeRoomsView.vue';
import SettingsView from './views/SettingsView.vue';
import GeneralSettingsView from './views/GeneralSettingsView.vue';
import ThemeSettingsView from './views/ThemeSettingsView.vue';

// Hash URLs (#/seaded): GitHub Pages cannot send other paths to the app, and they work offline in the PWA too.
export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'timetable', component: TimetableView },
    { path: '/vabad-ruumid', name: 'free-rooms', component: FreeRoomsView },
    {
      path: '/seaded',
      component: SettingsView,
      children: [
        { path: '', name: 'settings', component: GeneralSettingsView },
        { path: 'teema', name: 'theme-settings', component: ThemeSettingsView },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
