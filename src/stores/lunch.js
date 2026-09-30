/** The campuses' school lunch menus (data/lunch.json, read from techno.ee at deploy time). */
import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useLunchStore = defineStore('lunch', () => {
  const data = ref(null); // { source, generated, campuses: { K: { days, notes, legend } } }
  const missing = ref(false); // the deploy could not read the menus
  let loading = null;

  /** Load once; `fresh` re-reads (a kiosk stays open for days). */
  function load(fresh = false) {
    if (loading && !fresh) return loading;
    loading = fetch(`${import.meta.env.BASE_URL}data/lunch.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        data.value = d;
        missing.value = false;
      })
      .catch(() => {
        if (!data.value) missing.value = true;
      });
    return loading;
  }

  const menu = (campus) => data.value?.campuses?.[campus] ?? null;
  /** The day to open on: `today` (ISO) when it has a menu, else the next day that has one, else the last. */
  function dayFor(campus, today) {
    const days = menu(campus)?.days ?? [];
    return (days.find((d) => d.date >= today) ?? days.at(-1))?.date ?? null;
  }
  return { data, missing, load, menu, dayFor };
});
