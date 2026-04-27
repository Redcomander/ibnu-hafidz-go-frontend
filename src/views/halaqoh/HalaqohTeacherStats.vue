<template>
  <div class="space-y-6">
    <!-- Header Page -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Rekapan Halaqoh Guru</h2>
        <p class="text-gray-500 text-sm mt-1">
          Statistik kehadiran dan pengajar pengganti halaqoh
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="exportFile('excel')"
          class="btn-export bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
          :disabled="exporting === 'excel'"
        >
          <SvgIcon v-if="exporting === 'excel'" name="spinner" class="animate-spin" :size="16" />
          <SvgIcon v-else name="download" :size="16" />
          Export Excel
        </button>
        <button
          @click="exportFile('pdf')"
          class="btn-export bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          :disabled="exporting === 'pdf'"
        >
          <SvgIcon v-if="exporting === 'pdf'" name="spinner" class="animate-spin" :size="16" />
          <SvgIcon v-else name="document-text" :size="16" />
          Export PDF
        </button>
      </div>
    </div>

    <!-- Filter Card -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Date Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mulai Tanggal</label>
          <input
            v-model="filters.start_date"
            type="date"
            class="input-field"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
          <input
            v-model="filters.end_date"
            type="date"
            class="input-field"
          />
        </div>
        <!-- Teacher Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Guru Halaqoh</label>
          <select v-model="filters.teacher_id" class="input-field">
            <option value="">Semua Guru</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>
        <!-- Gender Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
          <select v-model="filters.gender" class="input-field">
            <option value="">Semua</option>
            <option value="Laki-laki">Laki-Laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <button @click="fetchStats" class="btn-primary" :disabled="loading">
          <SvgIcon v-if="loading" name="spinner" class="animate-spin mr-2" :size="16" />
          <SvgIcon v-else name="search" class="mr-2" :size="16" />
          Tampilkan Data
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <SvgIcon name="spinner" class="animate-spin text-primary" :size="32" />
    </div>

    <div v-else class="space-y-6">
      <!-- Global Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-white border text-center border-gray-100 rounded-xl p-4 shadow-sm">
          <p class="text-sm font-medium text-gray-500 mb-1 flex items-center justify-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Hadir
          </p>
          <p class="text-2xl font-bold text-gray-800">{{ stats.Hadir || 0 }}</p>
        </div>
        <div class="bg-white border text-center border-gray-100 rounded-xl p-4 shadow-sm">
          <p class="text-sm font-medium text-gray-500 mb-1 flex items-center justify-center gap-1">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span> Izin
          </p>
          <p class="text-2xl font-bold text-gray-800">{{ stats.Izin || 0 }}</p>
        </div>
        <div class="bg-white border text-center border-gray-100 rounded-xl p-4 shadow-sm">
          <p class="text-sm font-medium text-gray-500 mb-1 flex items-center justify-center gap-1">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span> Sakit
          </p>
          <p class="text-2xl font-bold text-gray-800">{{ stats.Sakit || 0 }}</p>
        </div>
        <div class="bg-white border text-center border-gray-100 rounded-xl p-4 shadow-sm">
          <p class="text-sm font-medium text-gray-500 mb-1 flex items-center justify-center gap-1">
            <span class="w-2 h-2 rounded-full bg-red-500"></span> Alpha
          </p>
          <p class="text-2xl font-bold text-gray-800">{{ stats.Alpha || 0 }}</p>
        </div>
        <div class="bg-white border text-center border-gray-100 rounded-xl p-4 shadow-sm">
          <p class="text-sm font-medium text-gray-500 mb-1 flex items-center justify-center gap-1">
            <span class="w-2 h-2 rounded-full bg-purple-500"></span> Badalkan
          </p>
          <p class="text-2xl font-bold text-gray-800">{{ substitutionCount }}</p>
        </div>
      </div>

      <!-- Sesi Detail Table (Waktu Halaqoh) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100">
          <h3 class="font-bold text-gray-800 flex items-center gap-2">
            <SvgIcon name="clock" class="text-primary" />
            Kehadiran Berdasarkan Sesi
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-600 uppercase bg-gray-50">
              <tr>
                <th class="px-6 py-4 font-bold">Waktu Sess / Status</th>
                <th class="px-6 py-4 text-center font-bold text-emerald-600">Hadir</th>
                <th class="px-6 py-4 text-center font-bold text-amber-600">Izin</th>
                <th class="px-6 py-4 text-center font-bold text-blue-600">Sakit</th>
                <th class="px-6 py-4 text-center font-bold text-red-600">Alpha</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="session in ['Shubuh', 'Ashar', 'Isya']" :key="session" class="hover:bg-gray-50/50">
                <td class="px-6 py-4 font-semibold text-gray-800">
                  {{ session }}
                </td>
                <td class="px-6 py-4 text-center bg-emerald-50/30 font-medium">
                  {{ sessionStats[session]?.Hadir || 0 }}
                </td>
                <td class="px-6 py-4 text-center bg-amber-50/30 font-medium">
                  {{ sessionStats[session]?.Izin || 0 }}
                </td>
                <td class="px-6 py-4 text-center bg-blue-50/30 font-medium">
                  {{ sessionStats[session]?.Sakit || 0 }}
                </td>
                <td class="px-6 py-4 text-center bg-red-50/30 font-medium">
                  {{ sessionStats[session]?.Alpha || 0 }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Ringkasan Kehadiran Guru Table -->
      <div v-if="teachersList && teachersList.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 class="font-bold text-gray-800 border-l-4 border-emerald-600 pl-2">Ringkasan Kehadiran Guru</h3>
          <div class="relative max-w-xs w-full">
            <SvgIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
            <input v-model="teacherSearchQuery" type="text" placeholder="Cari guru..." class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors outline-none" />
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-600 bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-4 py-4 font-bold text-center w-12">No</th>
                <th class="px-4 py-4 font-bold">Nama Guru</th>
                <th class="px-4 py-4 text-center font-bold">Hadir</th>
                <th class="px-4 py-4 text-center font-bold">Izin</th>
                <th class="px-4 py-4 text-center font-bold">Sakit</th>
                <th class="px-4 py-4 text-center font-bold">Alpha</th>
                <th class="px-4 py-4 text-center font-bold text-emerald-600">Subst.</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="(t, index) in filteredTeachers" :key="t.id" class="hover:bg-gray-50/50">
                <td class="px-4 py-3 text-gray-500 text-center">{{ index + 1 }}</td>
                <td class="px-4 py-3 font-medium text-gray-800">{{ t.name }}</td>
                <td class="px-4 py-3 text-center font-medium text-emerald-600">{{ t.hadir || 0 }}</td>
                <td class="px-4 py-3 text-center font-medium text-blue-600">{{ t.izin || 0 }}</td>
                <td class="px-4 py-3 text-center font-medium text-amber-600">{{ t.sakit || 0 }}</td>
                <td class="px-4 py-3 text-center font-medium text-red-600">{{ t.alpha || 0 }}</td>
                <td class="px-4 py-3 text-center font-medium text-emerald-600">{{ t.substitute > 0 ? t.substitute : '-' }}</td>
              </tr>
              <tr v-if="filteredTeachers.length === 0">
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">Tidak ada guru ditemukan</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Riwayat Ketidakhadiran Guru (Izin/Sakit/Alpha) -->
      <div v-if="absenceHistoryList && absenceHistoryList.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 class="font-bold text-gray-800 border-l-4 border-rose-500 pl-2">Riwayat Ketidakhadiran Guru (Izin / Sakit / Alpha)</h3>
          <div class="relative max-w-xs w-full">
            <SvgIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
            <input v-model="absenceSearchQuery" type="text" placeholder="Cari guru..." class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors outline-none" />
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-600 bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-4 py-4 font-bold">Tanggal</th>
                <th class="px-4 py-4 font-bold">Guru</th>
                <th class="px-4 py-4 font-bold">Sesi</th>
                <th class="px-4 py-4 font-bold">Status</th>
                <th class="px-4 py-4 font-bold">Catatan</th>
                <th v-if="isSuperAdmin" class="px-4 py-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="a in filteredAbsenceHistory" :key="a.id" class="hover:bg-gray-50/50">
                <td class="px-4 py-3 text-gray-600">{{ formatDate(a.date) }}</td>
                <td class="px-4 py-3 font-medium text-gray-800">{{ a.teacher }}</td>
                <td class="px-4 py-3 text-gray-600">{{ a.session }}</td>
                <td class="px-4 py-3">
                  <span :class="statusBadge(a.status)">{{ a.status }}</span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ a.notes || '-' }}</td>
                <td v-if="isSuperAdmin" class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button @click="openEditAbsence(a)" class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50">
                      <SvgIcon name="pencil" :size="13" /> Edit
                    </button>
                    <button @click="deleteAbsenceRecord(a)" :disabled="deletingAbsenceId === a.id" class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <SvgIcon name="trash" :size="13" /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredAbsenceHistory.length === 0">
                <td :colspan="isSuperAdmin ? 6 : 5" class="px-4 py-8 text-center text-gray-500">Tidak ada riwayat ditemukan</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Riwayat Guru Pengganti Table -->
      <div v-if="historyList && historyList.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 class="font-bold text-gray-800 border-l-4 border-amber-500 pl-2">Riwayat Guru Pengganti</h3>
          <div class="relative max-w-xs w-full">
            <SvgIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
            <input v-model="historySearchQuery" type="text" placeholder="Cari sesi/guru..." class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors outline-none" />
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-600 bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-4 py-4 font-bold">Tanggal</th>
                <th class="px-4 py-4 font-bold">Sesi</th>
                <th class="px-4 py-4 font-bold">Guru Asli</th>
                <th class="px-4 py-4 font-bold">Status</th>
                <th class="px-4 py-4 font-bold">Pengganti</th>
                <th v-if="isSuperAdmin" class="px-4 py-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="h in filteredHistory" :key="h.id" class="hover:bg-gray-50/50">
                <td class="px-4 py-3 text-gray-600">{{ formatDate(h.tanggal) }}</td>
                <td class="px-4 py-3 font-medium text-gray-800">{{ h.sesi }}</td>
                <td class="px-4 py-3 text-gray-600">{{ h.guru_asli || '-' }}</td>
                <td class="px-4 py-3">
                  <span :class="statusBadge(h.status)">{{ h.status }}</span>
                </td>
                <td class="px-4 py-3 font-medium" :class="h.pengganti !== '-' ? 'text-emerald-600' : 'text-gray-500'">
                  {{ h.pengganti }}
                </td>
                <td v-if="isSuperAdmin" class="px-4 py-3 text-center">
                  <button
                    @click="deleteHistoryItem(h)"
                    :disabled="deletingHistoryId === h.id"
                    class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SvgIcon name="trash" :size="13" />
                    Hapus
                  </button>
                </td>
              </tr>
              <tr v-if="filteredHistory.length === 0">
                <td :colspan="isSuperAdmin ? 6 : 5" class="px-4 py-8 text-center text-gray-500">Tidak ada riwayat ditemukan</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Edit Absence Modal -->
    <Teleport to="body">
      <div v-if="editingAbsence" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="editingAbsence = null">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-base font-bold text-gray-800 mb-4">Edit Absensi Guru Halaqoh</h3>
          <div class="text-sm text-gray-600 mb-4">
            <p class="font-semibold">{{ editingAbsence.teacher }}</p>
            <p class="text-xs text-gray-400">{{ editingAbsence.session }} — {{ formatDate(editingAbsence.date) }}</p>
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
import { ref, onMounted, computed } from 'vue'
import api from '@/api'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'



