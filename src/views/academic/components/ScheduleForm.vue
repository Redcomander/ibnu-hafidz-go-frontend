<template>
  <Modal :show="show" :title="title" @close="$emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-4">

      <!-- Step 1: Select Kelas -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
        <SearchableSelect
          v-model="selectedClassId"
          :options="kelasOptions"
          placeholder="Pilih Kelas terlebih dahulu..."
          :disabled="loadingKelas"
        />
        <p v-if="loadingKelas" class="text-xs text-gray-500 mt-1">Memuat daftar kelas...</p>
      </div>

      <!-- Step 2: Select Assignment (Mapel & Guru) — only after kelas selected -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran & Guru</label>
        <SearchableSelect
          v-model="form.assignment_id"
          :options="assignmentOptions"
          :placeholder="!selectedClassId ? 'Pilih kelas dulu...' : 'Pilih Mapel & Guru...'"
          :disabled="!selectedClassId || loadingAssignments"
        />
        <p v-if="loadingAssignments" class="text-xs text-gray-500 mt-1">Memuat daftar pelajaran...</p>
        <p v-if="selectedClassId && !loadingAssignments && assignmentOptions.length === 0" class="text-xs text-red-500 mt-1">
          Tidak ada pelajaran yang tersedia untuk kelas ini. Silakan assign guru terlebih dahulu di menu Pelajaran atau Kelas.
        </p>
      </div>

      <!-- Day Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Hari</label>
        <select v-model="form.day" class="input-field" required>
          <option value="" disabled>Pilih Hari</option>
          <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>

      <!-- Time Range -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
          <select v-model="form.start_time" class="input-field" required>
            <option value="" disabled>Pilih Jam Mulai</option>
            <option v-for="time in timeOptions" :key="'s'+time" :value="time">{{ time }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
          <select v-model="form.end_time" class="input-field" required>
            <option value="" disabled>Pilih Jam Selesai</option>
            <option v-for="time in timeOptions" :key="'e'+time" :value="time">{{ time }}</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end pt-4">
        <button type="button" @click="$emit('close')" class="btn-secondary mr-2">Batal</button>
        <button type="submit" class="btn-primary" :disabled="loading || !form.assignment_id || !form.day || !form.start_time || !form.end_time">
          {{ loading ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Modal from '@/components/ui/Modal.vue';
import SearchableSelect from '@/components/ui/SearchableSelect.vue';
import { useLessonTeacherStore } from '@/stores/lessonTeacher';
import api from '@/api';

const props = defineProps({
  show: Boolean,
  schedule: Object,    // If editing
  classId: [String, Number], // Optional pre-selected classId
  type: { type: String, default: 'formal' },
  loading: Boolean
});

const emit = defineEmits(['close', 'submit']);
const ltStore = useLessonTeacherStore();

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

// More comprehensive time options
const timeOptions = [
  '06:00', '06:15', '06:30', '06:45',
  '07:00', '07:15', '07:30', '07:45',
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45',
  '17:00',
];

// ── State ──
const loadingKelas = ref(false);
const loadingAssignments = ref(false);
const kelasList = ref([]);
const selectedClassId = ref(null);

const form = ref({
  assignment_id: null,
  day: 'Senin',
  start_time: '',
  end_time: ''
});

const title = computed(() => props.schedule ? 'Edit Jadwal' : 'Tambah Jadwal');

// ── Kelas options: id + display label ──
const kelasOptions = computed(() =>
  kelasList.value.map(k => ({
    id: k.id,
    name: `${k.tingkat || ''} ${k.nama || ''}`.trim() + (k.gender ? ` · ${k.gender}` : '')
  }))
);

// ── Fetch Kelas list when the modal opens ──
const fetchKelas = async () => {
  loadingKelas.value = true;
  try {
    const response = await api.get('/kelas', { params: { per_page: 200 } });
    // The API returns either { data: [...] } or directly [...]
    kelasList.value = response.data?.data || response.data || [];
  } catch (e) {
    console.error('Failed to fetch kelas:', e);
    kelasList.value = [];
  } finally {
    loadingKelas.value = false;
  }
};

// ── Fetch assignments when kelas is selected ──
const fetchAssignments = async (classId) => {
  if (!classId) {
    ltStore.assignments = [];
    return;
  }
  loadingAssignments.value = true;
  try {
    await ltStore.fetchAssignments(classId, props.type);
  } finally {
    loadingAssignments.value = false;
  }
};

// ── Assignment options ──
const assignmentOptions = computed(() =>
  ltStore.assignments.map(a => {
    const lessonName = a.lesson?.name || a.diniyyah_lesson?.name || 'Unknown Lesson';
    const teacherName = a.teacher?.name || a.user?.name || 'Unknown Teacher';
    return { id: a.id, name: `${lessonName} — ${teacherName}` };
  })
);

// ── When selectedClassId changes, fetch assignments ──
watch(selectedClassId, (newVal) => {
  form.value.assignment_id = null; // Reset assignment
  fetchAssignments(newVal);
});

// ── When modal opens: fetch kelas + populate form if editing ──
watch(() => props.show, (isShow) => {
  if (isShow) {
    fetchKelas();

    if (props.schedule) {
      // Editing: pre-populate
      selectedClassId.value = props.schedule.assignment?.kelas?.id || props.classId || null;
      form.value = {
        assignment_id: props.type === 'diniyyah' ? props.schedule.diniyyah_lesson_teacher_id : props.schedule.lesson_teacher_id,
        day: props.schedule.day,
        start_time: props.schedule.start_time?.substring(0, 5),
        end_time: props.schedule.end_time?.substring(0, 5)
      };
    } else {
      // Creating: reset everything
      selectedClassId.value = props.classId || null;
      form.value = { assignment_id: null, day: 'Senin', start_time: '', end_time: '' };
      ltStore.assignments = [];
    }
  }
});

const handleSubmit = () => {
  emit('submit', form.value);
};
</script>
