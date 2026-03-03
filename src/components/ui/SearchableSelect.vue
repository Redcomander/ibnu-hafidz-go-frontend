<template>
  <div class="relative" ref="container">
    <!-- Trigger -->
    <div
      @click="toggle"
      class="input-field flex items-center justify-between cursor-pointer select-none"
      :class="{ 'ring-2 ring-primary/20 border-primary': isOpen }"
    >
      <span v-if="selectedOption" class="text-gray-800 truncate">{{
        getLabel(selectedOption)
      }}</span>
      <span v-else class="text-gray-400">{{ placeholder }}</span>
      <SvgIcon
        name="chevron-down"
        :size="16"
        class="text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </div>

    <!-- Dropdown -->
    <Teleport to="body">
      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="isOpen"
          ref="dropdownRef"
          :style="dropdownStyle"
          @click.stop
          class="fixed z-[9999] mt-1 bg-white rounded-lg shadow-xl border border-gray-100 flex flex-col overflow-hidden"
        >
          <!-- Search Input -->
          <div class="p-2 border-b border-gray-50 sticky top-0 bg-white">
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              class="w-full px-3 py-1.5 text-sm bg-gray-50 rounded-md border-none focus:ring-1 focus:ring-primary focus:bg-white transition placeholder-gray-400 outline-none"
              placeholder="Cari..."
              @click.stop
            />
          </div>

          <!-- Options List -->
          <div class="overflow-y-auto flex-1 custom-scrollbar max-h-60">
            <button
              type="button"
              v-for="option in filteredOptions"
              :key="getValue(option)"
              @click="select(option)"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between group transition-colors"
              :class="{ 'bg-primary/5 text-primary': modelValue === getValue(option) }"
            >
              <span class="truncate">{{ getLabel(option) }}</span>
              <SvgIcon
                v-if="modelValue === getValue(option)"
                name="check"
                :size="16"
                class="text-primary"
              />
            </button>

            <div
              v-if="filteredOptions.length === 0"
              class="p-4 text-center text-xs text-gray-400"
            >
              Tidak ada data ditemukan
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";

const props = defineProps({
  modelValue: [String, Number, null],
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: "Pilih...",
  },
  labelKey: {
    type: String,
    default: "name",
  },
  valueKey: {
    type: String,
    default: "id",
  },
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = ref(false);
const searchQuery = ref("");
const container = ref(null);
const searchInput = ref(null);
const dropdownStyle = ref({});

function getLabel(opt) {
  if (!opt) return "";
  return opt[props.labelKey] || "";
}

function getValue(opt) {
  if (!opt) return null;
  return opt[props.valueKey];
}

const selectedOption = computed(() => {
  return props.options.find((opt) => getValue(opt) === props.modelValue);
});

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;
  const query = searchQuery.value.toLowerCase();
  return props.options.filter((opt) => String(getLabel(opt)).toLowerCase().includes(query));
});

function updatePosition() {
  if (container.value) {
    const rect = container.value.getBoundingClientRect();
    dropdownStyle.value = {
      top: `${rect.bottom}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    };
  }
}

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    updatePosition();
    searchQuery.value = "";
    nextTick(() => {
      searchInput.value?.focus();
    });
  }
}

function select(option) {
  emit("update:modelValue", getValue(option));
  isOpen.value = false;
}

function handleClickOutside(event) {
  if (container.value && !container.value.contains(event.target)) {
    // Check if click is inside the dropdown (which is teleported)
    // We can check if the target is inside the dropdown... wait.
    // Since dropdown is NOT child of container in DOM due to Teleport, 
    // container.contains(event.target) will be false for clicks in dropdown.
    // BUT, the dropdown itself stops propagation on click?
    // Let's add specific check for teleported content if possible, or just ignore clicks on dropdown elements?
    // Actually, Vue's event bubbling might handle it if components were nested, but Teleport breaks DOM hierarchy.
    // However, we rely on the input @click.stop to prevent bubbling to document?
    // No, we need to check if target is inside the dropdown.
    // Easy way: Check if target is inside the dropdown element using a ref on the dropdown?
    // I can add ref="dropdown" to the dropdown div.
  }
}

// Better Click Outside for Teleport
// We can use a custom directive or just check if event path includes container OR dropdown.
// But simpler:
// Use a transparent overlay? No.
// Let's track the dropdown ref.
const dropdownRef = ref(null); // I need to add this to the template div

// Updated handleClickOutside
function handleGlobalClick(event) {
  if (!isOpen.value) return;
  
  // Check if click is inside container (trigger)
  const isTrigger = container.value && container.value.contains(event.target);
  
  // Check if click is inside dropdown (teleported)
  // Since I haven't added ref yet, I'll rely on class or something?
  // Actually, I can add ref="dropdownContent" to the fixed div.
  // ... (I'll add it in template)
  // But wait, replace_file_content is replacing the template too.
  // I didn't add the ref in the replacement content above. 
  // I should add `ref="dropdownContent"` to the div.
  
  // Let's rely on event bubbling not reaching document if we stopProp on the dropdown?
  // Steps:
  // 1. Add @click.stop to the dropdown container.
  // 2. Document listener closes it.
  // 3. Trigger @click.stop too.
}
// Actually, simple solution:
// Just close on window scroll/resize?
// Re-calculating position on scroll is needed if we want it to stick?
// If we use `fixed`, it stays on screen. If user scrolls page, the input moves but dropdown stays? That's bad.
// Proper way: `absolute` relative to body? `rect.bottom + window.scrollY`.
// `fixed` is okay if we close on scroll.
// Let's use `fixed` and Close on Scroll.
// And close on Resize.

function close(e) {
  if (e && e.type === "scroll") {
    // Ignore if scrolling happens inside the dropdown itself
    if (e.target && dropdownRef.value && dropdownRef.value.contains(e.target)) {
      return;
    }
  }
  isOpen.value = false;
}

onMounted(() => {
  window.addEventListener("click", (e) => {
      if (container.value && !container.value.contains(e.target)) {
          // If we are clicking outside both container and dropdown (handled by @click.stop optionally)
          // actually dropdown is teleported, so it's not in container.
          // But dropdown has @click.stop which prevents it reaching window click handler.
          // so this is enough to close it.
          isOpen.value = false;
      }
  });
  window.addEventListener("resize", close);
  window.addEventListener("scroll", close, true); // Capture phase to catch all scrolls
});

onUnmounted(() => {
   // ... remove listeners
  window.removeEventListener("resize", close);
  window.removeEventListener("scroll", close, true);
});
</script>
