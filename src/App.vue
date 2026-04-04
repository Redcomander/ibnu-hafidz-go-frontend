<template>
  <router-view v-slot="{ Component }">
    <transition name="page">
      <component :is="Component" />
    </transition>
  </router-view>

  <!-- Toast Notifications -->
  <Teleport to="body">
    <div
      v-if="toast.visible"
      :class="
        toast.type === 'success'
          ? 'toast-success'
          : toast.type === 'error'
            ? 'toast-error'
            : 'toast-info'
      "
    >
      <div class="flex items-center gap-3">
        <span class="text-lg">{{
          toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"
        }}</span>
        <p class="text-sm font-medium">{{ toast.message }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from "@/stores/toast";
import { storeToRefs } from "pinia";

const toastStore = useToastStore();
const { toast } = storeToRefs(toastStore);
</script>
