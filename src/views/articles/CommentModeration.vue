<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-3">
          <button @click="$router.back()" class="p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
            <SvgIcon name="arrow-left" :size="20" />
          </button>
          <div>
            <h1 class="text-3xl font-extrabold text-primary-dark tracking-tight">Moderasi Komentar</h1>
            <p class="text-gray-500 text-sm mt-1">Tinjau dan setujui komentar yang masuk</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span
          v-if="total > 0"
          :class="['text-sm font-semibold px-3 py-1.5 rounded-full', theme.isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700']"
        >
          {{ total }} menunggu
        </span>
        <button @click="fetchComments" :disabled="loading" class="btn-secondary flex items-center gap-2 !rounded-xl !py-2 !px-3 text-sm">
          <SvgIcon name="refresh" :size="14" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && comments.length === 0"
      :class="['glass-card p-12 text-center', theme.isDark ? 'bg-slate-900/80' : '']"
    >
      <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4', theme.isDark ? 'bg-emerald-500/20' : 'bg-emerald-100']">
        <SvgIcon name="check-circle" :size="32" class="text-emerald-500" />
      </div>
      <p class="text-lg font-semibold text-gray-600">Tidak ada komentar yang menunggu persetujuan</p>
      <p class="text-sm text-gray-400 mt-1">Semua komentar sudah ditinjau</p>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" :class="['glass-card p-5 !rounded-2xl animate-pulse', theme.isDark ? 'bg-slate-800' : 'bg-gray-50']">
        <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
        <div class="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Comment Cards -->
    <div v-else class="space-y-3">
      <div
        v-for="comment in comments"
        :key="comment.id"
        :class="['glass-card p-5 !rounded-2xl border transition-all', theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md']"
      >
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <!-- Meta -->
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span :class="['font-semibold text-sm', theme.isDark ? 'text-white' : 'text-gray-900']">{{ comment.name }}</span>
              <span v-if="comment.email" :class="['text-xs', theme.isDark ? 'text-gray-400' : 'text-gray-500']">{{ comment.email }}</span>
              <span
                v-if="comment.parent_id"
                :class="['text-xs font-medium px-2 py-0.5 rounded-full', theme.isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600']"
              >
                Balasan
              </span>
              <span
                v-if="comment.article"
                :class="['text-xs font-medium px-2 py-0.5 rounded-full truncate max-w-xs', theme.isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700']"
              >
                {{ comment.article.title }}
              </span>
            </div>
            <!-- Body -->
            <p :class="['text-sm leading-relaxed', theme.isDark ? 'text-gray-300' : 'text-gray-700']">{{ comment.body }}</p>
            <!-- Date -->
            <p class="text-xs text-gray-400 mt-2">{{ formatDate(comment.created_at) }}</p>
          </div>
          <!-- Actions -->
          <div class="flex gap-2 shrink-0 self-start">
            <button
              @click="approve(comment)"
              :disabled="approving === comment.id"
              :class="['btn-primary flex items-center gap-1.5 !py-1.5 !px-3 text-sm !rounded-lg', approving === comment.id ? 'opacity-60' : '']"
            >
              <SvgIcon name="check" :size="14" />
              <span>Setujui</span>
            </button>
            <button
              @click="openDeleteConfirm(comment)"
              :class="['flex items-center gap-1.5 !py-1.5 !px-3 text-sm !rounded-lg font-semibold transition-colors', theme.isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100']"
            >
              <SvgIcon name="trash" :size="14" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 mt-6">
        <button
          @click="page > 1 && (page--, fetchComments())"
          :disabled="page === 1"
          class="btn-secondary !py-1.5 !px-4 text-sm disabled:opacity-40"
        >
          ‹ Prev
        </button>
        <span class="text-sm text-gray-500">{{ page }} / {{ totalPages }}</span>
        <button
          @click="page < totalPages && (page++, fetchComments())"
          :disabled="page === totalPages"
          class="btn-secondary !py-1.5 !px-4 text-sm disabled:opacity-40"
        >
          Next ›
        </button>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-if="showConfirm"
      title="Hapus Komentar"
      :message="`Komentar dari '${deleteTarget?.name}' akan dihapus permanen. Lanjutkan?`"
      @confirm="doDelete"
      @cancel="showConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()

const loading = ref(false)
const comments = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const totalPages = ref(1)
const approving = ref(null)
const showConfirm = ref(false)
const deleteTarget = ref(null)

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

async function fetchComments() {
  loading.value = true
  try {
    const { data } = await api.get('/articles/comments/pending', {
      params: { page: page.value, per_page: perPage.value },
    })
    comments.value = data.data || []
    total.value = data.total || 0
    totalPages.value = data.total_pages || 1
  } catch (e) {
    console.error('fetchComments error', e)
  }
  loading.value = false
}

async function approve(comment) {
  approving.value = comment.id
  try {
    await api.put(`/articles/comments/${comment.id}/approve`)
    comments.value = comments.value.filter(c => c.id !== comment.id)
    total.value = Math.max(0, total.value - 1)
  } catch (e) {
    console.error('approve error', e)
  }
  approving.value = null
}

function openDeleteConfirm(comment) {
  deleteTarget.value = comment
  showConfirm.value = true
}

async function doDelete() {
  showConfirm.value = false
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  deleteTarget.value = null
  try {
    await api.delete(`/articles/comments/${id}`)
    comments.value = comments.value.filter(c => c.id !== id)
    total.value = Math.max(0, total.value - 1)
  } catch (e) {
    console.error('delete error', e)
  }
}

onMounted(fetchComments)
</script>
