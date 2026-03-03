<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          @click="closeOnBackdrop ? $emit('close') : null"
        ></div>

        <!-- Modal Panel -->
        <Transition name="scale">
          <div
            v-if="show"
            class="relative bg-white rounded-xl shadow-2xl w-full flex flex-col overflow-hidden max-h-[90vh]"
            :class="maxWidthClass"
          >
            <!-- Header -->
            <div
              v-if="$slots.header || title"
              class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 flex-shrink-0"
            >
              <h3 class="text-lg font-semibold text-gray-800 tracking-tight">
                <slot name="header">{{ title }}</slot>
              </h3>
              <button
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
              >
                <SvgIcon name="x" :size="20" />
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-4 overflow-y-auto custom-scrollbar flex-1">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 z-10 flex-shrink-0"
            >
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";

const props = defineProps({
  show: { type: Boolean, required: true },
  title: { type: String, default: "" },
  maxWidth: { type: String, default: "lg" }, // sm, md, lg, xl, 2xl, full
  closeOnBackdrop: { type: Boolean, default: true },
});

const emit = defineEmits(["close"]);

const maxWidthClass = computed(() => {
  switch (props.maxWidth) {
    case "sm":
      return "max-w-sm";
    case "md":
      return "max-w-md";
    case "lg":
      return "max-w-lg";
    case "xl":
      return "max-w-xl";
    case "2xl":
      return "max-w-2xl";
    case "3xl":
      return "max-w-3xl";
    case "4xl":
      return "max-w-4xl";
    case "full":
      return "max-w-full m-4";
    default:
      return "max-w-lg";
  }
});

// Close on Escape key
const handleKeydown = (e) => {
  if (e.key === "Escape" && props.show) {
    emit("close");
  }
};

onMounted(() => document.addEventListener("keydown", handleKeydown));
onUnmounted(() => document.removeEventListener("keydown", handleKeydown));
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
