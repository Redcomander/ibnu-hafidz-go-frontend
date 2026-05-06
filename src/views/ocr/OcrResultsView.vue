<template>
  <div class="space-y-5">
    <div class="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-lg sm:text-xl font-bold text-gray-800">Hasil OCR Terintegrasi</h1>
          <p class="text-sm text-gray-500">Rekap hasil per pelajaran, kelas, dan guru pengampu.</p>
        </div>
        <button
          class="btn-primary text-sm px-4 py-2 rounded-lg"
          :disabled="loading"
          @click="loadResultLinks(true)"
        >
          {{ loading ? 'Memuat...' : 'Refresh' }}
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <div>
          <label class="text-xs font-medium text-gray-500">Tipe Pelajaran</label>
          <select
            v-model="lessonType"
            class="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            @change="onLessonTypeChange"
          >
            <option value="">Semua tipe</option>
            <option value="formal">Formal</option>
            <option value="diniyyah">Diniyyah</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500">Pelajaran</label>
          <select
            v-model="selectedLessonId"
            class="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            @change="loadResultLinks(true)"
          >
            <option :value="null">Semua pelajaran</option>
            <option v-for="lesson in lessons" :key="lesson.id" :value="lesson.id">{{ lesson.name || `Pelajaran #${lesson.id}` }}</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500">Kelas</label>
          <select
            v-model="selectedClassId"
            class="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            @change="loadResultLinks(true)"
          >
            <option :value="null">Semua kelas</option>
            <option v-for="k in classes" :key="k.id" :value="k.id">{{ classLabel(k) }}</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500">Guru</label>
          <select
            v-model="selectedTeacherId"
            class="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            @change="loadResultLinks(true)"
          >
            <option :value="null">Semua guru</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name || `Guru #${t.id}` }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">
      Memuat hasil OCR...
    </div>

    <div v-if="mappingSuccessMessage" class="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700">
      {{ mappingSuccessMessage }}
    </div>

    <div v-else-if="resultGroups.length === 0" class="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-400 italic">
      Belum ada data hasil OCR untuk filter saat ini.
    </div>

    <div v-else class="space-y-4">
      <div class="px-1 text-xs text-gray-500">
        Menampilkan {{ rows.length }} dari {{ totalRows }} hasil.
      </div>

      <div
        v-for="group in resultGroups"
        :key="group.key"
        class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 space-y-3"
      >
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
          <div class="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
            <p class="text-[11px] uppercase tracking-wide text-gray-400">Pelajaran</p>
            <p class="font-semibold text-gray-800 mt-0.5">{{ group.lessonName }}</p>
          </div>
          <div class="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
            <p class="text-[11px] uppercase tracking-wide text-gray-400">Kelas</p>
            <p class="font-semibold text-gray-800 mt-0.5">{{ group.kelasName }}</p>
          </div>
          <div class="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
            <p class="text-[11px] uppercase tracking-wide text-gray-400">Guru</p>
            <p class="font-semibold text-gray-800 mt-0.5">{{ group.teacherName }}</p>
          </div>
          <div class="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
            <p class="text-[11px] uppercase tracking-wide text-gray-400">Jumlah Scan</p>
            <p class="font-semibold text-gray-800 mt-0.5">{{ group.results.length }}</p>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 border border-gray-100 p-3">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] uppercase tracking-wide text-gray-400">Daftar Santri Kelas</p>
            <p class="text-xs text-gray-500">{{ group.studentRows.length }} santri</p>
          </div>

          <div v-if="group.studentRows.length" class="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            <div
              v-for="(row, idx) in group.studentRows"
              :key="row.student?.id || idx"
              class="grid grid-cols-12 gap-2 items-center rounded-md border border-gray-100 bg-white px-2.5 py-2 text-sm"
            >
              <div class="col-span-6 sm:col-span-5 font-medium text-gray-700 truncate">{{ studentLabel(row.student) }}</div>
              <div class="col-span-3 sm:col-span-2 text-gray-500 text-xs">Scan: {{ row.scanCount }}</div>
              <div class="col-span-3 sm:col-span-2 text-right sm:text-left font-semibold text-gray-800">{{ row.latestScore }}</div>
              <div class="col-span-12 sm:col-span-3 text-[11px] text-gray-400 truncate">
                {{ row.latestTime }}
              </div>
              <div class="col-span-12" v-if="row.latestResultId && row.scanCount > 0">
                <button
                  class="text-[11px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                  :disabled="mappingLoadingByResult[row.latestResultId]"
                  @click="unassignStudent(row.latestResultId)"
                >
                  {{ mappingLoadingByResult[row.latestResultId] ? 'Memproses...' : 'Lepas Mapping' }}
                </button>
              </div>
            </div>
          </div>

          <p v-else class="text-xs text-gray-400 italic">Belum ada data santri untuk kelas ini.</p>
        </div>

        <details class="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <summary class="text-xs font-semibold text-gray-600 cursor-pointer">Riwayat Scan Tanpa Mapping Santri ({{ group.unmappedResults.length }})</summary>
          <div v-if="group.unmappedResults.length" class="mt-2 space-y-1.5">
            <div
              v-for="item in group.unmappedResults.slice(0, 15)"
              :key="item.id"
              class="rounded-md border border-gray-100 bg-white px-2.5 py-2 text-sm space-y-2"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="truncate text-gray-700">{{ item.filename || `${item.source || 'scan'} #${item.id}` }}</span>
                <span class="font-semibold text-gray-800">{{ item.score ?? '-' }}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <select
                  :value="selectedStudentByResult[item.id] ?? ''"
                  class="sm:col-span-9 w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs"
                  @change="onStudentSelectionChange(item.id, $event.target.value)"
                >
                  <option value="">Pilih santri untuk mapping</option>
                  <option v-for="student in group.students" :key="student.id" :value="student.id">
                    {{ studentLabel(student) }}
                  </option>
                </select>

                <button
                  class="sm:col-span-3 px-2.5 py-2 rounded-lg bg-primary text-white text-xs font-medium disabled:opacity-60"
                  :disabled="!selectedStudentByResult[item.id] || mappingLoadingByResult[item.id]"
                  @click="assignStudent(item)"
                >
                  {{ mappingLoadingByResult[item.id] ? 'Menyimpan...' : 'Simpan' }}
                </button>
              </div>

              <p v-if="mappingErrorByResult[item.id]" class="text-[11px] text-red-500">
                {{ mappingErrorByResult[item.id] }}
              </p>
            </div>
          </div>
          <p v-else class="mt-2 text-xs text-gray-400 italic">Semua scan pada grup ini sudah terkait santri.</p>
        </details>
      </div>

      <div class="pt-1">
        <button
          v-if="hasMore"
          class="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? 'Memuat lagi...' : 'Muat lebih banyak' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/api'
