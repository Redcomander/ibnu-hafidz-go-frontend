<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
        <h3 class="font-bold text-gray-800">
          Assign Guru Mapel ({{ type === 'formal' ? 'Formal' : 'Diniyyah' }})
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition">
          <SvgIcon name="x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Lesson Select -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
          <SearchableSelect 
            v-model="form.lesson_id" 
            :options="lessons"
            placeholder="Pilih Pelajaran"
          />
        </div>

        <!-- Teacher Select -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Guru Pengajar</label>
          <SearchableSelect 
            v-model="form.teacher_id" 
            :options="teachers"
            placeholder="Pilih Guru (Cari nama...)"
          />
          <p class="text-xs text-gray-500 mt-1">Pilih dari semua user terdaftar.</p>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" @click="$emit('close')" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition">
            Batal
          </button>
          <button 
            type="submit" 
            class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            :disabled="loading"
          >
            <span v-if="loading" class="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
            Simpan
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import SvgIcon from '@/components/ui/SvgIcon.vue';
import SearchableSelect from '@/components/ui/SearchableSelect.vue';
import api from '@/api';

const props = defineProps({
  classId: { type: [String, Number], required: true },
  type: { type: String, default: 'formal' }, // formal | diniyyah
  existingAssignments: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'submit']);

const loading = ref(false);
const lessons = ref([]);
const teachers = ref([]);

const form = ref({
  lesson_id: null,
  teacher_id: null
});

// Fetch options
onMounted(async () => {
  try {
    const [resHas, resTeachers] = await Promise.all([
      api.get('/lessons', { params: { type: props.type } }),
      api.get('/users?per_page=1000') 
    ]);
    
    // Map lessons to have 'name' property suitable for SearchableSelect
    lessons.value = (resHas.data || []).map(l => ({
        ...l,
        name: l.code ? `${l.name} (${l.code})` : l.name
    }));

    // Use all users, assuming backend returns { data: [...] } for paginated or [...] for list
    // UserHandler.List returns paginated structure { data: [], meta: ... }
    const usersData = resTeachers.data.data || resTeachers.data;
    teachers.value = usersData; 
    
  } catch (e) {
    console.error("Failed to load options", e);
  }
});

const handleSubmit = async () => {
    if (!form.value.lesson_id || !form.value.teacher_id) return;
    
    loading.value = true;
    try {
        emit('submit', { ...form.value, type: props.type });
    } finally {
        loading.value = false;
    }
};
</script>
