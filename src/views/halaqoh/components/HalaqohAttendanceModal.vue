<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <div
        class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white rounded-t-xl">
          <h3 class="text-lg font-bold">Absensi Santri Halaqoh</h3>
          <p class="text-indigo-100 text-sm">
            {{ group.teacher_name }} — {{ date }}
          </p>
        </div>

        <!-- Session Tabs -->
        <div class="border-b border-gray-100 px-6 pt-4">
          <div class="flex gap-1">
            <button
              v-for="sess in sessions"
              :key="sess"
              @click="activeSession = sess"
              :class="[
                'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                activeSession === sess
                  ? 'bg-white border border-b-0 border-gray-200 text-indigo-600'
                  : 'text-gray-400 hover:text-gray-600',
              ]"
            >
              {{ sess }}
              <span
                v-if="isSessionSubmitted(sess)"
                class="ml-1 text-emerald-500"
              >✓</span>
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="p-8 text-center">
          <div class="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>

        <!-- Attendance Form -->
        <div v-else class="p-6">
          <!-- Substitute info -->
          <div
            v-if="substituteInfo"
            class="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm"
          >
            <span class="font-medium text-amber-700">Guru Pengganti:</span>
            {{ substituteInfo.substitute_teacher?.name }}
            <span v-if="substituteInfo.reason" class="text-amber-600">
              — {{ substituteInfo.reason }}
            </span>
          </div>

          <!-- Student List -->
          <div class="space-y-3">
            <div
              v-for="record in currentRecords"
              :key="record.student_id"
              class="p-3 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-800">
                  {{ record.student_name }}
                </span>
              </div>
              <div class="flex gap-2">
                <label
                  v-for="st in statusOptions"
                  :key="st.value"
                  :class="[
                    'flex-1 text-center text-xs font-medium py-2 rounded-lg border cursor-pointer transition-all',
                    record.status === st.value
                      ? st.activeClass
                      : 'border-gray-200 text-gray-400 hover:border-gray-300',
                  ]"
                >
                  <input
                    type="radio"
                    :value="st.value"
                    v-model="record.status"
                    class="sr-only"
                  />
                  {{ st.label }}
                </label>
              </div>
              <input
                v-model="record.notes"
                type="text"
                placeholder="Catatan (opsional)"
                class="mt-2 w-full text-xs input-field !py-1.5"
              />
            </div>
          </div>

          <p v-if="!currentRecords.length" class="text-center text-gray-400 py-8 text-sm">
            Tidak ada santri untuk sesi ini
          </p>

          <!-- Actions -->
          <div class="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              @click="$emit('close')"
              class="flex-1 px-4 py-2.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 font-medium"
            >
              Tutup
            </button>
            <button
              @click="submit"
              :disabled="saving || !currentRecords.length"
              class="flex-1 px-4 py-2.5 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 font-medium disabled:opacity-50"
            >
              {{ saving ? 'Menyimpan...' : `Simpan ${activeSession}` }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useHalaqohStore } from '@/stores/halaqoh'
import { useToastStore } from '@/stores/toast'

const props = defineProps({
  group: { type: Object, required: true },
  date: { type: String, required: true },
  initialSession: { type: String, default: 'Shubuh' },
  sessionTimes: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'saved'])

const store = useHalaqohStore()
const toast = useToastStore()

const sessions = ['Shubuh', 'Ashar', 'Isya']
const activeSession = ref(props.initialSession)
const loading = ref(true)
const saving = ref(false)

const statusOptions = [
  { value: 'hadir', label: 'Hadir', activeClass: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'izin', label: 'Izin', activeClass: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'sakit', label: 'Sakit', activeClass: 'border-amber-400 bg-amber-50 text-amber-700' },
  { value: 'alpa', label: 'Alpa', activeClass: 'border-red-400 bg-red-50 text-red-700' },
]

// All records grouped by session
const recordsBySession = ref({
  Shubuh: [],
  Ashar: [],
  Isya: [],
})

const submittedSessions = ref(new Set())

const currentRecords = computed(() => recordsBySession.value[activeSession.value] || [])

const substituteInfo = computed(() => {
  const data = store.attendanceData
  return data?.substitute_map?.[activeSession.value] || null
})

function isSessionSubmitted(sess) {
  return submittedSessions.value.has(sess)
}

onMounted(loadAttendance)
watch(activeSession, () => {}) // Records are already loaded

async function loadAttendance() {
  loading.value = true
  try {
    const firstAssignment = props.group.assignments[0]
    if (!firstAssignment) return

    const data = await store.fetchAttendance(firstAssignment.id, props.date)
    const assignments = data.assignments || []
    const attMap = data.attendance_map || {}

    // Build records for each session
    for (const sess of sessions) {
      recordsBySession.value[sess] = assignments.map((a) => {
        const key = `${a.id}_${sess}_${a.student_id}`
        const existing = attMap[key]
        return {
          halaqoh_assignment_id: a.id,
          student_id: a.student_id,
          student_name: a.student?.nama_lengkap || a.student?.name || `Santri #${a.student_id}`,
          status: existing?.status || 'hadir',
          notes: existing?.notes || '',
        }
      })

      // Mark as submitted if any existing attendance
      const hasExisting = assignments.some((a) => {
        const key = `${a.id}_${sess}_${a.student_id}`
        return !!attMap[key]
      })
      if (hasExisting) submittedSessions.value.add(sess)
    }
  } catch {
    toast.error('Gagal memuat data absensi')
  } finally {
    loading.value = false
  }
}

async function submit() {
  saving.value = true
  try {
    await store.submitSessionAttendance(activeSession.value, {
      date: props.date,
      records: currentRecords.value,
    })
    toast.success(`Absensi ${activeSession.value} berhasil disimpan!`)
    submittedSessions.value.add(activeSession.value)
    emit('saved')

    // Auto-advance to next session
    const idx = sessions.indexOf(activeSession.value)
    if (idx < sessions.length - 1) {
      activeSession.value = sessions[idx + 1]
    }
  } catch (err) {
    toast.error(err.response?.data?.error || 'Gagal menyimpan absensi')
  } finally {
    saving.value = false
  }
}
</script>
