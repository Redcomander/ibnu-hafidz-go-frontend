<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Riwayat Absensi Halaqoh</h1>
        <p class="text-gray-500 text-sm mt-1">
          Riwayat kehadiran santri dan guru
        </p>
      </div>
    </div>

    <!-- Tabs: Student / Teacher -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-1 inline-flex gap-1">
      <button
        @click="activeTab = 'students'"
        :class="[
          'px-5 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'students'
            ? 'bg-emerald-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
        ]"
      >
        Santri
      </button>
      <button
        @click="activeTab = 'teachers'"
        :class="[
          'px-5 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'teachers'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
        ]"
      >
        Guru
      </button>
    </div>

    <!-- Filters -->
    <div
      class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4"
    >
      <div class="flex-1 min-w-[120px]">
        <label class="block text-xs text-gray-500 mb-1">Mulai</label>
        <input v-model="filters.start_date" type="date" class="input-field text-sm" @change="loadHistory" />
      </div>
      <div class="flex-1 min-w-[120px]">
        <label class="block text-xs text-gray-500 mb-1">Selesai</label>
        <input v-model="filters.end_date" type="date" class="input-field text-sm" @change="loadHistory" />
      </div>
      <div class="flex-1 min-w-[100px]">
        <label class="block text-xs text-gray-500 mb-1">Sesi</label>
        <select v-model="filters.session" class="input-field text-sm" @change="loadHistory">
          <option value="">Semua</option>
          <option v-for="s in sessions" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="flex-1 min-w-[100px]">
        <label class="block text-xs text-gray-500 mb-1">Status</label>
        <select v-model="filters.status" class="input-field text-sm" @change="loadHistory">
          <option value="">Semua</option>
          <option v-for="st in currentStatusOptions" :key="st" :value="st">{{ st }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>

    <!-- Student History -->
    <div
      v-else-if="activeTab === 'students'"
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Tanggal</th>
              <th class="px-4 py-3 text-left font-medium">Sesi</th>
              <th class="px-4 py-3 text-left font-medium">Santri</th>
              <th class="px-4 py-3 text-left font-medium">Guru</th>
              <th class="px-4 py-3 text-center font-medium">Status</th>
              <th class="px-4 py-3 text-left font-medium">Catatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="record in studentData.data"
              :key="record.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-gray-700">{{ formatDate(record.date) }}</td>
              <td class="px-4 py-3">
                <span :class="sessionBadgeClass(record.session)">{{ record.session }}</span>
              </td>
              <td class="px-4 py-3 font-medium text-gray-800">
                {{ record.snapshot?.student_name || record.halaqoh_assignment?.student?.nama_lengkap || '-' }}
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ record.snapshot?.teacher_name || record.halaqoh_assignment?.teacher?.name || '-' }}
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="statusBadgeClass(record.status)">{{ record.status }}</span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ record.notes || '-' }}</td>
            </tr>
            <tr v-if="!studentData.data?.length">
              <td colspan="6" class="px-4 py-8 text-center text-gray-400">
                Tidak ada riwayat ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="studentData.total_pages > 1"
        :current="studentData.page"
        :total="studentData.total_pages"
        @change="(p) => { filters.page = p; loadHistory() }"
      />
    </div>

    <!-- Teacher History -->
    <div
      v-else
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Tanggal</th>
              <th class="px-4 py-3 text-left font-medium">Sesi</th>
              <th class="px-4 py-3 text-left font-medium">Guru</th>
              <th class="px-4 py-3 text-center font-medium">Status</th>
              <th class="px-4 py-3 text-left font-medium">Catatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="record in teacherData.data"
              :key="record.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-gray-700">{{ formatDate(record.date) }}</td>
              <td class="px-4 py-3">
                <span :class="sessionBadgeClass(record.session)">{{ record.session }}</span>
              </td>
              <td class="px-4 py-3 font-medium text-gray-800">
                {{ record.teacher?.name || '-' }}
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="statusBadgeClass(record.status)">{{ record.status }}</span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ record.notes || '-' }}</td>
            </tr>
            <tr v-if="!teacherData.data?.length">
              <td colspan="5" class="px-4 py-8 text-center text-gray-400">
                Tidak ada riwayat ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="teacherData.total_pages > 1"
        :current="teacherData.page"
        :total="teacherData.total_pages"
        @change="(p) => { filters.page = p; loadHistory() }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useHalaqohStore } from '@/stores/halaqoh'

const store = useHalaqohStore()

const sessions = ['Shubuh', 'Ashar', 'Isya']
const activeTab = ref('students')
const loading = ref(false)

const filters = ref({
  start_date: '',
  end_date: '',
  session: '',
  status: '',
  page: 1,
})

const studentData = computed(() => store.studentHistory)
const teacherData = computed(() => store.teacherHistory)

const currentStatusOptions = computed(() =>
  activeTab.value === 'students'
    ? ['hadir', 'izin', 'sakit', 'alpa']
    : ['Hadir', 'Izin', 'Sakit', 'Alpha']
)

watch(activeTab, () => {
  filters.value.page = 1
  filters.value.status = ''
  loadHistory()
})

onMounted(loadHistory)

async function loadHistory() {
  loading.value = true
  try {
    const params = { ...filters.value }
    Object.keys(params).forEach((k) => !params[k] && delete params[k])

    if (activeTab.value === 'students') {
      await store.fetchStudentHistory(params)
    } else {
      await store.fetchTeacherHistory(params)
    }
  } finally {
    loading.value = false
  }
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function sessionBadgeClass(session) {
  const map = {
    Shubuh: 'bg-indigo-100 text-indigo-700',
    Ashar: 'bg-amber-100 text-amber-700',
    Isya: 'bg-purple-100 text-purple-700',
  }
  return `text-xs px-2 py-0.5 rounded-full font-medium ${map[session] || 'bg-gray-100 text-gray-600'}`
}

function statusBadgeClass(status) {
  const s = (status || '').toLowerCase()
  const map = {
    hadir: 'bg-emerald-100 text-emerald-700',
    izin: 'bg-blue-100 text-blue-700',
    sakit: 'bg-amber-100 text-amber-700',
    alpa: 'bg-red-100 text-red-700',
    alpha: 'bg-red-100 text-red-700',
  }
  return `text-xs px-2 py-0.5 rounded-full font-medium ${map[s] || 'bg-gray-100 text-gray-600'}`
}

// Simple Pagination component inline
const Pagination = {
  props: ['current', 'total'],
  emits: ['change'],
  template: `
    <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <button @click="$emit('change', current-1)" :disabled="current <= 1"
        class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
        ← Sebelumnya
      </button>
      <span class="text-sm text-gray-500">Halaman {{ current }} dari {{ total }}</span>
      <button @click="$emit('change', current+1)" :disabled="current >= total"
        class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
        Selanjutnya →
      </button>
    </div>
  `,
}
</script>
