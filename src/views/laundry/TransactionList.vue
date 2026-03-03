<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-primary-dark tracking-tight">
          Transaksi Laundry
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Catat setoran laundry per kantong dan pantau batas mingguan (7.5 Kg).
        </p>
      </div>
      <div class="flex gap-2">
        <button
          v-if="auth.hasPermission('laundry_accounts.create')"
          @click="createTransaction"
          class="btn-primary flex items-center gap-2"
        >
          <SvgIcon name="plus" :size="16" />
          <span>Tambah Transaksi</span>
        </button>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
      <div class="flex-1 min-w-[200px]">
        <input
          v-model="search"
          type="text"
          placeholder="Cari nomor laundry atau catatan..."
          class="input-field !py-2"
        />
      </div>
      <select v-model="filters.status" class="input-field !py-2 w-auto">
        <option value="">Status Transaksi (Semua)</option>
        <option value="pending">Sedang Dicuci (Pending)</option>
        <option value="picked_up">Sudah Diambil (Picked Up)</option>
      </select>
    </div>

    <!-- Data Table -->
    <div class="glass-card overflow-hidden animate-fade-in">
      <div v-if="loading" class="p-12 text-center text-gray-400">
        <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm">Memuat data transaksi...</p>
      </div>

      <div v-else>
        <table class="data-table hidden md:table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nomor Laundry & Pemilik</th>
              <th class="text-right">Berat (Kg)</th>
              <th class="text-right">Tagihan Total</th>
              <th class="text-center">Status</th>
              <th>Catatan</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id">
              <td class="font-medium text-gray-800">
                {{ formatDate(item.tanggal) }}
              </td>
              <td>
                <div class="font-medium text-blue-700">{{ item.account?.nomor_laundry }}</div>
                <div class="text-xs text-gray-500 truncate max-w-[200px]">
                  {{ item.account?.student?.nama_lengkap || item.account?.user?.name || 'Unknown' }}
                </div>
              </td>
              <td class="text-right font-medium">
                {{ formatNumber(item.berat_kg) }} Kg
              </td>
              <td class="text-right font-medium text-gray-800">
                {{ formatRupiah(item.total_harga) }}
                <div class="text-[10px] text-gray-400">@{{ formatRupiah(item.harga_per_kg) }}/Kg</div>
              </td>
              <td class="text-center">
                <span
                  :class="[
                    'px-2 py-1 text-[11px] font-bold rounded uppercase tracking-wider',
                    item.status === 'picked_up'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700',
                  ]"
                >
                  {{ item.status === 'picked_up' ? "Selesai" : "Proses" }}
                </span>
                <div v-if="item.status === 'picked_up'" class="text-[10px] mt-1 text-gray-400">
                  {{ formatDateTime(item.picked_up_at) }}
                </div>
              </td>
              <td class="text-sm text-gray-500 truncate max-w-[150px]">
                {{ item.catatan || "-" }}
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="item.status === 'pending' && auth.hasPermission('laundry_accounts.edit')"
                    @click="markPickedUp(item)"
                    class="text-green-600 hover:text-green-800 transition text-sm px-2 py-1 rounded hover:bg-green-50"
                    title="Tandai Diambil"
                  >
                    <SvgIcon name="check-circle" :size="16" />
                  </button>
                  <button
                    v-if="auth.hasPermission('laundry_accounts.delete')"
                    @click="confirmDelete(item)"
                    class="text-red-500 hover:text-red-700 transition text-sm px-2 py-1 rounded hover:bg-red-50"
                    title="Hapus Transaksi"
                  >
                    <SvgIcon name="trash" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="data.length === 0">
              <td colspan="7" class="text-center py-8 text-gray-400">
                Tidak ada transaksi laundry ditemukan.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile View -->
        <div class="grid grid-cols-1 gap-4 md:hidden p-4">
          <div
            v-for="item in data"
            :key="item.id"
            class="bg-white border text-sm border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow relative"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="text-xs text-gray-500 font-medium">{{ formatDate(item.tanggal) }}</span>
                <h3 class="font-bold text-blue-700 mt-1">{{ item.account?.nomor_laundry }}</h3>
                <p class="text-xs text-gray-600 truncate max-w-[200px]">
                  {{ item.account?.student?.nama_lengkap || item.account?.user?.name || 'Unknown' }}
                </p>
              </div>
              <span
                :class="[
                  'px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider',
                  item.status === 'picked_up' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
                ]"
              >
                {{ item.status === 'picked_up' ? "Selesai" : "Proses" }}
              </span>
            </div>
            
            <div class="flex justify-between items-center bg-gray-50 rounded-lg p-3 my-3">
              <div>
                <p class="text-[10px] text-gray-500 uppercase font-semibold">Berat</p>
                <p class="font-bold text-gray-800">{{ formatNumber(item.berat_kg) }} Kg</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] text-gray-500 uppercase font-semibold">Total Tagihan</p>
                <p class="font-bold text-gray-800">{{ formatRupiah(item.total_harga) }}</p>
              </div>
            </div>

            <div v-if="item.catatan" class="mb-3 text-sm text-gray-600 bg-orange-50/50 p-2 rounded">
              <span class="font-medium text-gray-700 block text-xs mb-1">Catatan:</span>
              {{ item.catatan }}
            </div>
            
            <div v-if="item.status === 'picked_up'" class="text-xs text-gray-400 mb-3 flex items-center gap-1">
              <SvgIcon name="check-circle" :size="12" class="text-green-500" />
              Diambil pada: {{ formatDateTime(item.picked_up_at) }}
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                v-if="item.status === 'pending' && auth.hasPermission('laundry_accounts.edit')"
                @click="markPickedUp(item)"
                class="flex items-center gap-1 text-green-600 hover:text-green-800 bg-green-50 px-3 py-1.5 rounded transition text-xs font-medium"
              >
                <SvgIcon name="check-circle" :size="14" />
                <span>Tandai Diambil</span>
              </button>
              <button
                v-if="auth.hasPermission('laundry_accounts.delete')"
                @click="confirmDelete(item)"
                class="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded bg-gray-50 transition"
                title="Hapus"
              >
                <SvgIcon name="trash" :size="14" />
              </button>
            </div>
          </div>
          <div
            v-if="data.length === 0"
            class="text-center py-8 text-gray-400 col-span-full border border-dashed border-gray-200 rounded-xl"
          >
            Tidak ada transaksi laundry ditemukan.
          </div>
        </div>
      </div>

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

    <!-- Forms/Modals -->
    <TransactionForm v-model="showForm" @saved="handleSaved" />
    
    <ConfirmModal
      v-model:show="showDeleteModal"
      title="Hapus Transaksi"
      :message="`Menghapus transaksi ini akan mengurangi total berat (sebesar ${transactionToDelete?.berat_kg} Kg) pada akun laundry terkait. Lanjutkan?`"
      confirm-text="Hapus Permanen"
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
import TransactionForm from "@/components/laundry/TransactionForm.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { useToastStore } from "@/stores/toast";

