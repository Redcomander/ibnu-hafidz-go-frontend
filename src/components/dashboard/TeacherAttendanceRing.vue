<template>
  <div class="relative flex items-center justify-center">
    <!-- SVG Ring -->
    <svg :width="size" :height="size" viewBox="0 0 100 100" class="transform -rotate-90">
      <!-- Background Circle -->
      <circle
        cx="50"
        cy="50"
        :r="radius"
        fill="transparent"
        :stroke="trackColor"
        :stroke-width="strokeWidth"
      />
      <!-- Progress Circle -->
      <circle
        cx="50"
        cy="50"
        :r="radius"
        fill="transparent"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="transition-all duration-1000 ease-out"
      />
    </svg>
    <!-- Center Content -->
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <span class="text-2xl font-bold text-gray-800">{{ Math.round(percentage) }}%</span>
      <span v-if="label" class="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  percentage: {
    type: Number,
    required: true,
    default: 0
  },
  size: {
    type: Number,
    default: 120
  },
  strokeWidth: {
    type: Number,
    default: 8
  },
  label: {
    type: String,
    default: ''
  }
})

// Calculate SVG properties
const radius = computed(() => 50 - props.strokeWidth / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value - (props.percentage / 100) * circumference.value)

// Dynamic Color based on percentage
const color = computed(() => {
  if (props.percentage >= 90) return '#10b981' // emerald-500
  if (props.percentage >= 75) return '#f59e0b' // amber-500
  if (props.percentage > 0) return '#3b82f6' // blue-500
  return '#e5e7eb' // gray-200 (for 0%)
})

const trackColor = computed(() => {
  if (props.percentage >= 90) return '#d1fae5' // emerald-100
  if (props.percentage >= 75) return '#fef3c7' // amber-100
  if (props.percentage > 0) return '#dbeafe' // blue-100
  return '#f3f4f6' // gray-100
})
</script>
