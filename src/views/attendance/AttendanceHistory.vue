<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-800">{{ title }}</h1>
        <p class="text-gray-500 text-xs sm:text-sm mt-0.5">
          Statistik absensi {{ isDiniyyah ? 'diniyyah' : 'formal' }} berdasarkan periode
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
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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
        <!-- Jenjang -->
        <div>
          <label class="input-label">Jenjang</label>
          <select v-model="filters.jenjang" @change="onJenjangChange" class="input-field text-sm">
            <option value="">Semua Jenjang</option>
            <option value="smp">SMP (Kelas 7-9)</option>
            <option value="sma">SMA (Kelas 10-12)</option>
          </select>
        </div>
        <!-- Kelas -->
        <div>
          <label class="input-label">Kelas</label>
          <select v-model="filters.kelas_id" @change="fetchStats" class="input-field text-sm">
            <option value="">Semua Kelas</option>
            <option v-for="k in filteredKelas" :key="k.id" :value="k.id">{{ k.nama }} {{ k.tingkat }}</option>
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
        <!-- Status -->
        <div>
          <label class="input-label">Status</label>
          <select v-model="filters.status" @change="fetchStats" class="input-field text-sm">
            <option value="">Semua Status</option>
            <option value="izin">Izin</option>
            <option value="sakit">Sakit</option>
            <option value="alpa">Alpa</option>
          </select>
        </div>
        <!-- Reset -->
        <div class="flex items-end">
          <button @click="resetFilters" class="btn-secondary text-sm w-full">Reset</button>
        </div>
      </div>
    </div>

    <!-- Tabs: Student / Teacher / History -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="onTabChange(tab.key)"
        :class="[
          'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
          activeTab === tab.key
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-gray-500 mt-2 text-sm">Memuat statistik...</p>
    </div>

    <!-- Student Stats -->
    <template v-else-if="activeTab === 'student'">
      <!-- Stat Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          v-for="card in studentCards"
          :key="card.label"
          :class="[card.bg, 'rounded-xl shadow-sm p-4 sm:p-5 text-white']"
        >
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <SvgIcon :name="card.icon" :size="18" />
            </div>
          </div>
          <p class="text-2xl sm:text-3xl font-bold">{{ card.count }}</p>
          <p class="text-xs opacity-80 mt-0.5">{{ card.label }}</p>
        </div>
      </div>

      <!-- Bar Chart -->
      <div v-if="hasChartData" class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Distribusi Absensi</h3>
        <div class="h-64">
          <Bar :data="chartConfig" :options="chartOptions" />
        </div>
      </div>

      <!-- Student Detail Lists -->
      <div class="space-y-4">
        <StudentStatusSection
          v-for="section in studentSections"
          :key="section.status"
          :title="section.title"
          :students="section.students"
          :color="section.color"
          :icon="section.icon"
          :searchQuery="studentSearch"
        />
      </div>
    </template>

    <!-- History Tab -->
    <template v-else-if="activeTab === 'history'">
      <!-- Searchbar with robust flex layout -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="flex items-center gap-3 h-11 px-4 rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <SvgIcon name="search" :size="18" class="text-gray-400 shrink-0" />
          <input
            type="text"
            v-model="historySearch"
            @input="debouncedFetchHistory"
            placeholder="Cari nama santri..."
            class="flex-1 h-full bg-transparent border-none focus:ring-0 outline-none text-sm py-0 placeholder:text-gray-400"
          />
        </div>
      </div>

      <!-- History Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div v-if="historyLoading" class="text-center py-8">
          <div class="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <div v-else-if="!history.data?.length" class="text-center py-8">
          <p class="text-gray-400 text-sm">Tidak ada data riwayat absensi</p>
        </div>
        <template v-else>
          <!-- Desktop table -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="(r, i) in history.data" :key="r.id" class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-4 py-3 text-gray-500">{{ (history.page - 1) * history.per_page + i + 1 }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ r.name }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ r.kelas_nama || '-' }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ formatDate(r.tanggal) }}</td>
                  <td class="px-4 py-3">
                    <span :class="statusBadge(r.status)">{{ r.status }}</span>
                  </td>
                  <td class="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{{ r.catatan || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Mobile cards -->
          <div class="sm:hidden divide-y divide-gray-100">
            <div v-for="(r, i) in history.data" :key="r.id" class="p-4 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-800 text-sm">{{ r.name }}</span>
                <span :class="statusBadge(r.status)">{{ r.status }}</span>
              </div>
              <div class="flex gap-3 text-xs text-gray-500">
                <span>{{ r.kelas_nama || '-' }}</span>
                <span>{{ formatDate(r.tanggal) }}</span>
              </div>
              <p v-if="r.catatan" class="text-xs text-gray-400 italic">{{ r.catatan }}</p>
            </div>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p class="text-xs text-gray-500">
              {{ (history.page - 1) * history.per_page + 1 }}-{{ Math.min(history.page * history.per_page, history.total) }} dari {{ history.total }}
            </p>
            <div class="flex gap-1">
              <button
                @click="historyPage--; fetchHistory()"
                :disabled="historyPage <= 1"
                class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >Prev</button>
              <button
                @click="historyPage++; fetchHistory()"
                :disabled="historyPage * history.per_page >= history.total"
                class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >Next</button>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRoute } from 'vue-router'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import api from '@/api'
