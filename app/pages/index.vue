<script setup lang="ts">
import type { Gradient } from "~/stores/gradients";
import { useGradients } from "~/stores/gradients";
import TagMultiSelect from "~/components/TagMultiSelect.vue";
import AddGradientModal from "~/components/AddGradientModal.vue";

const { t } = useI18n();
const store = useGradients();
const user = useSupabaseUser();
const colorMode = useState<"dark" | "light">("colorMode", () => "dark");
const isDark = computed(() => colorMode.value === "dark");

const q = ref("");
const selectedTags = ref<string[]>([]);

// Tab state
const activeTab = ref<"all" | "system" | "mine">("all");

// Modal state
const showAddModal = ref(false);
const editingGradient = ref<Gradient | null>(null);

// Delete modal state
const showDeleteModal = ref(false);
const deletingGradient = ref<Gradient | null>(null);
const deleteLoading = ref(false);

// Fetch gradients on mount
onMounted(() => {
  store.fetchGradients();
});

// Refetch when user changes (login/logout)
watch(user, () => {
  store.fetchGradients();
});

// Sadece tek kart açık kalsın
const openId = useState<string | null>("openId", () => null);
function toggle(id: string) {
  openId.value = openId.value === id ? null : id;
}

// Edit handler
function handleEdit(id: string) {
  editingGradient.value = store.items.find((g) => g.id === id) || null;
  showAddModal.value = true;
}

// Delete handler - show modal
function handleDelete(id: string) {
  deletingGradient.value = store.items.find((g) => g.id === id) || null;
  showDeleteModal.value = true;
}

// Confirm delete
async function confirmDelete() {
  if (!deletingGradient.value) return;
  deleteLoading.value = true;
  await store.deleteGradient(deletingGradient.value.id);
  deleteLoading.value = false;
  showDeleteModal.value = false;
  deletingGradient.value = null;
}

// Cancel delete
function cancelDelete() {
  showDeleteModal.value = false;
  deletingGradient.value = null;
}

// Modal close handler
function handleModalClose() {
  showAddModal.value = false;
  editingGradient.value = null;
}

// Tüm tag'leri çıkar (benzersiz + alfabetik)
const allTags = computed(() => {
  const set = new Set<string>();
  for (const g of store.items) for (const t of g.tags) set.add(t);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
});

// Görünüm modu
const view = useState<"grid" | "list">("view", () => "grid");

// Tab counts
const systemCount = computed(() => store.systemGradients.length);
const userCount = computed(() => store.userGradients.length);