const auth = useAuthStore();
const toast = useToastStore();

const showForm = ref(false);
const showDeleteModal = ref(false);
const transactionToDelete = ref(null);
const deleteLoading = ref(false);

const { data, loading, meta, search, filters, fetchData, setPage } =
  useTable("/laundry/transactions", {
    defaultSort: "created_at",
    defaultOrder: "desc",
    initialFilters: { status: "" },
  });

function formatNumber(num) {
  if (!num) return "0";
  return parseFloat(num).toFixed(2);
}

function formatRupiah(amount) {
  if (!amount) return "Rp 0";
  return "Rp " + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return dateStr.split('T')[0];
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
}

function createTransaction() {
  showForm.value = true;
}

async function markPickedUp(transaction) {
  try {
    await api.put(`/laundry/transactions/${transaction.id}/pickup`);
    toast.success("Berhasil ditandai sudah diambil");
    fetchData();
  } catch (e) {
    if (e.response?.data?.message) {
      toast.error(e.response.data.message);
    } else {
      toast.error("Gagal update status pengambilan.");
    }
  }
}

function confirmDelete(transaction) {
  transactionToDelete.value = transaction;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!transactionToDelete.value) return;

  deleteLoading.value = true;
  try {
    await api.delete(`/laundry/transactions/${transactionToDelete.value.id}`);
    toast.success(`Transaksi berhasil dihapus`);
    fetchData();
    showDeleteModal.value = false;
  } catch (e) {
    console.error(e);
    toast.error("Gagal menghapus transaksi");
  } finally {
    deleteLoading.value = false;
    transactionToDelete.value = null;
  }
}

function handleSaved() {
  fetchData();
}
</script>
