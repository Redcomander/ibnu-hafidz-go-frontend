<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center gap-4 mb-8">
      <button @click="$router.back()" class="p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
        <SvgIcon name="arrow-left" :size="20" />
      </button>
      <div>
        <h1 class="text-2xl font-extrabold text-primary-dark tracking-tight">
          {{ isEdit ? 'Edit Artikel' : 'Tulis Artikel Baru' }}
        </h1>
        <p class="text-gray-500 text-sm mt-1">{{ isEdit ? 'Perbarui konten artikel' : 'Buat konten berita atau artikel baru' }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <div class="glass-card p-6 !rounded-2xl">
          <div class="space-y-5">
            <div>
              <label class="label-field">Judul Artikel <span class="text-red-500">*</span></label>
              <input v-model="form.title" type="text" class="input-field !rounded-xl !py-3 text-lg font-medium" placeholder="Masukkan judul artikel..." />
            </div>

            <!-- Editor / Preview Tabs -->
            <div>
              <div class="flex items-center gap-1 mb-3 border-b border-gray-200">
                <button
                  @click="activeTab = 'editor'"
                  :class="['px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px', activeTab === 'editor' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600']"
                >
                  <span class="flex items-center gap-1.5">
                    <SvgIcon name="edit" :size="14" />
                    Editor
                  </span>
                </button>
                <button
                  @click="activeTab = 'preview'"
                  :class="['px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px', activeTab === 'preview' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600']"
                >
                  <span class="flex items-center gap-1.5">
                    <SvgIcon name="eye" :size="14" />
                    Preview
                  </span>
                </button>
                <!-- Gallery button for editor -->
                <button
                  v-if="activeTab === 'editor'"
                  @click="galleryPickerTarget = 'editor'; showGalleryPicker = true; fetchGalleryImages()"
                  class="ml-auto px-3 py-2 text-xs font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                >
                  <SvgIcon name="image" :size="14" />
                  Sisipkan dari Galeri
                </button>
              </div>

              <!-- Quill Editor -->
              <div v-show="activeTab === 'editor'">
                <QuillEditor
                  ref="quillEditor"
                  v-model:content="form.body"
                  content-type="html"
                  :options="quillOptions"
                  style="min-height: 350px;"
                />
              </div>

              <!-- Preview -->
              <div v-show="activeTab === 'preview'" class="border border-gray-200 rounded-xl bg-white min-h-[350px]">
                <div class="max-w-3xl mx-auto p-6 md:p-10">
                  <div class="mb-6">
                    <div class="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <span v-if="selectedCategory" class="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-semibold">{{ selectedCategory.name }}</span>
                      <span>{{ previewDate }}</span>
                      <span>&middot;</span>
                      <span>{{ readingTime }}</span>
                    </div>
                    <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">{{ form.title || 'Judul Artikel' }}</h1>
                  </div>
                  <div v-if="thumbnailPreview || (isEdit && form.existing_thumbnail)" class="rounded-xl overflow-hidden mb-8 shadow-sm">
                    <img :src="thumbnailPreview || '/uploads/' + form.existing_thumbnail" class="w-full max-h-[360px] object-cover" />
                  </div>
                  <article class="ql-editor-preview prose prose-sm md:prose-base max-w-none" v-html="form.body || '<p class=\'text-gray-400 italic\'>Mulai menulis konten artikel...</p>'"></article>
                  <div v-if="selectedTags.length > 0" class="mt-8 pt-6 border-t border-gray-100">
                    <div class="flex flex-wrap gap-2">
                      <span v-for="t in selectedTags" :key="t.id" class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">#{{ t.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="label-field">Ringkasan (Excerpt)</label>
              <textarea v-model="form.excerpt" rows="3" class="input-field !rounded-xl" placeholder="Ringkasan singkat artikel..."></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Publish Settings -->
        <div class="glass-card p-5 !rounded-2xl">
          <h3 class="font-bold text-sm text-gray-700 mb-4 flex items-center gap-2">
            <SvgIcon name="settings" :size="16" class="text-gray-400" />
            Pengaturan Publish
          </h3>
          <div class="space-y-4">
            <div>
              <label class="label-field">Status</label>
              <select v-model="form.status" class="input-field !rounded-xl">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label class="label-field">Kategori</label>
              <select v-model="form.category_id" class="input-field !rounded-xl">
                <option value="">Tanpa Kategori</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="label-field">Tag</label>
              <div class="flex flex-wrap gap-1.5 mb-2">
                <span v-for="t in selectedTags" :key="t.id" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {{ t.name }}
                  <button @click="removeTag(t.id)" class="hover:text-red-500 transition-colors">&times;</button>
                </span>
              </div>
              <select @change="addTag($event)" class="input-field !rounded-xl">
                <option value="">Pilih tag...</option>
                <option v-for="t in availableTags" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Thumbnail -->
        <div class="glass-card p-5 !rounded-2xl">
          <h3 class="font-bold text-sm text-gray-700 mb-4 flex items-center gap-2">
            <SvgIcon name="image" :size="16" class="text-gray-400" />
            Thumbnail
          </h3>
          <div v-if="thumbnailPreview || (isEdit && form.existing_thumbnail)" class="mb-3 rounded-xl overflow-hidden shadow-sm">
            <img :src="thumbnailPreview || '/uploads/' + form.existing_thumbnail" class="w-full h-40 object-cover" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <!-- Upload from file -->
            <div
              class="flex flex-col items-center justify-center px-3 py-4 border-2 border-gray-200 border-dashed rounded-xl bg-gray-50/50 hover:bg-gray-100/50 hover:border-primary/30 transition-all cursor-pointer"
              @click="$refs.thumbnailInput.click()"
            >
              <SvgIcon name="upload" :size="22" class="text-gray-400 mb-1" />
              <p class="text-[11px] text-gray-500 font-medium text-center">Upload File</p>
              <input type="file" ref="thumbnailInput" accept="image/*" class="sr-only" @change="onThumbnailSelected" />
            </div>
            <!-- Pick from gallery -->
            <div
              class="flex flex-col items-center justify-center px-3 py-4 border-2 border-gray-200 border-dashed rounded-xl bg-gray-50/50 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer"
              @click="galleryPickerTarget = 'thumbnail'; showGalleryPicker = true; fetchGalleryImages()"
            >
              <SvgIcon name="image" :size="22" class="text-primary/50 mb-1" />
              <p class="text-[11px] text-primary font-medium text-center">Dari Galeri</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="glass-card p-5 !rounded-2xl space-y-3">
          <button @click="handleSubmit" :disabled="saving" class="btn-primary w-full flex items-center justify-center gap-2 !rounded-xl !py-3 shadow-lg shadow-green-200/40">
            <SvgIcon name="check" :size="16" />
            {{ saving ? 'Menyimpan...' : (isEdit ? 'Perbarui Artikel' : 'Publish Artikel') }}
          </button>
          <button @click="$router.back()" class="btn-secondary w-full !rounded-xl !py-3">Batal</button>
        </div>
      </div>
    </div>

    <!-- Gallery Image Picker Modal -->
    <Modal :show="showGalleryPicker" @close="showGalleryPicker = false" :title="galleryPickerTarget === 'thumbnail' ? 'Pilih Thumbnail dari Galeri' : 'Sisipkan Gambar dari Galeri'" maxWidth="lg">
      <div>
        <!-- Search -->
        <div class="mb-4">
          <input v-model="gallerySearch" type="text" class="input-field !rounded-xl !py-2.5" placeholder="Cari gambar..." @input="fetchGalleryImages" />
        </div>

        <!-- Loading -->
        <div v-if="galleryLoading" class="text-center py-12 text-gray-400">
          <div class="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
          Memuat galeri...
        </div>

        <!-- Images Grid -->
        <div v-else-if="galleryImages.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1">
          <div
            v-for="img in galleryImages"
            :key="img.id"
            @click="selectGalleryImage(img)"
            class="relative group cursor-pointer rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all hover:shadow-lg"
          >
            <img :src="'/uploads/' + img.path" class="w-full h-24 sm:h-28 object-cover group-hover:scale-105 transition-transform duration-200" />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <SvgIcon name="check" :size="16" class="text-primary" />
              </div>
            </div>
            <p class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[10px] px-2 py-1.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {{ img.title }}
            </p>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="text-center py-12 text-gray-400">
          <SvgIcon name="image" :size="40" class="mx-auto mb-3 text-gray-300" />
          <p class="text-sm">Belum ada foto di galeri</p>
        </div>

        <!-- Pagination -->
        <div v-if="galleryTotalPages > 1" class="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            v-for="p in galleryTotalPages"
            :key="p"
            @click="galleryPage = p; fetchGalleryImages()"
            :class="['w-8 h-8 rounded-lg text-xs font-medium transition-colors', p === galleryPage ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']"
          >{{ p }}</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import Modal from '@/components/ui/Modal.vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const categories = ref([])
const allTags = ref([])
const selectedTags = ref([])
const thumbnailFile = ref(null)
const thumbnailPreview = ref(null)
const activeTab = ref('editor')
const quillEditor = ref(null)

const form = ref({
  title: '',
  body: '',
  excerpt: '',
  category_id: '',
  status: 'draft',
  existing_thumbnail: null,
})

// Gallery picker
const showGalleryPicker = ref(false)
const galleryPickerTarget = ref('editor') // 'editor' or 'thumbnail'
const galleryImages = ref([])
const galleryLoading = ref(false)
const gallerySearch = ref('')
const galleryPage = ref(1)
const galleryTotalPages = ref(1)

const quillOptions = {
  theme: 'snow',
  placeholder: 'Mulai menulis konten artikel...',
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean'],
    ],
  },
}

