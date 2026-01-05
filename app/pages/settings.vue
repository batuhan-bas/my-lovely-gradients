<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { t } = useI18n();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const colorMode = useState<"dark" | "light">("colorMode", () => "dark");
const isDark = computed(() => colorMode.value === "dark");

// Profile form
const fullName = ref(user.value?.user_metadata?.full_name || "");
const profileLoading = ref(false);
const profileSuccess = ref(false);
const profileError = ref("");

async function updateProfile() {
  profileLoading.value = true;
  profileError.value = "";
  profileSuccess.value = false;

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName.value.trim() },
  });

  if (error) {
    profileError.value = error.message;
  } else {
    profileSuccess.value = true;
    setTimeout(() => (profileSuccess.value = false), 3000);
  }

  profileLoading.value = false;
}

// Password form
const currentPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");
const showNewPassword = ref(false);
const showConfirmNewPassword = ref(false);
const passwordLoading = ref(false);
const passwordSuccess = ref(false);
const passwordError = ref("");

async function updatePassword() {
  if (newPassword.value.length < 6) {
    passwordError.value = t("auth.errors.passwordMinLength");
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    passwordError.value = t("auth.errors.passwordMismatch");
    return;
  }

  passwordLoading.value = true;
  passwordError.value = "";
  passwordSuccess.value = false;

  const { error } = await supabase.auth.updateUser({
    password: newPassword.value,
  });

  if (error) {
    passwordError.value = error.message;
  } else {
    passwordSuccess.value = true;
    currentPassword.value = "";
    newPassword.value = "";
    confirmNewPassword.value = "";
    setTimeout(() => (passwordSuccess.value = false), 3000);
  }

  passwordLoading.value = false;
}

// Delete account
const showDeleteModal = ref(false);
const deleteConfirmText = ref("");
const deleteLoading = ref(false);
const deleteError = ref("");

const canDelete = computed(() => deleteConfirmText.value === t("settings.danger.modal.confirmText"));

async function deleteAccount() {
  if (!canDelete.value) return;

  deleteLoading.value = true;
  deleteError.value = "";

  // First delete user's gradients
  const { error: gradientsError } = await supabase
    .from("gradients")
    .delete()
    .eq("user_id", user.value?.id);

  if (gradientsError) {
    deleteError.value = gradientsError.message;
    deleteLoading.value = false;
    return;
  }

  // Delete user account via edge function or RPC
  // Note: Direct user deletion requires admin privileges
  // For now, we'll sign out and show a message
  // In production, you'd use an edge function or RPC

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to home with message
  navigateTo("/?deleted=1");
}
</script>

