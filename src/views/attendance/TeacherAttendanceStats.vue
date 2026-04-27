<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-800">{{ title }}</h1>
        <p class="text-gray-500 text-xs sm:text-sm mt-0.5">
          Statistik kehadiran guru {{ attendanceTypeLabel }} berdasarkan periode
        </p>
      </div>
      <!-- Export Buttons -->
      <div class="flex gap-2">
        <button @click="exportFile('pdf')" :disabled="exporting === 'pdf'" class="btn-export bg-red-600 hover:bg-red-700">
          <SvgIcon name="download" :size="16" />
          <span class="hidden sm:inline">{{ exporting === 'pdf' ? 'Mengunduh...' : 'Export PDF' }}</span>
        </button>
        <button @click="exportFile('excel')" :disabled="exporting === 'excel'" class="btn-export bg-emerald-600 hover:bg-emerald-700">
          <SvgIcon name="download" :size="16" />
          <span class="hidden sm:inline">{{ exporting === 'excel' ? 'Mengunduh...' : 'Export Excel' }}</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <!-- Start Date -->
        <div>
          <label class="input-label">Dari Tanggal</label>
          <input type="date" v-model="filters.start_date" @change="fetchStats" class="input-field text-sm" />
        </div>
        <!-- End Date -->
        <div>
          <label class="input-label">Sampai Tanggal</label>
          <input type="date" v-model="filters.end_date" @change="fetchStats" class="input-field text-sm" />
        </div>
        <!-- Teacher Search (Server side string or local string filter? Let's use local filter via server input or dropdown) -->
        <div class="col-span-2 sm:col-span-2">
          <label class="input-label">Guru</label>
          <select v-model="filters.teacher_id" @change="fetchStats" class="input-field text-sm">
            <option value="">Semua Guru</option>
            <option v-for="t in teacherList" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <!-- Gender -->
        <div>
          <label class="input-label">Gender</label>
          <select v-model="filters.gender" @change="fetchStats" class="input-field text-sm">
            <option value="">Semua</option>
            <option value="banin">Banin</option>
            <option value="banat">Banat</option>
          </select>
        </div>
        <!-- Kelas (only for Diniyyah) -->
        <div v-if="isDiniyyah">
          <label class="input-label">Kelas</label>
          <select v-model="filters.kelas_id" @change="fetchStats" class="input-field text-sm">
            <option value="">Semua Kelas</option>
            <option v-for="k in kelasList" :key="k.id" :value="k.id">{{ k.nama }} {{ k.tingkat }}</option>
          </select>
        </div>
        <!-- Reset -->
        <div class="flex items-end">
          <button @click="resetFilters" class="btn-secondary text-sm w-full">Reset</button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-gray-500 mt-2 text-sm">Memuat statistik...</p>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div
          v-for="card in teacherCards"
          :key="card.label"
          :class="[card.bg, 'rounded-xl shadow-sm p-4 sm:p-5 text-white transform hover:scale-[1.02] transition-all']"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <SvgIcon :name="card.icon" :size="18" />
            </div>
            <span class="text-[10px] uppercase tracking-wider font-bold opacity-70">Total</span>
          </div>
          <p class="text-2xl sm:text-3xl font-bold">{{ card.count }}</p>
          <p class="text-xs opacity-90 font-medium mt-0.5">{{ card.label }}</p>
        </div>
      </div>

      <!-- Teacher Summary Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div class="p-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-6 bg-primary rounded-full"></div>
            <h3 class="font-bold text-gray-800">Ringkasan Kehadiran Guru</h3>
          </div>
          <div class="relative w-full sm:w-64">
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SvgIcon name="search" :size="14" />
            </div>
            <input
              v-model="teacherTabSearch"
              type="text"
              placeholder="Cari guru..."
              class="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th class="px-4 py-3 text-left w-12">No</th>
                <th class="px-4 py-3 text-left">Nama Guru</th>
                <th class="px-4 py-3 text-center">Hadir</th>
                <th class="px-4 py-3 text-center">Izin</th>
                <th class="px-4 py-3 text-center">Sakit</th>
                <th class="px-4 py-3 text-center border-r border-gray-100">Alpha</th>
                <th class="px-4 py-3 text-center font-bold text-primary bg-primary/5">Subst.</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr 
                v-for="(t, i) in filteredTeacherSummary" 
                :key="t.id" 
                class="hover:bg-gray-50/50 transition-colors"
                :class="{'bg-rose-50/30' : (t.izin + t.sakit + t.alpha) > 3}"
              >
                <td class="px-4 py-3 text-gray-400 text-xs">{{ i + 1 }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <img v-if="t.avatar" :src="t.avatar" class="w-6 h-6 rounded-full bg-gray-100 object-cover" />
                    <div v-else class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary italic">
                      {{ t.name.charAt(0) }}
                    </div>
                    <span class="font-medium text-gray-900">{{ t.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center text-emerald-600 font-mono">{{ t.hadir }}</td>
                <td class="px-4 py-3 text-center text-blue-600 font-mono">{{ t.izin }}</td>
                <td class="px-4 py-3 text-center text-amber-600 font-mono">{{ t.sakit }}</td>
                <td class="px-4 py-3 text-center text-rose-600 font-mono border-r border-gray-100">{{ t.alpha }}</td>
                <td class="px-4 py-3 text-center font-bold bg-primary/5 text-primary">{{ t.substitute || '-' }}</td>
              </tr>
              <tr v-if="!filteredTeacherSummary.length">
                <td colspan="7" class="px-4 py-12 text-center text-gray-400">
                  <template v-if="teacherTotal === 0">
                    Belum ada data absensi guru untuk periode ini
                  </template>
                  <template v-else>
                    Tidak ada data guru yang cocok
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Absence History Table (Izin/Sakit/Alpha) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-6 bg-rose-500 rounded-full"></div>
            <h3 class="font-bold text-gray-800">Riwayat Ketidakhadiran Guru (Izin / Sakit / Alpha)</h3>
          </div>
          <div class="relative w-full sm:w-64">
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SvgIcon name="search" :size="14" /></div>
            <input v-model="absenceSearch" type="text" placeholder="Cari guru/pelajaran..." class="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none transition-all" />
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th class="px-4 py-3 text-left">Tanggal</th>
                <th class="px-4 py-3 text-left">Guru</th>
                <th class="px-4 py-3 text-left">Pelajaran</th>
                <th class="px-4 py-3 text-left">Kelas</th>
                <th class="px-4 py-3 text-center">Status</th>
                <th class="px-4 py-3 text-left">Catatan</th>
                <th v-if="isSuperAdmin" class="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="a in filteredAbsenceHistory" :key="a.id" class="hover:bg-gray-50/50 transition-colors">
                <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{{ formatDate(a.date) }}</td>
                <td class="px-4 py-3 font-medium">{{ a.teacher }}</td>
                <td class="px-4 py-3 text-gray-600">{{ a.lesson }}</td>
                <td class="px-4 py-3 text-gray-500">{{ a.kelas }}</td>
                <td class="px-4 py-3 text-center">
                  <span :class="[getStatusBadge(a.status), 'px-2 py-0.5 rounded text-[10px] font-bold uppercase']">{{ a.status }}</span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ a.notes || '-' }}</td>
                <td v-if="isSuperAdmin" class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button @click="openEditAbsence(a)" class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50">
                      <SvgIcon name="pencil" :size="13" /> Edit
                    </button>
                    <button @click="deleteAbsenceRecord(a)" :disabled="deletingAbsenceId === a.id" class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                      <SvgIcon name="trash" :size="13" /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredAbsenceHistory.length">
                <td :colspan="isSuperAdmin ? 7 : 6" class="px-4 py-12 text-center text-gray-400">Tidak ada riwayat ketidakhadiran</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Substitute History Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-6 bg-amber-500 rounded-full"></div>
            <h3 class="font-bold text-gray-800">Riwayat Guru Pengganti</h3>
          </div>
          <div class="relative w-full sm:w-64">
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SvgIcon name="search" :size="14" />
            </div>
            <input
              v-model="substituteSearch"
              type="text"
              placeholder="Cari mapel/guru..."
              class="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
            />
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th class="px-4 py-3 text-left">Tanggal</th>
                <th class="px-4 py-3 text-left">Pelajaran</th>
                <th class="px-4 py-3 text-left">Kelas</th>
                <th class="px-4 py-3 text-left">Guru Asli</th>
                <th class="px-4 py-3 text-center">Status</th>
                <th class="px-4 py-3 text-left">Pengganti</th>
                <th v-if="isSuperAdmin" class="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="s in filteredSubstituteHistory" :key="s.id || (s.date + s.lesson + s.substitute_teacher)" class="hover:bg-gray-50/50 transition-colors">
                <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{{ formatDate(s.date) }}</td>
                <td class="px-4 py-3 font-medium">{{ s.lesson }}</td>
                <td class="px-4 py-3 text-gray-500">{{ s.kelas }}</td>
                <td class="px-4 py-3 text-gray-600">{{ s.original_teacher }}</td>
                <td class="px-4 py-3 text-center">
                  <span :class="[getStatusBadge(s.original_status), 'px-2 py-0.5 rounded text-[10px] font-bold uppercase']">
                    {{ s.original_status }}
                  </span>
                </td>
                <td class="px-4 py-3 font-semibold text-primary">{{ s.substitute_teacher }}</td>
                <td v-if="isSuperAdmin" class="px-4 py-3 text-center">
                  <button
                    @click="deleteSubstituteHistory(s)"
                    :disabled="deletingHistoryId === s.id"
                    class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SvgIcon name="trash" :size="13" />
                    Hapus
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredSubstituteHistory.length">
                <td :colspan="isSuperAdmin ? 7 : 6" class="px-4 py-12 text-center text-gray-400">Tidak ada riwayat penggantian</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Edit Absence Modal -->
    <Teleport to="body">
      <div v-if="editingAbsence" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="editingAbsence = null">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-base font-bold text-gray-800 mb-4">Edit Absensi Guru</h3>
          <div class="text-sm text-gray-600 mb-4">
            <p class="font-semibold">{{ editingAbsence.teacher }}</p>
            <p class="text-xs text-gray-400">{{ editingAbsence.lesson }} — {{ editingAbsence.kelas }} — {{ formatDate(editingAbsence.date) }}</p>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select v-model="editAbsenceForm.status" class="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                <option value="Hadir">Hadir</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Alpha">Alpha</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Catatan</label>
              <textarea v-model="editAbsenceForm.notes" rows="3" class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none" placeholder="Catatan opsional..."></textarea>
            </div>
          </div>
          <div class="flex gap-2 mt-5">
            <button @click="editingAbsence = null" class="flex-1 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
            <button @click="saveAbsenceEdit" :disabled="savingAbsence" class="flex-1 h-9 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">{{ savingAbsence ? 'Menyimpan...' : 'Simpan' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const route = useRoute()
const authStore = useAuthStore()
const toast = useToastStore()
const isSuperAdmin = computed(() => authStore.userRoles?.some((role) => role.name === 'super_admin'))
const deletingHistoryId = ref(null)
const isDiniyyah = computed(() => route.name === 'attendance-guru-diniyyah')
const isRamadhan = computed(() => route.name === 'attendance-guru-ramadhan')
const attendanceType = computed(() => isDiniyyah.value ? 'diniyyah' : isRamadhan.value ? 'ramadhan' : 'formal')
const attendanceTypeLabel = computed(() => isDiniyyah.value ? 'diniyyah' : isRamadhan.value ? 'ramadhan' : 'formal')
const title = computed(() => route.meta.title || 'Rekapan Kehadiran Guru')

const loading = ref(false)
const exporting = ref(null)
const kelasList = ref([])
const teacherList = ref([])

// Filters — default to current month
const now = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const today = now.toISOString().slice(0, 10)

const filters = ref({
  start_date: firstDay,
  end_date: today,
  kelas_id: '',
  gender: '',
  teacher_id: '',
})

// Stats data
const data = ref({
  teacher_counts: { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Substitute: 0 },
  teacher_summary: [],
  substitute_history: [],
  absence_history: [],
})

// Search refs
const teacherTabSearch = ref('')
const substituteSearch = ref('')
const absenceSearch = ref('')

// Absence edit state
const editingAbsence = ref(null)
const editAbsenceForm = ref({ status: '', notes: '' })
const savingAbsence = ref(false)
const deletingAbsenceId = ref(null)

const teacherCards = computed(() => [
  { label: 'Hadir', count: data.value.teacher_counts.Hadir || 0,  icon: 'check-circle', bg: 'bg-gradient-to-br from-green-500 to-emerald-600' },
  { label: 'Izin',  count: data.value.teacher_counts.Izin || 0,   icon: 'clock',        bg: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
  { label: 'Sakit', count: data.value.teacher_counts.Sakit || 0,  icon: 'heart',        bg: 'bg-gradient-to-br from-amber-400 to-orange-500' },
  { label: 'Alpha', count: data.value.teacher_counts.Alpha || 0,  icon: 'x-circle',     bg: 'bg-gradient-to-br from-rose-500 to-red-600' },
  { label: 'Substitute', count: data.value.teacher_counts.Substitute || 0,  icon: 'users', bg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600' },
])

const teacherTotal = computed(() => {
  const tc = data.value.teacher_counts || {}
  return (tc.Hadir || 0) + (tc.Izin || 0) + (tc.Sakit || 0) + (tc.Alpha || 0)
})

const filteredTeacherSummary = computed(() => {
  const list = data.value.teacher_summary || []
  if (!teacherTabSearch.value) return list
  const s = teacherTabSearch.value.toLowerCase().trim()
  return list.filter(t => (t.name || '').toLowerCase().includes(s))
})

const filteredAbsenceHistory = computed(() => {
  const list = data.value.absence_history || []
  if (!absenceSearch.value) return list
  const s = absenceSearch.value.toLowerCase().trim()
  return list.filter(item =>
    (item.teacher || '').toLowerCase().includes(s) ||
    (item.lesson || '').toLowerCase().includes(s) ||
    (item.kelas || '').toLowerCase().includes(s) ||
    (item.status || '').toLowerCase().includes(s)
  )
})

const filteredSubstituteHistory = computed(() => {
  const list = data.value.substitute_history || []
  if (!substituteSearch.value) return list
  const s = substituteSearch.value.toLowerCase().trim()
  return list.filter(item => 
    (item.lesson || '').toLowerCase().includes(s) || 
    (item.original_teacher || '').toLowerCase().includes(s) || 
    (item.substitute_teacher || '').toLowerCase().includes(s) ||
    (item.kelas || '').toLowerCase().includes(s)
  )
})

function getStatusBadge(status) {
  const s = (status || '').toLowerCase()
  if (s === 'hadir') return 'bg-emerald-100 text-emerald-700'
  if (s === 'izin') return 'bg-blue-100 text-blue-700'
  if (s === 'sakit') return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: id })
  } catch {
    return dateStr
  }
}

onMounted(async () => {
  await Promise.all([fetchStats(), fetchKelas(), fetchTeachers()])
})

// watch for route type changes (Formal <-> Diniyyah)
watch(() => route.name, () => {
  fetchStats()
})

async function fetchStats() {
  loading.value = true
  try {
    const params = {
      type: attendanceType.value,
      ...filters.value,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const res = await api.get('/attendance/teacher-statistics', { params })
    data.value = res.data
  } catch (err) {
    console.error('Failed to fetch teacher statistics:', err)
  } finally {
    loading.value = false
  }
}

async function fetchKelas() {
  try {
    const res = await api.get('/kelas', { params: { per_page: 200 } })
    kelasList.value = res.data.data || res.data || []
  } catch {
    kelasList.value = []
  }
}

async function fetchTeachers() {
  try {
    const res = await api.get('/users', { params: { role: 'guru', per_page: 500 } })
    teacherList.value = res.data.data || res.data || []
  } catch {
    teacherList.value = []
  }
}

function resetFilters() {
  filters.value = {
    start_date: firstDay,
    end_date: today,
    kelas_id: '',
    gender: '',
    teacher_id: '',
  }
  fetchStats()
}

function openEditAbsence(item) {
  editingAbsence.value = item
  editAbsenceForm.value = { status: item.status, notes: item.notes || '' }
}

async function saveAbsenceEdit() {
  if (!editingAbsence.value) return
  savingAbsence.value = true
  try {
    await api.put(`/attendance/teacher-record/${editingAbsence.value.id}`, editAbsenceForm.value)
    toast.success('Data absensi berhasil diperbarui')
    editingAbsence.value = null
    await fetchStats()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Gagal memperbarui data absensi')
  } finally {
    savingAbsence.value = false
  }
}

async function deleteAbsenceRecord(item) {
  if (!isSuperAdmin.value || !item?.id) return
  const ok = window.confirm(`Hapus data absensi ${item.teacher} (${item.status}) pada ${formatDate(item.date)}?`)
  if (!ok) return
  deletingAbsenceId.value = item.id
  try {
    await api.delete(`/attendance/teacher-record/${item.id}`)
    toast.success('Data absensi berhasil dihapus')
    await fetchStats()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Gagal menghapus data absensi')
  } finally {
    deletingAbsenceId.value = null
  }
}

async function deleteSubstituteHistory(item) {
  if (!isSuperAdmin.value || !item?.id) return
  const ok = window.confirm('Hapus riwayat guru pengganti ini?')
  if (!ok) return

  deletingHistoryId.value = item.id
  try {
    await api.delete(`/attendance/substitute/${item.id}`, {
      params: { type: attendanceType.value },
    })
    toast.success('Riwayat guru pengganti berhasil dihapus')
    await fetchStats()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Gagal menghapus riwayat guru pengganti')
  } finally {
    deletingHistoryId.value = null
  }
}

async function exportFile(format) {
  if (exporting.value) return
  exporting.value = format

  try {
    const params = {
      type: attendanceType.value,
      ...filters.value
    }
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, v)
    })

    const url = `/attendance/export/teacher/${format}?${query.toString()}`

    const response = await api.get(url, { responseType: 'blob' })
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = urlBlob
    link.setAttribute('download', `Rekapan_Absensi_Guru_${params.type}_${format.toUpperCase()}.${format === 'excel' ? 'xlsx' : 'pdf'}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(urlBlob)
  } catch (err) {
    console.error(`Gagal export ${format}:`, err)
    alert(`Gagal mengunduh file ${format.toUpperCase()}`)
  } finally {
    exporting.value = null
  }
}
</script>

<style scoped>
.btn-export {
  @apply flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm;
}
</style>