import SvgIcon from '@/components/ui/SvgIcon.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Inline sub-component for student status sections with search (uses render function)
const StudentStatusSection = {
  props: {
    title: String,
    students: Array,
    color: String,
    icon: String,
    searchQuery: String,
  },
  setup(props) {
    const open = ref(true)
    const localSearch = ref('')
    const colorMap = {
      yellow: {
        headerBg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
        badgeBg: 'bg-amber-500',
        pipeBg: 'bg-amber-400',
      },
      orange: {
        headerBg: 'bg-gradient-to-r from-orange-500 to-red-500',
        badgeBg: 'bg-orange-500',
        pipeBg: 'bg-orange-400',
      },
      red: {
        headerBg: 'bg-gradient-to-r from-red-600 to-rose-700',
        badgeBg: 'bg-red-600',
        pipeBg: 'bg-red-400',
      },
    }
    const styles = colorMap[props.color] || colorMap.yellow

    // Group students by name
    const grouped = computed(() => {
      const map = {}
      for (const s of props.students || []) {
        if (!map[s.name]) map[s.name] = { name: s.name, count: 0, notes: [] }
        map[s.name].count++
        if (s.catatan) map[s.name].notes.push(s.catatan)
      }
      return Object.values(map).sort((a, b) => b.count - a.count)
    })

    // Filter by local search
    const filtered = computed(() => {
      const q = (localSearch.value || props.searchQuery || '').toLowerCase().trim()
      if (!q) return grouped.value
      return grouped.value.filter(e => e.name.toLowerCase().includes(q))
    })

    return () => {
      const headerIcon = h('div', { class: 'w-7 h-7 bg-white/20 rounded-full flex items-center justify-center' }, [
        h(SvgIcon, { name: props.icon || 'clock', size: 16, color: 'white' })
      ])

      const headerBtn = h('button', {
        class: ['w-full px-5 py-3.5 flex items-center justify-between transition-all', styles.headerBg].join(' '),
        onClick: () => { open.value = !open.value }
      }, [
        h('div', { class: 'flex items-center gap-2.5' }, [
          headerIcon,
          h('span', { class: 'text-sm font-bold text-white tracking-wide' }, props.title)
        ]),
        h('span', { class: 'px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-bold' },
          `${filtered.value.length} siswa`
        )
      ])

      const bodyChildren = []
      if (open.value) {
        // Search bar with robust flex layout
        const searchComp = h('div', { 
          class: 'flex items-center gap-2 h-10 px-3.5 mb-2 rounded-lg border border-gray-200 bg-gray-50/50 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all'
        }, [
          h(SvgIcon, { name: 'search', size: 15, class: 'text-gray-400 shrink-0' }),
          h('input', {
            type: 'text',
            value: localSearch.value,
            onInput: (e) => { localSearch.value = e.target.value },
            placeholder: 'Cari nama siswa...',
            class: 'flex-1 h-full bg-transparent border-none focus:ring-0 outline-none text-sm py-0 placeholder:text-gray-400'
          })
        ])

        bodyChildren.push(h('div', { class: 'px-5 pt-4 pb-2' }, [searchComp]))

        // Student list
        const listItems = []
        if (!filtered.value.length) {
          listItems.push(h('div', { class: 'text-center py-6 text-gray-400 text-sm' }, 'Tidak ada data'))
        } else {
          for (const entry of filtered.value) {
            const nameRow = h('div', { class: 'flex items-center gap-2' }, [
              h('span', { class: 'text-[13px] font-bold text-gray-800 uppercase tracking-wide' }, entry.name),
              h('span', {
                class: ['inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[10px] font-extrabold rounded-full text-white shadow-sm', styles.badgeBg].join(' ')
              }, `${entry.count}x`)
            ])

            const noteRows = entry.notes.length
              ? h('div', { class: 'mt-1.5 space-y-0.5 ml-0.5' },
                  entry.notes.map((note, i) =>
                    h('div', { key: i, class: 'flex items-start gap-0' }, [
                      h('div', { class: ['w-0.5 min-h-[18px] rounded-full shrink-0 mr-2', styles.pipeBg].join(' ') }),
                      h('span', { class: 'text-xs text-gray-500 italic leading-[18px]' }, note)
                    ])
                  )
                )
              : null

            listItems.push(
              h('div', { key: entry.name, class: 'py-3 border-b border-gray-100/80 last:border-0' }, [nameRow, noteRows])
            )
          }
        }

        bodyChildren.push(h('div', { class: 'px-5 pb-4 space-y-1.5 max-h-[400px] overflow-y-auto' }, listItems))
      }

      return h('div', { class: 'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden' }, [
        headerBtn,
        ...bodyChildren
      ])
    }
  },
}

