<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <div
        class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 text-white rounded-t-xl">
          <h3 class="text-lg font-bold">
            {{ isEditing ? 'Edit Penugasan Halaqoh' : 'Tambah Penugasan Halaqoh' }}
          </h3>
          <p class="text-emerald-100 text-sm mt-0.5">
            {{ isEditing ? 'Ubah guru atau santri yang ditugaskan' : 'Pilih guru dan santri' }}
          </p>
        </div>

        <form @submit.prevent="save" class="p-6 space-y-5">
          <!-- Teacher Select -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Guru Pengampu</label>
            <select v-model="form.user_id" class="input-field" required>
              <option value="">-- Pilih Guru --</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">
                {{ t.name }}
              </option>
            </select>
          </div>

          <!-- Helper Teacher (optional) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Guru Pembantu
              <span class="text-gray-400 font-normal">(opsional)</span>
            </label>
            <select v-model="form.helper_teacher_id" class="input-field">
              <option :value="null">-- Tidak Ada --</option>
              <option
                v-for="t in teachers.filter(t => t.id !== form.user_id)"
                :key="t.id"
                :value="t.id"
              >
                {{ t.name }}
              </option>
            </select>
          </div>

          <!-- Student Multi-select -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Santri ({{ form.student_ids.length }} dipilih)
            </label>
            <input
              v-model="studentSearch"
              type="text"
              placeholder="Cari santri..."
              class="input-field mb-2"
            />
            <div
              class="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-50"
            >
              <label
                v-for="s in filteredStudents"
                :key="s.id"
                class="flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  :value="s.id"
                  v-model="form.student_ids"
                  class="w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-400"
                />
                <span class="text-sm text-gray-700">{{ s.nama_lengkap || s.name }}</span>
                <span
                  v-if="isAssigned(s.id)"
                  class="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full ml-auto"
                >
                  Sudah ditugaskan
                </span>
              </label>
              <p v-if="!filteredStudents.length" class="text-center text-gray-400 text-sm py-4">
                Tidak ada santri ditemukan
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="$emit('close')"
              class="flex-1 px-4 py-2.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="saving || !form.user_id || !form.student_ids.length"
              class="flex-1 px-4 py-2.5 text-sm rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ saving ? 'Menyimpan...' : isEditing ? 'Perbarui' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHalaqohStore } from '@/stores/halaqoh'
import { useToastStore } from '@/stores/toast'
import api from '@/api'

const props = defineProps({
  editingGroup: { type: Object, default: null },
})
const emit = defineEmits(['close', 'saved'])

const store = useHalaqohStore()
const toast = useToastStore()

const isEditing = computed(() => !!props.editingGroup)

const teachers = ref([])
const allStudents = ref([])
const assignedStudentIds = ref(new Set())
const studentSearch = ref('')
const saving = ref(false)

const form = ref({
  user_id: '',
  student_ids: [],
  helper_teacher_id: null,
})

const filteredStudents = computed(() => {
  const q = studentSearch.value.toLowerCase()
  return allStudents.value.filter(
    (s) => (s.nama_lengkap || s.name || '').toLowerCase().includes(q)
  )
})

function isAssigned(studentId) {
  return assignedStudentIds.value.has(studentId) && !form.value.student_ids.includes(studentId)
}

onMounted(async () => {
  // Fetch teachers + students
  try {
    const [t, s] = await Promise.all([
      api.get('/users', { params: { per_page: 999 } }),
      api.get('/students', { params: { per_page: 999 } }),
    ])
    teachers.value = t.data.data || t.data || []
    allStudents.value = s.data.data || s.data || []

    // Build assigned set from all groups
    for (const g of store.groups || []) {
      for (const a of g.assignments || []) {
        assignedStudentIds.value.add(a.student_id)
      }
    }

    // Pre-fill if editing
    if (props.editingGroup) {
      form.value.user_id = props.editingGroup.teacher_id
      form.value.student_ids = props.editingGroup.assignments.map((a) => a.student_id)
      // Find helper from first assignment
      const first = props.editingGroup.assignments[0]
      form.value.helper_teacher_id = first?.helper_teacher_id || null
    }
  } catch {
    toast.error('Gagal memuat data guru/santri')
  }
})

async function save() {
  saving.value = true
  try {
    if (isEditing.value) {
      await store.updateAssignment(props.editingGroup.teacher_id, form.value)
      toast.success('Penugasan berhasil diperbarui')
    } else {
      await store.createAssignment(form.value)
      toast.success('Penugasan berhasil dibuat')
    }
    emit('saved')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Gagal menyimpan')
  } finally {
    saving.value = false
  }
}
</script>
