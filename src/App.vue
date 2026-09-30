<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { House } from '@lucide/vue';
import TechnoLogo from './components/TechnoLogo.vue';
import { useKioskRuntime } from './kioskRuntime';
import { useKioskStore } from './stores/kiosk';
import { useThemeStore } from './stores/theme';
import { useTimetableStore } from './stores/timetable';

const store = useTimetableStore();
const kiosk = useKioskStore();
const route = useRoute();
const router = useRouter();
useThemeStore(); // applies the theme on every page
useKioskRuntime();
onMounted(store.init);

// A kiosk hides the settings gear; holding the logo for 2 s opens settings instead
let hold;
let held = false;
function holdStart() {
  held = false;
  hold = setTimeout(() => {
    held = true;
    router.push({ name: 'settings' });
  }, 2000);
}
const holdEnd = () => clearTimeout(hold);
function logoClick(e) {
  if (!held) return;
  // the long press already navigated
  e.preventDefault();
  e.stopPropagation();
  held = false;
}
</script>
<template>
  <div class="mx-auto p-4" :class="kiosk.settings.enabled ? 'max-w-[1600px]' : 'max-w-[900px]'">
    <header class="flex items-center gap-2.5">
      <!-- capture: the click that ends a long press must be stopped before the link navigates -->
      <div class="select-none" @pointerdown="kiosk.settings.enabled && holdStart()" @pointerup="holdEnd" @pointerleave="holdEnd" @click.capture="logoClick"
        @contextmenu.prevent>
        <RouterLink :to="{ name: kiosk.settings.enabled ? 'kiosk' : 'timetable' }" class="flex items-center gap-2.5" aria-label="Tunniplaan">
          <TechnoLogo class="h-7 w-auto text-primary"></TechnoLogo>
          <div class="h-6 w-px bg-base-content/20" aria-hidden="true"></div>
          <h1 class="text-lg font-bold">Tunniplaan</h1>
        </RouterLink>
      </div>
      <template v-if="kiosk.settings.enabled">
        <span class="ml-auto text-lg text-base-content/70">{{ kiosk.campusName }}</span>
        <span class="text-2xl font-bold tabular-nums">{{ kiosk.time }}</span>
        <RouterLink v-if="!route.path.startsWith('/kiosk')" :to="{ name: 'kiosk' }" class="btn btn-lg border-neutral">
          <House class="size-6" aria-hidden="true" />Avaleht
        </RouterLink>
      </template>
      <RouterLink v-else :to="{ name: 'settings' }" class="btn btn-square btn-ghost btn-sm ml-auto" aria-label="Seaded" title="Seaded">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </RouterLink>
    </header>

    <RouterView></RouterView>

    <footer class="mt-6 mb-2 text-center text-xs text-base-content/60" v-if="store.index">
      Andmed:
      <!-- a kiosk names its sources without links: a touch there would leave the app -->
      <template v-for="(s, i) in store.sources" :key="s.id">{{ i ? ', ' : '' }}<span v-if="kiosk.settings.enabled">{{ s.label }}</span><a v-else class="link link-secondary" :href="s.url" target="_blank" rel="noopener">{{ s.label }}</a></template>;
      uuendatud {{ store.updated }}
    </footer>
  </div>
</template>
