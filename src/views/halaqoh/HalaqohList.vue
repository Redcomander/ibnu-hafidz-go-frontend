<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Halaqoh</h1>
        <p class="text-gray-500 text-xs sm:text-sm mt-0.5">
          Penugasan guru &amp; absensi tahfidz Al-Qur'an
        </p>
      </div>
      <div class="flex items-center gap-2 sm:gap-3">
        <input
          v-if="store.canFilterByDate"
          v-model="selectedDate"
          type="date"
          class="input-field text-sm w-auto"
          @change="loadData"
        />
        <select v-model="selectedGender" class="input-field text-sm w-auto min-w-[170px]">
          <option value="">Semua (Banin & Banat)</option>
          <option value="banin">Banin (Putra)</option>
          <option value="banat">Banat (Putri)</option>
        </select>
        <button
          v-if="auth.hasPermission('halaqoh-assignments.create')"
          @click="showCreateForm = true"
          class="btn-primary flex items-center gap-1.5 text-sm px-3 py-2"
        >
          <SvgIcon name="plus" :size="16" />
          <span class="hidden sm:inline">Tambah Penugasan</span>
          <span class="sm:hidden">Tambah</span>
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="relative">
      <SvgIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        v-model="rawSearch"
        type="text"
        placeholder="Cari guru atau santri..."
        class="input-field input-with-icon text-sm w-full sm:w-80"
      />
      <button
        v-if="rawSearch"
        @click="rawSearch = ''; searchQuery = ''"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <SvgIcon name="x" :size="14" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="text-center py-12">
      <div class="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-gray-500 mt-2 text-sm">Memuat data...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!filteredGroups.length"
      class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center"
    >
      <div class="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <SvgIcon name="book-open" :size="24" class="text-emerald-500" />
      </div>
      <h3 class="text-base font-semibold text-gray-700">
        {{ searchQuery ? 'Tidak ditemukan' : 'Belum ada penugasan' }}
      </h3>
      <p class="text-gray-400 mt-1 text-xs sm:text-sm">
        {{ searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Mulai dengan menambahkan penugasan guru ke santri' }}
      </p>
    </div>

    <!-- Teacher Groups -->
    <template v-else>
      <p v-if="searchQuery" class="text-xs text-gray-500">
        Menampilkan {{ filteredGroups.length }} dari {{ store.groups.length }} kelompok
      </p>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div
          v-for="group in filteredGroups"
        :key="group.teacher_id"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
      >
        <!-- Teacher Header -->
        <div class="bg-primary-dark px-4 sm:px-5 py-3 sm:py-4 text-white">
          <!-- Teacher Name + Info -->
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              {{ group.teacher_name.charAt(0) }}
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-sm leading-tight truncate">{{ group.teacher_name }}</h3>
              <p class="text-emerald-100 text-xs mt-0.5">{{ group.assignments.length }} Santri</p>
              <!-- Role badges -->
              <div class="flex flex-wrap gap-1 mt-1.5">
                <span
                  v-if="getAccessInfo(group.teacher_id)?.is_substitute"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/30 text-blue-100"
                >
                  <SvgIcon name="users" :size="10" /> Guru Pengganti
                </span>
                <span
                  v-if="getAccessInfo(group.teacher_id)?.is_helper"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/30 text-purple-100"
                >
                  <SvgIcon name="users" :size="10" /> Guru Pendamping
                </span>
                <span
                  v-if="getHelperName(group) && !getAccessInfo(group.teacher_id)?.is_helper"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/30 text-purple-100"
                  :title="'Guru Pendamping: ' + getHelperName(group)"
                >
                  <SvgIcon name="users" :size="10" /> Pendamping: {{ getHelperName(group) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Student Attendance Status -->
          <div class="mt-3 p-2.5 bg-white/10 rounded-lg">
            <div class="flex items-center gap-1.5 mb-2">
              <SvgIcon name="clipboard-check" :size="12" class="text-emerald-100" />
              <span class="text-[10px] font-semibold text-emerald-100 uppercase tracking-wide">Status Absen Santri</span>
            </div>
            <div class="grid grid-cols-3 gap-1.5">
              <div
                v-for="badge in getStudentBadges(group.teacher_id)"
                :key="badge.session"
                :class="[
                  'flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-md border text-center',
                  badge.completed
                    ? 'bg-green-500/30 border-green-300/50'
                    : badge.partial
                    ? 'bg-yellow-500/30 border-yellow-300/50'
                    : 'bg-white/10 border-white/20',
                ]"
              >
                <SvgIcon
                  :name="badge.completed ? 'check-circle' : badge.partial ? 'clock' : 'x-circle'"
                  :size="16"
                  :class="badge.completed ? 'text-green-200' : badge.partial ? 'text-yellow-200' : 'text-white/40'"
                />
                <span class="text-[10px] font-bold text-white">{{ badge.session }}</span>
                <span class="text-[9px] text-emerald-100">{{ badge.count }}/{{ badge.total }}</span>
              </div>
            </div>
          </div>

          <!-- Teacher Attendance Status -->
          <div class="mt-2 p-2.5 bg-white/10 rounded-lg">
            <div class="flex items-center gap-1.5 mb-2">
              <SvgIcon name="user-check" :size="12" class="text-emerald-100" />
              <span class="text-[10px] font-semibold text-emerald-100 uppercase tracking-wide">Status Absen Guru</span>
            </div>
            <div class="grid grid-cols-3 gap-1.5">
              <div
                v-for="sess in sessions"
                :key="sess"
                :class="[
                  'flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-md border text-center',
                  getTeacherAttStatus(group.teacher_id, sess).bgClass,
                ]"
              >
                <SvgIcon
                  :name="getTeacherAttStatus(group.teacher_id, sess).icon"
                  :size="16"
                  :class="getTeacherAttStatus(group.teacher_id, sess).iconClass"
                />
                <span class="text-[10px] font-bold text-white">{{ sess }}</span>
                <span class="text-[9px] text-emerald-100">{{ getTeacherAttStatus(group.teacher_id, sess).label }}</span>
              </div>
            </div>
          </div>

          <!-- Substitute Info -->
          <div
            v-if="getSubstituteInfos(group.teacher_id).length"
            class="mt-2 p-2.5 bg-amber-500/20 border border-amber-300/40 rounded-lg"
          >
            <div class="flex items-center gap-1.5 mb-1.5">
              <SvgIcon name="alert-triangle" :size="12" class="text-amber-200" />
              <span class="text-[10px] font-semibold text-amber-100 uppercase tracking-wide">Guru Pengganti Ditugaskan</span>
            </div>
            <div
              v-for="sub in getSubstituteInfos(group.teacher_id)"
              :key="sub.session"
              class="border-l-2 border-amber-300/60 pl-2 mb-1.5 last:mb-0"
            >
              <p class="text-xs text-white font-medium">
                {{ sub.substitute_name }} <span class="text-emerald-100">({{ sub.session }})</span>
              </p>
              <div class="flex flex-wrap gap-1.5 text-[10px] text-amber-100 mt-0.5">
                <span class="px-1.5 py-0.5 bg-amber-500/40 rounded font-semibold">{{ sub.status }}</span>
                <span v-if="sub.reason" class="truncate">{{ sub.reason }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div
            class="flex flex-wrap gap-1.5 sm:gap-2 mt-3"
            v-if="getAccessInfo(group.teacher_id)?.can_access_attendance"
          >
            <button
              @click="openStudentAttendance(group)"
              class="flex-1 min-w-[100px] text-xs bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <SvgIcon name="clipboard-check" :size="13" />
              Absen Santri
            </button>
            <button
              v-if="canOpenTeacherAttendance(group)"
              @click="openTeacherAttendance(group)"
              class="flex-1 min-w-[100px] text-xs bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <SvgIcon name="user-check" :size="13" />
              Absen Guru
            </button>
            <button
              v-if="getAccessInfo(group.teacher_id)?.can_manage"
              @click="editAssignment(group)"
              class="text-xs bg-white/15 hover:bg-white/25 text-white px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              title="Edit Penugasan"
            >
              <SvgIcon name="edit" :size="13" />
              <span class="hidden sm:inline">Edit</span>
            </button>
            <button
              v-if="getAccessInfo(group.teacher_id)?.can_manage"
              @click="openSubstitute(group)"
              class="text-xs bg-white/15 hover:bg-white/25 text-white px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              title="Guru Pengganti"
            >
              <SvgIcon name="user-plus" :size="13" />
              <span class="hidden sm:inline">Pengganti</span>
            </button>
          </div>
        </div>

        <!-- Student List -->
        <div class="p-3 sm:p-4 space-y-1.5 sm:space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
          <div
            v-for="assignment in group.assignments"
            :key="assignment.id"
            class="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors gap-2"
          >
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                :class="[
                  'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0',
                  assignment.student?.jenis_kelamin === 'Laki-Laki'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-pink-100 text-pink-700',
                ]"
              >
                {{ assignment.student?.nama_lengkap?.charAt(0) || '?' }}
              </div>
              <div class="min-w-0">
                <p class="text-xs sm:text-sm font-medium text-gray-800 truncate">
                  {{ assignment.student?.nama_lengkap || 'Santri #' + assignment.student_id }}
                </p>
              </div>
            </div>

            <!-- Per-session attendance badges -->
            <div class="flex gap-1 flex-shrink-0">
              <span
                v-for="sess in sessions"
                :key="sess"
                :class="[
                  'text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium whitespace-nowrap',
                  assignment.has_attendance_today?.[sess]
                    ? sessionStyles[sess].badge
                    : 'bg-gray-200 text-gray-400',
                ]"
                :title="sess + (assignment.has_attendance_today?.[sess] ? ': Sudah absen' : ': Belum absen')"
              >
                {{ sess.charAt(0) }}
                <SvgIcon
                  v-if="assignment.has_attendance_today?.[sess]"
                  name="check"
                  :size="8"
                  class="inline-block -mt-px"
                />
              </span>
            </div>
          </div>

          <!-- Delete Group Button -->
          <button
            v-if="getAccessInfo(group.teacher_id)?.can_manage"
            @click="confirmDeleteGroup(group)"
            class="w-full mt-2 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <SvgIcon name="trash" :size="13" />
            Hapus Semua Penugasan Guru Ini
          </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <HalaqohAssignmentForm
      v-if="showCreateForm || editingGroup"
      :editing-group="editingGroup"
      @close="showCreateForm = false; editingGroup = null"
      @saved="onAssignmentSaved"
    />

    <HalaqohAttendanceModal
      v-if="attendanceGroup"
      :group="attendanceGroup"
      :date="selectedDate"
      :initial-session="activeSession"
      :session-times="store.sessionTimes"
      @close="attendanceGroup = null"
      @saved="loadData"
    />

    <HalaqohTeacherAttendanceModal
      v-if="teacherAttendanceGroup"
      :group="teacherAttendanceGroup"
      :date="selectedDate"
      :initial-session="activeSession"
      :session-times="store.sessionTimes"
      @close="teacherAttendanceGroup = null"
      @saved="loadData"
    />

    <HalaqohSubstituteForm
      v-if="substituteGroup"
      :group="substituteGroup"
      :date="selectedDate"
      @close="substituteGroup = null"
      @saved="loadData"
    />

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="deleteTarget = null"
      >
        <div class="bg-white rounded-xl shadow-xl p-5 sm:p-6 max-w-sm w-full">
          <h3 class="text-base font-bold text-gray-800">Konfirmasi Hapus</h3>
          <p class="text-gray-500 text-sm mt-2">
            Hapus semua penugasan <strong>{{ deleteTarget.teacher_name }}</strong>?
            Data absensi sebelumnya tetap tersimpan.
          </p>
          <div class="flex gap-3 mt-5">
            <button
              @click="deleteTarget = null"
              class="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              @click="executeDelete"
              class="flex-1 px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useHalaqohStore } from '@/stores/halaqoh'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import HalaqohAssignmentForm from './components/HalaqohAssignmentForm.vue'
import HalaqohAttendanceModal from './components/HalaqohAttendanceModal.vue'
import HalaqohTeacherAttendanceModal from './components/HalaqohTeacherAttendanceModal.vue'
import HalaqohSubstituteForm from './components/HalaqohSubstituteForm.vue'

const store = useHalaqohStore()
const auth = useAuthStore()
const toast = useToastStore()

const sessions = ['Shubuh', 'Ashar', 'Isya']
const activeSession = ref('Shubuh')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const selectedGender = ref('')
const rawSearch = ref('')
const searchQuery = ref('')
let debounceTimer = null

watch(rawSearch, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchQuery.value = val.trim()
  }, 300)
})

