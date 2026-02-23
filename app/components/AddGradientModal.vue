<script setup lang="ts">
import type { Gradient } from "~/stores/gradients";
import { useGradients } from "~/stores/gradients";

const props = defineProps<{
  open: boolean;
  isDark?: boolean;
  editGradient?: Gradient | null;
}>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "created"): void;
  (e: "updated"): void;
}>();
const { t } = useI18n();
const store = useGradients();
const user = useSupabaseUser();

const isEditMode = computed(() => !!props.editGradient);
const submitting = ref(false);
const submitError = ref("");

// Toast state
const showToast = ref(false);
const toastMessage = ref("");

// Form state
const name = ref("");
const desc = ref("");
const colors = ref<string[]>(["#667eea", "#764ba2"]);
const angle = ref(135);
const selectedTags = ref<string[]>([]);
const customTag = ref("");

// Color management
const MAX_COLORS = 6;
const MIN_COLORS = 2;

function addColor() {
  if (colors.value.length < MAX_COLORS) {
    // Generate a random color or use a default
    const lastColor = colors.value[colors.value.length - 1] || "#ffffff";
    colors.value.push(lastColor);
  }
}

function removeColor(index: number) {
  if (colors.value.length > MIN_COLORS) {
    colors.value.splice(index, 1);
  }
}

function updateColor(index: number, value: string) {
  colors.value[index] = value;
}

// Existing tags from store
const existingTags = computed(() => {
  const set = new Set<string>();
  for (const g of store.items) {
    for (const t of g.tags) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
});

// Available tags (not yet selected)
const availableTags = computed(() =>
  existingTags.value.filter((t) => !selectedTags.value.includes(t)),
);

// Live preview gradient
const previewGradient = computed(() => {
  const stops = colors.value
    .map((color, i) => {
      const percent = Math.round((i / (colors.value.length - 1)) * 100);
      return `${color} ${percent}%`;
    })
    .join(", ");
  return `linear-gradient(${angle.value}deg, ${stops})`;
});

// Add custom tag
function addCustomTag() {
  const tag = customTag.value.trim().toLowerCase();
  if (tag && !selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag);
    customTag.value = "";
  }
}

// Add existing tag
function addTag(tag: string) {
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag);
  }
}

// Remove tag
function removeTag(tag: string) {
  selectedTags.value = selectedTags.value.filter((t) => t !== tag);
}

// Form validation
const isValid = computed(() => {
  return name.value.trim().length > 0 && selectedTags.value.length > 0 && !!user.value;
});

// Pre-fill form when editing
watch(
  () => props.editGradient,
  (gradient) => {
    if (gradient) {
      name.value = gradient.name;
      desc.value = gradient.desc;
      colors.value = [...gradient.colors];
      angle.value = gradient.angle;
      selectedTags.value = [...gradient.tags];
    }
  },
  { immediate: true },
);

// Submit
async function submit() {
  if (!isValid.value || submitting.value) return;

  submitting.value = true;
  submitError.value = "";

  const input = {
    name: name.value.trim(),
    desc: desc.value.trim() || `${name.value} gradient`,
    tags: [...selectedTags.value],
    angle: angle.value,
    colors: [...colors.value],
  };

  if (isEditMode.value && props.editGradient) {
    const success = await store.updateGradient(props.editGradient.id, input);
    if (success) {
      resetForm();
      emit("updated");
      emit("close");
      // Show toast
      toastMessage.value = t("gradientModal.toast.updated");
      showToast.value = true;
      setTimeout(() => {
        showToast.value = false;
      }, 2000);
    } else {
      submitError.value = store.error || t("gradientModal.errors.updateFailed");
    }
  } else {
    const created = await store.createGradient(input);
    if (created) {
      resetForm();
      emit("created");
      emit("close");
      // Show toast
      toastMessage.value = t("gradientModal.toast.created");
      showToast.value = true;
      setTimeout(() => {
        showToast.value = false;
      }, 2000);
    } else {
      submitError.value = store.error || t("gradientModal.errors.createFailed");
    }
  }

  submitting.value = false;
}

// Reset form
function resetForm() {
  name.value = "";
  desc.value = "";
  colors.value = ["#667eea", "#764ba2"];
  angle.value = 135;
  selectedTags.value = [];
  customTag.value = "";
  submitError.value = "";
}

// Close modal
function close() {
  resetForm();
  emit("close");
}

