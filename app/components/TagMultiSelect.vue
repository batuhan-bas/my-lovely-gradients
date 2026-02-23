<script setup lang="ts">
type Option = { label: string; value: string };

const props = defineProps<{
  options: string[];
  modelValue: string[];
  placeholder?: string;
  isDark?: boolean;
}>();

const emit = defineEmits<{ (e: "update:modelValue", v: string[]): void }>();
const open = ref(false);
const root = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);
const term = ref("");

const normalized = computed<Option[]>(() =>
  (props.options ?? []).map((o) => ({ label: o, value: o })),
);

const filtered = computed<Option[]>(() => {
  const t = term.value.trim().toLowerCase();
  const out = normalized.value.filter(
    (x) => !props.modelValue.includes(x.value) && (t === "" || x.label.toLowerCase().includes(t)),
  );
  return out.sort((a, b) => a.label.localeCompare(b.label));
});

function toggleOpen() {
  open.value = !open.value;
  if (open.value) nextTick(() => inputEl.value?.focus());
}
function close() {
  open.value = false;
}

function add(val: string) {
  if (!props.modelValue.includes(val)) {
    emit("update:modelValue", [...props.modelValue, val]);
  }
  term.value = "";
  nextTick(() => inputEl.value?.focus());
}
function remove(val: string) {
  emit(
    "update:modelValue",
    props.modelValue.filter((v) => v !== val),
  );
  nextTick(() => inputEl.value?.focus());
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    const first = filtered.value[0];
    if (first) add(first.value);
  } else if (e.key === "Backspace" && term.value === "") {
    const idx = props.modelValue.length - 1;
    if (idx >= 0) {
      const last = props.modelValue[idx];
      if (last !== undefined) remove(last);
    }
  } else if (e.key === "Escape") {
    close();
  }
}

function onDocClick(ev: MouseEvent) {
  if (!root.value) return;
  if (!root.value.contains(ev.target as Node)) close();
}
onMounted(() => document.addEventListener("mousedown", onDocClick));
onBeforeUnmount(() => document.removeEventListener("mousedown", onDocClick));
</script>

<template>
  <div ref="root" class="relative">
    <!-- Trigger -->
    <button
      type="button"
      class="h-12 w-full rounded-xl pl-12 pr-4 flex items-center justify-between gap-2 transition-colors duration-300 relative"
      :class="
        isDark
          ? 'bg-[#1a1a1a] ring-1 ring-white/10 text-white hover:ring-white/20'
          : 'bg-white ring-1 ring-gray-200 text-gray-900 hover:ring-gray-300 shadow-sm'
      "
      @click="toggleOpen"
    >
      <!-- Tag icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors"
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
      <span v-if="modelValue.length === 0" :class="isDark ? 'text-white/40' : 'text-gray-400'">
        {{ placeholder ?? "Select tags..." }}
      </span>
      <span v-else :class="isDark ? 'text-white/70' : 'text-gray-700'" class="truncate">
        {{ modelValue.join(", ") }}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 shrink-0 transition-colors"
        :class="isDark ? 'text-white/40' : 'text-gray-400'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <!-- Dropdown -->
    <div
      v-show="open"
      class="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded-lg p-2 transition-colors duration-300"
      :class="
        isDark ? 'bg-[#1a1a1a] ring-1 ring-white/10' : 'bg-white ring-1 ring-gray-200 shadow-lg'
      "
    >
      <!-- Search input -->
      <input
        ref="inputEl"
        v-model="term"
        placeholder="Ara..."
        class="w-full h-9 px-3 mb-2 rounded-md outline-none text-sm transition-colors"
        :class="
          isDark
            ? 'bg-white/5 ring-1 ring-white/10 placeholder-white/40 text-white'
            : 'bg-gray-100 ring-1 ring-gray-200 placeholder-gray-400 text-gray-900'
        "
        @keydown="onKeydown"
        @click.stop
      />

      <!-- Selected chips -->
      <div
        v-if="modelValue.length"
        class="flex flex-wrap gap-1 mb-2 pb-2 border-b"
        :class="isDark ? 'border-white/10' : 'border-gray-200'"
      >
        <button
          v-for="t in modelValue"
          :key="t"
          class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors"
          :class="
            isDark
              ? 'bg-white/10 text-white/80 hover:bg-white/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          "
          @click.stop="remove(t)"
        >
          {{ t }}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <template v-if="filtered.length > 0">
        <button
          v-for="opt in filtered"
          :key="opt.value"
          class="w-full text-left text-sm px-3 py-2 rounded-md transition-colors"
          :class="isDark ? 'text-white/70 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'"
          @click.stop="add(opt.value)"
        >
          {{ opt.label }}
        </button>
      </template>
      <div v-else class="px-3 py-2 text-sm" :class="isDark ? 'text-white/40' : 'text-gray-400'">
        Sonuc bulunamadi
      </div>
    </div>
  </div>
</template>
