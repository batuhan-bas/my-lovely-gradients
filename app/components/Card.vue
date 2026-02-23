<script setup lang="ts">
import type { Gradient } from "~/stores/gradients";
import { useGradients } from "~/stores/gradients";

const props = defineProps<{
  gradient: Gradient;
  open: boolean;
  isDark?: boolean;
}>();
const emit = defineEmits<{
  (e: "toggle"): void;
  (e: "edit", id: string): void;
  (e: "delete", id: string): void;
}>();
const { t } = useI18n();
const store = useGradients();

// Owner name for admin view
const ownerDisplay = computed(() => {
  if (!props.gradient.ownerId) return null;
  return props.gradient.ownerName || "N/A";
});

const bg = computed(() => {
  const stops = props.gradient.colors
    .map((color, i) => {
      const percent = Math.round((i / (props.gradient.colors.length - 1)) * 100);
      return `${color} ${percent}%`;
    })
    .join(", ");
  return `linear-gradient(${props.gradient.angle}deg, ${stops})`;
});

const tab = ref<"css" | "scss">("css");
const showCopied = ref(false);

function copyCode() {
  const str =
    tab.value === "css" ? store.cssString(props.gradient) : store.scssString(props.gradient);
  if (import.meta.client && globalThis.navigator?.clipboard) {
    globalThis.navigator.clipboard.writeText(str);
    showCopied.value = true;
    setTimeout(() => {
      showCopied.value = false;
    }, 2000);
  }
}

/* Smooth accordion */
const DURATION = 220;
const EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

function onEnter(el: Element) {
  const n = el as HTMLElement;
  n.style.overflow = "hidden";
  n.style.height = "0px";
  n.style.opacity = "0";
  n.style.transition = `height ${DURATION}ms ${EASING}, opacity ${DURATION}ms ease-out`;
  requestAnimationFrame(() => {
    n.style.height = n.scrollHeight + "px";
    n.style.opacity = "1";
  });
}
function onAfterEnter(el: Element) {
  const n = el as HTMLElement;
  n.style.overflow = "";
  n.style.height = "";
  n.style.opacity = "";
  n.style.transition = "";
}
function onBeforeLeave(el: Element) {
  const n = el as HTMLElement;
  n.style.overflow = "hidden";
  n.style.height = n.scrollHeight + "px";
  n.style.opacity = "1";
}
function onLeave(el: Element) {
  const n = el as HTMLElement;
  n.style.transition = `height ${DURATION}ms ${EASING}, opacity ${DURATION}ms ease-in`;
  requestAnimationFrame(() => {
    n.style.height = "0px";
    n.style.opacity = "0";
  });
}
</script>