const authStore = useAuthStore()
const toast = useToastStore()
const isSuperAdmin = computed(() => authStore.userRoles?.some((role) => role.name === 'super_admin'))
const deletingHistoryId = ref(null)

const getLocalDateString = (date = new Date()) => {
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10)
}

const now = new Date()

// Filters
const filters = ref({
  start_date: getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
  end_date: getLocalDateString(now),
  teacher_id: '',
  gender: ''
})

// Data references
const loading = ref(false)
const exporting = ref(null)
const teachers = ref([])

// Stats references
const stats = ref({
  Hadir: 0,
  Izin: 0,
  Sakit: 0,
  Alpha: 0
})
const sessionStats = ref({
  Shubuh: { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 },
  Ashar: { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 },
  Isya: { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 }
})
const substitutionCount = ref(0)
const teachersList = ref([])
const historyList = ref([])

const teacherSearchQuery = ref('')
const historySearchQuery = ref('')
const absenceSearchQuery = ref('')

// Absence edit state
const absenceHistoryList = ref([])
const editingAbsence = ref(null)
const editAbsenceForm = ref({ status: '', notes: '' })
const savingAbsence = ref(false)
const deletingAbsenceId = ref(null)

const filteredTeachers = computed(() => {
  if (!teacherSearchQuery.value) return teachersList.value
  const q = teacherSearchQuery.value.toLowerCase()
  return teachersList.value.filter(t => t.name.toLowerCase().includes(q))
})