import { ocrGetResultLinks, ocrUpdateResultLinkStudent } from '@/api/ocr'

const loading = ref(false)
const loadingMore = ref(false)
const rows = ref([])
const page = ref(1)
const perPage = ref(100)
const totalPages = ref(1)
const totalRows = ref(0)

const lessonType = ref('')
const lessons = ref([])
const classes = ref([])
const teachers = ref([])
const selectedLessonId = ref(null)
const selectedClassId = ref(null)
const selectedTeacherId = ref(null)
const selectedStudentByResult = reactive({})
const mappingLoadingByResult = reactive({})
const mappingErrorByResult = reactive({})
const mappingSuccessMessage = ref('')

onMounted(async () => {
  await Promise.all([loadClasses(), loadTeachers()])
  await loadLessons()
  await loadResultLinks(true)
})

async function onLessonTypeChange() {
  selectedLessonId.value = null
  await loadLessons()
  await loadResultLinks(true)
}

async function loadLessons() {
  try {
    const params = {}
    if (lessonType.value) params.type = lessonType.value
    const res = await api.get('/lessons', { params })
    lessons.value = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
        ? res.data.data
        : []
  } catch {
    lessons.value = []
  }
}

async function loadClasses() {
  try {
    const res = await api.get('/kelas', { params: { per_page: 1000 } })
    classes.value = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
        ? res.data.data
        : []
  } catch {
    classes.value = []
  }
}

async function loadTeachers() {
  try {
    const res = await api.get('/users', { params: { role: 'guru', per_page: 1000 } })
    teachers.value = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
        ? res.data.data
        : []
  } catch {
    teachers.value = []
  }
}

