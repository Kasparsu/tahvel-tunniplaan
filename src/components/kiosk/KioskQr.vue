<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import QrcodeVue from 'qrcode.vue';
import { absolute } from '../../deepLink';

/** A QR code of the same page in the normal app, so a passer-by can take what is on the kiosk with them. */
const props = defineProps({ to: { type: Object, required: true } });
const router = useRouter();
const url = computed(() => absolute(router, props.to));
</script>
<template>
  <div class="flex shrink-0 items-center gap-2">
    <span class="w-24 text-right text-sm leading-tight text-base-content/60">Skanni, et telefonis avada</span>
    <!-- Black on white whatever the theme: a themed QR code does not scan. 128 px keeps the densest of
         these links (a long teacher name encodes to 45 × 45) above 2.5 px a module, and the margin is
         the quiet zone the white padding then widens. -->
    <QrcodeVue :value="url" :size="128" :margin="2" render-as="svg" level="M" background="#ffffff" foreground="#000000" class="rounded bg-white p-2" />
  </div>
</template>
