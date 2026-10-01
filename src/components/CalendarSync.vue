<script setup>
import { computed, ref } from 'vue';
import { CalendarPlus, Check, Copy, ExternalLink } from '@lucide/vue';
import { feedUrl, googleUrl, webcalUrl } from '../calendar';

/** Subscribe to the selected group's or teacher's timetable in a calendar app. */
const props = defineProps({ selection: { type: Object, required: true } });
const open = ref(false);
const copied = ref(false);
const url = computed(() => feedUrl(props.selection));

// The URL is shown in a field as well, both to say what is being subscribed to and because
// clipboard access is refused often enough (an insecure context, an older browser) to need a fallback.
async function copy() {
    try {
        await navigator.clipboard.writeText(url.value);
        copied.value = true;
        setTimeout(() => (copied.value = false), 2000);
    } catch {
        copied.value = false;
    }
}
</script>
<template>
    <div class="mt-3">
        <button type="button" class="btn btn-sm border-neutral" :class="{ 'btn-primary': open }" :aria-expanded="open" @click="open = !open">
            <CalendarPlus class="size-4" aria-hidden="true" />
            Lisa kalendrisse
        </button>

        <div v-if="open" class="mt-2 grid gap-3 rounded-box border border-base-300 p-3">
            <p class="text-sm text-base-content/70">
                Telli <strong>{{ selection.name }}</strong> tunniplaan oma kalendrisse. Kalender uueneb ise, kui tunniplaan muutub —
                faili pole vaja uuesti lisada.
            </p>
            <div class="flex flex-wrap gap-2">
                <a :href="webcalUrl(selection)" class="btn btn-primary btn-sm">
                    <CalendarPlus class="size-4" aria-hidden="true" />
                    Ava kalendris
                </a>
                <a :href="googleUrl(selection)" target="_blank" rel="noopener" class="btn btn-sm border-neutral">
                    <ExternalLink class="size-4" aria-hidden="true" />
                    Google Calendar
                </a>
                <button type="button" class="btn btn-sm border-neutral" @click="copy">
                    <component :is="copied ? Check : Copy" class="size-4" aria-hidden="true" />
                    {{ copied ? 'Kopeeritud' : 'Kopeeri link' }}
                </button>
            </div>
            <input class="input field-themed input-sm w-full font-mono text-xs" :value="url" readonly aria-label="Kalendri link"
                @focus="(e) => e.target.select()" />
            <p class="text-xs text-base-content/50">
                "Ava kalendris" annab lingi seadme kalendrirakendusele. Kui see ei avane, kopeeri link ja lisa see kalendris
                ise (Google Calendar: "Muu kalender" → "URL-i järgi").
            </p>
        </div>
    </div>
</template>
