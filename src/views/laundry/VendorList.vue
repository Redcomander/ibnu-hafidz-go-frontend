<template>
  <div>
    <!-- Page Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
    >
      <div>
        <h1 class="text-2xl font-bold text-primary-dark tracking-tight">
          Vendor Laundry
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Kelola data penyedia jasa laundry dan statistik pendapatannya
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="auth.hasPermission('laundry_accounts.view')"
          @click="openMergeModal"
          class="btn-secondary flex items-center gap-1.5 !bg-emerald-50 !text-emerald-700 !border-emerald-200 hover:!bg-emerald-100 !py-2 !px-3 text-sm"
        >
          <SvgIcon name="document-add" :size="14" />
          <span class="hidden sm:inline">Gabung Vendor</span>
          <span class="sm:hidden">PDF</span>
        </button>
        <button
          v-if="auth.hasPermission('laundry_accounts.view')" 
          @click="openStatsModal"
          class="btn-secondary flex items-center gap-1.5 !py-2 !px-3 text-sm"
        >
          <SvgIcon name="chart" :size="14" />
          <span class="hidden sm:inline">Statistik Global</span>
        </button>
        <button
          v-if="auth.hasPermission('laundry_accounts.view')"
          @click="createVendor"
          class="btn-primary flex items-center gap-1.5 !py-2 !px-3 text-sm"
        >
          <SvgIcon name="plus" :size="14" />
          <span>Tambah Vendor</span>
        </button>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="glass-card p-3 md:p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
      <div class="flex-1">
        <input
          v-model="search"
          type="text"
          placeholder="Cari nama vendor atau telepon..."
          class="input-field !py-2 w-full"
        />
      </div>
      <select v-model="filters.gender_type" class="input-field !py-2 sm:!w-auto">
        <option value="all">Semua Kategori</option>
        <option value="banin">Banin</option>
        <option value="banat">Banat</option>
      </select>
    </div>

    <!-- Data Table -->
    <div class="glass-card overflow-hidden animate-fade-in">
      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center text-gray-400">
        <div
          class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"
        ></div>
        <p class="text-sm">Memuat data vendor...</p>
      </div>

      <!-- Table -->
      <div v-else>
        <!-- Desktop Table -->
        <table class="data-table hidden md:table">
          <thead>
            <tr>
              <th>Nama Vendor</th>
              <th>Kategori</th>
              <th>Telepon</th>
              <th>Aktif</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id">
              <td class="font-medium text-gray-800">
                {{ item.name }}
                <div class="text-xs text-gray-400 truncate max-w-xs">{{ item.address }}</div>
              </td>
              <td>
                <span :class="['px-2 py-0.5 rounded text-xs font-medium', item.gender_type === 'banin' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700']">
                  {{ item.gender_type === 'banin' ? 'Banin' : 'Banat' }}
                </span>
              </td>
              <td class="text-gray-600">
                {{ item.phone || "-" }}
              </td>
              <td>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    item.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700',
                  ]"
                >
                  {{ item.active ? "Ya" : "Tidak" }}
                </span>
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="auth.hasPermission('laundry_accounts.view')"
                    @click="viewStats(item)"
                    class="text-blue-500 hover:text-blue-700 transition text-sm px-2 py-1 rounded hover:bg-blue-50 relative group"
                    title="Statistik Vendor"
                  >
                    <SvgIcon name="chart" :size="16" />
                  </button>
                  <button
                    v-if="auth.hasPermission('laundry_accounts.view')"
                    @click="editVendor(item)"
                    class="text-primary hover:text-primary-dark transition text-sm px-2 py-1 rounded hover:bg-primary-50"
                  >
                    <SvgIcon name="edit" :size="16" />
                  </button>
                  <button
                    v-if="auth.hasPermission('laundry_accounts.view')"
                    @click="confirmDelete(item)"
                    class="text-red-500 hover:text-red-700 transition text-sm px-2 py-1 rounded hover:bg-red-50"
                  >
                    <SvgIcon name="trash" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="data.length === 0">
              <td colspan="6" class="text-center py-8 text-gray-400">
                Tidak ada vendor ditemukan
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile View -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden p-4">
          <div
            v-for="item in data"
            :key="item.id"
            class="bg-white border text-sm border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow relative"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="font-bold text-gray-900">{{ item.name }}</h3>
                <p class="text-xs text-gray-500 mt-1 line-clamp-2">
                  {{ item.address }}
                </p>
              </div>
              <span
                :class="[
                  'px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider',
                  item.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                ]"
              >
                {{ item.active ? "Aktif" : "Non-Aktif" }}
              </span>
            </div>
            
            <div class="flex items-center gap-4 text-sm text-gray-600 mb-4 mt-3">
              <div class="flex items-center gap-1">
                <span :class="['px-2 py-0.5 rounded text-xs font-medium', item.gender_type === 'banin' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700']">
                  {{ item.gender_type === 'banin' ? 'Banin' : 'Banat' }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <SvgIcon name="phone" :size="14" class="text-gray-400" />
                <span>{{ item.phone || "-" }}</span>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                v-if="auth.hasPermission('laundry_accounts.view')"
                @click="viewStats(item)"
                class="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1.5 rounded transition text-xs flex-1 justify-center font-medium"
              >
                <SvgIcon name="chart" :size="14" />
                <span>Statistik</span>
              </button>
              <button
                v-if="auth.hasPermission('laundry_accounts.edit')"
                @click="editVendor(item)"
                class="flex items-center justify-center p-1.5 text-primary hover:bg-primary-50 rounded bg-gray-50 transition"
              >
                <SvgIcon name="edit" :size="14" />
              </button>
              <button
                v-if="auth.hasPermission('laundry_accounts.delete')"
                @click="confirmDelete(item)"
                class="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded bg-gray-50 transition"
              >
                <SvgIcon name="trash" :size="14" />
              </button>
            </div>
          </div>
          <div
            v-if="data.length === 0"
            class="text-center py-8 text-gray-400 col-span-full border border-dashed border-gray-200 rounded-xl"
          >
            Tidak ada data vendor.
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

    <!-- Vendor Form Modal -->
    <VendorForm v-model="showForm" :vendor="selectedVendor" @saved="handleSaved" />

    <!-- Vendor Stats Modal -->
    <VendorStatsModal v-model:show="showStatsModal" :vendor="selectedVendorForStats" />

    <!-- Vendor Merge Modal -->
    <VendorMergeModal v-model:show="showMergeModal" :vendors="data" />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model:show="showDeleteModal"
      title="Hapus Vendor"
      :message="`Apakah Anda yakin ingin menghapus vendor ${vendorToDelete?.name}?`"
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
import VendorForm from "@/components/laundry/VendorForm.vue";
import VendorStatsModal from "@/components/laundry/VendorStatsModal.vue";
import VendorMergeModal from "@/components/laundry/VendorMergeModal.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { useToastStore } from "@/stores/toast";

const auth = useAuthStore();
const toast = useToastStore();

const showForm = ref(false);
const selectedVendor = ref(null);
const showDeleteModal = ref(false);
const vendorToDelete = ref(null);
const deleteLoading = ref(false);

const showStatsModal = ref(false);
const selectedVendorForStats = ref(null);

const showMergeModal = ref(false);

const { data, loading, meta, search, filters, fetchData, setPage } =
  useTable("/laundry/vendors", {
    defaultSort: "created_at",
    defaultOrder: "desc",
    initialFilters: { gender_type: "all" },
  });

function createVendor() {
  selectedVendor.value = null;
  showForm.value = true;
}

function editVendor(vendor) {
  selectedVendor.value = { ...vendor };
  showForm.value = true;
}

function viewStats(vendor) {
  selectedVendorForStats.value = vendor;
  showStatsModal.value = true;
}

function openStatsModal() {
  selectedVendorForStats.value = null;
  showStatsModal.value = true;
}

function openMergeModal() {
  showMergeModal.value = true;
}

function confirmDelete(vendor) {
  vendorToDelete.value = vendor;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!vendorToDelete.value) return;

  deleteLoading.value = true;
  try {
    await api.delete(`/laundry/vendors/${vendorToDelete.value.id}`);
    toast.success(`Vendor ${vendorToDelete.value.name} berhasil dihapus`);
    fetchData();
    showDeleteModal.value = false;
  } catch (e) {
    console.error(e);
    toast.error("Gagal menghapus vendor");
  } finally {
    deleteLoading.value = false;
    vendorToDelete.value = null;
  }
}

function handleSaved() {
  fetchData();
}
</script>