<template>
  <section class="mx-auto max-w-2xl px-6 py-8 space-y-8">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink
        to="/"
        class="p-2 rounded-lg transition-colors"
        :class="isDark ? 'hover:bg-white/5 text-white/60' : 'hover:bg-gray-100 text-gray-500'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
          {{ t('settings.title') }}
        </h1>
        <p class="text-sm" :class="isDark ? 'text-white/50' : 'text-gray-500'">
          {{ t('settings.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Profile Section -->
    <div
      class="rounded-2xl p-6 transition-colors"
      :class="isDark ? 'bg-[#1a1a1a] ring-1 ring-white/10' : 'bg-white ring-1 ring-gray-200 shadow-sm'"
    >
      <h2 class="text-lg font-semibold mb-4" :class="isDark ? 'text-white' : 'text-gray-900'">
        {{ t('settings.profile.title') }}
      </h2>

      <!-- Success/Error Messages -->
      <div v-if="profileSuccess" class="mb-4 p-3 rounded-lg bg-green-500/10 text-green-500 text-sm">
        {{ t('settings.profile.success') }}
      </div>
      <div v-if="profileError" class="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
        {{ profileError }}
      </div>

      <div class="space-y-4">
        <!-- Email (read-only) -->
        <div>
          <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-white/70' : 'text-gray-700'">
            {{ t('settings.profile.emailLabel') }}
          </label>
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" :class="isDark ? 'text-white/30' : 'text-gray-300'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              :value="user?.email"
              type="email"
              disabled
              class="w-full h-11 pl-12 pr-4 rounded-lg cursor-not-allowed opacity-60"
              :class="isDark
                ? 'bg-white/5 ring-1 ring-white/10 text-white'
                : 'bg-gray-100 ring-1 ring-gray-200 text-gray-900'"
            />
          </div>
          <p class="mt-1 text-xs" :class="isDark ? 'text-white/40' : 'text-gray-400'">
            {{ t('settings.profile.emailHint') }}
          </p>
        </div>

        <!-- Full Name -->
        <div>
          <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-white/70' : 'text-gray-700'">
            {{ t('settings.profile.nameLabel') }}
          </label>
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" :class="isDark ? 'text-white/40' : 'text-gray-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
            <input
              v-model="fullName"
              type="text"
              :placeholder="t('settings.profile.namePlaceholder')"
              class="w-full h-11 pl-12 pr-4 rounded-lg outline-none transition-colors"
              :class="isDark
                ? 'bg-white/5 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-white/20'
                : 'bg-gray-50 ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-300'"
            />
          </div>
        </div>

        <button
          :disabled="profileLoading"
          class="h-10 px-5 rounded-lg text-sm font-medium transition-colors bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50"
          @click="updateProfile"
        >
          <span v-if="profileLoading">{{ t('settings.profile.saving') }}</span>
          <span v-else>{{ t('settings.profile.saveButton') }}</span>
        </button>
      </div>
    </div>

    <!-- Password Section -->
    <div
      class="rounded-2xl p-6 transition-colors"
      :class="isDark ? 'bg-[#1a1a1a] ring-1 ring-white/10' : 'bg-white ring-1 ring-gray-200 shadow-sm'"
    >
      <h2 class="text-lg font-semibold mb-4" :class="isDark ? 'text-white' : 'text-gray-900'">
        {{ t('settings.password.title') }}
      </h2>

      <!-- Success/Error Messages -->
      <div v-if="passwordSuccess" class="mb-4 p-3 rounded-lg bg-green-500/10 text-green-500 text-sm">
        {{ t('settings.password.success') }}
      </div>
      <div v-if="passwordError" class="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
        {{ passwordError }}
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-white/70' : 'text-gray-700'">
            {{ t('settings.password.newPassword') }}
          </label>
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" :class="isDark ? 'text-white/40' : 'text-gray-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              v-model="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              :placeholder="t('auth.fields.passwordPlaceholder')"
              class="w-full h-11 pl-12 pr-12 rounded-lg outline-none transition-colors"
              :class="isDark
                ? 'bg-white/5 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-white/20'
                : 'bg-gray-50 ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-300'"
            />
            <button
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
              :class="isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'"
              @click="showNewPassword = !showNewPassword"
            >
              <svg v-if="!showNewPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            {{ t('settings.password.confirmNewPassword') }}
          </label>
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" :class="isDark ? 'text-white/40' : 'text-gray-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="16" r="1" />
            </svg>
            <input
              v-model="confirmNewPassword"
              :type="showConfirmNewPassword ? 'text' : 'password'"
              :placeholder="t('auth.fields.confirmPasswordPlaceholder')"
              class="w-full h-11 pl-12 pr-12 rounded-lg outline-none transition-colors"
              :class="isDark
                ? 'bg-white/5 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-white/20'
                : 'bg-gray-50 ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-300'"
            />
            <button
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
              :class="isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'"
              @click="showConfirmNewPassword = !showConfirmNewPassword"
            >
              <svg v-if="!showConfirmNewPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          :disabled="passwordLoading || !newPassword || !confirmNewPassword"
          class="h-10 px-5 rounded-lg text-sm font-medium transition-colors bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50"
          @click="updatePassword"
        >
          <span v-if="passwordLoading">{{ t('settings.password.updating') }}</span>
          <span v-else>{{ t('settings.password.updateButton') }}</span>
        </button>
      </div>
    </div>

    <!-- Danger Zone -->
    <div
      class="rounded-2xl p-6 ring-1 ring-red-500/30 bg-red-500/5"
    >
      <h2 class="text-lg font-semibold mb-2 text-red-500">
        {{ t('settings.danger.title') }}
      </h2>
      <p class="text-sm mb-4" :class="isDark ? 'text-white/50' : 'text-gray-500'">
        {{ t('settings.danger.description') }}
      </p>

      <button
        class="h-10 px-5 rounded-lg text-sm font-medium transition-colors bg-red-500 text-white hover:bg-red-600"
        @click="showDeleteModal = true"
      >
        {{ t('settings.danger.deleteButton') }}
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDeleteModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-black/60 backdrop-blur-sm"
            @click="showDeleteModal = false"
          />

          <!-- Modal -->
          <div
            class="relative w-full max-w-md rounded-2xl p-6 transition-colors"
            :class="isDark ? 'bg-[#1a1a1a]' : 'bg-white shadow-2xl'"
          >
            <!-- Warning Icon -->
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>

            <h3 class="text-xl font-bold text-center mb-2" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ t('settings.danger.modal.title') }}
            </h3>
            <p class="text-center text-sm mb-6" :class="isDark ? 'text-white/50' : 'text-gray-500'">
              {{ t('settings.danger.modal.description', { confirm: t('settings.danger.modal.confirmText') }) }}
            </p>

            <!-- Error -->
            <div v-if="deleteError" class="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {{ deleteError }}
            </div>

            <!-- Confirmation Input -->
            <input
              v-model="deleteConfirmText"
              type="text"
              :placeholder="t('settings.danger.modal.confirmText')"
              class="w-full h-11 px-4 rounded-lg outline-none transition-colors mb-4 text-center font-mono"
              :class="isDark
                ? 'bg-white/5 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-red-500/50'
                : 'bg-gray-50 ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-red-500/50'"
            />

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                class="flex-1 h-10 rounded-lg text-sm font-medium transition-colors"
                :class="isDark
                  ? 'bg-white/5 text-white/70 hover:bg-white/10'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                @click="showDeleteModal = false; deleteConfirmText = ''"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                :disabled="!canDelete || deleteLoading"
                class="flex-1 h-10 rounded-lg text-sm font-medium transition-colors bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="deleteAccount"
              >
                <span v-if="deleteLoading">{{ t('settings.danger.modal.deleting') }}</span>
                <span v-else>{{ t('settings.danger.modal.deleteButton') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(10px);
}
</style>
