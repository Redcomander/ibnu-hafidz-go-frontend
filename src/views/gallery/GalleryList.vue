<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-primary-dark tracking-tight">Galeri</h1>
        <p class="text-gray-500 text-sm mt-1">Kelola foto dan video kegiatan pesantren</p>
      </div>
      <div class="flex gap-2">
        <button @click="showAlbumModal = true" class="btn-secondary flex items-center gap-2">
          <SvgIcon name="folder" :size="16" />
          <span>Album</span>
        </button>
        <button @click="showUploadModal = true" class="btn-primary flex items-center gap-2">
          <SvgIcon name="plus" :size="16" />
          <span>Upload Media</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
      <div class="flex-1 min-w-[200px]">
        <input v-model="search" type="text" placeholder="Cari judul media..." class="input-field !py-2" @input="debounceFetch" />
      </div>
      <select v-model="filterAlbum" class="input-field !py-2 !w-auto min-w-[160px]" @change="fetchGalleries">
        <option value="">Semua Album</option>
        <option v-for="a in albums" :key="a.id" :value="a.id">{{ a.title }}</option>
      </select>
      <select v-model="filterType" class="input-field !py-2 !w-auto min-w-[140px]" @change="fetchGalleries">
        <option value="">Semua Tipe</option>
        <option value="photo">Foto</option>
        <option value="video">Video</option>
      </select>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="glass-card p-4 text-center">
        <p class="text-2xl font-bold text-blue-600">{{ total }}</p>
        <p class="text-xs text-gray-500 mt-1">Total Media</p>
      </div>
      <div class="glass-card p-4 text-center">
        <p class="text-2xl font-bold text-emerald-600">{{ albums.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Album</p>
      </div>
      <div class="glass-card p-4 text-center">
        <p class="text-2xl font-bold text-purple-600">{{ photoCount }}</p>
        <p class="text-xs text-gray-500 mt-1">Foto</p>
      </div>
      <div class="glass-card p-4 text-center">
        <p class="text-2xl font-bold text-rose-600">{{ videoCount }}</p>
        <p class="text-xs text-gray-500 mt-1">Video</p>
      </div>
    </div>

    <!-- Mass Actions -->
    <div v-if="selectedIds.length > 0" class="glass-card p-3 mb-4 flex items-center justify-between bg-blue-50/50">
      <span class="text-sm text-blue-700 font-medium">{{ selectedIds.length }} item dipilih</span>
      <button @click="massDelete" class="btn-primary !bg-red-600 hover:!bg-red-700 !py-1.5 !px-3 text-sm">Hapus Terpilih</button>
    </div>

    <!-- Gallery Grid -->
    <div v-if="loading" class="text-center py-12 text-gray-400">Memuat data...</div>
    <div v-else-if="galleries.length === 0" class="text-center py-12 text-gray-400">Belum ada media</div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
      <div v-for="g in galleries" :key="g.id" class="glass-card group relative overflow-hidden rounded-xl cursor-pointer" @click="toggleSelect(g.id)">
        <!-- Checkbox -->
        <div class="absolute top-2 left-2 z-10">
          <input type="checkbox" :checked="selectedIds.includes(g.id)" class="w-4 h-4 rounded border-gray-300" @click.stop />
        </div>

        <!-- Thumbnail -->
        <div class="aspect-square bg-gray-100 overflow-hidden">
          <template v-if="g.type === 'photo'">
            <img :src="getMediaUrl(g)" :alt="g.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          </template>
          <template v-else>
            <div class="w-full h-full flex items-center justify-center bg-gray-900/80">
              <div class="text-center text-white">
                <SvgIcon name="play" :size="32" class="mx-auto mb-1 opacity-80" />
                <span class="text-xs opacity-60">{{ g.source === 'upload' ? 'Video' : g.source }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Info -->
        <div class="p-2.5">
          <p class="text-xs font-medium text-gray-800 truncate">{{ g.title }}</p>
          <p class="text-[10px] text-gray-400 mt-0.5">{{ g.album ? g.album.title : 'Tanpa Album' }}</p>
        </div>

        <!-- Actions overlay -->
        <div class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button @click.stop="editItem = g; showEditModal = true" class="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-blue-50">
            <SvgIcon name="edit" :size="12" />
          </button>
          <button @click.stop="deleteGallery(g.id)" class="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-red-50">
            <SvgIcon name="trash" :size="12" />
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-6">
      <button v-for="p in totalPages" :key="p" @click="page = p; fetchGalleries()" :class="['w-8 h-8 rounded-lg text-sm font-medium transition-colors', p === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100']">{{ p }}</button>
    </div>

    <!-- Upload Modal -->
    <Modal :show="showUploadModal" @close="showUploadModal = false" title="Upload Media" maxWidth="lg">
      <div class="space-y-4">
        <div>
          <label class="label-field">Judul</label>
          <input v-model="uploadForm.title" type="text" class="input-field" placeholder="Judul media" />
        </div>
        <div>
          <label class="label-field">Album (Opsional)</label>
          <select v-model="uploadForm.album_id" class="input-field">
            <option value="">Tanpa Album</option>
            <option v-for="a in albums" :key="a.id" :value="a.id">{{ a.title }}</option>
          </select>
        </div>
        <div>
          <label class="label-field">Tipe Upload</label>
          <select v-model="uploadForm.upload_type" class="input-field">
            <option value="file">File (Foto/Video)</option>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
        <div v-if="uploadForm.upload_type === 'file'">
          <label class="label-field">Pilih File</label>
          <div 
            class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors w-full cursor-pointer"
            @click="$refs.mediaInput.click()"
            @dragover.prevent
            @drop.prevent="onFilesDropped"
          >
            <div class="space-y-1 text-center">
              <SvgIcon name="document" :size="32" class="mx-auto text-gray-400" />
              <div class="flex text-sm text-gray-600 justify-center mt-2">
                <span class="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span v-if="selectedFiles.length === 0">Klik untuk upload atau drag & drop file</span>
                  <span v-else>{{ selectedFiles.length }} file terpilih. Klik untuk mengubah.</span>
                  <input ref="mediaInput" type="file" multiple accept="image/*,video/*" class="sr-only" @change="onFilesSelected" />
                </span>
              </div>
              <p class="text-xs text-gray-500 mb-0">PNG, JPG, MP4</p>
              <p class="text-[10px] text-gray-400 mt-0.5">Maks 10 foto + 5 video per upload</p>
            </div>
          </div>
          
          <!-- Selected Files Preview List -->
          <div v-if="selectedFiles.length > 0" class="mt-3 flex flex-wrap gap-2">
            <div v-for="(file, idx) in selectedFiles" :key="idx" class="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
              <span class="truncate max-w-[120px]">{{ file.name }}</span>
              <button @click.stop="removeSelectedFile(idx)" class="text-blue-400 hover:text-blue-600 font-bold ml-1 outline-none text-base leading-none">&times;</button>
            </div>
          </div>
        </div>
        <div v-else>
          <label class="label-field">URL Video</label>
          <input v-model="uploadForm.video_url" type="url" class="input-field" placeholder="https://..." />
        </div>
      </div>
      <template #footer>
        <button @click="showUploadModal = false" class="btn-secondary">Batal</button>
        <button @click="handleUpload" :disabled="uploading" class="btn-primary">
          {{ uploading ? 'Mengupload...' : 'Upload' }}
        </button>
      </template>
    </Modal>

    <!-- Edit Modal -->
    <Modal :show="showEditModal" @close="showEditModal = false" title="Edit Media">
      <div class="space-y-4" v-if="editItem">
        <div>
          <label class="label-field">Judul</label>
          <input v-model="editItem.title" type="text" class="input-field" />
        </div>
        <div>
          <label class="label-field">Album</label>
          <select v-model="editItem.album_id" class="input-field">
            <option :value="null">Tanpa Album</option>
            <option v-for="a in albums" :key="a.id" :value="a.id">{{ a.title }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button @click="showEditModal = false" class="btn-secondary">Batal</button>
        <button @click="updateGallery" class="btn-primary">Simpan</button>
      </template>
    </Modal>

    <!-- Album Modal -->
    <Modal :show="showAlbumModal" @close="showAlbumModal = false" title="Kelola Album" maxWidth="lg">
      <div class="space-y-4">
        <!-- Create album -->
        <div class="flex gap-2">
          <input v-model="newAlbumTitle" type="text" class="input-field flex-1" placeholder="Nama album baru..." />
          <button @click="createAlbum" class="btn-primary !py-2 whitespace-nowrap">Tambah</button>
        </div>
        <!-- Album list -->
        <div class="divide-y max-h-[300px] overflow-y-auto">
          <div v-for="a in albums" :key="a.id" class="flex items-center justify-between py-3 px-1">
            <div>
              <p class="font-medium text-sm text-gray-800">{{ a.title }}</p>
              <p class="text-xs text-gray-400">{{ a.gallery_count || 0 }} media</p>
            </div>
            <button @click="deleteAlbum(a.id)" class="text-red-500 hover:text-red-700 text-xs">Hapus</button>
          </div>
          <div v-if="albums.length === 0" class="py-6 text-center text-gray-400 text-sm">Belum ada album</div>
        </div>
      </div>
    </Modal>

    <!-- Confirm Modal -->
    <ConfirmModal v-model:show="showConfirm" :title="confirmTitle" :message="confirmMessage" @confirm="confirmAction" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/api'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import Modal from '@/components/ui/Modal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const loading = ref(false)
const uploading = ref(false)
const galleries = ref([])
const albums = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const totalPages = ref(1)
const search = ref('')
const filterAlbum = ref('')
const filterType = ref('')
const selectedIds = ref([])

// Modals
const showUploadModal = ref(false)
const showEditModal = ref(false)
const showAlbumModal = ref(false)
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref(() => {})

const editItem = ref(null)
const newAlbumTitle = ref('')
const mediaInput = ref(null)
const selectedFiles = ref([])

const uploadForm = ref({
  title: '',
  album_id: '',
  upload_type: 'file',
  video_url: '',
})

const photoCount = computed(() => galleries.value.filter(g => g.type === 'photo').length)
const videoCount = computed(() => galleries.value.filter(g => g.type === 'video').length)

let debounceTimer = null
function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; fetchGalleries() }, 300)
}

function getMediaUrl(g) {
  if (g.source === 'upload') {
    return '/uploads/' + g.path
  }
  if (g.source === 'youtube') {
    const id = g.path.replace('youtube:', '')
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
  }
  return '/uploads/' + (g.webp_path || g.path)
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

async function fetchAlbums() {
  try {
    const { data } = await api.get('/gallery/albums')
    albums.value = data.data || []
  } catch (e) { console.error(e) }
}

async function fetchGalleries() {
  loading.value = true
  try {
    const params = { page: page.value, per_page: perPage.value }
    if (search.value) params.search = search.value
    if (filterAlbum.value) params.album_id = filterAlbum.value
    if (filterType.value) params.type = filterType.value

    const { data } = await api.get('/gallery/items', { params })
    galleries.value = data.data || []
    total.value = data.total
    totalPages.value = data.total_pages
  } catch (e) { console.error(e) }
  loading.value = false
}

function onFilesSelected(e) {
  selectedFiles.value = Array.from(e.target.files)
}

function onFilesDropped(e) {
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    selectedFiles.value = Array.from(e.dataTransfer.files)
  }
}

function removeSelectedFile(idx) {
  selectedFiles.value.splice(idx, 1)
}

async function handleUpload() {
  if (!uploadForm.value.title) return
  uploading.value = true

  try {
    const fd = new FormData()
    fd.append('title', uploadForm.value.title)
    fd.append('upload_type', uploadForm.value.upload_type)
    if (uploadForm.value.album_id) fd.append('album_id', uploadForm.value.album_id)

    if (uploadForm.value.upload_type === 'file') {
      selectedFiles.value.forEach(f => fd.append('media', f))
    } else {
      fd.append('video_url', uploadForm.value.video_url)
    }

    await api.post('/gallery/items', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    showUploadModal.value = false
    uploadForm.value = { title: '', album_id: '', upload_type: 'file', video_url: '' }
    selectedFiles.value = []
    fetchGalleries()
    fetchAlbums()
  } catch (e) { console.error(e) }
  uploading.value = false
}

async function updateGallery() {
  if (!editItem.value) return
  try {
    await api.put(`/gallery/items/${editItem.value.id}`, {
      title: editItem.value.title,
      album_id: editItem.value.album_id,
    })
    showEditModal.value = false
    fetchGalleries()
  } catch (e) { console.error(e) }
}

async function deleteGallery(id) {
  confirmTitle.value = 'Hapus Media'
  confirmMessage.value = 'Apakah Anda yakin ingin menghapus media ini?'
  confirmAction.value = async () => {
    try {
      await api.delete(`/gallery/items/${id}`)
      fetchGalleries()
    } catch (e) { console.error(e) }
  }
  showConfirm.value = true
}

async function massDelete() {
  confirmTitle.value = 'Hapus Terpilih'
  confirmMessage.value = `Hapus ${selectedIds.value.length} item yang dipilih?`
  confirmAction.value = async () => {
    try {
      await api.post('/gallery/items/mass-delete', { ids: selectedIds.value })
      selectedIds.value = []
      fetchGalleries()
    } catch (e) { console.error(e) }
  }
  showConfirm.value = true
}

async function createAlbum() {
  if (!newAlbumTitle.value) return
  try {
    await api.post('/gallery/albums', { title: newAlbumTitle.value })
    newAlbumTitle.value = ''
    fetchAlbums()
  } catch (e) { console.error(e) }
}

async function deleteAlbum(id) {
  confirmTitle.value = 'Hapus Album'
  confirmMessage.value = 'Media dalam album ini tidak akan dihapus, hanya albumnya saja.'
  confirmAction.value = async () => {
    try {
      await api.delete(`/gallery/albums/${id}`)
      fetchAlbums()
      fetchGalleries()
    } catch (e) { console.error(e) }
  }
  showConfirm.value = true
}

onMounted(() => {
  fetchAlbums()
  fetchGalleries()
})
</script>