const filteredAbsenceHistory = computed(() => {
  if (!absenceSearchQuery.value) return absenceHistoryList.value
  const q = absenceSearchQuery.value.toLowerCase()
  return absenceHistoryList.value.filter(a =>
    (a.teacher || '').toLowerCase().includes(q) ||
    (a.session || '').toLowerCase().includes(q) ||
    (a.status || '').toLowerCase().includes(q)
  )
})

const filteredHistory = computed(() => {
  if (!historySearchQuery.value) return historyList.value
  const q = historySearchQuery.value.toLowerCase()
  return historyList.value.filter(h => 
    h.guru_asli.toLowerCase().includes(q) || 
    h.sesi.toLowerCase().includes(q) ||
    h.pengganti.toLowerCase().includes(q)
  )
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

const statusBadge = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'hadir') return 'px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-700 uppercase'
  if (s === 'izin') return 'px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-700 uppercase'
  if (s === 'sakit') return 'px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700 uppercase'
  if (s === 'alpha' || s === 'alpa') return 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700 uppercase'
  if (s === 'dinas luar') return 'px-2 py-1 text-xs font-semibold rounded bg-pink-100 text-pink-700 uppercase'
  if (s === 'cuti') return 'px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-700 uppercase'
  return 'px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600 uppercase'
}