const route = useRoute()
const isDiniyyah = computed(() => route.name === 'attendance-diniyyah')
const title = computed(() => route.meta.title || 'Statistik Absensi')

const loading = ref(false)
const activeTab = ref('student')
const kelasList = ref([])
const exporting = ref(null)

const tabs = [
  { key: 'student', label: 'Absensi Santri' },
  { key: 'history', label: 'Riwayat' },
]

// Filters — default to current month
const now = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const today = now.toISOString().slice(0, 10)

const filters = ref({
  start_date: firstDay,
  end_date: today,
  kelas_id: '',
  gender: '',
  jenjang: '',
  status: '',
})

// Filter kelas based on jenjang
const filteredKelas = computed(() => {
  if (!filters.value.jenjang) return kelasList.value
  const jenjangMap = {
    smp: ['7', '8', '9'],
    sma: ['10', '11', '12'],
  }
  const allowed = jenjangMap[filters.value.jenjang] || []
  return kelasList.value.filter(k => {
    // kelas.nama contains "Kelas 7", "Kelas 10", etc.
    // kelas.tingkat contains the section letter "A", "B", etc.
    const gradeNum = String(k.nama || '').replace(/[^0-9]/g, '')
    return allowed.includes(gradeNum)
  })
})

function onJenjangChange() {
  // Reset kelas when jenjang changes if current kelas is not in filtered list
  const ids = filteredKelas.value.map(k => k.id)
  if (filters.value.kelas_id && !ids.includes(Number(filters.value.kelas_id))) {
    filters.value.kelas_id = ''
  }
  fetchStats()
}

// Stats data
const data = ref({
  student_counts: { hadir: 0, izin: 0, sakit: 0, alpa: 0 },
  izin_students: [],
  sakit_students: [],
  alpa_students: [],
  chart_data: [],
})

// Search refs
const studentSearch = ref('')

// Student search (passed to sections)
// Already declared above

// History
const historySearch = ref('')
const historyPage = ref(1)
const historyLoading = ref(false)
const history = ref({ data: [], total: 0, page: 1, per_page: 20 })

let debounceTimer = null
function debouncedFetchHistory() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    historyPage.value = 1
    fetchHistory()
  }, 400)
}

const studentCards = computed(() => [
  { label: 'Hadir',  count: data.value.student_counts.hadir, icon: 'check-circle', bg: 'bg-gradient-to-br from-green-500 to-emerald-600' },
  { label: 'Izin',   count: data.value.student_counts.izin,  icon: 'clock',        bg: 'bg-gradient-to-br from-yellow-400 to-amber-500' },
  { label: 'Sakit',  count: data.value.student_counts.sakit, icon: 'heart',        bg: 'bg-gradient-to-br from-orange-500 to-red-500' },
  { label: 'Alpa',   count: data.value.student_counts.alpa,  icon: 'x-circle',     bg: 'bg-gradient-to-br from-red-600 to-rose-700' },
])

