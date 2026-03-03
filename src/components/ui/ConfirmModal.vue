<template>
  <Modal :show="show" :max-width="maxWidth" @close="cancel">
    <template #header>
      <div class="flex items-center gap-2" :class="headerClass">
        <SvgIcon v-if="icon" :name="icon" :size="24" />
        <span>{{ title }}</span>
      </div>
    </template>

    <div class="py-2 text-gray-600">
      <p>{{ message }}</p>
    </div>

    <template #footer>
      <button
        type="button"
        class="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
        @click="cancel"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        class="px-4 py-2 text-white rounded-lg transition shadow-sm flex items-center gap-2"
        :class="confirmBtnClass"
        @click="confirm"
        :disabled="loading"
      >
        <div
          v-if="loading"
          class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
        ></div>
        {{ confirmText }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from "vue";
import Modal from "./Modal.vue";
import SvgIcon from "./SvgIcon.vue";

const props = defineProps({
  show: Boolean,
  title: { type: String, default: "Konfirmasi" },
  message: { type: String, default: "Apakah Anda yakin?" },
  confirmText: { type: String, default: "Ya, Lanjutkan" },
  cancelText: { type: String, default: "Batal" },
  type: { type: String, default: "primary" }, // primary, danger, warning, info
  loading: Boolean,
  maxWidth: { type: String, default: "md" },
});

const emit = defineEmits(["update:show", "confirm", "cancel"]);

const headerClass = computed(() => {
  switch (props.type) {
    case "danger":
      return "text-red-600";
    case "warning":
      return "text-amber-600";
    case "info":
      return "text-blue-600";
    default:
      return "text-primary";
  }
});

const confirmBtnClass = computed(() => {
  switch (props.type) {
    case "danger":
      return "bg-red-600 hover:bg-red-700";
    case "warning":
      return "bg-amber-500 hover:bg-amber-600";
    case "info":
      return "bg-blue-500 hover:bg-blue-600";
    default:
      return "bg-primary hover:bg-primary-dark";
  }
});

const icon = computed(() => {
  switch (props.type) {
    case "danger":
      return "alert-triangle"; // Make sure this icon exists or use generic
    case "warning":
      return "alert-circle";
    default:
      return "";
  }
});

const cancel = () => {
  emit("update:show", false);
  emit("cancel");
};

const confirm = () => {
  emit("confirm");
};
</script>
