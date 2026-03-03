<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-primary-dark tracking-tight">Prestasi Santri</h1>
        <p class="text-gray-500 text-sm mt-1.5">Kelola data prestasi dan pencapaian santri</p>
      </div>
      <button @click="openForm()" class="btn-primary flex items-center gap-2 !rounded-xl shadow-lg shadow-green-200/50">
        <SvgIcon name="plus" :size="16" />
        <span>Tambah Prestasi</span>
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="stat-card bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100">
        <div class="stat-icon bg-amber-500/10"><SvgIcon name="trophy" :size="20" class="text-amber-600" /></div>
        <p class="text-3xl font-extrabold text-amber-700">{{ total }}</p>
        <p class="text-xs text-amber-500/80 font-medium mt-1">Total Prestasi</p>
      </div>
      <div class="stat-card bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
        <div class="stat-icon bg-blue-500/10"><SvgIcon name="folder" :size="20" class="text-blue-600" /></div>
        <p class="text-3xl font-extrabold text-blue-700">{{ filterCategories.length }}</p>
        <p class="text-xs text-blue-500/80 font-medium mt-1">Kategori</p>
      </div>
      <div class="stat-card bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100">
        <div class="stat-icon bg-purple-500/10"><SvgIcon name="scale" :size="20" class="text-purple-600" /></div>
        <p class="text-3xl font-extrabold text-purple-700">{{ filterLevels.length }}</p>
        <p class="text-xs text-purple-500/80 font-medium mt-1">Tingkat</p>
      </div>
      <div class="stat-card bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100">
        <div class="stat-icon bg-emerald-500/10"><SvgIcon name="image" :size="20" class="text-emerald-600" /></div>
        <p class="text-3xl font-extrabold text-emerald-700">{{ withPhotoCount }}</p>
        <p class="text-xs text-emerald-500/80 font-medium mt-1">Dengan Foto</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="glass-card p-4 mb-6 flex flex-wrap items-center gap-4 !rounded-2xl">
      <div class="flex-1 min-w-[200px] relative">
        <SvgIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" type="text" placeholder="Cari prestasi..." class="input-field !py-2.5 !pl-10 !rounded-xl" @input="debounceFetch" />
      </div>
      <select v-model="filterKategori" class="input-field !py-2.5 !w-auto min-w-[160px] !rounded-xl" @change="page = 1; fetchData()">
        <option value="">Semua Kategori</option>
        <option v-for="c in filterCategories" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="filterTingkat" class="input-field !py-2.5 !w-auto min-w-[140px] !rounded-xl" @change="page = 1; fetchData()">
        <option value="">Semua Tingkat</option>
        <option v-for="l in filterLevels" :key="l" :value="l">{{ l }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16">
      <div class="inline-flex items-center gap-3 text-gray-400">
        <div class="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        Memuat data...
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="items.length === 0" class="text-center py-16 glass-card !rounded-2xl">
      <SvgIcon name="trophy" :size="48" class="text-gray-300 mx-auto mb-4" />
      <p class="text-gray-400 text-lg font-medium">Belum ada prestasi</p>
      <p class="text-gray-400 text-sm mt-1">Mulai tambahkan prestasi santri</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="p in items"
        :key="p.id"
        class="prestasi-card group"
      >
        <!-- Photo -->
        <div class="relative h-44 rounded-t-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            v-if="p.webp_path || p.photo_path"
            :src="'/uploads/' + (p.webp_path || p.photo_path)"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <SvgIcon name="trophy" :size="48" class="text-gray-300" />
          </div>
          <!-- Kategori badge -->
          <span class="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
            {{ p.kategori }}
          </span>
          <!-- Actions overlay -->
          <div class="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click.stop="openForm(p)" class="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-blue-600 hover:bg-blue-50 shadow-sm transition-colors">
              <SvgIcon name="edit" :size="14" />
            </button>
            <button @click.stop="confirmDelete(p.id)" class="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-500 hover:bg-red-50 shadow-sm transition-colors">
              <SvgIcon name="trash" :size="14" />
            </button>
          </div>
        </div>
        <!-- Content -->
        <div class="p-4">
          <h3 class="font-bold text-gray-800 text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {{ p.nama_prestasi }}
          </h3>
          <div class="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <span v-if="p.tingkat" class="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 font-semibold">{{ p.tingkat }}</span>
            <span v-if="p.tanggal">{{ formatDate(p.tanggal) }}</span>
          </div>
          <div v-if="p.student" class="flex items-center gap-2 mt-2.5">
            <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
              {{ p.student.nama_lengkap?.charAt(0) || 'S' }}
            </div>
            <span class="text-xs text-gray-600 font-medium truncate">{{ p.student.nama_lengkap }}</span>
          </div>
          <p v-if="p.deskripsi" class="text-xs text-gray-400 mt-2 line-clamp-2">{{ p.deskripsi }}</p>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-8">
      <button @click="page > 1 && (page--, fetchData())" :disabled="page === 1" class="px-3 py-2 rounded-xl text-sm font-medium bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition-colors">←</button>
      <button
        v-for="p in visiblePages" :key="p"
        @click="page = p; fetchData()"
        :class="['w-10 h-10 rounded-xl text-sm font-semibold transition-all', p === page ? 'bg-primary text-white shadow-lg shadow-green-200/50' : 'bg-white text-gray-600 hover:bg-gray-100']"
      >{{ p }}</button>
      <button @click="page < totalPages && (page++, fetchData())" :disabled="page === totalPages" class="px-3 py-2 rounded-xl text-sm font-medium bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition-colors">→</button>
    </div>

    <!-- Create / Edit Modal -->
    <Modal :show="showForm" @close="showForm = false" :title="editingId ? 'Edit Prestasi' : 'Tambah Prestasi'" maxWidth="lg">
      <div class="space-y-4">
        <div>
          <label class="label-field">Nama Prestasi <span class="text-red-500">*</span></label>
          <input v-model="form.nama_prestasi" type="text" class="input-field !rounded-xl" placeholder="Juara 1 Lomba Tahfidz..." />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label-field">Kategori <span class="text-red-500">*</span></label>
            <input v-model="form.kategori" type="text" class="input-field !rounded-xl" placeholder="Akademik, Olahraga..." />
          </div>
          <div>
            <label class="label-field">Tingkat</label>
            <input v-model="form.tingkat" type="text" class="input-field !rounded-xl" placeholder="Nasional, Regional..." />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label-field">Tanggal</label>
            <input v-model="form.tanggal" type="date" class="input-field !rounded-xl" />
          </div>
          <div>
            <label class="label-field">Santri (Opsional)</label>
            <select v-model="form.student_id" class="input-field !rounded-xl">
              <option value="">Tidak ada</option>
              <option v-for="s in students" :key="s.id" :value="s.id">{{ s.nama_lengkap }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label-field">Deskripsi</label>
          <textarea v-model="form.deskripsi" rows="3" class="input-field !rounded-xl" placeholder="Detail prestasi..."></textarea>
        </div>
        <!-- Photo upload -->
        <div>
          <label class="label-field">Foto Prestasi</label>
          <div v-if="photoPreview" class="mb-3 rounded-xl overflow-hidden shadow-sm">
            <img :src="photoPreview" class="w-full h-40 object-cover" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              class="flex flex-col items-center justify-center px-3 py-4 border-2 border-gray-200 border-dashed rounded-xl bg-gray-50/50 hover:bg-gray-100/50 hover:border-primary/30 transition-all cursor-pointer"
              @click="$refs.photoInput.click()"
            >
              <SvgIcon name="upload" :size="22" class="text-gray-400 mb-1" />
              <p class="text-[11px] text-gray-500 font-medium text-center">Upload Foto</p>
              <p class="text-[10px] text-gray-400 mt-0.5">JPG, PNG — Maks 5MB</p>
              <input type="file" ref="photoInput" accept="image/*" class="sr-only" @change="onPhotoSelected" />
            </div>
            <div
              class="flex flex-col items-center justify-center px-3 py-4 border-2 border-gray-200 border-dashed rounded-xl bg-gray-50/50 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer"
              @click="showGalleryPicker = true; fetchGalleryImages()"
            >
              <SvgIcon name="image" :size="22" class="text-primary/50 mb-1" />
              <p class="text-[11px] text-primary font-medium text-center">Dari Galeri</p>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button @click="showForm = false" class="btn-secondary !rounded-xl">Batal</button>
          <button @click="handleSubmit" :disabled="saving" class="btn-primary !rounded-xl flex items-center gap-2">
            <SvgIcon name="check" :size="16" />
            {{ saving ? 'Menyimpan...' : (editingId ? 'Perbarui' : 'Simpan') }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- Gallery Picker Modal -->
    <Modal :show="showGalleryPicker" @close="showGalleryPicker = false" title="Pilih Foto dari Galeri" maxWidth="lg">
      <div>
        <div class="mb-4">
          <input v-model="gallerySearch" type="text" class="input-field !rounded-xl !py-2.5" placeholder="Cari gambar..." @input="fetchGalleryImages" />
        </div>
        <div v-if="galleryLoading" class="text-center py-12 text-gray-400">
          <div class="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
          Memuat galeri...
        </div>
        <div v-else-if="galleryImages.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1">
          <div v-for="img in galleryImages" :key="img.id" @click="selectGalleryImage(img)"
            class="relative group cursor-pointer rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all hover:shadow-lg">
            <img :src="'/uploads/' + img.path" class="w-full h-24 sm:h-28 object-cover group-hover:scale-105 transition-transform duration-200" />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <SvgIcon name="check" :size="16" class="text-primary" />
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-gray-400">
          <SvgIcon name="image" :size="40" class="mx-auto mb-3 text-gray-300" />
          <p class="text-sm">Belum ada foto di galeri</p>
        </div>
      </div>
    </Modal>

    <ConfirmModal v-model:show="showConfirm" :title="confirmTitle" :message="confirmMessage" @confirm="confirmAction" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import Modal from '@/components/ui/Modal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const loading = ref(false)
const saving = ref(false)
const items = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(12)
const totalPages = ref(1)
const search = ref('')
const filterKategori = ref('')
const filterTingkat = ref('')
const filterCategories = ref([])
const filterLevels = ref([])
const students = ref([])

const showForm = ref(false)
const editingId = ref(null)
const photoFile = ref(null)
const photoPreview = ref(null)
const form = ref({ nama_prestasi: '', kategori: '', tingkat: '', tanggal: '', deskripsi: '', student_id: '' })

const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref(() => {})

// Gallery picker
const showGalleryPicker = ref(false)
const galleryImages = ref([])
const galleryLoading = ref(false)
const gallerySearch = ref('')
const galleryPhotoPath = ref(null)

const withPhotoCount = computed(() => items.value.filter(p => p.photo_path || p.webp_path).length)

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, page.value - 2)
  const end = Math.min(totalPages.value, page.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

let debounceTimer = null
function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; fetchData() }, 300)
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, per_page: perPage.value }
    if (search.value) params.search = search.value
    if (filterKategori.value) params.kategori = filterKategori.value
    if (filterTingkat.value) params.tingkat = filterTingkat.value

    const { data } = await api.get('/prestasi/', { params })
    items.value = data.data || []
    total.value = data.total
    totalPages.value = data.total_pages
    filterCategories.value = data.categories || []
    filterLevels.value = data.levels || []
  } catch (e) { console.error(e) }
  loading.value = false
}

