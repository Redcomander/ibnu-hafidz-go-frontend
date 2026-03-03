<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-primary-dark tracking-tight">
          Pengambilan Laundry
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Tandai laundry yang sudah diambil santri secara massal.
        </p>
      </div>
    </div>

    <!-- Filters & Actions -->
    <div class="glass-card p-4 mb-6 flex flex-wrap flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div class="flex flex-wrap gap-4 flex-1">
        <select v-model="filters.vendor_id" class="input-field !py-2 min-w-[200px]" @change="fetchData">
          <option value="">Semua Vendor</option>
          <option v-for="v in vendors" :key="v.id" :value="v.id">
            {{ v.name }} ({{ v.gender_type }})
          </option>
        </select>
        
        <div class="flex-1 min-w-[200px]">
          <input
            v-model="search"
            type="text"
            placeholder="Cari nama pemiik atau nomor laundry..."
            class="input-field !py-2"
          />
        </div>
      </div>
      
      <div>
        <button
          v-if="auth.hasPermission('laundry_accounts.edit')"
          @click="confirmBulkPickup"
          :disabled="selectedTransactions.length === 0"
          class="btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SvgIcon name="check-circle" :size="16" />
          <span>Tandai {{ selectedTransactions.length }} Diambil</span>
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="glass-card overflow-hidden animate-fade-in relative">
      <div v-if="loading" class="p-12 text-center text-gray-400 absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
        <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
        <p class="text-sm">Memuat data...</p>
      </div>

      <div class="min-h-[400px]">
        <table class="data-table hidden md:table">
          <thead>
            <tr>
              <th class="w-12 text-center">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  class="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary cursor-pointer"
                />
              </th>
              <th>Tanggal Transaksi</th>
              <th>Nomor & Pemilik</th>
              <th class="text-right">Berat Lama</th>
              <th>Status</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id" @click="toggleSelect(item.id)" class="cursor-pointer hover:bg-gray-50 transition">
              <td class="text-center" @click.stop>
                <input
                  type="checkbox"
                  :value="item.id"
                  v-model="selectedTransactions"
                  class="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary cursor-pointer"
                />
              </td>
              <td class="font-medium text-gray-800">
                {{ formatDateTime(item.tanggal) }}
                <div class="text-[10px] text-gray-500">{{ timeAgo(item.tanggal) }}</div>
              </td>
              <td>
                <div class="font-medium text-blue-700">{{ item.account?.nomor_laundry }}</div>
                <div class="text-xs text-gray-500">
                  {{ item.account?.student?.nama_lengkap || item.account?.user?.name || 'Unknown' }}
                </div>
              </td>
              <td class="text-right font-medium">
                {{ formatNumber(item.berat_kg) }} Kg
              </td>
              <td>
                <span class="px-2 py-1 text-[11px] font-bold rounded uppercase tracking-wider bg-yellow-100 text-yellow-700">
                  PROSES CUCI
                </span>
              </td>
              <td class="text-sm text-gray-500">
                {{ item.catatan || "-" }}
              </td>
            </tr>
            <tr v-if="data.length === 0">
              <td colspan="6" class="text-center py-12 text-gray-500">
                <div class="flex flex-col items-center justify-center">
                  <SvgIcon name="check-circle" :size="48" class="text-green-200 mb-3" />
                  <p class="font-medium">Tidak ada laundry yang menunggu diambil</p>
                  <p class="text-xs text-gray-400 mt-1">Semua transaksi terpilih sudah selesai diambil atau belum ada setoran.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile View -->
        <div class="grid grid-cols-1 gap-4 md:hidden p-4">
          <div
            v-for="item in data"
            :key="item.id"
            @click="toggleSelect(item.id)"
            class="bg-white border text-sm p-4 rounded-xl shadow-sm transition-all relative cursor-pointer"
            :class="selectedTransactions.includes(item.id) ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-gray-100 hover:shadow-md'"
          >
            <!-- Checkbox Overlay for Mobile -->
            <div class="absolute top-4 right-4 z-10">
               <input
                  type="checkbox"
                  :value="item.id"
                  v-model="selectedTransactions"
                  class="w-5 h-5 text-primary bg-white border-gray-300 rounded focus:ring-primary cursor-pointer pointer-events-none"
                />
            </div>
          
            <div class="pr-8">
              <span class="text-[10px] text-gray-500 font-medium block mb-1">
                {{ formatDateTime(item.tanggal) }} • {{ timeAgo(item.tanggal) }}
              </span>
              <h3 class="font-bold text-blue-700 text-base">{{ item.account?.nomor_laundry }}</h3>
              <p class="text-xs text-gray-600 mt-0.5 font-medium truncate">
                {{ item.account?.student?.nama_lengkap || item.account?.user?.name || 'Unknown' }}
              </p>
            </div>
            
            <div class="flex justify-between items-center bg-white border border-gray-100/50 rounded-lg p-3 my-3">
              <div>
                <p class="text-[10px] text-gray-400 uppercase font-semibold">Berat Laundry</p>
                <p class="font-bold text-gray-800">{{ formatNumber(item.berat_kg) }} Kg</p>
              </div>
              <div class="text-right">
                <span class="px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider bg-yellow-100 text-yellow-700">
                  PROSES CUCI
                </span>
              </div>
            </div>

            <div v-if="item.catatan" class="text-sm text-gray-600 bg-orange-50/50 p-2 rounded border border-orange-100/50">
              <span class="font-medium text-orange-800/70 block text-[10px] mb-0.5 uppercase tracking-wide">Catatan:</span>
              {{ item.catatan }}
            </div>
          </div>
          
          <div
            v-if="data.length === 0"
            class="text-center py-12 text-gray-400 col-span-full border border-dashed border-gray-200 rounded-xl bg-gray-50/50"
          >
             <div class="flex flex-col items-center justify-center">
                <SvgIcon name="check-circle" :size="40" class="text-green-200 mb-3" />
                <p class="font-medium text-gray-500">Tidak ada laundry</p>
                <p class="text-xs text-gray-400 mt-1 max-w-[200px] text-center">Semua transaksi terpilih sudah selesai diambil.</p>
             </div>
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

    <!-- Confirm Pickup Modal -->
    <ConfirmModal
      v-model:show="showConfirmModal"
      title="Konfirmasi Pengambilan"
      :message="`Anda akan menyelesaikan ${selectedTransactions.length} transaksi laundry dan mengubah statusnya menjadi 'Sudah Diambil'. Proses ini tidak dapat dibatalkan.`"
      confirm-text="Ya, Tandai Selesai"
      cancel-text="Batal"
      type="success"
      :loading="submitLoading"
      @confirm="submitBulkPickup"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useTable } from "@/composables/useTable";
