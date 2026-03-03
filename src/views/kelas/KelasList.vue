<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Data Kelas</h1>
        <p class="text-gray-500 text-sm mt-1">
          Kelola data kelas, wali kelas, dan wali diniyyah
        </p>
      </div>
      <button
        v-if="auth.hasPermission('kelas.create')"
        @click="createKelas"
        class="btn-primary flex items-center gap-2"
      >
        <SvgIcon name="plus" :size="20" />
        Tambah Kelas
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <!-- Total Kelas -->
      <div
        class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white relative overflow-hidden shadow-lg"
      >
        <div
          class="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full"
        ></div>
        <div class="relative flex justify-between items-center">
          <div>
            <p class="text-indigo-100 text-sm font-medium">Total Kelas</p>
            <p class="text-3xl font-bold mt-1">{{ stats.total_kelas }}</p>
          </div>
          <div class="bg-white/20 p-3 rounded-lg">
            <SvgIcon name="home" :size="24" />
          </div>
        </div>
      </div>

      <!-- Total Santri -->
      <div
        class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white relative overflow-hidden shadow-lg"
      >
        <div
          class="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full"
        ></div>
        <div class="relative flex justify-between items-center">
          <div>
            <p class="text-emerald-100 text-sm font-medium">Total Santri</p>
            <p class="text-3xl font-bold mt-1">{{ stats.total_santri }}</p>
          </div>
          <div class="bg-white/20 p-3 rounded-lg">
            <SvgIcon name="users" :size="24" />
          </div>
        </div>
      </div>

      <!-- Wali Kelas Aktif -->
      <div
        class="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white relative overflow-hidden shadow-lg"
      >
        <div
          class="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full"
        ></div>
        <div class="relative flex justify-between items-center">
          <div>
            <p class="text-blue-100 text-sm font-medium">Wali Kelas Aktif</p>
            <p class="text-3xl font-bold mt-1">{{ stats.active_walis }}</p>
          </div>
          <div class="bg-white/20 p-3 rounded-lg">
            <SvgIcon name="user-check" :size="24" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filters & Search -->
    <div
      class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4"
    >
      <!-- Search -->
      <div class="relative flex-1">
        <input
          v-model="search"
          type="text"
          placeholder="Cari nama kelas atau tingkat..."
          class="input-field !pl-10"
          style="padding-left: 2.5rem !important"
        />
        <SvgIcon
          name="search"
          :size="20"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>

      <!-- Gender Filter -->
      <select v-model="filters.gender" class="input-field md:w-48">
        <option value="">Semua Gender</option>
        <option value="banin">Banin (Putra)</option>
        <option value="banat">Banat (Putri)</option>
      </select>
    </div>

    <!-- Table content -->
    <div
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th
                class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                @click="setSort('nama')"
              >
                <div class="flex items-center gap-1">
                  Nama Kelas
                  <SvgIcon
                    v-if="sort === 'nama'"
                    :name="order === 'asc' ? 'chevron-up' : 'chevron-down'"
                    :size="14"
                  />
                </div>
              </th>
              <th
                class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                @click="setSort('tingkat')"
              >
                <div class="flex items-center gap-1">
                  Tingkat
                  <SvgIcon
                    v-if="sort === 'tingkat'"
                    :name="order === 'asc' ? 'chevron-up' : 'chevron-down'"
                    :size="14"
                  />
                </div>
              </th>
              <th
                class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Gender
              </th>
              <th
                class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Wali Kelas
              </th>
              <th
                class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Wali Diniyyah
              </th>
              <th
                class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Jml Santri
              </th>
              <th
                class="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="6" class="p-8 text-center text-gray-500">
                <div
                  class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"
                ></div>
                Memuat data...
              </td>
            </tr>
            <tr
              v-else
              v-for="item in data"
              :key="item.id"
              class="hover:bg-gray-50 transition"
            >
              <td class="py-3 px-4 text-sm font-medium text-gray-800">
                {{ item.nama }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">
                {{ item.tingkat }}
              </td>
              <td class="py-3 px-4">
                <span
                  class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  :class="
                    item.gender === 'banin'
                      ? 'bg-blue-50 text-blue-700'
                      : item.gender === 'banat'
                        ? 'bg-pink-50 text-pink-700'
                        : 'bg-gray-50 text-gray-600'
                  "
                >
                  {{
                    item.gender === "banin"
                      ? "Banin"
                      : item.gender === "banat"
                        ? "Banat"
                        : "-"
                  }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">
                <div v-if="item.wali_kelas" class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary"
                  >
                    {{ item.wali_kelas.name.charAt(0) }}
                  </div>
                  {{ item.wali_kelas.name }}
                </div>
                <span v-else class="text-gray-400 italic text-xs"
                  >Belum diatur</span
                >
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">
                <div
                  v-if="item.wali_kelas_diniyyah"
                  class="flex items-center gap-2"
                >
                  <div
                    class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700"
                  >
                    {{ item.wali_kelas_diniyyah.name.charAt(0) }}
                  </div>
                  {{ item.wali_kelas_diniyyah.name }}
                </div>
                <span v-else class="text-gray-400 italic text-xs"
                  >Belum diatur</span
                >
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">
                <span class="font-medium text-gray-800">{{
                  item.students ? item.students.length : 0
                }}</span>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <router-link
                    v-if="auth.hasPermission('kelas.view')"
                    :to="`/kelas/${item.id}`"
                    class="text-gray-500 hover:text-gray-700 transition text-sm px-2 py-1 rounded hover:bg-gray-100"
                    title="Detail"
                  >
                    <SvgIcon name="eye" :size="16" />
                  </router-link>
                  <button
                    v-if="auth.hasPermission('kelas.edit')"
                    @click="openMembersModal(item)"
                    class="text-blue-500 hover:text-blue-700 transition text-sm px-2 py-1 rounded hover:bg-blue-50 relative group"
                    title="Kelola Anggota"
                  >
                    <SvgIcon name="users" :size="16" />
                  </button>
                  <button
                    v-if="auth.hasPermission('kelas.edit')"
                    @click="editKelas(item)"
                    class="text-primary hover:text-primary-dark transition text-sm px-2 py-1 rounded hover:bg-primary-50"
                    title="Edit"
                  >
                    <SvgIcon name="edit" :size="16" />
                  </button>
                  <button
                    v-if="auth.hasPermission('kelas.delete')"
                    @click="confirmDelete(item)"
                    class="text-red-500 hover:text-red-700 transition text-sm px-2 py-1 rounded hover:bg-red-50"
                    title="Hapus"
                  >
                    <SvgIcon name="trash" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && data.length === 0">
              <td colspan="6" class="text-center py-8 text-gray-400">
                Tidak ada data ditemukan
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile View -->
        <div class="md:hidden">
          <div
            v-for="item in data"
            :key="item.id"
            class="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="font-semibold text-gray-800">{{ item.nama }}</h3>
                <p class="text-xs text-gray-500">{{ item.tingkat }}</p>
              </div>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="
                  item.gender === 'banin'
                    ? 'bg-blue-50 text-blue-700'
                    : item.gender === 'banat'
                      ? 'bg-pink-50 text-pink-700'
                      : 'bg-gray-50 text-gray-600'
                "
              >
                {{
                  item.gender === "banin"
                    ? "Banin"
                    : item.gender === "banat"
                      ? "Banat"
                      : "-"
                }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <p class="text-xs text-gray-400">Wali Kelas</p>
                <p v-if="item.wali_kelas" class="font-medium text-gray-700">
                  {{ item.wali_kelas.name }}
                </p>
                <p v-else class="text-gray-400 italic text-xs">Belum diatur</p>
              </div>
              <div>
                <p class="text-xs text-gray-400">Wali Diniyyah</p>
                <p
                  v-if="item.wali_kelas_diniyyah"
                  class="font-medium text-gray-700"
                >
                  {{ item.wali_kelas_diniyyah.name }}
                </p>
                <p v-else class="text-gray-400 italic text-xs">Belum diatur</p>
              </div>
            </div>

            <div class="flex justify-end gap-2 mt-3">
              <button
                v-if="auth.hasPermission('kelas.edit')"
                @click="openMembersModal(item)"
                class="text-blue-600 hover:text-blue-700 text-sm px-3 py-1.5 bg-blue-50 rounded-md flex items-center gap-1"
              >
                <SvgIcon name="users" :size="14" />
                Anggota
              </button>
              <button
                v-if="auth.hasPermission('kelas.edit')"
                @click="editKelas(item)"
                class="text-primary hover:text-primary-dark text-sm px-3 py-1.5 bg-brand-50 rounded-md"
              >
                Edit
              </button>
              <button
                v-if="auth.hasPermission('kelas.delete')"
                @click="confirmDelete(item)"
                class="text-red-600 hover:text-red-700 text-sm px-3 py-1.5 bg-red-50 rounded-md"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="meta.totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t border-gray-100"
      >
        <p class="text-sm text-gray-500">
          Halaman {{ meta.page }} dari {{ meta.totalPages }}
        </p>
        <div class="flex items-center gap-2">
          <button
            @click="setPage(meta.page - 1)"
            :disabled="meta.page === 1"
            class="p-1 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <SvgIcon name="chevron-left" :size="20" />
          </button>
          <button
            @click="setPage(meta.page + 1)"
            :disabled="meta.page === meta.totalPages"
            class="p-1 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <SvgIcon name="chevron-right" :size="20" />
          </button>
        </div>
      </div>
    </div>

    <!-- Kelas Form Modal -->
    <KelasForm v-model="showForm" :kelas="selectedKelas" @saved="handleSaved" />

    <!-- Members Modal -->
    <KelasMembersModal
      v-model:show="showMembersModal"
      :kelas="selectedKelasForMembers"
      @updated="handleMembersUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model:show="showDeleteModal"
      title="Hapus Kelas"
      :message="`Apakah Anda yakin ingin menghapus kelas ${kelasToDelete?.nama}?`"
      confirm-text="Hapus"
      cancel-text="Batal"
      type="danger"
      :loading="deleteLoading"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useTable } from "@/composables/useTable";
import api from "@/api";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import KelasForm from "@/components/kelas/KelasForm.vue";
import KelasMembersModal from "@/components/kelas/KelasMembersModal.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { useToastStore } from "@/stores/toast";

const auth = useAuthStore();
const toast = useToastStore();

// Form state
const showForm = ref(false);
const selectedKelas = ref(null);
const showDeleteModal = ref(false);
const kelasToDelete = ref(null);
const deleteLoading = ref(false);

// Members Modal State
const showMembersModal = ref(false);
const selectedKelasForMembers = ref(null);

// Stats State
const stats = ref({
  total_kelas: 0,
  total_santri: 0,
  active_walis: 0,
});

async function fetchStats() {
  try {
    const { data } = await api.get("/kelas/stats");
    stats.value = data;
  } catch (e) {
    console.error("Failed to fetch stats", e);
  }
}

fetchStats();

// useTable
const {
  data,
  loading,
  meta,
  search,
  filters,
  sort,
  order,
  setPage,
  setSort,
  fetchData,
} = useTable("/kelas", {
  defaultSort: "nama",
  defaultOrder: "asc",
  filters: {
    gender: "",
  },
});

function createKelas() {
  selectedKelas.value = null;
  showForm.value = true;
}

function editKelas(item) {
  selectedKelas.value = { ...item };
  showForm.value = true;
}

function openMembersModal(kelas) {
  selectedKelasForMembers.value = kelas;
  showMembersModal.value = true;
}

function handleMembersUpdated() {
  // Optional: Refresh list if we display member counts
  fetchData();
}

async function confirmDelete(item) {
  kelasToDelete.value = item;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!kelasToDelete.value) return;

  deleteLoading.value = true;
  try {
    await api.delete(`/kelas/${kelasToDelete.value.id}`);
    toast.success(`Kelas ${kelasToDelete.value.nama} berhasil dihapus`);
    fetchData();
    showDeleteModal.value = false;
  } catch (e) {
    console.error(e);
    toast.error("Gagal menghapus kelas");
  } finally {
    deleteLoading.value = false;
    kelasToDelete.value = null;
  }
}

function handleSaved() {
  fetchData();
}
</script>