async function fetchStudents() {
  try {
    const { data } = await api.get('/students/', { params: { per_page: 999 } })
    students.value = data.data || []
  } catch (e) { console.error(e) }
}

function openForm(item = null) {
  editingId.value = item?.id || null
  photoFile.value = null
  galleryPhotoPath.value = null
  if (item) {
    form.value = {
      nama_prestasi: item.nama_prestasi,
      kategori: item.kategori,
      tingkat: item.tingkat || '',
      tanggal: item.tanggal || '',
      deskripsi: item.deskripsi || '',
      student_id: item.student_id || '',
    }
    photoPreview.value = item.webp_path ? '/uploads/' + item.webp_path : (item.photo_path ? '/uploads/' + item.photo_path : null)
  } else {
    form.value = { nama_prestasi: '', kategori: '', tingkat: '', tanggal: '', deskripsi: '', student_id: '' }
    photoPreview.value = null
  }
  showForm.value = true
}

function onPhotoSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  photoFile.value = file
  galleryPhotoPath.value = null
  photoPreview.value = URL.createObjectURL(file)
}

async function fetchGalleryImages() {
  galleryLoading.value = true
  try {
    const params = { page: 1, per_page: 24, type: 'photo' }
    if (gallerySearch.value) params.search = gallerySearch.value
    const { data } = await api.get('/gallery/items', { params })
    galleryImages.value = data.data || []
  } catch (e) { console.error(e) }
  galleryLoading.value = false
}