<template>
  <article
    class="rounded-xl overflow-hidden transition-colors duration-300"
    :class="isDark ? 'bg-[#1a1a1a]' : 'bg-white shadow-md ring-1 ring-gray-100'"
  >
    <!-- Gradient Preview -->
    <div class="relative">
      <div class="h-40 w-full" :style="{ background: bg }"></div>
      <!-- Badges -->
      <div class="absolute left-3 top-3 flex gap-2">
        <span
          v-if="gradient.isSystem"
          class="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/80 text-white backdrop-blur"
        >
          {{ t("card.badges.system") }}
        </span>
        <span
          v-if="gradient.isOwner"
          class="px-2 py-1 text-xs font-medium rounded-full bg-green-500/80 text-white backdrop-blur"
        >
          {{ t("card.badges.mine") }}
        </span>
        <!-- Admin: show owner name for other users' gradients -->
        <span
          v-if="store.isAdmin && !gradient.isSystem && !gradient.isOwner && ownerDisplay"
          class="px-2 py-1 text-xs font-medium rounded-full bg-purple-500/80 text-white backdrop-blur"
        >
          {{ ownerDisplay }}
        </span>
      </div>
      <!-- Show code button -->
      <button
        class="absolute right-3 top-3 h-8 px-3 rounded-full bg-black/50 backdrop-blur ring-1 ring-white/20 text-xs font-medium text-white/90 hover:bg-black/70 transition"
        :aria-expanded="open"
        @click="emit('toggle')"
      >
        {{ open ? t("card.hideCode") : t("card.showCode") }}
      </button>
    </div>

    <!-- Copied Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="showCopied"
          class="fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl bg-green-500 text-white text-sm font-medium shadow-2xl flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {{ t("common.copied") }}
        </div>
      </Transition>
    </Teleport>

    <!-- Body -->
    <div class="p-4 space-y-3">
      <!-- Title -->
      <h3 class="text-base font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
        {{ gradient.name }}
      </h3>

      <!-- Description -->
      <p
        class="text-sm leading-relaxed line-clamp-2"
        :class="isDark ? 'text-white/50' : 'text-gray-500'"
        :title="gradient.desc"
      >
        {{ gradient.desc }}
      </p>

      <!-- Tags -->
      <div class="flex gap-1.5 items-center flex-wrap">
        <span
          v-for="t in gradient.tags.slice(0, 4)"
          :key="t"
          class="px-2.5 py-1 text-xs rounded-md ring-1 transition-colors"
          :class="
            isDark
              ? 'text-white/60 bg-white/5 ring-white/10'
              : 'text-gray-600 bg-gray-100 ring-gray-200'
          "
        >
          {{ t }}
        </span>
        <!-- +X more badge -->
        <span
          v-if="gradient.tags.length > 4"
          class="px-2.5 py-1 text-xs text-orange-500 bg-orange-500/10 rounded-md ring-1 ring-orange-500/20 cursor-default"
          :title="gradient.tags.slice(4).join(', ')"
        >
          +{{ gradient.tags.length - 4 }}
        </span>
      </div>

      <!-- Edit/Delete Buttons (owner or admin for non-system gradients) -->
      <div v-if="gradient.isOwner || (store.isAdmin && !gradient.isSystem)" class="flex gap-2 pt-2">
        <button
          class="flex-1 h-9 rounded-lg text-xs font-medium transition-colors"
          :class="
            isDark
              ? 'bg-white/5 ring-1 ring-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              : 'bg-gray-100 ring-1 ring-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          "
          @click="emit('edit', gradient.id)"
        >
          {{ t("card.edit") }}
        </button>
        <button
          class="flex-1 h-9 rounded-lg text-xs font-medium transition-colors ring-1"
          :class="
            isDark
              ? 'bg-red-500/10 ring-red-500/30 text-red-400 hover:bg-red-500/20'
              : 'bg-red-50 ring-red-200 text-red-600 hover:bg-red-100'
          "
          @click="emit('delete', gradient.id)"
        >
          {{ t("card.delete") }}
        </button>
      </div>

      <!-- Expandable Code Panel -->
      <Transition
        @enter="onEnter"
        @after-enter="onAfterEnter"
        @before-leave="onBeforeLeave"
        @leave="onLeave"
      >
        <div
          v-if="open"
          class="pt-3 border-t"
          :class="isDark ? 'border-white/10' : 'border-gray-200'"
        >
          <!-- CSS / SCSS Toggle + Copy Button -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex gap-2">
              <button
                class="px-3 py-1.5 rounded-md text-xs font-medium transition"
                :class="
                  tab === 'css'
                    ? 'bg-orange-500 text-white'
                    : isDark
                      ? 'bg-white/5 text-white/60 hover:bg-white/10'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                "
                @click="tab = 'css'"
              >
                CSS
              </button>
              <button
                class="px-3 py-1.5 rounded-md text-xs font-medium transition"
                :class="
                  tab === 'scss'
                    ? 'bg-orange-500 text-white'
                    : isDark
                      ? 'bg-white/5 text-white/60 hover:bg-white/10'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                "
                @click="tab = 'scss'"
              >
                SCSS
              </button>
            </div>
            <!-- Copy Button -->
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ring-1 transition"
              :class="
                isDark
                  ? 'bg-white/5 text-white/70 ring-white/10 hover:bg-white/10 hover:text-white'
                  : 'bg-gray-100 text-gray-600 ring-gray-200 hover:bg-gray-200 hover:text-gray-900'
              "
              @click="copyCode"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
              {{ t("common.copy") }}
            </button>
          </div>

          <!-- Code Block -->
          <pre
            class="text-sm leading-relaxed rounded-lg p-4 overflow-x-auto"
            :class="isDark ? 'bg-black/30 text-white/80' : 'bg-gray-100 text-gray-800'"
          ><code v-if="tab === 'css'">{{ store.cssString(gradient) }}</code><code v-else>{{ store.scssString(gradient) }}</code></pre>
        </div>
      </Transition>
    </div>
  </article>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