// Filtre mantığı
const filtered = computed(() => {
  const query = q.value.trim().toLowerCase();

  // First filter by tab
  let baseItems = store.items;
  if (activeTab.value === "system") {
    baseItems = store.systemGradients;
  } else if (activeTab.value === "mine") {
    baseItems = store.userGradients;
  }

  return baseItems.filter((g) => {
    const matchesQuery =
      query === "" ||
      g.name.toLowerCase().includes(query) ||
      g.desc.toLowerCase().includes(query) ||
      g.tags.some((t) => t.toLowerCase().includes(query));

    const matchesTags =
      selectedTags.value.length === 0 || selectedTags.value.every((t) => g.tags.includes(t));

    return matchesQuery && matchesTags;
  });
});
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-8 space-y-10">
    <!-- Hero Banner -->
    <header
      class="relative overflow-hidden rounded-3xl p-8 sm:p-12 transition-colors duration-300"
      :class="
        isDark ? 'bg-[#1a1a1a]' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
      "
    >
      <!-- Decorative blurred shapes -->
      <div
        class="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-br from-pink-500 to-orange-400 rounded-full blur-3xl opacity-30 animate-float"
      ></div>
      <div
        class="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl opacity-30 animate-float-delayed"
      ></div>
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse-slow"
      ></div>

      <!-- Content -->
      <div class="relative z-10 max-w-2xl">
        <!-- Badge -->
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10 text-xs text-white/70 mb-6"
        >
          <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          {{ t("home.hero.badge", { count: store.items.length }) }}
        </div>

        <!-- Title -->
        <h2
          class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-tight"
        >
          {{ t("home.hero.titleStart") }}
          <span class="hero-gradient-text">{{ t("home.hero.titleHighlight") }}</span>
        </h2>

        <!-- Description -->
        <p class="text-white/50 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
          {{ t("home.hero.description") }}
        </p>

        <!-- Stats + Create Button -->
        <div class="flex flex-wrap items-center gap-6">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 grid place-items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
              </svg>
            </div>
            <div>
              <div class="text-xl font-bold text-white">{{ store.items.length }}</div>
              <div class="text-xs text-white/50">{{ t("home.stats.gradients") }}</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 grid place-items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div class="text-xl font-bold text-white">{{ allTags.length }}</div>
              <div class="text-xs text-white/50">{{ t("home.stats.categories") }}</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 grid place-items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </div>
            <div>
              <div class="text-xl font-bold text-white">{{ t("home.stats.oneClick") }}</div>
              <div class="text-xs text-white/50">{{ t("home.stats.copy") }}</div>
            </div>
          </div>

          <!-- Create Gradient Button - Shiny CTA -->
          <button class="shiny-cta group relative" @click="showAddModal = true">
            <span class="shiny-cta-content">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              {{ t("home.createGradient") }}
            </span>
          </button>
        </div>
      </div>

      <!-- Decorative gradient preview cards -->
      <div class="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2">
        <div class="relative">
          <div
            class="w-32 h-20 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 shadow-2xl transform rotate-6 translate-x-4 translate-y-4 opacity-80"
          ></div>
          <div
            class="w-32 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl transform -rotate-3 opacity-90"
          ></div>
          <div
            class="w-32 h-20 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-2xl transform rotate-12 -translate-x-4 -translate-y-8"
          ></div>
        </div>
      </div>
    </header>

    <!-- Search & Filter -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors"
          :class="isDark ? 'text-white/40' : 'text-gray-400'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="q"
          type="text"
          :placeholder="t('home.search.placeholder')"
          class="w-full h-12 rounded-xl pl-12 pr-4 outline-none transition-colors duration-300"
          :class="
            isDark
              ? 'bg-[#1a1a1a] ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-white/20'
              : 'bg-white ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-300 shadow-sm'
          "
        />
      </div>

      <TagMultiSelect
        v-model="selectedTags"
        :options="allTags"
        :placeholder="t('home.search.tagPlaceholder')"
        :is-dark="isDark"
      />
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-2">
      <button
        class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
        :class="
          activeTab === 'all'
            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25'
            : isDark
              ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        "
        @click="activeTab = 'all'"
      >
        {{ t("home.tabs.all") }}
        <span
          class="ml-1.5 px-1.5 py-0.5 text-xs rounded-md"
          :class="activeTab === 'all' ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-gray-200'"
        >
          {{ store.items.length }}
        </span>
      </button>
      <button
        class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
        :class="
          activeTab === 'system'
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
            : isDark
              ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        "
        @click="activeTab = 'system'"
      >
        {{ t("home.tabs.system") }}
        <span
          class="ml-1.5 px-1.5 py-0.5 text-xs rounded-md"
          :class="activeTab === 'system' ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-gray-200'"
        >
          {{ systemCount }}
        </span>
      </button>
      <button
        v-if="user"
        class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
        :class="
          activeTab === 'mine'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
            : isDark
              ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        "
        @click="activeTab = 'mine'"
      >
        {{ store.isAdmin ? t("home.tabs.user") : t("home.tabs.mine") }}
        <span
          class="ml-1.5 px-1.5 py-0.5 text-xs rounded-md"
          :class="activeTab === 'mine' ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-gray-200'"
        >
          {{ userCount }}
        </span>
      </button>
    </div>

    <!-- Results count + View toggle -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <p class="text-sm" :class="isDark ? 'text-white/40' : 'text-gray-500'">
          {{ t("home.results.count", { count: filtered.length }) }}
          <span v-if="q || selectedTags.length">({{ t("home.results.filtered") }})</span>
        </p>
        <button
          v-if="q || selectedTags.length"
          class="text-sm text-orange-500 hover:text-orange-400 transition"
          @click="
            q = '';
            selectedTags = [];
          "
        >
          {{ t("home.results.clear") }}
        </button>
      </div>

      <!-- View Toggle -->
      <div
        class="flex items-center gap-1 p-1 rounded-lg transition-colors duration-300"
        :class="isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-gray-100 ring-1 ring-gray-200'"
      >
        <button
          class="p-2 rounded-md transition"
          :class="
            view === 'grid'
              ? 'bg-orange-500 text-white'
              : isDark
                ? 'text-white/50 hover:text-white/70'
                : 'text-gray-400 hover:text-gray-600'
          "
          :title="t('home.view.grid')"
          @click="view = 'grid'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>
        <button
          class="p-2 rounded-md transition"
          :class="
            view === 'list'
              ? 'bg-orange-500 text-white'
              : isDark
                ? 'text-white/50 hover:text-white/70'
                : 'text-gray-400 hover:text-gray-600'
          "
          :title="t('home.view.list')"
          @click="view = 'list'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading" class="flex items-center justify-center py-20">
      <div class="flex items-center gap-3">
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
        <span :class="isDark ? 'text-white/60' : 'text-gray-500'">{{ t("home.loading") }}</span>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="store.error"
      class="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500"
    >
      <p class="font-medium mb-2">{{ t("home.error.title") }}</p>
      <p class="text-sm opacity-80">{{ store.error }}</p>
      <button
        class="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
        @click="store.fetchGradients()"
      >
        {{ t("home.error.retry") }}
      </button>
    </div>

    <!-- Grid / List -->
    <div
      v-else
      class="grid gap-6 items-start"
      :class="
        view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
      "
    >
      <Card
        v-for="g in filtered"
        :key="g.id"
        :gradient="g"
        :open="openId === g.id"
        :is-dark="isDark"
        @toggle="toggle(g.id)"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <!-- Empty State -->
      <div v-if="filtered.length === 0 && !store.loading" class="col-span-full text-center py-12">
        <p :class="isDark ? 'text-white/40' : 'text-gray-400'">
          {{ q || selectedTags.length ? t("home.empty.noResults") : t("home.empty.noGradients") }}
        </p>
      </div>
    </div>

    <!-- Add/Edit Gradient Modal -->
    <AddGradientModal
      :open="showAddModal"
      :is-dark="isDark"
      :edit-gradient="editingGradient"
      @close="handleModalClose"
    />

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="cancelDelete"></div>

          <!-- Modal -->
          <div
            class="relative w-full max-w-md rounded-2xl p-6 transition-colors"
            :class="isDark ? 'bg-[#1a1a1a]' : 'bg-white shadow-2xl'"
          >
            <!-- Warning Icon -->
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 grid place-items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-8 h-8 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>

            <h3
              class="text-xl font-bold text-center mb-2"
              :class="isDark ? 'text-white' : 'text-gray-900'"
            >
              {{ t("home.deleteModal.title") }}
            </h3>
            <p class="text-center text-sm mb-2" :class="isDark ? 'text-white/50' : 'text-gray-500'">
              {{ t("home.deleteModal.description") }}
            </p>

            <!-- Gradient name -->
            <div
              v-if="deletingGradient"
              class="text-center py-3 px-4 rounded-lg mb-6"
              :class="isDark ? 'bg-white/5' : 'bg-gray-100'"
            >
              <p class="font-medium" :class="isDark ? 'text-white' : 'text-gray-900'">
                {{ deletingGradient.name }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                class="flex-1 h-11 rounded-xl text-sm font-medium transition-colors"
                :class="
                  isDark
                    ? 'bg-white/5 text-white/70 hover:bg-white/10'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                "
                @click="cancelDelete"
              >
                {{ t("common.cancel") }}
              </button>
              <button
                :disabled="deleteLoading"
                class="flex-1 h-11 rounded-xl text-sm font-medium transition-colors bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                @click="confirmDelete"
              >
                <span v-if="deleteLoading">{{ t("common.loading") }}</span>
                <span v-else>{{ t("common.delete") }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.hero-gradient-text {
  background: linear-gradient(135deg, #f97316, #ec4899, #8b5cf6);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float 6s ease-in-out infinite;
  animation-delay: -3s;
}

.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

@keyframes pulse-slow {
  0%,
  100% {
    opacity: 0.2;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-float,
  .animate-float-delayed,
  .animate-pulse-slow,
  .shiny-cta::before {
    animation: none;
  }
}

/* Shiny CTA Button */
.shiny-cta {
  --shimmer-speed: 2.5s;
  --shimmer-hue: 30;
  position: relative;
  padding: 3px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    hsl(var(--shimmer-hue), 100%, 60%),
    hsl(calc(var(--shimmer-hue) + 40), 100%, 55%),
    hsl(calc(var(--shimmer-hue) + 80), 100%, 60%),
    hsl(calc(var(--shimmer-hue) + 40), 100%, 55%),
    hsl(var(--shimmer-hue), 100%, 60%)
  );
  background-size: 200% 200%;
  animation: shimmer-gradient var(--shimmer-speed) linear infinite;
  cursor: pointer;
  border: none;
  box-shadow:
    0 0 20px hsla(var(--shimmer-hue), 100%, 60%, 0.4),
    0 0 40px hsla(var(--shimmer-hue), 100%, 60%, 0.2);
  transition: all 0.3s ease;
}

.shiny-cta::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 45%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(255, 255, 255, 0.4) 55%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer-shine 3s ease-in-out infinite;
  opacity: 0.6;
  pointer-events: none;
}

.shiny-cta:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 0 30px hsla(var(--shimmer-hue), 100%, 60%, 0.6),
    0 0 60px hsla(var(--shimmer-hue), 100%, 60%, 0.3),
    0 10px 40px hsla(var(--shimmer-hue), 100%, 40%, 0.3);
}

.shiny-cta:active {
  transform: translateY(0) scale(0.98);
}

.shiny-cta-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 11px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.shiny-cta:hover .shiny-cta-content {
  background: linear-gradient(135deg, #222 0%, #333 100%);
}

@keyframes shimmer-gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes shimmer-shine {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Modal transition */
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
