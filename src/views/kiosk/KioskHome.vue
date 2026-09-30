<script setup>
import { BellRing, Building2, DoorOpen, GraduationCap, Hourglass, Users, UtensilsCrossed } from '@lucide/vue';
import { useRouter } from 'vue-router';
import KioskTiles from '../../components/kiosk/KioskTiles.vue';

// The same panels and order as Tahvel's school board, coloured with the theme's eight colours, then the lunch menu.
// Themes often make secondary and success alike (string colour vs terminal green), and accent and info (function
// colour vs terminal blue), so those pairs are kept apart in the 3 × 3 grid.
const TILES = [
  { key: 'now', label: 'Hetke tunnid', icons: [BellRing], color: 'bg-primary text-primary-content', to: { name: 'kiosk-now' } },
  { key: 'groups-today', label: 'Hetke tunnid rühmade lõikes', icons: [Users, BellRing], color: 'bg-secondary text-secondary-content', to: { name: 'kiosk-groups', params: { purpose: 'tana' } } },
  { key: 'groups', label: 'Õpperühmade tunniplaan', icons: [Users], color: 'bg-accent text-accent-content', to: { name: 'kiosk-groups', params: { purpose: 'plaan' } } },
  { key: 'teachers', label: 'Õpetajate tunniplaan', icons: [GraduationCap], color: 'bg-warning text-warning-content', to: { name: 'kiosk-teachers' } },
  { key: 'rooms-today', label: 'Hetke tunnid ruumi lõikes', icons: [DoorOpen, BellRing], color: 'bg-info text-info-content', to: { name: 'kiosk-rooms', params: { purpose: 'tana' } } },
  { key: 'buildings', label: 'Hetke tunnid hoone lõikes', icons: [Building2, BellRing], color: 'bg-error text-error-content', to: { name: 'kiosk-building' } },
  { key: 'rooms', label: 'Ruumide tunniplaan', icons: [DoorOpen], color: 'bg-success text-success-content', to: { name: 'kiosk-rooms', params: { purpose: 'plaan' } } },
  { key: 'free', label: 'Vabad ruumid', icons: [Building2, Hourglass], color: 'bg-neutral text-neutral-content', to: { name: 'kiosk-free' } },
  { key: 'lunch', label: 'Koolilõuna', icons: [UtensilsCrossed], color: 'border-2 border-primary bg-base-200 text-base-content', to: { name: 'kiosk-lunch' } },
];
const router = useRouter();
</script>
<template>
  <div class="mt-4">
    <!-- the tiles fill the screen: 3 × 3 on a landscape screen, 2 columns on a portrait one -->
    <KioskTiles :tiles="TILES" @pick="(t) => router.push(t.to)"></KioskTiles>
  </div>
</template>
