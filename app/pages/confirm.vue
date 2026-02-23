<script setup lang="ts">
definePageMeta({ layout: "auth" });

const router = useRouter();
const colorMode = useState<"dark" | "light">("colorMode", () => "dark");
const isDark = computed(() => colorMode.value === "dark");

// Auto-redirect to home after successful confirmation
onMounted(() => {
  setTimeout(() => {
    router.push("/");
  }, 3000);
});
</script>

<template>
  <div class="w-full max-w-md">
    <div
      class="rounded-2xl p-8 transition-colors duration-300 text-center"
      :class="
        isDark ? 'bg-[#1a1a1a] ring-1 ring-white/10' : 'bg-white ring-1 ring-gray-200 shadow-xl'
      "
    >
      <!-- Success Icon -->
      <div
        class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 grid place-items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-10 h-10 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <!-- Text -->
      <h1 class="text-2xl font-bold mb-2">Email Dogrulandi!</h1>
      <p :class="isDark ? 'text-white/50' : 'text-gray-500'" class="mb-6">
        Hesabiniz basariyla dogrulandi. Anasayfaya yonlendiriliyorsunuz...
      </p>

      <!-- Loading Spinner -->
      <div class="flex justify-center mb-6">
        <svg class="animate-spin w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>

      <!-- Manual Link -->
      <NuxtLink
        to="/"
        class="inline-flex h-10 px-6 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium hover:opacity-90"
      >
        Anasayfaya Git
      </NuxtLink>
    </div>
  </div>
</template>
