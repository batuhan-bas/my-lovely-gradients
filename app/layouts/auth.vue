<script setup lang="ts">
import LanguageSelector from "~/components/LanguageSelector.vue";

const { t } = useI18n();

// Theme initialization - check localStorage first, then system preference
function getInitialTheme(): "dark" | "light" {
  if (import.meta.client) {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    // Check system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }
  return "dark"; // SSR default
}

const colorMode = useState<"dark" | "light">("colorMode", getInitialTheme);
const isDark = computed(() => colorMode.value === "dark");

// Apply theme on mount
onMounted(() => {
  document.documentElement.classList.toggle("dark", colorMode.value === "dark");
});

function toggleColorMode() {
  colorMode.value = colorMode.value === "dark" ? "light" : "dark";
  document.documentElement.classList.toggle("dark", colorMode.value === "dark");
  localStorage.setItem("theme", colorMode.value);
}
</script>

<template>
  <div
    class="min-h-dvh flex flex-col transition-colors duration-300"
    :class="isDark ? 'bg-[#0f0f0f] text-white' : 'bg-gray-50 text-gray-900'"
  >
    <!-- Header -->
    <header
      class="sticky top-0 z-20 backdrop-blur-sm transition-colors duration-300"
      :class="isDark ? 'bg-[#0f0f0f]/80' : 'bg-white/80 shadow-sm'"
    >
      <div
        class="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between"
      >
        <NuxtLink to="/" class="logo-text text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
          {{ t('nav.brand') }}
        </NuxtLink>

        <div class="flex items-center gap-3">
          <!-- Language Selector -->
          <LanguageSelector :is-dark="isDark" />

          <!-- Theme toggle -->
          <button
            class="h-10 w-10 grid place-items-center rounded-full transition-colors duration-300"
            :class="isDark ? 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10' : 'bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200'"
            @click="toggleColorMode"
            :aria-label="isDark ? 'Light mode' : 'Dark mode'"
          >
            <!-- Sun icon (show in dark mode) -->
            <svg
              v-if="isDark"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-yellow-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
            <!-- Moon icon (show in light mode) -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-indigo-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Centered Content -->
    <main class="flex-1 flex items-center justify-center px-6 py-12">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.logo-text {
  background: linear-gradient(
    90deg,
    #ff6b6b,
    #feca57,
    #48dbfb,
    #ff9ff3,
    #54a0ff,
    #5f27cd,
    #ff6b6b
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 3s linear infinite;
}

@keyframes gradient-shift {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo-text {
    animation: none;
    background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb);
    background-clip: text;
    -webkit-background-clip: text;
  }
}
</style>
