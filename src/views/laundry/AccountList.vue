<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-primary-dark tracking-tight">
          Manajemen Akun Laundry
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Kelola akun laundry santri & guru serta pantau batas penggunaan per bulan (30 Kg).
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="auth.hasPermission('laundry_accounts.view')"
          @click="exportExceeded"
          class="btn-secondary flex items-center gap-2"
        >
          <SvgIcon name="document-download" :size="16" />
          <span>Export Kelebihan (Excel)</span>
        </button>
        <button
          v-if="auth.hasPermission('laundry_accounts.view')"
          @click="exportAllAccountsPdf"
          class="btn-secondary flex items-center gap-2 !bg-blue-50 !text-blue-700 !border-blue-200 hover:!bg-blue-100"
        >
          <SvgIcon name="document-download" :size="16" />
          <span>Print Daftar Akun (PDF)</span>
        </button>
        <button
          v-if="auth.hasPermission('laundry_accounts.create')"
          @click="openBulkCreateModal"
          class="btn-secondary flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <SvgIcon name="users" :size="16" />
          <span>Bulk Create</span>
        </button>
        <button
          v-if="auth.hasPermission('laundry_accounts.create')"
          @click="createAccount"
          class="btn-primary flex items-center gap-2"
        >
          <SvgIcon name="plus" :size="16" />
          <span>Tambah Akun</span>
        </button>
        <router-link
          v-if="auth.hasPermission('laundry_accounts.delete')"
          to="/admin/laundry/accounts/trash"
          class="btn-secondary flex items-center gap-2 !bg-red-50 !text-red-600 !border-red-200 hover:!bg-red-100"
        >
          <SvgIcon name="trash" :size="16" />
          <span>Tong Sampah</span>
        </router-link>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
      <div class="flex-1 min-w-[200px]">
        <input
          v-model="search"
          type="text"
          placeholder="Cari nomor laundry atau nama..."
          class="input-field !py-2"
        />
      </div>
      <select v-model="filters.gender_type" class="input-field !py-2 w-auto" @change="fetchData">
        <option value="all">Semua Kategori</option>
        <option value="banin">Banin</option>
        <option value="banat">Banat</option>
      </select>
      <div class="flex flex-wrap gap-2 items-center w-full sm:w-auto">
        <span class="text-xs text-gray-500 font-medium whitespace-nowrap">Periode Limit:</span>
        <input type="date" v-model="filters.date_from" @change="fetchData" class="input-field !py-1.5 w-auto text-sm flex-1 min-w-[130px]" />
        <span class="text-gray-400">-</span>
        <input type="date" v-model="filters.date_to" @change="fetchData" class="input-field !py-1.5 w-auto text-sm flex-1 min-w-[130px]" />
      </div>
    </div>

    <!-- Data Table -->
    <div class="glass-card overflow-hidden animate-fade-in">
      <div v-if="loading" class="p-12 text-center text-gray-400">
        <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm">Memuat data akun...</p>
      </div>

      <div v-else>
        <table class="data-table hidden xl:table">
          <thead>
            <tr>
              <th>Nomor Laundry</th>
              <th>Nama Pemilik</th>
              <th>Vendor</th>
              <th class="text-center">Berat Bulanan (Limit 30Kg)</th>
              <th class="text-center">Tagihan Kelebihan</th>
              <th class="text-center">Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id" :class="{'bg-red-50/30': item.monthly_exceeded}">
              <td class="font-medium text-gray-800">
                {{ item.nomor_laundry }}
              </td>
              <td>
                <div class="font-medium text-gray-800">{{ item.owner_name }}</div>
                <div class="text-xs text-gray-500">{{ item.owner_type }}</div>
              </td>
              <td class="text-gray-600 font-medium">
                {{ item.vendor?.name || "-" }}
                <span :class="['ml-1 px-1.5 py-0.5 rounded text-[10px]', item.vendor?.gender_type === 'banin' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700']">
                  {{ item.vendor?.gender_type }}
                </span>
              </td>
              <td class="text-center">
                <div class="flex flex-col items-center">
                  <span :class="['font-bold', item.monthly_exceeded ? 'text-red-600' : 'text-green-600']">
                    {{ formatNumber(item.monthly_weight) }} Kg
                  </span>
                  <div class="w-full max-w-[100px] bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      class="h-1.5 rounded-full" 
                      :class="item.monthly_exceeded ? 'bg-red-500' : 'bg-green-500'" 
                      :style="`width: ${Math.min((item.monthly_weight / 30) * 100, 100)}%`"
                    ></div>
                  </div>
                </div>
              </td>
              <td class="text-center">
                <span v-if="item.monthly_exceeded" class="text-red-600 font-bold text-sm bg-red-100 px-2 py-1 rounded">
                  {{ formatRupiah(item.debt_amount) }}
                </span>
                <span v-else class="text-gray-400 text-sm">-</span>
              </td>
              <td class="text-center">
                <button
                  @click="toggleBlock(item)"
                  :class="[
                    'px-3 py-1 text-xs font-medium rounded-full transition cursor-pointer',
                    item.blocked
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200',
                  ]"
                  title="Klik untuk ubah status blokir"
                >
                  {{ item.blocked ? "Diblokir" : "Aktif" }}
                </button>
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="auth.hasPermission('laundry_accounts.edit')"
                    @click="editAccount(item)"
                    class="text-primary hover:text-primary-dark transition text-sm px-2 py-1 rounded hover:bg-primary-50"
                  >
                    <SvgIcon name="edit" :size="16" />
                  </button>
                  <button
                    v-if="auth.hasPermission('laundry_accounts.delete')"
                    @click="confirmDelete(item)"
                    class="text-red-500 hover:text-red-700 transition text-sm px-2 py-1 rounded hover:bg-red-50"
                  >
                    <SvgIcon name="trash" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="data.length === 0">
              <td colspan="7" class="text-center py-8 text-gray-400">
                Tidak ada data akun laundry.
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Mobile View -->
        <div class="grid grid-cols-1 gap-4 xl:hidden p-4">
          <div
            v-for="item in data"
            :key="item.id"
            class="bg-white border text-sm border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow relative"
            :class="{'border-red-200 bg-red-50/20': item.monthly_exceeded}"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="font-bold text-gray-800">{{ item.nomor_laundry }}</h3>
                <p class="text-sm font-medium text-blue-700 mt-0.5">{{ item.owner_name }}</p>
                <div class="flex gap-1 items-center mt-1">
                  <span class="text-xs text-gray-500">{{ item.owner_type }}</span>
                  <span class="text-gray-300 px-1">•</span>
                  <span class="text-xs text-gray-600 font-medium tracking-tight">{{ item.vendor?.name || "-" }}</span>
                  <span :class="['ml-1 px-1.5 py-0.5 rounded text-[10px]', item.vendor?.gender_type === 'banin' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700']">
                    {{ item.vendor?.gender_type }}
                  </span>
                </div>
              </div>
              
              <button
                @click="toggleBlock(item)"
                :class="[
                  'px-2 py-1 text-[10px] font-bold rounded-full transition cursor-pointer shrink-0 uppercase',
                  item.blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
                ]"
              >
                {{ item.blocked ? "Diblokir" : "Aktif" }}
              </button>
            </div>
            
            <div class="my-3 bg-gray-50 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1.5">
                <p class="text-[10px] text-gray-500 uppercase font-semibold">Berat Bulanan / Limit (30Kg)</p>
                <span :class="['font-bold text-sm', item.monthly_exceeded ? 'text-red-600' : 'text-green-600']">
                  {{ formatNumber(item.monthly_weight) }} Kg
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  class="h-1.5 rounded-full" 
                  :class="item.monthly_exceeded ? 'bg-red-500' : 'bg-green-500'" 
                  :style="`width: ${Math.min((item.monthly_weight / 30) * 100, 100)}%`"
                ></div>
              </div>
            </div>

            <div v-if="item.monthly_exceeded" class="mb-3 flex justify-between items-center bg-red-50/50 p-2 rounded border border-red-100">
               <span class="text-xs font-semibold text-red-800">Tagihan Kelebihan:</span>
               <span class="text-sm font-bold text-red-600">{{ formatRupiah(item.debt_amount) }}</span>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
              <button
                v-if="auth.hasPermission('laundry_accounts.edit')"
                @click="editAccount(item)"
                class="flex items-center justify-center p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                title="Edit"
              >
                <SvgIcon name="edit" :size="16" />
              </button>
              <button
                v-if="auth.hasPermission('laundry_accounts.delete')"
                @click="confirmDelete(item)"
                class="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded bg-gray-50 transition"
                title="Hapus"
              >
                <SvgIcon name="trash" :size="16" />
              </button>
            </div>
          </div>
          <div
            v-if="data.length === 0"
            class="text-center py-8 text-gray-400 col-span-full border border-dashed border-gray-200 rounded-xl"
          >
            Tidak ada data akun laundry.
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

    <!-- Forms/Modals will go here -->
    <AccountForm v-model="showForm" :account="selectedAccount" @saved="handleSaved" />
    <AccountBulkCreateModal v-model:show="showBulkModal" @saved="handleSaved" />
    
    <ConfirmModal
      v-model:show="showDeleteModal"
      title="Hapus Akun Laundry"
      :message="`Menghapus akun laundry ${accountToDelete?.nomor_laundry} akan menghapus semua riwayat transaksi terkait. Apakah Anda yakin?`"
      confirm-text="Hapus Permanen"
      cancel-text="Batal"
      type="danger"
      :loading="deleteLoading"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useTable } from "@/composables/useTable";
