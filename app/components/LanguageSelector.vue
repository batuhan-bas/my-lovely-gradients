<script setup lang="ts">
defineProps<{
  isDark?: boolean;
}>();

const { locale, locales, setLocale } = useI18n();

const isOpen = ref(false);

const availableLocales = computed(() => {
  return locales.value.filter((l) => typeof l !== "string");
});

const currentLocale = computed(() => {
  return availableLocales.value.find((l) => l.code === locale.value);
});

async function switchLocale(code: string) {
  await setLocale(code);
  isOpen.value = false;

  // Update HTML dir attribute for RTL
  const selectedLocale = availableLocales.value.find((l) => l.code === code);
  if (selectedLocale) {
    document.documentElement.dir = selectedLocale.dir || "ltr";
    document.documentElement.lang = code;
  }
}

// Set initial direction on mount
onMounted(() => {
  if (currentLocale.value) {
    document.documentElement.dir = currentLocale.value.dir || "ltr";
    document.documentElement.lang = locale.value;
  }
});

// Close on click outside
function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest(".language-selector")) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", onClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside);
});
</script>

<template>
  <div class="relative language-selector">
    <!-- Trigger Button -->
    <button
      class="h-10 px-3 rounded-full flex items-center gap-2 transition-colors duration-200"
      :class="isDark
        ? 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'
        : 'bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200'"
      @click.stop="isOpen = !isOpen"
    >
      <!-- Globe icon -->
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" :class="isDark ? 'text-white/60' : 'text-gray-500'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>

      <!-- Current locale code -->
      <span class="text-sm font-medium uppercase" :class="isDark ? 'text-white/80' : 'text-gray-700'">
        {{ locale }}
      </span>

      <!-- Chevron -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-3 h-3 transition-transform duration-200"
        :class="[
          isOpen ? 'rotate-180' : '',
          isDark ? 'text-white/40' : 'text-gray-400'
        ]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute top-full mt-2 w-40 rounded-xl overflow-hidden shadow-xl z-50 transition-colors duration-200"
        :class="[
          isDark ? 'bg-[#1a1a1a] ring-1 ring-white/10' : 'bg-white ring-1 ring-gray-200',
          locale === 'ar' ? 'left-0' : 'right-0'
        ]"
      >
        <div class="py-1">
          <button
            v-for="loc in availableLocales"
            :key="loc.code"
            class="w-full px-4 py-2.5 text-sm flex items-center justify-between transition-colors"
            :class="[
              locale === loc.code
                ? 'bg-orange-500/10 text-orange-500'
                : isDark
                  ? 'text-white/70 hover:bg-white/5 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
            @click="switchLocale(loc.code)"
          >
            <span>{{ loc.name }}</span>
            <svg
              v-if="locale === loc.code"
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4 text-orange-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
