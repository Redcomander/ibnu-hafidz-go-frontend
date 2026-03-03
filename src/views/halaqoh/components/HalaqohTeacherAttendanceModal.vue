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
        <div class="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-white rounded-t-xl">
          <h3 class="text-lg font-bold">Absensi Guru Halaqoh</h3>
          <p class="text-cyan-100 text-sm">
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
                  ? 'bg-white border border-b-0 border-gray-200 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600',
              ]"
            >
              {{ sess }}
              <span v-if="isSessionSubmitted(sess)" class="ml-1 text-emerald-500">✓</span>
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="p-8 text-center">
          <div class="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>

        <!-- Form -->
        <div v-else class="p-6 space-y-5">
          <!-- Current session info -->
          <div v-if="currentSessionInfo" class="space-y-4">
            <!-- Substitute badge -->
            <div
              v-if="currentSessionInfo.is_substitute"
              class="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm"
            >
              <span class="font-medium text-amber-700">Mengisi sebagai pengganti</span>
              <span v-if="currentSessionInfo.substitute_reason" class="text-amber-600">
                — {{ currentSessionInfo.substitute_reason }}
              </span>
            </div>

            <div class="text-sm text-gray-600">
              <span class="font-medium">Guru:</span>
              {{ currentSessionInfo.effective_teacher?.name || group.teacher_name }}
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status Kehadiran</label>
              <div class="grid grid-cols-4 gap-2">
                <label
                  v-for="st in statusOptions"
                  :key="st.value"
                  :class="[
                    'text-center text-xs font-medium py-2.5 rounded-lg border cursor-pointer transition-all',
                    sessionForm.status === st.value
                      ? st.activeClass
                      : 'border-gray-200 text-gray-400 hover:border-gray-300',
                  ]"
                >
                  <input
                    type="radio"
                    :value="st.value"
                    v-model="sessionForm.status"
                    class="sr-only"
                  />
                  {{ st.label }}
                </label>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
              <textarea
                v-model="sessionForm.notes"
                rows="2"
                placeholder="Catatan (opsional)"
                class="input-field text-sm"
              ></textarea>
            </div>

            <!-- Photo Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Foto Bukti</label>
              <input
                type="file"
                accept="image/*"
                @change="handlePhotoChange"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <div v-if="currentSessionInfo.photo_path && !photoFile" class="mt-2">
                <span class="text-xs text-emerald-600">📷 Foto sudah diunggah sebelumnya</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              @click="$emit('close')"
              class="flex-1 px-4 py-2.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 font-medium"
            >
              Tutup
            </button>
            <button
              @click="submit"
              :disabled="saving || !sessionForm.status"
              class="flex-1 px-4 py-2.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-medium disabled:opacity-50"
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
const photoFile = ref(null)

const statusOptions = [
  { value: 'Hadir', label: 'Hadir', activeClass: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'Izin', label: 'Izin', activeClass: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'Sakit', label: 'Sakit', activeClass: 'border-amber-400 bg-amber-50 text-amber-700' },
  { value: 'Alpha', label: 'Alpha', activeClass: 'border-red-400 bg-red-50 text-red-700' },
]

const sessionInfos = ref([])
const sessionForm = ref({ status: '', notes: '' })
const submittedSessions = ref(new Set())

const currentSessionInfo = computed(() =>
  sessionInfos.value.find((s) => s.session === activeSession.value)
)

function isSessionSubmitted(sess) {
  return submittedSessions.value.has(sess)
}

watch(activeSession, updateForm)

function updateForm() {
  const info = currentSessionInfo.value
  if (info) {
    sessionForm.value.status = info.status || ''
    sessionForm.value.notes = info.notes || ''
    if (info.has_attendance) submittedSessions.value.add(info.session)
  } else {
    sessionForm.value = { status: '', notes: '' }
  }
  photoFile.value = null
}

onMounted(async () => {
  loading.value = true
  try {
    const firstAssignment = props.group.assignments[0]
    const data = await store.fetchTeacherAttendance(firstAssignment.id, props.date)
    sessionInfos.value = data.session_infos || []
    updateForm()
  } catch {
    toast.error('Gagal memuat data')
  } finally {
    loading.value = false
  }
})

function handlePhotoChange(e) {
  photoFile.value = e.target.files[0] || null
}

async function submit() {
  saving.value = true
  try {
    const firstAssignment = props.group.assignments[0]
    const fd = new FormData()
    fd.append('status', sessionForm.value.status)
    fd.append('notes', sessionForm.value.notes)
    fd.append('date', props.date)
    if (photoFile.value) fd.append('photo', photoFile.value)

    await store.submitTeacherAttendance(firstAssignment.id, activeSession.value, fd)
    toast.success(`Absensi Guru ${activeSession.value} berhasil!`)
    submittedSessions.value.add(activeSession.value)
    emit('saved')

    // Auto-advance
    const idx = sessions.indexOf(activeSession.value)
    if (idx < sessions.length - 1) {
      activeSession.value = sessions[idx + 1]
    }
  } catch (err) {
    toast.error(err.response?.data?.error || 'Gagal menyimpan')
  } finally {
    saving.value = false
  }
}
</script>