const selectedCategory = computed(() => {
  if (!form.value.category_id) return null
  return categories.value.find(c => c.id === parseInt(form.value.category_id))
})

const readingTime = computed(() => {
  if (!form.value.body) return '1 min read'
  const text = form.value.body.replace(/<[^>]*>/g, '')
  const words = text.split(/\s+/).filter(w => w.length > 0).length
  return Math.max(1, Math.ceil(words / 200)) + ' min read'
})

const previewDate = computed(() => {
  return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
})

const availableTags = computed(() =>
  allTags.value.filter(t => !selectedTags.value.find(st => st.id === t.id))
)

function addTag(e) {
  const id = parseInt(e.target.value)
  if (!id) return
  const tag = allTags.value.find(t => t.id === id)
  if (tag) selectedTags.value.push(tag)
  e.target.value = ''
}

function removeTag(id) {
  selectedTags.value = selectedTags.value.filter(t => t.id !== id)
}

function onThumbnailSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  thumbnailFile.value = file
  thumbnailPreview.value = URL.createObjectURL(file)
}

// Gallery image picker
async function fetchGalleryImages() {
  galleryLoading.value = true
  try {
    const params = { page: galleryPage.value, per_page: 20, type: 'photo' }
    if (gallerySearch.value) params.search = gallerySearch.value
    const { data } = await api.get('/gallery/items', { params })
    galleryImages.value = data.data || []
    galleryTotalPages.value = data.total_pages || 1
  } catch (e) { console.error(e) }
  galleryLoading.value = false
}

