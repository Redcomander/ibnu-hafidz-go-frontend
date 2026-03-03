<template>
  <div>
    <!-- Page Header with gradient accent -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-primary-dark tracking-tight">Berita & Artikel</h1>
        <p class="text-gray-500 text-sm mt-1.5">Kelola konten berita dan artikel pesantren</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button @click="showTagModal = true" class="btn-secondary flex items-center gap-2 !rounded-xl !py-2 !px-3 text-sm">
          <SvgIcon name="tag" :size="14" />
          <span class="hidden sm:inline">Tag</span>
        </button>
        <button @click="showCategoryModal = true" class="btn-secondary flex items-center gap-2 !rounded-xl !py-2 !px-3 text-sm">
          <SvgIcon name="folder" :size="14" />
          <span class="hidden sm:inline">Kategori</span>
        </button>
        <router-link :to="{ name: 'article-create' }" class="btn-primary flex items-center gap-2 !rounded-xl !py-2 !px-3 text-sm shadow-lg shadow-green-200/50">
          <SvgIcon name="plus" :size="14" />
          <span>Tulis Artikel</span>
        </router-link>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="stat-card bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
        <div class="stat-icon bg-blue-500/10"><SvgIcon name="document" :size="20" class="text-blue-600" /></div>
        <p class="text-3xl font-extrabold text-blue-700">{{ total }}</p>
        <p class="text-xs text-blue-500/80 font-medium mt-1">Total Artikel</p>
      </div>
      <div class="stat-card bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100">
        <div class="stat-icon bg-emerald-500/10"><SvgIcon name="check-circle" :size="20" class="text-emerald-600" /></div>
        <p class="text-3xl font-extrabold text-emerald-700">{{ publishedCount }}</p>
        <p class="text-xs text-emerald-500/80 font-medium mt-1">Published</p>
      </div>
      <div class="stat-card bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100">
        <div class="stat-icon bg-amber-500/10"><SvgIcon name="edit" :size="20" class="text-amber-600" /></div>
        <p class="text-3xl font-extrabold text-amber-700">{{ draftCount }}</p>
        <p class="text-xs text-amber-500/80 font-medium mt-1">Draft</p>
      </div>
      <div class="stat-card bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100">
        <div class="stat-icon bg-purple-500/10"><SvgIcon name="folder" :size="20" class="text-purple-600" /></div>
        <p class="text-3xl font-extrabold text-purple-700">{{ categories.length }}</p>
        <p class="text-xs text-purple-500/80 font-medium mt-1">Kategori</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="glass-card p-3 md:p-4 mb-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-4 !rounded-2xl">
      <div class="flex-1 relative">
        <SvgIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" type="text" placeholder="Cari judul artikel..." class="input-field !py-2.5 !pl-10 !rounded-xl w-full" @input="debounceFetch" />
      </div>
      <div class="flex gap-2">
        <select v-model="filterStatus" class="input-field !py-2.5 !rounded-xl flex-1 sm:flex-none sm:!w-auto sm:min-w-[140px]" @change="fetchArticles">
          <option value="">Semua Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select v-model="filterCategory" class="input-field !py-2.5 !rounded-xl flex-1 sm:flex-none sm:!w-auto sm:min-w-[160px]" @change="fetchArticles">
          <option value="">Semua Kategori</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
    </div>

    <!-- Articles Grid/Cards View -->
    <div v-if="loading" class="text-center py-16">
      <div class="inline-flex items-center gap-3 text-gray-400">
        <div class="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        Memuat data...
      </div>
    </div>
    <div v-else-if="articles.length === 0" class="text-center py-16 glass-card !rounded-2xl">
      <SvgIcon name="document" :size="48" class="text-gray-300 mx-auto mb-4" />
      <p class="text-gray-400 text-lg font-medium">Belum ada artikel</p>
      <p class="text-gray-400 text-sm mt-1">Mulai tulis artikel pertama Anda</p>
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="a in articles"
        :key="a.id"
        class="article-card group"
      >
        <div class="flex gap-3 md:gap-4 items-start">
          <!-- Thumbnail -->
          <div v-if="a.thumbnail" class="w-16 h-16 sm:w-24 sm:h-20 md:w-32 md:h-24 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            <img :src="'/uploads/' + a.thumbnail" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div v-else class="w-16 h-16 sm:w-24 sm:h-20 md:w-32 md:h-24 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center flex-shrink-0">
            <SvgIcon name="document" :size="20" class="text-primary/40 sm:hidden" />
            <SvgIcon name="document" :size="28" class="text-primary/40 hidden sm:block" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-1.5 mb-1">
              <span v-if="a.category" class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                {{ a.category.name }}
              </span>
              <span :class="['inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold', a.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100']">
                {{ a.status === 'published' ? '● Published' : '● Draft' }}
              </span>
            </div>
            <h3 class="font-bold text-gray-800 text-sm sm:text-base md:text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {{ a.title }}
            </h3>
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] sm:text-xs text-gray-400">
              <span class="flex items-center gap-1">
                <SvgIcon name="user" :size="11" />
                {{ a.author?.name || '—' }}
              </span>
              <span class="hidden sm:inline">•</span>
              <span>{{ formatDate(a.created_at) }}</span>
              <span class="hidden sm:inline">•</span>
              <span class="flex items-center gap-1">
                <SvgIcon name="eye" :size="11" />
                {{ a.views_count || 0 }}
              </span>
            </div>
            <!-- Tags -->
            <div v-if="a.tags && a.tags.length > 0" class="flex flex-wrap gap-1 mt-1.5 hidden sm:flex">
              <span v-for="t in a.tags.slice(0, 3)" :key="t.id" class="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                #{{ t.name }}
              </span>
              <span v-if="a.tags.length > 3" class="text-[10px] text-gray-400">+{{ a.tags.length - 3 }}</span>
            </div>
          </div>

          <!-- Actions — always visible on mobile, hover on desktop -->
          <div class="flex flex-col items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
            <router-link :to="{ name: 'article-edit', params: { id: a.id } }" class="p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
              <SvgIcon name="edit" :size="14" />
            </router-link>
            <button @click="deleteArticle(a.id)" class="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Hapus">
              <SvgIcon name="trash" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-8">
      <button
        @click="page > 1 && (page--, fetchArticles())"
        :disabled="page === 1"
        class="px-3 py-2 rounded-xl text-sm font-medium bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >←</button>
      <button
        v-for="p in visiblePages"
        :key="p"
        @click="page = p; fetchArticles()"
        :class="['w-10 h-10 rounded-xl text-sm font-semibold transition-all', p === page ? 'bg-primary text-white shadow-lg shadow-green-200/50' : 'bg-white text-gray-600 hover:bg-gray-100']"
      >{{ p }}</button>
      <button
        @click="page < totalPages && (page++, fetchArticles())"
        :disabled="page === totalPages"
        class="px-3 py-2 rounded-xl text-sm font-medium bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >→</button>
    </div>

    <!-- Category Modal — with edit -->
    <Modal :show="showCategoryModal" @close="showCategoryModal = false" title="Kelola Kategori" maxWidth="md">
      <div class="space-y-4">
        <div class="flex gap-2">
          <input v-model="newCategoryName" type="text" class="input-field flex-1 !rounded-xl" placeholder="Nama kategori baru..." @keyup.enter="createCategory" />
          <button @click="createCategory" class="btn-primary !py-2 !rounded-xl whitespace-nowrap">Tambah</button>
        </div>
        <div class="divide-y max-h-[360px] overflow-y-auto">
          <div v-for="c in categories" :key="c.id" class="flex items-center justify-between py-3 px-1 group/cat">
            <div v-if="editCategoryId !== c.id" class="flex-1">
              <p class="font-semibold text-sm text-gray-800">{{ c.name }}</p>
              <p class="text-xs text-gray-400">{{ c.articles_count || 0 }} artikel</p>
            </div>
            <div v-else class="flex-1 flex gap-2">
              <input v-model="editCategoryName" type="text" class="input-field !py-1.5 flex-1 !rounded-lg text-sm" @keyup.enter="saveCategory" />
              <button @click="saveCategory" class="text-emerald-600 hover:text-emerald-800 text-xs font-semibold">Simpan</button>
              <button @click="editCategoryId = null" class="text-gray-400 hover:text-gray-600 text-xs">Batal</button>
            </div>
            <div v-if="editCategoryId !== c.id" class="flex items-center gap-2 opacity-0 group-hover/cat:opacity-100 transition-opacity">
              <button @click="editCategoryId = c.id; editCategoryName = c.name" class="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
              <button @click="deleteCategory(c.id)" class="text-red-500 hover:text-red-700 text-xs font-medium">Hapus</button>
            </div>
          </div>
          <div v-if="categories.length === 0" class="py-8 text-center text-gray-400 text-sm">Belum ada kategori</div>
        </div>
      </div>
    </Modal>

    <!-- Tag Modal -->
    <Modal :show="showTagModal" @close="showTagModal = false" title="Kelola Tag" maxWidth="md">
      <div class="space-y-4">
        <div class="flex gap-2">
          <input v-model="newTagName" type="text" class="input-field flex-1 !rounded-xl" placeholder="Nama tag baru..." @keyup.enter="createTag" />
          <button @click="createTag" class="btn-primary !py-2 !rounded-xl whitespace-nowrap">Tambah</button>
        </div>
        <div class="flex flex-wrap gap-2 max-h-[360px] overflow-y-auto">
          <span v-for="t in tags" :key="t.id" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors group/tag">
            #{{ t.name }}
            <button @click="deleteTag(t.id)" class="text-gray-400 hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity">
              <SvgIcon name="x" :size="12" />
            </button>
          </span>
          <span v-if="tags.length === 0" class="py-8 w-full text-center text-gray-400 text-sm">Belum ada tag</span>
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
const articles = ref([])
const categories = ref([])
const tags = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const totalPages = ref(1)
const search = ref('')
const filterStatus = ref('')
const filterCategory = ref('')

