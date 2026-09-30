/** The height an element can take from where it starts down to the bottom of the screen, above the footer. */
import { onBeforeUnmount, onMounted, ref } from 'vue';

const FOOTER = 72; // px left below for the page's footer (data credits) and padding

export function useFillHeight(el, onMeasure = () => {}) {
  const height = ref(0);
  function measure() {
    if (!el.value) return;
    height.value = Math.max(240, window.innerHeight - el.value.getBoundingClientRect().top - FOOTER);
    onMeasure(height.value);
  }
  onMounted(() => {
    measure();
    window.addEventListener('resize', measure);
  });
  onBeforeUnmount(() => window.removeEventListener('resize', measure));
  return { height, measure };
}