// Close on escape
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") close();
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close"></div>

        <!-- Modal -->
        <div
          class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 transition-colors duration-300"
          :class="isDark ? 'bg-[#1a1a1a]' : 'bg-white shadow-2xl'"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ isEditMode ? t("gradientModal.editTitle") : t("gradientModal.createTitle") }}
            </h2>
            <button
              class="p-2 rounded-lg transition-colors"
              :class="
                isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-500'
              "
              @click="close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Error Alert -->
          <div
            v-if="submitError"
            class="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm"
          >
            {{ submitError }}
          </div>

          <!-- Not logged in warning -->
          <div
            v-if="!user"
            class="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm"
            :class="isDark ? 'text-yellow-400' : 'text-yellow-600'"
          >
            {{ t("gradientModal.loginRequired") }}
            <NuxtLink to="/login" class="underline font-medium">{{ t("common.login") }}</NuxtLink>
          </div>

          <!-- Live Preview -->
          <div
            class="h-40 rounded-xl mb-6 ring-1 transition-all duration-300"
            :class="isDark ? 'ring-white/10' : 'ring-gray-200'"
            :style="{ background: previewGradient }"
          ></div>

          <!-- Form -->
          <div class="space-y-5">
            <!-- Name -->
            <div>
              <label
                class="block text-sm font-medium mb-2"
                :class="isDark ? 'text-white/70' : 'text-gray-700'"
              >
                {{ t("gradientModal.fields.name") }} *
              </label>
              <div class="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  :class="isDark ? 'text-white/40' : 'text-gray-400'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
                </svg>
                <input
                  v-model="name"
                  type="text"
                  :placeholder="t('gradientModal.fields.namePlaceholder')"
                  class="w-full h-11 pl-12 pr-4 rounded-lg outline-none transition-colors"
                  :class="
                    isDark
                      ? 'bg-white/5 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-white/20'
                      : 'bg-gray-100 ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-300'
                  "
                />
              </div>
            </div>

            <!-- Description -->
            <div>
              <label
                class="block text-sm font-medium mb-2"
                :class="isDark ? 'text-white/70' : 'text-gray-700'"
              >
                {{ t("gradientModal.fields.description") }}
              </label>
              <div class="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="absolute left-4 top-4 w-5 h-5"
                  :class="isDark ? 'text-white/40' : 'text-gray-400'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M17 6.1H3" />
                  <path d="M21 12.1H3" />
                  <path d="M15.1 18H3" />
                </svg>
                <textarea
                  v-model="desc"
                  rows="2"
                  :placeholder="t('gradientModal.fields.descriptionPlaceholder')"
                  class="w-full pl-12 pr-4 py-3 rounded-lg outline-none resize-none transition-colors"
                  :class="
                    isDark
                      ? 'bg-white/5 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-white/20'
                      : 'bg-gray-100 ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-300'
                  "
                ></textarea>
              </div>
            </div>

            <!-- Colors -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label
                  class="block text-sm font-medium"
                  :class="isDark ? 'text-white/70' : 'text-gray-700'"
                >
                  {{ t("gradientModal.fields.colors") }} ({{ colors.length }}/{{ MAX_COLORS }})
                </label>
                <button
                  v-if="colors.length < MAX_COLORS"
                  type="button"
                  class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  :class="
                    isDark
                      ? 'bg-white/5 text-white/70 hover:bg-white/10'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  "
                  @click="addColor"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {{ t("gradientModal.fields.addColor") }}
                </button>
              </div>

              <div class="space-y-3">
                <div v-for="(color, index) in colors" :key="index" class="flex items-center gap-3">
                  <!-- Color picker -->
                  <div
                    class="relative w-12 h-12 rounded-lg overflow-hidden ring-1 cursor-pointer shrink-0"
                    :class="isDark ? 'ring-white/10' : 'ring-gray-200'"
                  >
                    <input
                      :value="color"
                      type="color"
                      class="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                      @input="updateColor(index, ($event.target as HTMLInputElement).value)"
                    />
                    <div class="w-full h-full" :style="{ backgroundColor: color }"></div>
                  </div>

                  <!-- Hex input -->
                  <input
                    :value="color"
                    type="text"
                    class="flex-1 h-11 px-3 rounded-lg font-mono text-sm uppercase outline-none transition-colors"
                    :class="
                      isDark
                        ? 'bg-white/5 ring-1 ring-white/10 text-white focus:ring-white/20'
                        : 'bg-gray-100 ring-1 ring-gray-200 text-gray-900 focus:ring-gray-300'
                    "
                    @input="updateColor(index, ($event.target as HTMLInputElement).value)"
                  />

                  <!-- Color label -->
                  <span
                    class="text-xs w-16 text-center shrink-0"
                    :class="isDark ? 'text-white/40' : 'text-gray-400'"
                  >
                    {{
                      index === 0
                        ? t("gradientModal.fields.colorStart")
                        : index === colors.length - 1
                          ? t("gradientModal.fields.colorEnd")
                          : t("gradientModal.fields.colorN", { n: index + 1 })
                    }}
                  </span>

                  <!-- Remove button -->
                  <button
                    v-if="colors.length > MIN_COLORS"
                    type="button"
                    class="p-2 rounded-lg transition-colors shrink-0"
                    :class="
                      isDark
                        ? 'text-white/40 hover:text-red-400 hover:bg-red-500/10'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    "
                    @click="removeColor(index)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                  <div v-else class="w-8 shrink-0"></div>
                </div>
              </div>
            </div>

            <!-- Angle -->
            <div>
              <label
                class="block text-sm font-medium mb-2"
                :class="isDark ? 'text-white/70' : 'text-gray-700'"
              >
                {{ t("gradientModal.fields.angle") }}: {{ angle }}°
              </label>
              <div class="flex items-center gap-4">
                <input
                  v-model.number="angle"
                  type="range"
                  min="0"
                  max="360"
                  class="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-orange-500"
                  :class="isDark ? 'bg-white/10' : 'bg-gray-200'"
                />
                <div class="flex gap-1">
                  <button
                    v-for="a in [0, 45, 90, 135, 180]"
                    :key="a"
                    class="px-2 py-1 text-xs rounded-md transition-colors"
                    :class="
                      angle === a
                        ? 'bg-orange-500 text-white'
                        : isDark
                          ? 'bg-white/5 text-white/60 hover:bg-white/10'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    "
                    @click="angle = a"
                  >
                    {{ a }}°
                  </button>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div>
              <label
                class="block text-sm font-medium mb-2"
                :class="isDark ? 'text-white/70' : 'text-gray-700'"
              >
                {{ t("gradientModal.fields.tags") }} *
              </label>

              <!-- Selected tags -->
              <div v-if="selectedTags.length" class="flex flex-wrap gap-1.5 mb-3">
                <button
                  v-for="tag in selectedTags"
                  :key="tag"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors"
                  :class="
                    isDark
                      ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                      : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                  "
                  @click="removeTag(tag)"
                >
                  {{ tag }}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Custom tag input -->
              <div class="flex gap-2 mb-3">
                <div class="relative flex-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    :class="isDark ? 'text-white/40' : 'text-gray-400'"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"
                    />
                    <path d="M7 7h.01" />
                  </svg>
                  <input
                    v-model="customTag"
                    type="text"
                    :placeholder="t('gradientModal.fields.addTag')"
                    class="w-full h-10 pl-9 pr-3 rounded-lg text-sm outline-none transition-colors"
                    :class="
                      isDark
                        ? 'bg-white/5 ring-1 ring-white/10 text-white placeholder-white/40 focus:ring-white/20'
                        : 'bg-gray-100 ring-1 ring-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-300'
                    "
                    @keydown.enter.prevent="addCustomTag"
                  />
                </div>
                <button
                  class="px-4 h-10 rounded-lg text-sm font-medium transition-colors"
                  :class="
                    isDark
                      ? 'bg-white/5 text-white/70 hover:bg-white/10'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  "
                  @click="addCustomTag"
                >
                  {{ t("common.add") }}
                </button>
              </div>

              <!-- Available tags -->
              <div v-if="availableTags.length" class="flex flex-wrap gap-1.5">
                <button
                  v-for="tag in availableTags"
                  :key="tag"
                  class="px-2.5 py-1 text-xs rounded-md ring-1 transition-colors"
                  :class="
                    isDark
                      ? 'bg-white/5 text-white/60 ring-white/10 hover:bg-white/10'
                      : 'bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100'
                  "
                  @click="addTag(tag)"
                >
                  + {{ tag }}
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-end gap-3 mt-8 pt-6 border-t"
            :class="isDark ? 'border-white/10' : 'border-gray-200'"
          >
            <button
              class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              :class="isDark ? 'text-white/70 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'"
              @click="close"
            >
              {{ t("common.cancel") }}
            </button>
            <button
              class="shiny-cta"
              :class="{ 'shiny-cta-disabled': !isValid || submitting }"
              :disabled="!isValid || submitting"
              @click="submit"
            >
              <span class="shiny-cta-content">
                <template v-if="submitting">
                  <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
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
                  {{
                    isEditMode
                      ? t("gradientModal.buttons.updating")
                      : t("gradientModal.buttons.creating")
                  }}
                </template>
                <template v-else>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path v-if="isEditMode" d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path v-else d="M12 5v14M5 12h14" />
                  </svg>
                  {{
                    isEditMode
                      ? t("gradientModal.buttons.update")
                      : t("gradientModal.buttons.create")
                  }}
                </template>
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Success Toast -->
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="showToast"
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
        {{ toastMessage }}
      </div>
    </Transition>
  </Teleport>
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

/* Custom range slider */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #f97316;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #f97316;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

/* Shiny CTA Button */
.shiny-cta {
  --shimmer-speed: 2.5s;
  --shimmer-hue: 30;
  position: relative;
  padding: 3px;
  border-radius: 12px;
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
    0 0 15px hsla(var(--shimmer-hue), 100%, 60%, 0.4),
    0 0 30px hsla(var(--shimmer-hue), 100%, 60%, 0.2);
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
    0 0 25px hsla(var(--shimmer-hue), 100%, 60%, 0.6),
    0 0 50px hsla(var(--shimmer-hue), 100%, 60%, 0.3);
}

.shiny-cta:active {
  transform: translateY(0) scale(0.98);
}

.shiny-cta-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 9px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.shiny-cta:hover .shiny-cta-content {
  background: linear-gradient(135deg, #222 0%, #333 100%);
}

.shiny-cta-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  animation: none;
  box-shadow: none;
}

.shiny-cta-disabled::before {
  animation: none;
  opacity: 0;
}

.shiny-cta-disabled:hover {
  transform: none;
  box-shadow: none;
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

@media (prefers-reduced-motion: reduce) {
  .shiny-cta,
  .shiny-cta::before {
    animation: none;
  }
}

/* Toast transition */
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