const showCategoryModal = ref(false)
const showTagModal = ref(false)
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref(() => {})
const newCategoryName = ref('')
const newTagName = ref('')

// Category inline edit
const editCategoryId = ref(null)
const editCategoryName = ref('')

const publishedCount = computed(() => articles.value.filter(a => a.status === 'published').length)
const draftCount = computed(() => articles.value.filter(a => a.status === 'draft').length)

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
  debounceTimer = setTimeout(() => { page.value = 1; fetchArticles() }, 300)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function fetchCategories() {
  try {
    const { data } = await api.get('/articles/categories')
    categories.value = data.data || []
  } catch (e) { console.error(e) }
}

async function fetchTags() {
  try {
    const { data } = await api.get('/articles/tags')
    tags.value = data.data || []
  } catch (e) { console.error(e) }
}

async function fetchArticles() {
  loading.value = true
  try {
    const params = { page: page.value, per_page: perPage.value }
    if (search.value) params.search = search.value
    if (filterStatus.value) params.status = filterStatus.value
    if (filterCategory.value) params.category_id = filterCategory.value

    const { data } = await api.get('/articles/', { params })
    articles.value = data.data || []
    total.value = data.total
    totalPages.value = data.total_pages
  } catch (e) { console.error(e) }
  loading.value = false
}

