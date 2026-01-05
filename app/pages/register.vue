<script setup lang="ts">
definePageMeta({ layout: "auth" });

const { t } = useI18n();
const supabase = useSupabaseClient();
const colorMode = useState<"dark" | "light">("colorMode", () => "dark");
const isDark = computed(() => colorMode.value === "dark");

const fullName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const error = ref("");
const success = ref(false);

async function handleRegister() {
  if (!email.value || !password.value) {
    error.value = t("auth.errors.emailRequired");
    return;
  }

  if (password.value.length < 6) {
    error.value = t("auth.errors.passwordMinLength");
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = t("auth.errors.passwordMismatch");
    return;
  }

  loading.value = true;
  error.value = "";

  const { error: authError } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: {
        full_name: fullName.value.trim() || null,
      },
    },
  });

  if (authError) {
    error.value = authError.message;
    loading.value = false;
    return;
  }

  success.value = true;
  loading.value = false;
}
</script>

<template>
  <div class="w-full max-w-md space-y-6">
    <!-- Header with Back Button -->
    <div class="flex items-center gap-4">
      <NuxtLink
        to="/"
        class="p-2 rounded-lg transition-colors"
        :class="isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-500'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
          {{ t('auth.register.title') }}
        </h1>
        <p class="text-sm" :class="isDark ? 'text-white/50' : 'text-gray-500'">
          {{ t('auth.register.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Card -->
    <div
      class="rounded-2xl p-8 transition-colors duration-300"
      :class="isDark ? 'bg-[#1a1a1a] ring-1 ring-white/10' : 'bg-white ring-1 ring-gray-200 shadow-xl'"
    >
      <!-- Success State -->
      <template v-if="success">
        <div class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 grid place-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 class="text-xl font-bold mb-2">{{ t('auth.register.successTitle') }}</h2>
          <p :class="isDark ? 'text-white/50' : 'text-gray-500'" class="mb-6">
            {{ t('auth.register.successMessage') }}
          </p>
          <NuxtLink
            to="/login"
            class="inline-flex h-10 px-6 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium hover:opacity-90"
          >
            {{ t('auth.login.button') }}
          </NuxtLink>
        </div>
      </template>

      <!-- Register Form -->
      <template v-else>
        <!-- Error Alert -->
        <div
          v-if="error"
          class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm"
        >
          {{ error }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-5">
          <!-- Full Name -->
          <div>
            <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-white/70' : 'text-gray-700'">
              {{ t('auth.fields.fullName') }}
            </label>
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" :class="isDark ? 'text-white/40' : 'text-gray-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
              <input
                v-model="fullName"
                type="text"
                :placeholder="t('auth.fields.fullNamePlaceholder')"
                class="w-full h-12 pl-12 pr-4 rounded-xl outline-none transition-colors"
                :class="isDark
                  ? 'bg-white/5 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-white/20'
                  : 'bg-gray-50 ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-300'"
              />
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-white/70' : 'text-gray-700'">
              {{ t('auth.fields.email') }}
            </label>
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" :class="isDark ? 'text-white/40' : 'text-gray-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                v-model="email"
                type="email"
                :placeholder="t('auth.fields.emailPlaceholder')"
                class="w-full h-12 pl-12 pr-4 rounded-xl outline-none transition-colors"
                :class="isDark
                  ? 'bg-white/5 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-white/20'
                  : 'bg-gray-50 ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-300'"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-white/70' : 'text-gray-700'">
              {{ t('auth.fields.password') }}
            </label>
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" :class="isDark ? 'text-white/40' : 'text-gray-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="t('auth.fields.passwordPlaceholder')"
                class="w-full h-12 pl-12 pr-12 rounded-xl outline-none transition-colors"
                :class="isDark
                  ? 'bg-white/5 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-white/20'
                  : 'bg-gray-50 ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-300'"
              />
              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                :class="isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-white/70' : 'text-gray-700'">
              {{ t('auth.fields.confirmPassword') }}
            </label>
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" :class="isDark ? 'text-white/40' : 'text-gray-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="12" cy="16" r="1" />
              </svg>
              <input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                :placeholder="t('auth.fields.confirmPasswordPlaceholder')"
                class="w-full h-12 pl-12 pr-12 rounded-xl outline-none transition-colors"
                :class="isDark
                  ? 'bg-white/5 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-white/20'
                  : 'bg-gray-50 ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-300'"
              />
              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                :class="isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <svg v-if="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full h-12 rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="inline-flex items-center gap-2">
              <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ t('auth.register.loading') }}
            </span>
            <span v-else>{{ t('auth.register.button') }}</span>
          </button>
        </form>

        <!-- Footer -->
        <p class="mt-6 text-center text-sm" :class="isDark ? 'text-white/50' : 'text-gray-500'">
          {{ t('auth.register.hasAccount') }}
          <NuxtLink to="/login" class="text-orange-500 hover:text-orange-400 font-medium">
            {{ t('auth.register.loginLink') }}
          </NuxtLink>
        </p>
      </template>
    </div>
  </div>
</template>