async function loadResultLinks(reset = false) {
  if (reset) {
    page.value = 1
  }

  if (reset) {
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const params = { per_page: perPage.value, page: page.value }
    if (selectedLessonId.value) params.lesson_id = selectedLessonId.value
    if (selectedClassId.value) params.kelas_id = selectedClassId.value
    if (selectedTeacherId.value) params.teacher_id = selectedTeacherId.value

    const res = await ocrGetResultLinks(params)
    const incomingRows = Array.isArray(res.data?.data) ? res.data.data : []
    rows.value = reset ? incomingRows : [...rows.value, ...incomingRows]
    totalRows.value = Number(res.data?.total || 0)
    totalPages.value = Number(res.data?.total_pages || 1)
  } catch {
    if (reset) {
      rows.value = []
      totalRows.value = 0
      totalPages.value = 1
    }
  } finally {
    if (reset) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

const hasMore = computed(() => page.value < totalPages.value)

async function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return
  page.value += 1
  await loadResultLinks(false)
}

function classLabel(k) {
  if (!k) return '-'
  return `${k.nama || '-'} ${k.tingkat || ''}`.trim()
}

function studentLabel(student) {
  return student?.nama_lengkap || student?.nama || student?.name || `Santri #${student?.id || '?'}`
}

function onStudentSelectionChange(resultId, value) {
  const parsed = Number(value || 0)
  selectedStudentByResult[resultId] = Number.isFinite(parsed) && parsed > 0 ? parsed : null
  if (mappingErrorByResult[resultId]) {
    mappingErrorByResult[resultId] = ''
  }
}

async function assignStudent(item) {
  const studentId = Number(selectedStudentByResult[item.id] || 0)
  if (!studentId) return

  mappingLoadingByResult[item.id] = true
  mappingErrorByResult[item.id] = ''

  try {
    await ocrUpdateResultLinkStudent(item.id, { student_id: studentId })
    mappingSuccessMessage.value = `Mapping santri untuk hasil #${item.id} berhasil disimpan.`
    await loadResultLinks(true)
  } catch (err) {
    mappingErrorByResult[item.id] = err?.response?.data?.message || 'Gagal menyimpan mapping santri'
  } finally {
    mappingLoadingByResult[item.id] = false
    if (mappingSuccessMessage.value) {
      setTimeout(() => {
        mappingSuccessMessage.value = ''
      }, 2500)
    }
  }
}

async function unassignStudent(resultId) {
  if (!resultId) return

  mappingLoadingByResult[resultId] = true
  mappingErrorByResult[resultId] = ''
  try {
    await ocrUpdateResultLinkStudent(resultId, { student_id: null })
    mappingSuccessMessage.value = `Mapping santri untuk hasil #${resultId} berhasil dilepas.`
    await loadResultLinks(true)
  } catch (err) {
    mappingErrorByResult[resultId] = err?.response?.data?.message || 'Gagal melepas mapping santri'
  } finally {
    mappingLoadingByResult[resultId] = false
    if (mappingSuccessMessage.value) {
      setTimeout(() => {
        mappingSuccessMessage.value = ''
      }, 2500)
    }
  }
}

function formatDateTime(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID')
}

const resultGroups = computed(() => {
  const grouped = new Map()

  for (const item of rows.value) {
    const lessonName = item?.lesson?.name || 'Pelajaran belum dipilih'
    const kelasName = item?.kelas ? classLabel(item.kelas) : 'Kelas belum dipilih'
    const key = `${item?.lesson_id || 0}-${item?.kelas_id || 0}-${item?.teacher_id || 0}`

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        lessonName,
        kelasName,
        teacherName: item?.teacher?.name || 'Guru belum dipilih',
        students: Array.isArray(item?.kelas?.students) ? item.kelas.students : [],
        results: [],
      })
    }

    const g = grouped.get(key)
    if ((!g.teacherName || g.teacherName === 'Guru belum dipilih') && item?.teacher?.name) {
      g.teacherName = item.teacher.name
    }
    if ((!g.students || g.students.length === 0) && Array.isArray(item?.kelas?.students)) {
      g.students = item.kelas.students
    }
    g.results.push(item)
  }

  return Array.from(grouped.values()).map((group) => {
    const byStudent = new Map()

    for (const item of group.results) {
      const sid = Number(item?.student_id || item?.student?.id || 0)
      if (!sid) continue

      const prev = byStudent.get(sid)
      const currentAt = new Date(item?.created_at || 0).getTime()
      const prevAt = new Date(prev?.created_at || 0).getTime()
      if (!prev || currentAt >= prevAt) {
        byStudent.set(sid, item)
      }
    }

    const studentRows = (group.students || []).map((student) => {
      const sid = Number(student?.id || 0)
      const latest = sid ? byStudent.get(sid) : null
      return {
        student,
        scanCount: group.results.filter((r) => Number(r?.student_id || r?.student?.id || 0) === sid).length,
        latestScore: latest?.score ?? '-',
        latestTime: formatDateTime(latest?.created_at),
        latestResultId: latest?.id || null,
      }
    })

    return {
      ...group,
      studentRows,
      unmappedResults: group.results.filter((r) => !(Number(r?.student_id || r?.student?.id || 0) > 0)),
    }
  })
})
</script>