function openEditAbsence(item) {
  editingAbsence.value = item
  editAbsenceForm.value = { status: item.status, notes: item.notes || '' }
}

async function saveAbsenceEdit() {
  if (!editingAbsence.value) return
  savingAbsence.value = true
  try {
    await api.put(`/halaqoh/teacher-attendance-record/${editingAbsence.value.id}`, editAbsenceForm.value)
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
    await api.delete(`/halaqoh/teacher-attendance-record/${item.id}`)
    toast.success('Data absensi guru halaqoh berhasil dihapus')
    await fetchStats()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Gagal menghapus data absensi')
  } finally {
    deletingAbsenceId.value = null
  }
}

const deleteHistoryItem = async (item) => {
  if (!isSuperAdmin.value || !item?.id) return
  const ok = window.confirm('Hapus riwayat guru pengganti halaqoh ini?')
  if (!ok) return

  deletingHistoryId.value = item.id
  try {
    await api.delete(`/halaqoh/substitute-history/${item.id}`)
    toast.success('Riwayat guru pengganti halaqoh berhasil dihapus')
    await fetchStats()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Gagal menghapus riwayat guru pengganti halaqoh')
  } finally {
    deletingHistoryId.value = null
  }
}

onMounted(async () => {
  loadTeachers()
  await fetchStats()
})

const fetchStats = async () => {
  loading.value = true
  try {
    const query = new URLSearchParams()
    Object.entries(filters.value).forEach(([k, v]) => {
      if (v) query.append(k, v)
    })
    
    const res = await api.get(`/halaqoh/statistics/teachers?${query.toString()}`)
    
    stats.value = res.data.stats || stats.value
    sessionStats.value = res.data.sessionStats || sessionStats.value
    substitutionCount.value = res.data.substitutionCount || 0
    teachersList.value = res.data.teachers || []
    historyList.value = res.data.history || []
    absenceHistoryList.value = res.data.absence_history || []

  } catch (err) {
    console.error('Failed to fetch statistics:', err)
  } finally {
    loading.value = false
  }
}

const loadTeachers = async () => {
  try {
    // Assuming /users returns all teachers who can be Halqah mentors
    const res = await api.get('/users?per_page=1000')
    teachers.value = res.data.data.map(u => ({ id: u.id, name: u.name }))
  } catch (e) {
    console.error('Error loading teachers:', e)
  }
}

async function exportFile(format) {
  if (exporting.value) return
  exporting.value = format

  try {
    const query = new URLSearchParams()
    Object.entries(filters.value).forEach(([k, v]) => {
      if (v) query.append(k, v)
    })

    // Example URL: /halaqoh/export/teacher/pdf (To be fully implemented in Go)
    const url = format === 'pdf' 
      ? `/halaqoh/export/teacher/pdf?${query.toString()}`
      : `/halaqoh/export/teacher/excel?${query.toString()}`

    const response = await api.get(url, { responseType: 'blob' })
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = urlBlob
    link.setAttribute('download', `Rekapan_Halaqoh_Guru_${format.toUpperCase()}.${format === 'excel' ? 'xlsx' : 'pdf'}`)
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
  @apply px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-transparent shadow-sm disabled:opacity-70 disabled:cursor-not-allowed;
}
</style>
