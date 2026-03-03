<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">{{ title }}</h1>
        <p class="text-gray-500 text-sm mt-1">
          Laundry transactions under construction
        </p>
      </div>
    </div>

    <div
      class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center"
    >
      <div
        class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <SvgIcon name="trending-up" :size="32" class="text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Segera Hadir</h3>
      <p class="text-gray-500 max-w-md mx-auto">
        Fitur ini sedang dalam pengembangan. Silakan kembali lagi nanti.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import SvgIcon from "@/components/ui/SvgIcon.vue";

const route = useRoute();
const title = computed(() => route.meta.title || "Page");
</script>