function selectGalleryImage(img) {
  photoPreview.value = '/uploads/' + img.path
  galleryPhotoPath.value = img.path
  photoFile.value = null
  showGalleryPicker.value = false
}

async function handleSubmit() {
  if (!form.value.nama_prestasi || !form.value.kategori) return
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('nama_prestasi', form.value.nama_prestasi)
    fd.append('kategori', form.value.kategori)
    if (form.value.tingkat) fd.append('tingkat', form.value.tingkat)
    if (form.value.tanggal) fd.append('tanggal', form.value.tanggal)
    if (form.value.deskripsi) fd.append('deskripsi', form.value.deskripsi)
    if (form.value.student_id) fd.append('student_id', form.value.student_id)
    if (photoFile.value) fd.append('photo', photoFile.value)

    if (editingId.value) {
      await api.put(`/prestasi/${editingId.value}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    } else {
      await api.post('/prestasi/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
    showForm.value = false
    fetchData()
  } catch (e) { console.error(e) }
  saving.value = false
}

function confirmDelete(id) {
  confirmTitle.value = 'Hapus Prestasi'
  confirmMessage.value = 'Apakah Anda yakin ingin menghapus prestasi ini?'
  confirmAction.value = async () => {
    try {
      await api.delete(`/prestasi/${id}`)
      fetchData()
    } catch (e) { console.error(e) }
  }
  showConfirm.value = true
}

onMounted(() => {
  fetchData()
  fetchStudents()
})
</script>

<style scoped>
.stat-card {
  @apply rounded-2xl p-5 text-center relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5;
}
.stat-icon {
  @apply w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3;
}
.prestasi-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.prestasi-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: rgba(34, 197, 94, 0.1);
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
