<template>
  <div class="relative" ref="container">
    <div class="relative">
      <input
        type="text"
        v-model="searchQuery"
        @focus="isOpen = true"
        @input="handleInput"
        class="input-field w-full !pl-10"
        :placeholder="placeholder"
      />
      <SvgIcon name="search" :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      
      <button 
        v-if="modelValue" 
        @click="clearSelection"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
      >
        <SvgIcon name="x" :size="16" />
      </button>
    </div>

    <!-- Dropdown -->
    <div v-if="isOpen" class="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
      <div v-if="loading" class="p-4 text-center text-gray-400 text-sm">
        Loading...
      </div>
      <div v-else-if="users.length === 0" class="p-4 text-center text-gray-400 text-sm">
        Tidak ditemukan users.
      </div>
      <div v-else>
        <button
          v-for="user in users"
          :key="user.id"
          @click="selectUser(user)"
          class="w-full text-left px-4 py-2 hover:bg-blue-50 transition border-b border-gray-50 last:border-0"
        >
          <div class="font-medium text-gray-800">{{ user.name }}</div>
          <div class="text-xs text-gray-500 flex gap-2">
            <span>{{ user.email }}</span>
            <span v-if="user.roles && user.roles.length" class="bg-gray-100 px-1 rounded">
                {{ user.roles.map(r => r.name).join(', ') }}
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import api from '@/api';
import SvgIcon from '@/components/ui/SvgIcon.vue';


// Simple debounce utility 
const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}; 

const props = defineProps({
  modelValue: [String, Number],
  placeholder: {
    type: String,
    default: 'Cari pengguna...'
  },
  initialLabel: String
});

const emit = defineEmits(['update:modelValue', 'select']);

const container = ref(null);
const isOpen = ref(false);
const searchQuery = ref('');
const users = ref([]);
const loading = ref(false);

// Initialize search query if label provided
watch(() => props.initialLabel, (val) => {
    if (val) searchQuery.value = val;
}, { immediate: true });

// Also distinct logic: if modelValue is cleared externally
watch(() => props.modelValue, (val) => {
    if (!val) {
        searchQuery.value = '';
    }
});

const fetchUsers = async (query = '') => {
    loading.value = true;
    try {
        const params = { page: 1, limit: 20 };
        if (query) params.search = query;
        
        const res = await api.get('/users', { params });
        users.value = res.data.data;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const debouncedFetch = debounce(fetchUsers, 300);

const handleInput = () => {
    isOpen.value = true;
    debouncedFetch(searchQuery.value);
};

const selectUser = (user) => {
    searchQuery.value = user.name;
    emit('update:modelValue', user.id);
    emit('select', user);
    isOpen.value = false;
};

const clearSelection = () => {
    searchQuery.value = '';
    emit('update:modelValue', null);
    emit('select', null);
    fetchUsers(''); // reset list
};

// Close on click outside
const handleClickOutside = (e) => {
    if (container.value && !container.value.contains(e.target)) {
        isOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    fetchUsers(); // Initial load
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>