const studentSections = computed(() => [
  { status: 'izin',  title: 'Santri Izin',  students: data.value.izin_students,  color: 'yellow', icon: 'clock' },
  { status: 'sakit', title: 'Santri Sakit',  students: data.value.sakit_students, color: 'orange', icon: 'heart' },
  { status: 'alpa',  title: 'Santri Alpa',   students: data.value.alpa_students,  color: 'red',    icon: 'x-circle' },
])

function getStatusBadge(status) {
  const s = (status || '').toLowerCase()
  if (s === 'hadir') return 'bg-emerald-100 text-emerald-700'
  if (s === 'izin') return 'bg-blue-100 text-blue-700'
  if (s === 'sakit') return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}


// Chart
const hasChartData = computed(() => {
  const cd = data.value.chart_data
  return cd && cd.length > 0 && cd.some(d => d.value > 0)
})

const chartConfig = computed(() => ({
  labels: (data.value.chart_data || []).map(d => d.name),
  datasets: [{
    label: 'Jumlah',
    data: (data.value.chart_data || []).map(d => d.value),
    backgroundColor: ['#22c55e', '#eab308', '#f97316', '#ef4444'],
    borderRadius: 8,
    borderSkipped: false,
    barPercentage: 0.6,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1f2937',
      titleFont: { size: 13 },
      bodyFont: { size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { precision: 0, font: { size: 11 } },
      grid: { color: '#f3f4f6' },
    },
    x: {
      ticks: { font: { size: 12 } },
      grid: { display: false },
    },
  },
}

onMounted(async () => {
  await Promise.all([fetchStats(), fetchKelas()])
})

// watch for route type changes (Formal <-> Diniyyah)
watch(isDiniyyah, () => {
  fetchStats()
  if (activeTab.value === 'history') {
    historyPage.value = 1
    fetchHistory()
  }
})

function onTabChange(tab) {
  activeTab.value = tab
  if (tab === 'history' && !history.value.data?.length) {
    fetchHistory()
  }
}

async function fetchStats() {
  loading.value = true
  try {
    const params = {
      type: isDiniyyah.value ? 'diniyyah' : 'formal',
      ...filters.value,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const res = await api.get('/attendance/statistics', { params })
    data.value = res.data
  } catch (err) {
    console.error('Failed to fetch statistics:', err)
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

async function fetchHistory() {
  historyLoading.value = true
  try {
    const params = {
      type: isDiniyyah.value ? 'diniyyah' : 'formal',
      start_date: filters.value.start_date,
      end_date: filters.value.end_date,
      kelas_id: filters.value.kelas_id || undefined,
      gender: filters.value.gender || undefined,
      jenjang: filters.value.jenjang || undefined,
      status: filters.value.status || undefined,
      search: historySearch.value || undefined,
      page: historyPage.value,
      per_page: 20,
    }
    Object.keys(params).forEach(k => { if (params[k] === undefined) delete params[k] })
    const res = await api.get('/attendance/history', { params })
    history.value = res.data
  } catch (err) {
    console.error('Failed to fetch history:', err)
  } finally {
    historyLoading.value = false
  }
}

async function exportFile(format) {
  exporting.value = format
  try {
    const params = {
      type: isDiniyyah.value ? 'diniyyah' : 'formal',
      ...filters.value,
    }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const res = await api.get(`/attendance/export/${format}`, {
      params,
      responseType: 'blob',
    })
    const ext = format === 'excel' ? 'xlsx' : 'pdf'
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `absensi_${params.type}_${params.start_date || 'all'}_${params.end_date || 'all'}.${ext}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error(`Export ${format} failed:`, err)
  } finally {
    exporting.value = null
  }
}

function resetFilters() {
  filters.value = {
    start_date: firstDay,
    end_date: today,
    kelas_id: '',
    gender: '',
    jenjang: '',
    status: '',
  }
  fetchStats()
  if (activeTab.value === 'history') fetchHistory()
}

function formatDate(d) {
  if (!d) return '-'
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (e) {
    return '-'
  }
}

function statusBadge(status) {
  const map = {
    hadir: 'px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700',
    izin:  'px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-100 text-yellow-700',
    sakit: 'px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700',
    alpa:  'px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700',
  }
  return map[status?.toLowerCase()] || map.alpa
}
</script>

<style scoped>
.btn-export {
  @apply flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm;
}
</style>
