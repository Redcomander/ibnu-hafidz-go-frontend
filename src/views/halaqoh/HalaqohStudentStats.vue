<template>
  <div class="space-y-6">
    <!-- Header Page -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Rekapan Halaqoh Santri</h2>
        <p class="text-gray-500 text-sm mt-1">
          Statistik absensi halaqoh santri berdasarkan filter
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
          <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin Santri</label>
          <select v-model="filters.gender" class="input-field">
            <option value="">Semua (Banin & Banat)</option>
            <option value="banin">Banin</option>
            <option value="banat">Banat</option>
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

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Chart Card (Takes 1 Col on LG) -->
      <div class="col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Grafik Absensi Santri</h3>
        <div class="relative h-64 overflow-hidden rounded-lg">
          <DoughnutChart v-if="hasData" :data="chartDataFormatted" :options="chartOptions" />
          <div v-else class="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400">
            Belum ada data
          </div>
        </div>
      </div>

      <!-- Detail Lists (Takes 2 Cols on LG) -->
      <div class="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- Izin List -->
        <div class="bg-amber-50 rounded-xl border border-amber-100 overflow-hidden flex flex-col">
          <div class="bg-amber-100 p-3 flex justify-between items-center">
            <span class="font-bold text-amber-800 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-amber-500"></span> Izin
            </span>
            <span class="bg-white px-2 py-0.5 rounded-md text-sm font-bold text-amber-600">
              {{ izinStudents.length }}
            </span>
          </div>
          <div class="p-3 flex-1 overflow-y-auto max-h-64 h-64">
            <ul v-if="izinStudents.length > 0" class="space-y-1">
              <li v-for="(name, idx) in izinStudents" :key="idx" class="text-sm text-gray-700 py-1 border-b border-amber-100 last:border-0 pl-2 border-l-2 border-l-amber-400">
                {{ name }}
              </li>
            </ul>
            <div v-else class="h-full flex flex-col items-center justify-center text-amber-400/70">
              <SvgIcon name="check-circle" :size="24" class="mb-2" />
              <span class="text-sm">Nihil</span>
            </div>
          </div>
        </div>

        <!-- Sakit List -->
        <div class="bg-blue-50 rounded-xl border border-blue-100 overflow-hidden flex flex-col">
          <div class="bg-blue-100 p-3 flex justify-between items-center">
            <span class="font-bold text-blue-800 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-blue-500"></span> Sakit
            </span>
            <span class="bg-white px-2 py-0.5 rounded-md text-sm font-bold text-blue-600">
              {{ sakitStudents.length }}
            </span>
          </div>
          <div class="p-3 flex-1 overflow-y-auto max-h-64 h-64">
            <ul v-if="sakitStudents.length > 0" class="space-y-1">
              <li v-for="(name, idx) in sakitStudents" :key="idx" class="text-sm text-gray-700 py-1 border-b border-blue-100 last:border-0 pl-2 border-l-2 border-l-blue-400">
                {{ name }}
              </li>
            </ul>
            <div v-else class="h-full flex flex-col items-center justify-center text-blue-400/70">
              <SvgIcon name="check-circle" :size="24" class="mb-2" />
              <span class="text-sm">Nihil</span>
            </div>
          </div>
        </div>

        <!-- Alpa List -->
        <div class="bg-red-50 rounded-xl border border-red-100 overflow-hidden flex flex-col">
          <div class="bg-red-100 p-3 flex justify-between items-center">
            <span class="font-bold text-red-800 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-red-500"></span> Alpha
            </span>
            <span class="bg-white px-2 py-0.5 rounded-md text-sm font-bold text-red-600">
              {{ alpaStudents.length }}
            </span>
          </div>
          <div class="p-3 flex-1 overflow-y-auto max-h-64 h-64">
            <ul v-if="alpaStudents.length > 0" class="space-y-1">
              <li v-for="(name, idx) in alpaStudents" :key="idx" class="text-sm text-gray-700 py-1 border-b border-red-100 last:border-0 pl-2 border-l-2 border-l-red-400">
                {{ name }}
              </li>
            </ul>
            <div v-else class="h-full flex flex-col items-center justify-center text-red-400/70">
              <SvgIcon name="check-circle" :size="24" class="mb-2" />
              <span class="text-sm">Nihil</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/api'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)