function selectGalleryImage(img) {
  if (galleryPickerTarget.value === 'thumbnail') {
    // Set as thumbnail
    thumbnailPreview.value = '/uploads/' + img.path
    thumbnailFile.value = null // Will need to send the path instead
    form.value.thumbnail_from_gallery = img.path
    showGalleryPicker.value = false
  } else {
    // Insert into Quill editor
    const editor = quillEditor.value?.getQuill()
    if (editor) {
      const range = editor.getSelection(true)
      const imgUrl = '/uploads/' + img.path
      editor.insertEmbed(range.index, 'image', imgUrl)
      editor.setSelection(range.index + 1)
    }
    showGalleryPicker.value = false
  }
}

async function fetchMeta() {
  try {
    const [catRes, tagRes] = await Promise.all([
      api.get('/articles/categories'),
      api.get('/articles/tags'),
    ])
    categories.value = catRes.data.data || []
    allTags.value = tagRes.data.data || []
  } catch (e) { console.error(e) }
}

async function fetchArticle() {
  if (!isEdit.value) return
  try {
    const { data } = await api.get('/articles/', { params: { per_page: 999 } })
    const article = (data.data || []).find(a => a.id === parseInt(route.params.id))
    if (article) {
      form.value.title = article.title
      form.value.body = article.body
      form.value.excerpt = article.excerpt || ''
      form.value.category_id = article.category_id || ''
      form.value.status = article.status
      form.value.existing_thumbnail = article.thumbnail
      selectedTags.value = article.tags || []
    }
  } catch (e) { console.error(e) }
}

