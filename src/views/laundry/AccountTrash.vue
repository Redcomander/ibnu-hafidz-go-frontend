<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <router-link to="/admin/laundry/accounts" class="text-gray-400 hover:text-primary transition" title="Kembali">
            <SvgIcon name="arrow-left" :size="24" />
          </router-link>
          Tong Sampah Akun Laundry
        </h1>
        <p class="text-gray-500 text-sm mt-1 ml-9">
          Daftar akun laundry yang telah dihapus (soft-delete). Anda dapat memulihkannya kembali atau menghapusnya secara permanen.
        </p>
      </div>
    </div>

    <!-- Data Table -->
    <div class="glass-card overflow-hidden animate-fade-in">
      <div v-if="loading" class="p-12 text-center text-gray-400">
        <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm">Memuat data sampah...</p>
      </div>

      <div v-else>
        <table class="data-table hidden sm:table">
          <thead>
            <tr>
              <th>Nomor Laundry</th>
              <th>Nama Pemilik</th>
              <th>Kategori</th>
              <th>Vendor</th>
              <th>Tanggal Dihapus</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id">
              <td class="font-medium text-gray-800">
                {{ item.nomor_laundry }}
              </td>
              <td>
                <div class="font-medium text-gray-800">{{ item.owner_name }}</div>
              </td>
              <td class="text-gray-600">
                {{ item.owner_type }}
              </td>
              <td class="text-gray-600 font-medium">
                {{ item.vendor_name || "-" }}
              </td>
              <td class="text-gray-500 text-sm">
                {{ formatDateTime(item.deleted_at) }}
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="auth.hasPermission('laundry_accounts.delete')"
                    @click="confirmRestore(item)"
                    class="text-green-600 hover:bg-green-50 transition text-sm px-2 py-1 rounded font-medium flex items-center gap-1"
                  >
                    <SvgIcon name="refresh" :size="16" /> Restore
                  </button>
                  <button
                    v-if="auth.hasPermission('laundry_accounts.delete')"
                    @click="confirmForceDelete(item)"
                    class="text-red-600 hover:bg-red-50 transition text-sm px-2 py-1 rounded font-medium flex items-center gap-1"
                  >
                    <SvgIcon name="trash" :size="16" /> Hapus Permanen
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="data.length === 0">
              <td colspan="6" class="text-center py-8 text-gray-400">
                Tempat sampah kosong.
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Mobile View -->
        <div class="grid grid-cols-1 gap-4 sm:hidden p-4">
          <div
            v-for="item in data"
            :key="item.id"
            class="bg-white border text-sm border-gray-100 p-4 rounded-xl shadow-sm"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="font-bold text-gray-800">{{ item.nomor_laundry }}</h3>
                <p class="text-sm font-medium text-gray-700 mt-0.5">{{ item.owner_name }}</p>
                <div class="flex gap-1 items-center mt-1">
                  <span class="text-xs text-gray-500">{{ item.owner_type }}</span>
                  <span class="text-gray-300 px-1">•</span>
                  <span class="text-xs text-gray-600 font-medium">{{ item.vendor_name || "-" }}</span>
                </div>
              </div>
            </div>
            
            <div class="text-xs text-gray-400 mb-3 border-b border-gray-50 pb-2">
              Dihapus pada: {{ formatDateTime(item.deleted_at) }}
            </div>

            <div class="flex justify-end gap-2 mt-2">
              <button
                v-if="auth.hasPermission('laundry_accounts.delete')"
                @click="confirmRestore(item)"
                class="flex items-center justify-center p-2 text-green-600 hover:bg-green-50 rounded bg-gray-50 transition text-xs font-semibold"
              >
                Restore
              </button>
              <button
                v-if="auth.hasPermission('laundry_accounts.delete')"
                @click="confirmForceDelete(item)"
                class="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded bg-gray-50 transition text-xs font-semibold"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
          <div
            v-if="data.length === 0"
            class="text-center py-8 text-gray-400 col-span-full border border-dashed border-gray-200 rounded-xl"
          >
            Tempat sampah kosong.
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <ConfirmModal
      v-model:show="showConfirmModal"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmBtnText"
      cancel-text="Batal"
      :type="confirmType"
      :loading="actionLoading"
      @confirm="handleConfirmAction"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/api";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { useToastStore } from "@/stores/toast";

const auth = useAuthStore();
const toast = useToastStore();

const data = ref([]);
const loading = ref(true);

const showConfirmModal = ref(false);
const actionType = ref(""); // restore | force_delete
const selectedAccount = ref(null);
const actionLoading = ref(false);

const confirmTitle = ref("");
const confirmMessage = ref("");
const confirmBtnText = ref("");
const confirmType = ref("danger");

async function fetchTrashed() {
  loading.value = true;
  try {
    const response = await api.get("/laundry/accounts/trashed");
    data.value = response.data;
  } catch (error) {
    console.error(error);
    toast.error("Gagal memuat data sampah");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchTrashed();
});

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function confirmRestore(account) {
  actionType.value = "restore";
  selectedAccount.value = account;
  confirmTitle.value = "Restore Akun Laundry";
  confirmMessage.value = `Apakah Anda yakin ingin mengembalikan akun ${account.nomor_laundry} (${account.owner_name}) beserta transaksinya?`;
  confirmBtnText.value = "Restore Akun";
  confirmType.value = "info";
  showConfirmModal.value = true;
}

function confirmForceDelete(account) {
  actionType.value = "force_delete";
  selectedAccount.value = account;
  confirmTitle.value = "Hapus Permanen Akun Laundry";
  confirmMessage.value = `Tindakan ini tidak dapat dibatalkan! Semua data dan riwayat transaksi akun ${account.nomor_laundry} (${account.owner_name}) akan dihapus selamanya. Apakah Anda yakin?`;
  confirmBtnText.value = "Ya, Hapus Permanen";
  confirmType.value = "danger";
  showConfirmModal.value = true;
}

async function handleConfirmAction() {
  if (!selectedAccount.value) return;

  actionLoading.value = true;
  try {
    if (actionType.value === "restore") {
      await api.put(`/laundry/accounts/${selectedAccount.value.id}/restore`);
      toast.success("Akun berhasil dikembalikan");
    } else if (actionType.value === "force_delete") {
      await api.delete(`/laundry/accounts/${selectedAccount.value.id}/force`);
      toast.success("Akun berhasil dihapus permanen");
    }
    fetchTrashed();
    showConfirmModal.value = false;
  } catch (e) {
    console.error(e);
    toast.error(
      actionType.value === "restore"
        ? "Gagal mengembalikan akun"
        : "Gagal menghapus permanen. Pastikan tidak ada data yang terikat."
    );
  } finally {
    actionLoading.value = false;
    selectedAccount.value = null;
  }
}
</script>
