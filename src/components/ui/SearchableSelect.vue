<template>
  <div ref="container" class="relative">
    <button
      type="button"
      @click="toggle"
      class="input-field flex w-full items-center justify-between text-left cursor-pointer select-none"
      :class="[
        disabled ? 'cursor-not-allowed bg-gray-100 text-gray-400' : '',
        isOpen ? 'ring-2 ring-primary/20 border-primary' : ''
      ]"
      :disabled="disabled"
    >
      <span v-if="selectedOption" class="text-gray-800 truncate">{{ getLabel(selectedOption) }}</span>
      <span v-else class="text-gray-400 truncate">{{ placeholder }}</span>
      <SvgIcon
        name="chevron-down"
        :size="16"
        class="text-gray-400 transition-transform duration-200 shrink-0"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

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
          class="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-100 flex flex-col overflow-hidden"
          @click.stop
        >
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

          <div class="overflow-y-auto flex-1 custom-scrollbar" :style="listStyle">
            <button
              v-for="option in filteredOptions"
              :key="getValue(option)"
              type="button"
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

            <div v-if="filteredOptions.length === 0" class="p-4 text-center text-xs text-gray-400">
              Tidak ada data ditemukan
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import SvgIcon from '@/components/ui/SvgIcon.vue'

const props = defineProps({
  modelValue: [String, Number, null],
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Pilih...',
  },
  labelKey: {
    type: String,
    default: 'name',
  },
  valueKey: {
    type: String,
    default: 'id',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  searchDebounce: {
    type: Number,
    default: 250,
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const container = ref(null)
const dropdownRef = ref(null)
const searchInput = ref(null)
const dropdownStyle = ref({})
const listStyle = ref({ maxHeight: '240px' })
let searchDebounceTimer = null

function getLabel(opt) {
  if (!opt) return ''
  return opt[props.labelKey] || ''
}

function getValue(opt) {
  if (!opt) return null
  return opt[props.valueKey]
}

const selectedOption = computed(() => props.options.find((opt) => getValue(opt) === props.modelValue))

const filteredOptions = computed(() => {
  if (!debouncedSearchQuery.value) return props.options
  const query = debouncedSearchQuery.value.toLowerCase()
  return props.options.filter((opt) => String(getLabel(opt)).toLowerCase().includes(query))
})

function updatePosition() {
  if (!container.value) return

  const rect = container.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - rect.bottom - 12
  const spaceAbove = rect.top - 12
  const openUpward = spaceBelow < 260 && spaceAbove > spaceBelow
  const maxHeight = Math.max(160, Math.min(260, openUpward ? spaceAbove - 8 : spaceBelow - 8))

  dropdownStyle.value = {
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    ...(openUpward
      ? { bottom: `${viewportHeight - rect.top + 4}px` }
      : { top: `${rect.bottom + 4}px` }),
  }

  listStyle.value = {
    maxHeight: `${maxHeight}px`,
  }
}

function open() {
  if (props.disabled) return
  isOpen.value = true
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  updatePosition()
  nextTick(() => searchInput.value?.focus())
}

function close() {
  isOpen.value = false
}

function toggle() {
  if (isOpen.value) {
    close()
    return
  }
  open()
}

function select(option) {
  emit('update:modelValue', getValue(option))
  close()
}

function handleWindowClick(event) {
  if (!isOpen.value) return
  const clickedTrigger = container.value?.contains(event.target)
  const clickedDropdown = dropdownRef.value?.contains(event.target)
  if (!clickedTrigger && !clickedDropdown) {
    close()
  }
}

function handleViewportChange() {
  if (!isOpen.value) return
  updatePosition()
}

watch(() => props.disabled, (disabled) => {
  if (disabled) close()
})

watch(searchQuery, (value) => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = value
  }, props.searchDebounce)
})

watch(() => props.options, () => {
  if (isOpen.value) {
    nextTick(updatePosition)
  }
})

onMounted(() => {
  window.addEventListener('click', handleWindowClick)
  window.addEventListener('resize', handleViewportChange)
  window.addEventListener('scroll', handleViewportChange, true)
})

onUnmounted(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  window.removeEventListener('click', handleWindowClick)
  window.removeEventListener('resize', handleViewportChange)
  window.removeEventListener('scroll', handleViewportChange, true)
})
</script>