async function createCategory() {
  if (!newCategoryName.value) return
  try {
    await api.post('/articles/categories', { name: newCategoryName.value })
    newCategoryName.value = ''
    fetchCategories()
  } catch (e) { console.error(e) }
}

async function saveCategory() {
  if (!editCategoryName.value || !editCategoryId.value) return
  try {
    await api.put(`/articles/categories/${editCategoryId.value}`, { name: editCategoryName.value })
    editCategoryId.value = null
    fetchCategories()
    fetchArticles()
  } catch (e) { console.error(e) }
}

async function deleteCategory(id) {
  confirmTitle.value = 'Hapus Kategori'
  confirmMessage.value = 'Artikel dalam kategori ini tidak terhapus, hanya dipindahkan ke tanpa kategori.'
  confirmAction.value = async () => {
    try {
      await api.delete(`/articles/categories/${id}`)
      fetchCategories()
      fetchArticles()
    } catch (e) { console.error(e) }
  }
  showConfirm.value = true
}

async function createTag() {
  if (!newTagName.value) return
  try {
    await api.post('/articles/tags', { name: newTagName.value })
    newTagName.value = ''
    fetchTags()
  } catch (e) { console.error(e) }
}

async function deleteTag(id) {
  confirmTitle.value = 'Hapus Tag'
  confirmMessage.value = 'Tag ini akan dihapus dari semua artikel.'
  confirmAction.value = async () => {
    try {
      await api.delete(`/articles/tags/${id}`)
      fetchTags()
    } catch (e) { console.error(e) }
  }
  showConfirm.value = true
}

async function deleteArticle(id) {
  confirmTitle.value = 'Hapus Artikel'
  confirmMessage.value = 'Apakah Anda yakin ingin menghapus artikel ini?'
  confirmAction.value = async () => {
    try {
      await api.delete(`/articles/${id}`)
      fetchArticles()
    } catch (e) { console.error(e) }
  }
  showConfirm.value = true
}

onMounted(() => {
  fetchCategories()
  fetchTags()
  fetchArticles()
})
</script>

<style scoped>
.stat-card {
  @apply rounded-2xl p-5 text-center relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5;
}
.stat-icon {
  @apply w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3;
}
.article-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  @apply p-4 md:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-transparent hover:border-green-100;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
