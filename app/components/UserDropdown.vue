<script setup lang="ts">
import { useGradients } from "~/stores/gradients";

const { t } = useI18n();
defineProps<{
  isDark?: boolean;
}>();

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const store = useGradients();

const isOpen = ref(false);

// Get display name
const displayName = computed(() => {
  if (user.value?.user_metadata?.full_name) {
    return user.value.user_metadata.full_name;
  }
  // Fallback to email prefix
  return user.value?.email?.split("@")[0] || "Kullanici";
});

// Get initials for avatar
const initials = computed(() => {
  const name = displayName.value;
  if (name.includes(" ")) {
    const parts = name.split(" ");
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
});

async function logout() {
  await supabase.auth.signOut();
  isOpen.value = false;
  navigateTo("/");
}

// Close on click outside
function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest(".user-dropdown")) {
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
  <div class="relative user-dropdown">
    <!-- Trigger Button -->
    <button
      class="flex items-center gap-2 h-10 pl-1 pr-3 rounded-full transition-colors duration-200"
      :class="isDark
        ? 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'
        : 'bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200'"
      @click.stop="isOpen = !isOpen"
    >
      <!-- Avatar -->
      <div
        class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 grid place-items-center text-white text-xs font-bold"
      >
        {{ initials }}
      </div>

      <!-- Admin Badge (inline) -->
      <span
        v-if="store.isAdmin"
        class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-500 text-white"
      >
        {{ t('user.admin') }}
      </span>

      <!-- Chevron -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 transition-transform duration-200"
        :class="[
          isOpen ? 'rotate-180' : '',
          isDark ? 'text-white/50' : 'text-gray-400'
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
        class="absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden shadow-xl z-50 transition-colors duration-200"
        :class="isDark
          ? 'bg-[#1a1a1a] ring-1 ring-white/10'
          : 'bg-white ring-1 ring-gray-200'"
      >
        <!-- User Info -->
        <div class="p-4 border-b" :class="isDark ? 'border-white/10' : 'border-gray-100'">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 grid place-items-center text-white font-bold"
            >
              {{ initials }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate" :class="isDark ? 'text-white' : 'text-gray-900'">
                {{ displayName }}
              </p>
              <p class="text-sm truncate" :class="isDark ? 'text-white/50' : 'text-gray-500'">
                {{ user?.email }}
              </p>
            </div>
          </div>
          <div v-if="store.isAdmin" class="mt-3">
            <span class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg bg-purple-500/10 text-purple-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
              {{ t('user.administrator') }}
            </span>
          </div>
        </div>

        <!-- Menu Items -->
        <div class="p-2">
          <NuxtLink
            to="/settings"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors"
            :class="isDark
              ? 'text-white/70 hover:bg-white/5 hover:text-white'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            @click="isOpen = false"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {{ t('common.settings') }}
          </NuxtLink>

          <button
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-red-500 hover:bg-red-500/10"
            @click="logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {{ t('common.logout') }}
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
