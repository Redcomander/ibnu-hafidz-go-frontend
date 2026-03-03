<template>
  <div>
    <!-- Page Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
    >
      <div>
        <h1 class="text-2xl font-bold text-primary-dark tracking-tight">
          Data Kamar
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Kelola data kamar santri dan kapasitasnya
        </p>
      </div>
      <button
        v-if="auth.hasPermission('kamar.create')"
        @click="createKamar"
        class="btn-primary flex items-center gap-2"
      >
        <SvgIcon name="plus" :size="16" />
        <span>Tambah Kamar</span>
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
      <div class="flex-1 min-w-[200px]">
        <input
          v-model="search"
          type="text"
          placeholder="Cari nama kamar atau deskripsi..."
          class="input-field !py-2"
        />
      </div>
    </div>

    <!-- Data Table -->
    <div class="glass-card overflow-hidden animate-fade-in">
      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center text-gray-400">
        <div
          class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"
        ></div>
        <p class="text-sm">Memuat data...</p>
      </div>

      <!-- Table -->
      <div v-else>
        <!-- Desktop Table -->
        <table class="data-table hidden md:table">
          <thead>
            <tr>
              <th @click="setSort('nama_kamar')" class="cursor-pointer">
                Nama Kamar
                {{
                  sort.field === "nama_kamar"
                    ? sort.order === "asc"
                      ? "↑"
                      : "↓"
                    : ""
                }}
              </th>
              <th @click="setSort('kapasitas')" class="cursor-pointer">
                Kapasitas
                {{
                  sort.field === "kapasitas"
                    ? sort.order === "asc"
                      ? "↑"
                      : "↓"
                    : ""
                }}
              </th>
              <th>Wali Kamar</th>
              <th>Deskripsi</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id">
              <td class="font-medium text-gray-800">
                {{ item.nama_kamar }}
              </td>
              <td>
                <span class="badge-primary px-3 py-1">
                  {{ item.kapasitas }} Orang
                </span>
              </td>
              <td class="text-gray-600">
                {{ item.wali_kamar?.name || "-" }}
              </td>
              <td class="text-gray-500 text-sm max-w-xs truncate">
                {{ item.keterangan || "-" }}
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="auth.hasPermission('kamar.edit')"
                    @click="openMembersModal(item)"
                    class="text-blue-500 hover:text-blue-700 transition text-sm px-2 py-1 rounded hover:bg-blue-50 relative group"
                    title="Kelola Anggota"
                  >
                    <SvgIcon name="users" :size="16" />
                  </button>
                  <button
                    v-if="auth.hasPermission('kamar.edit')"
                    @click="editKamar(item)"
                    class="text-primary hover:text-primary-dark transition text-sm px-2 py-1 rounded hover:bg-primary-50"
                  >
                    <SvgIcon name="edit" :size="16" />
                  </button>
                  <button
                    v-if="auth.hasPermission('kamar.delete')"
                    @click="confirmDelete(item)"
                    class="text-red-500 hover:text-red-700 transition text-sm px-2 py-1 rounded hover:bg-red-50"
                  >
                    <SvgIcon name="trash" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="data.length === 0">
              <td colspan="5" class="text-center py-8 text-gray-400">
                Tidak ada data ditemukan
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile List View -->
        <div class="md:hidden">
          <div
            v-for="item in data"
            :key="item.id"
            class="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="font-semibold text-gray-800">
                  {{ item.nama_kamar }}
                </h3>
                <p
                  class="text-xs text-primary mt-0.5 font-medium"
                  v-if="item.wali_kamar"
                >
                  Wali: {{ item.wali_kamar.name }}
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  {{ item.keterangan || "Tidak ada deskripsi" }}
                </p>
              </div>
              <span class="badge-primary text-xs whitespace-nowrap">
                {{ item.kapasitas }} Orang
              </span>
            </div>
            <div class="flex justify-end gap-2 mt-3">
              <button
                v-if="auth.hasPermission('kamar.edit')"
                @click="openMembersModal(item)"
                class="text-blue-600 hover:text-blue-700 text-sm px-3 py-1.5 bg-blue-50 rounded-md flex items-center gap-1"
              >
                <SvgIcon name="users" :size="14" />
                Anggota
              </button>
              <button
                v-if="auth.hasPermission('kamar.edit')"
                @click="editKamar(item)"
                class="text-primary hover:text-primary-dark text-sm px-3 py-1.5 bg-brand-50 rounded-md"
              >
                Edit
              </button>
              <button
                v-if="auth.hasPermission('kamar.delete')"
                @click="confirmDelete(item)"
                class="text-red-600 hover:text-red-700 text-sm px-3 py-1.5 bg-red-50 rounded-md"
              >
                Hapus
              </button>
            </div>
          </div>
          <div v-if="data.length === 0" class="text-center py-8 text-gray-400">
            Tidak ada data
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

    <!-- Kamar Form Modal -->
    <KamarForm v-model="showForm" :kamar="selectedKamar" @saved="handleSaved" />

    <!-- Members Modal -->
    <KamarMembersModal
      v-model:show="showMembersModal"
      :kamar="selectedKamarForMembers"
      @updated="handleMembersUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model:show="showDeleteModal"
      title="Hapus Kamar"
      :message="`Apakah Anda yakin ingin menghapus kamar ${kamarToDelete?.nama_kamar}?`"
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
import KamarForm from "@/components/kamar/KamarForm.vue";
import KamarMembersModal from "@/components/kamar/KamarMembersModal.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { useToastStore } from "@/stores/toast";

const auth = useAuthStore();
const toast = useToastStore();

// Form state
const showForm = ref(false);
const selectedKamar = ref(null);
const showDeleteModal = ref(false);
const kamarToDelete = ref(null);
const deleteLoading = ref(false);

// Members Modal State
const showMembersModal = ref(false);
const selectedKamarForMembers = ref(null);

// useTable
const { data, loading, meta, search, sort, setPage, setSort, fetchData } =
  useTable("/kamar", {
    defaultSort: "nama_kamar",
    defaultOrder: "asc",
  });

function createKamar() {
  selectedKamar.value = null;
  showForm.value = true;
}

function editKamar(kamar) {
  selectedKamar.value = { ...kamar };
  showForm.value = true;
}

function openMembersModal(kamar) {
  selectedKamarForMembers.value = kamar;
  showMembersModal.value = true;
}

function handleMembersUpdated() {
  // Optionally refresh list if we want to show member counts in the table (future)
  fetchData();
}

async function confirmDelete(kamar) {
  kamarToDelete.value = kamar;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!kamarToDelete.value) return;

  deleteLoading.value = true;
  try {
    await api.delete(`/kamar/${kamarToDelete.value.id}`);
    toast.success(`Kamar ${kamarToDelete.value.nama_kamar} berhasil dihapus`);
    fetchData(); // Refresh list
    showDeleteModal.value = false;
  } catch (e) {
    console.error(e);
    toast.error("Gagal menghapus kamar");
  } finally {
    deleteLoading.value = false;
    kamarToDelete.value = null;
  }
}

function handleSaved() {
  fetchData();
}
</script>