import api from "@/api";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { useToastStore } from "@/stores/toast";

const auth = useAuthStore();
const toast = useToastStore();

const vendors = ref([]);
const selectedTransactions = ref([]);

const showConfirmModal = ref(false);
const submitLoading = ref(false);

const { data, loading, meta, search, filters, fetchData, setPage } =
  useTable("/laundry/transactions", {
    defaultSort: "created_at",
    defaultOrder: "desc",
    initialFilters: { 
      status: "pending", // ONLY SHOW PENDING
      vendor_id: "" 
    },
  });

// Clear selection on page change or search change
watch([() => meta.page, search, () => filters.vendor_id], () => {
  selectedTransactions.value = [];
});

const isAllSelected = computed(() => {
  return data.value.length > 0 && selectedTransactions.value.length === data.value.length;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedTransactions.value = [];
  } else {
    selectedTransactions.value = data.value.map(item => item.id);
  }
}

function toggleSelect(id) {
  const index = selectedTransactions.value.indexOf(id);
  if (index === -1) {
    selectedTransactions.value.push(id);
  } else {
    selectedTransactions.value.splice(index, 1);
  }
}

function formatNumber(num) {
  if (!num) return "0";
  return parseFloat(num).toFixed(2);
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  return `${diffDays} hari yang lalu`;
}

async function fetchVendors() {
  try {
    const res = await api.get("/laundry/vendors", { params: { per_page: 100 } });
    vendors.value = res.data.data;
  } catch (e) {
    console.error(e);
  }
}

function confirmBulkPickup() {
  if (selectedTransactions.value.length === 0) return;
  showConfirmModal.value = true;
}

async function submitBulkPickup() {
  submitLoading.value = true;
  try {
    await api.post("/laundry/transactions/bulk-pickup", {
      transaction_ids: selectedTransactions.value
    });
    
    toast.success(`${selectedTransactions.value.length} transaksi berhasil ditandai selesai`);
    selectedTransactions.value = [];
    showConfirmModal.value = false;
    fetchData(); // Refresh list to remove picked up items
  } catch (err) {
    console.error(err);
    toast.error("Gagal melakukan proses pengambilan massal");
  } finally {
    submitLoading.value = false;
  }
}

onMounted(() => {
  fetchVendors();
});
</script>