import api from "@/api";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import AccountForm from "@/components/laundry/AccountForm.vue";
import AccountBulkCreateModal from "@/components/laundry/AccountBulkCreateModal.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { useToastStore } from "@/stores/toast";

const auth = useAuthStore();
const toast = useToastStore();

const showForm = ref(false);
const selectedAccount = ref(null);
const showBulkModal = ref(false);

const showDeleteModal = ref(false);
const accountToDelete = ref(null);
const deleteLoading = ref(false);

// Initialize dates to current month
const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

const { data, loading, meta, search, filters, fetchData, setPage } =
  useTable("/laundry/accounts", {
    defaultSort: "created_at",
    defaultOrder: "desc",
    initialFilters: { 
      gender_type: "all",
      date_from: firstDay,
      date_to: lastDay
    },
  });

function formatNumber(num) {
  if (!num) return "0";
  return parseFloat(num).toFixed(2);
}

function formatRupiah(amount) {
  if (!amount) return "Rp 0";
  return "Rp " + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function createAccount() {
  selectedAccount.value = null;
  showForm.value = true;
}

function editAccount(account) {
  selectedAccount.value = { ...account };
  showForm.value = true;
}

function openBulkCreateModal() {
  showBulkModal.value = true;
}

async function toggleBlock(account) {
  try {
    const response = await api.put(`/laundry/accounts/${account.id}/toggle-block`);
    toast.success(response.data.blocked ? "Akun berhasil diblokir" : "Akun berhasil diaktifkan");
    fetchData();
  } catch(e) {
    toast.error("Gagal mengubah status blokir");
  }
}

function confirmDelete(account) {
  accountToDelete.value = account;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!accountToDelete.value) return;

  deleteLoading.value = true;
  try {
    await api.delete(`/laundry/accounts/${accountToDelete.value.id}`);
    toast.success(`Akun laundry ${accountToDelete.value.nomor_laundry} berhasil dihapus`);
    fetchData();
    showDeleteModal.value = false;
  } catch (e) {
    console.error(e);
    toast.error("Gagal menghapus akun");
  } finally {
    deleteLoading.value = false;
    accountToDelete.value = null;
  }
}

function exportExceeded() {
  const token = auth.accessToken;
  const queryParams = new URLSearchParams();
  
  if (filters.gender_type && filters.gender_type !== 'all') {
    queryParams.append('gender_type', filters.gender_type);
  }
  if (filters.date_from) {
    queryParams.append('date_from', filters.date_from);
  }
  if (filters.date_to) {
    queryParams.append('date_to', filters.date_to);
  }
  if (search.value) {
    queryParams.append('search', search.value);
  }
  if (token) {
    queryParams.append('token', token);
  }
  
  const url = `${api.defaults.baseURL || 'http://localhost:8080/api'}/laundry/export/accounts/exceeded/excel?${queryParams.toString()}`;
  
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportAllAccountsPdf() {
  const token = auth.accessToken;
  const queryParams = new URLSearchParams();
  
  if (filters.gender_type && filters.gender_type !== 'all') {
    queryParams.append('gender_type', filters.gender_type);
  }
  if (token) {
    queryParams.append('token', token);
  }
  
  const url = `${api.defaults.baseURL || 'http://localhost:8080/api'}/laundry/export/accounts/all/pdf?${queryParams.toString()}`;
  
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function handleSaved() {
  fetchData();
}
</script>