onUnmounted(() => clearTimeout(debounceTimer))

const filteredGroups = computed(() => {
  const q = searchQuery.value.toLowerCase()
  const gender = selectedGender.value

  return (store.groups || []).map((group) => {
    const assignments = (group.assignments || []).filter((a) => {
      if (!gender) return true
      return classifyGender(a.student?.jenis_kelamin) === gender
    })

    return {
      ...group,
      assignments,
    }
  }).filter((group) => {
    if (!group.assignments.length) return false
    if (!q) return true
    if (group.teacher_name?.toLowerCase().includes(q)) return true
    return group.assignments.some((a) =>
      (a.student?.nama_lengkap || '').toLowerCase().includes(q),
    )
  })
})

function classifyGender(rawGender) {
  const normalized = String(rawGender || '').trim().toLowerCase()
  if (normalized === 'laki-laki' || normalized === 'laki laki' || normalized === 'putra' || normalized === 'banin') {
    return 'banin'
  }
  if (normalized === 'perempuan' || normalized === 'putri' || normalized === 'banat') {
    return 'banat'
  }
  return ''
}

const sessionStyles = {
  Shubuh: {
    tabActive: 'bg-indigo-500 text-white shadow-sm',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  Ashar: {
    tabActive: 'bg-amber-500 text-white shadow-sm',
    badge: 'bg-amber-100 text-amber-700',
  },
  Isya: {
    tabActive: 'bg-purple-500 text-white shadow-sm',
    badge: 'bg-purple-100 text-purple-700',
  },
}

// Modals
const showCreateForm = ref(false)
const editingGroup = ref(null)
const attendanceGroup = ref(null)
const teacherAttendanceGroup = ref(null)
const substituteGroup = ref(null)
const deleteTarget = ref(null)

onMounted(loadData)

async function loadData() {
  try {
    await store.fetchAssignments(selectedDate.value)
  } catch (err) {
    toast.error('Gagal memuat data Halaqoh')
  }
}

// ── Badge helpers ──

function getStudentBadges(teacherId) {
  const badge = store.badges?.find((b) => b.teacher_id === teacherId)
  return badge?.student_attendance || sessions.map((s) => ({
    session: s, count: 0, total: 0, completed: false, partial: false,
  }))
}

function getTeacherAttStatus(teacherId, session) {
  const badge = store.badges?.find((b) => b.teacher_id === teacherId)
  const hasAtt = badge?.has_teacher_attendance?.[session]
  const status = badge?.teacher_attendance?.[session] || ''

  if (!hasAtt) {
    return {
      icon: 'info',
      iconClass: 'text-white/40',
      bgClass: 'bg-white/10 border-white/20',
      label: 'Belum',
    }
  }
  switch (status) {
    case 'Hadir':
      return {
        icon: 'check-circle',
        iconClass: 'text-green-200',
        bgClass: 'bg-green-500/30 border-green-300/50',
        label: 'Hadir',
      }
    case 'Izin':
      return {
        icon: 'file-text',
        iconClass: 'text-blue-200',
        bgClass: 'bg-blue-500/30 border-blue-300/50',
        label: 'Izin',
      }
    case 'Sakit':
      return {
        icon: 'alert-triangle',
        iconClass: 'text-yellow-200',
        bgClass: 'bg-yellow-500/30 border-yellow-300/50',
        label: 'Sakit',
      }
    case 'Alpha':
      return {
        icon: 'x-circle',
        iconClass: 'text-red-200',
        bgClass: 'bg-red-500/30 border-red-300/50',
        label: 'Alpha',
      }
    default:
      return {
        icon: 'info',
        iconClass: 'text-white/40',
        bgClass: 'bg-white/10 border-white/20',
        label: status || 'Tidak Diketahui',
      }
  }
}

function getSubstituteInfos(teacherId) {
  return (store.substituteInfos || []).filter((s) => s.teacher_id === teacherId)
}

function getAccessInfo(teacherId) {
  return (store.accessInfos || []).find((a) => a.teacher_id === teacherId) || {
    can_access_attendance: false,
    can_manage: false,
    is_substitute: false,
    is_helper: false,
  }
}

function getHelperName(group) {
  const first = group.assignments?.[0]
  return first?.helper_teacher?.name || null
}

function canOpenTeacherAttendance(group) {
  const access = getAccessInfo(group.teacher_id)
  return !!(access.can_manage || access.is_substitute || store.currentUserId === group.teacher_id)
}

// ── Actions ──

function openStudentAttendance(group) {
  attendanceGroup.value = group
}

function openTeacherAttendance(group) {
  teacherAttendanceGroup.value = group
}

function editAssignment(group) {
  editingGroup.value = group
}

function openSubstitute(group) {
  substituteGroup.value = group
}

function onAssignmentSaved() {
  showCreateForm.value = false
  editingGroup.value = null
  loadData()
}

function confirmDeleteGroup(group) {
  deleteTarget.value = group
}

async function executeDelete() {
  try {
    await store.deleteAssignmentsByTeacher(deleteTarget.value.teacher_id)
    toast.success('Penugasan berhasil dihapus')
    deleteTarget.value = null
    loadData()
  } catch (err) {
    toast.error('Gagal menghapus penugasan')
  }
}
</script>
