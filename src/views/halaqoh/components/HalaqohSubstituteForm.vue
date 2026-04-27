<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <div
        class="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 text-white rounded-t-xl">
          <h3 class="text-lg font-bold">Guru Pengganti</h3>
          <p class="text-amber-100 text-sm">
            {{ group.teacher_name }}
          </p>
        </div>

        <form @submit.prevent="save" class="p-6 space-y-5">
          <!-- Substitute Teacher -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Guru Pengganti</label>
            <SearchableSelect
              v-model="form.substitute_teacher_id"
              :options="teachers"
              placeholder="-- Pilih Guru --"
              label-key="name"
              value-key="id"
              :search-debounce="300"
            />
          </div>

          <!-- Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Tanggal</label>
            <input v-model="form.substitute_date" type="date" class="input-field" required />
          </div>

          <!-- Sessions -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Sesi</label>
            <div class="flex gap-3">
              <label
                v-for="sess in sessions"
                :key="sess"
                :class="[
                  'flex-1 text-center text-sm font-medium py-2.5 rounded-lg border cursor-pointer transition-all',
                  form.sessions.includes(sess)
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300',
                ]"
              >
                <input
                  type="checkbox"
                  :value="sess"
                  v-model="form.sessions"
                  class="sr-only"
                />
                {{ sess }}
              </label>
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select v-model="form.substitute_status" class="input-field">
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
              <option value="Alpha">Alpha</option>
            </select>
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Alasan</label>
            <textarea
              v-model="form.substitute_reason"
              rows="2"
              placeholder="Alasan penggantian..."
              class="input-field text-sm"
            ></textarea>
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
              :disabled="saving || !form.substitute_teacher_id || !form.sessions.length"
              class="flex-1 px-4 py-2.5 text-sm rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-medium disabled:opacity-50"
            >
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHalaqohStore } from '@/stores/halaqoh'
import { useToastStore } from '@/stores/toast'
import api from '@/api'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'

const props = defineProps({
  group: { type: Object, required: true },
  date: { type: String, required: true },
})
const emit = defineEmits(['close', 'saved'])

const store = useHalaqohStore()
const toast = useToastStore()

const sessions = ['Shubuh', 'Ashar', 'Isya']
const teachers = ref([])
const saving = ref(false)

const form = ref({
  substitute_teacher_id: '',
  substitute_date: props.date,
  sessions: [],
  substitute_status: 'Izin',
  substitute_reason: '',
})

onMounted(async () => {
  try {
    const collected = []
    let page = 1
    const perPage = 100

    // Reuse the same endpoint used by formal/diniyyah substitute picker.
    while (true) {
      const { data } = await api.get('/attendance/assignable-teachers', {
        params: { page, per_page: perPage },
      })

      const rows = data?.data || []
      collected.push(...rows)

      if (rows.length < perPage) break
      page += 1
    }

    teachers.value = collected.filter((t) => t.id !== props.group.teacher_id)
  } catch {
    toast.error('Gagal memuat daftar guru')
  }
})

async function save() {
  saving.value = true
  try {
    const firstAssignment = props.group.assignments[0]
    await store.assignSubstitute(firstAssignment.id, form.value)
    toast.success('Guru pengganti berhasil ditugaskan')
    emit('saved')
    emit('close')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Gagal menyimpan')
  } finally {
    saving.value = false
  }
}
</script>