async function handleSubmit() {
  if (!form.value.title || !form.value.body) return
  saving.value = true

  try {
    const fd = new FormData()
    fd.append('title', form.value.title)
    fd.append('body', form.value.body)
    if (form.value.excerpt) fd.append('excerpt', form.value.excerpt)
    if (form.value.category_id) fd.append('category_id', form.value.category_id)
    fd.append('status', form.value.status)

    if (selectedTags.value.length > 0) {
      fd.append('tag_ids', selectedTags.value.map(t => t.id).join(','))
    }
    if (thumbnailFile.value) {
      fd.append('thumbnail', thumbnailFile.value)
    } else if (form.value.thumbnail_from_gallery) {
      fd.append('thumbnail_from_gallery', form.value.thumbnail_from_gallery)
    }

    if (isEdit.value) {
      await api.put(`/articles/${route.params.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    } else {
      await api.post('/articles/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    router.push({ name: 'articles' })
  } catch (e) { console.error(e) }
  saving.value = false
}

onMounted(() => {
  fetchMeta()
  fetchArticle()
})
</script>

<style>
/* Quill editor container styling */
.ql-toolbar.ql-snow {
  border-radius: 0.75rem 0.75rem 0 0 !important;
  border-color: #e5e7eb !important;
  background: #f9fafb;
}
.ql-container.ql-snow {
  border-radius: 0 0 0.75rem 0.75rem !important;
  border-color: #e5e7eb !important;
  font-family: inherit;
  font-size: 0.95rem;
  min-height: 300px;
}
.ql-editor {
  min-height: 300px;
  line-height: 1.7;
  caret-color: #111827 !important;
  cursor: text;
}
.ql-editor * {
  caret-color: #111827 !important;
}
.ql-editor:focus {
  outline: none;
  caret-color: #111827 !important;
}
.ql-editor.ql-blank::before {
  font-style: normal;
  color: #9ca3af;
}

/* Preview article prose styles */
.ql-editor-preview {
  line-height: 1.8;
  color: #374151;
}
.ql-editor-preview h1 { font-size: 1.75rem; font-weight: 700; margin: 1.5em 0 0.5em; color: #111827; }
.ql-editor-preview h2 { font-size: 1.4rem; font-weight: 700; margin: 1.25em 0 0.5em; color: #1f2937; }
.ql-editor-preview h3 { font-size: 1.15rem; font-weight: 600; margin: 1em 0 0.4em; color: #1f2937; }
.ql-editor-preview p { margin: 0.75em 0; }
.ql-editor-preview ul, .ql-editor-preview ol { padding-left: 1.75em; margin: 0.75em 0; }
.ql-editor-preview li { margin: 0.25em 0; }
.ql-editor-preview blockquote {
  border-left: 4px solid #3b82f6;
  margin: 1em 0;
  padding: 0.75em 1em;
  background: #eff6ff;
  border-radius: 0 0.5rem 0.5rem 0;
  color: #1e40af;
  font-style: italic;
}
.ql-editor-preview pre {
  background: #1f2937;
  color: #e5e7eb;
  padding: 1em;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-size: 0.85em;
}
.ql-editor-preview img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1em 0;
}
.ql-editor-preview a {
  color: #2563eb;
  text-decoration: underline;
}
.ql-editor-preview strong { font-weight: 700; }
.ql-editor-preview em { font-style: italic; }
</style>