const filters = ref({
  start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10),
  end_date: new Date().toISOString().substring(0, 10),
  teacher_id: '',
  gender: ''
})

// Data references
const loading = ref(false)
const exporting = ref(null)
const teachers = ref([])

// Stats references
const rawChartData = ref([])
const izinStudents = ref([])
const sakitStudents = ref([])
const alpaStudents = ref([])

onMounted(async () => {
  await fetchStats()
})

const fetchStats = async () => {
  loading.value = true
  try {
    const query = new URLSearchParams()
    Object.entries(filters.value).forEach(([k, v]) => {
      if (v) query.append(k, v)
    })
    
    // We expect the backend to return { chartData, teachers, izinStudents, sakitStudents, alpaStudents }
    const res = await api.get(`/halaqoh/statistics/students?${query.toString()}`)
    
    // In actual implementation, we'd adjust to whatever structure `GetHalaqohStudentStatistics` provides
    rawChartData.value = res.data.chartData || []
    izinStudents.value = res.data.izinStudents || []
    sakitStudents.value = res.data.sakitStudents || []
    alpaStudents.value = res.data.alpaStudents || []

    // Cache the teachers list if returned (to avoid fetching it separately)
    if (res.data.teachers && teachers.value.length === 0) {
      // Extract unique teachers from the assignments if not directly provided
      // Wait, our backend currently does NOT return teachers list dynamically in halaqoh_stats.go
      // Let's fetch it from another endpoint or assume it is handled. E.g `/users` with `is_teacher=true`
    }
    
    // Fallback: load teachers list from general users endpoint
    if (teachers.value.length === 0) {
       loadTeachers()
    }
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

// Chart computed properties
const hasData = computed(() => {
  return rawChartData.value.some(d => d.value > 0)
})

const chartDataFormatted = computed(() => {
  const lbls = []
  const dt = []
  const bg = []
  
  rawChartData.value.forEach(item => {
    lbls.push(item.name)
    dt.push(item.value)
    
    // Map colors
    if(item.name === 'Hadir') bg.push('#10B981') // emerald-500
    else if(item.name === 'Izin') bg.push('#F59E0B') // amber-500
    else if(item.name === 'Sakit') bg.push('#3B82F6') // blue-500
    else if(item.name === 'Alpha' || item.name === 'Alpa') bg.push('#EF4444') // red-500
    else bg.push('#9CA3AF') // gray-400
  })

  return {
    labels: lbls,
    datasets: [{
      data: dt,
      backgroundColor: bg,
      borderWidth: 0,
      hoverOffset: 4
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: { family: "'Inter', sans-serif" }
      }
    }
  },
  cutout: '65%' // Makes it a nice doughnut
}

// Re-map Doughnut for Vue template since we imported it as Doughnut
const DoughnutChart = Doughnut

async function exportFile(format) {
  if (exporting.value) return
  exporting.value = format

  try {
    const query = new URLSearchParams()
    Object.entries(filters.value).forEach(([k, v]) => {
      if (v) query.append(k, v)
    })

    // Example URL: /halaqoh/export/student/pdf (To be fully implemented in Go)
    const url = format === 'pdf' 
      ? `/halaqoh/export/student/pdf?${query.toString()}`
      : `/halaqoh/export/student/excel?${query.toString()}`

    const response = await api.get(url, { responseType: 'blob' })
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = urlBlob
    link.setAttribute('download', `Rekapan_Halaqoh_Santri_${format.toUpperCase()}.${format === 'excel' ? 'xlsx' : 'pdf'}`)
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
  @apply px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-transparent shadow-sm  disabled:opacity-70 disabled:cursor-not-allowed;
}
</style>
