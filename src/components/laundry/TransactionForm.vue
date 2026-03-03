<template>
  <TransitionRoot appear :show="modelValue" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
            >
              <DialogTitle as="h3" class="text-lg font-bold leading-6 text-gray-900 mb-4">
                Tambah Transaksi Laundry
              </DialogTitle>

              <form @submit.prevent="saveTransaction" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Akun Laundry (Nomor / Nama) *
                  </label>
                  <SearchableSelect
                    v-model="form.laundry_account_id"
                    :options="accounts"
                    labelKey="displayText"
                    valueKey="id"
                    placeholder="Ketik nama atau nomor laundry..."
                    required
                  />
                  <p v-if="selectedAccountDetails" class="mt-1 text-xs" :class="selectedAccountDetails.blocked ? 'text-red-500 font-bold' : 'text-gray-500'">
                    {{ selectedAccountDetails.blocked ? '⚠️ Akun ini sedang diblokir!' : `Sisa kuota bulan ini: ${Math.max(0, 30 - parseFloat(selectedAccountDetails.monthly_weight)).toFixed(2)} Kg` }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Berat Laundry (Kg) *
                  </label>
                  <div class="relative">
                    <input
                      v-model.number="form.berat_kg"
                      type="number"
                      step="0.01"
                      min="0.1"
                      required
                      class="input-field !pr-10"
                      placeholder="Contoh: 2.5"
                    />
                    <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-400 pointer-events-none">
                      Kg
                    </span>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    v-model="form.catatan"
                    rows="2"
                    class="input-field resize-none"
                    placeholder="Contoh: Sprei, Selimut..."
                  ></textarea>
                </div>

                <!-- Total Harga Calculation -->
                <div v-if="form.laundry_account_id && form.berat_kg > 0" class="mt-4 p-4 rounded-xl border-2 transition-all duration-300"
                  :class="selectedAccountDetails?.blocked ? 'bg-gray-50 border-gray-200' : 'bg-green-50/50 border-green-200'"
                >
                  <div class="flex justify-between items-center">
                    <div>
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Harga</p>
                      <p class="text-xs text-gray-500 mt-1">{{ form.berat_kg }} kg × Rp 4.500/kg</p>
                    </div>
                    <p class="text-2xl font-bold" :class="selectedAccountDetails?.blocked ? 'text-gray-400' : 'text-green-600'">
                      Rp {{ (form.berat_kg * 4500).toLocaleString('id-ID') }}
                    </p>
                  </div>
                </div>

                <!-- Usage Warning -->
                <div v-if="accountStats && (accountStats.weekly.exceeded || accountStats.monthly.exceeded)" 
                     class="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <SvgIcon name="warning" :size="20" class="text-red-500 shrink-0 mt-0.5" />
                  <p class="text-sm text-red-700 font-medium">
                    <span v-if="accountStats.monthly.exceeded">Kuota bulanan (30kg) telah terlampaui!</span>
                    <span v-else>Kuota mingguan (7.5kg) telah terlampaui!</span> 
                    Transaksi tetap bisa dilanjutkan namun akan dicatat sebagai hutang/tagihan tambahan.
                  </p>
                </div>

                <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    class="btn-secondary"
                    @click="closeModal"
                    :disabled="loading"
                  >
                    Batal
                  </button>
                  <button type="submit" class="btn-primary" :disabled="loading || (selectedAccountDetails && selectedAccountDetails.blocked)">
                    <span v-if="loading" class="flex items-center gap-2">
                      <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Menyimpan...
                    </span>
                    <span v-else>Simpan Transaksi</span>
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/vue";
import api from "@/api";
import { useToastStore } from "@/stores/toast";
import SearchableSelect from "@/components/ui/SearchableSelect.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue", "saved"]);
const toast = useToastStore();
const loading = ref(false);

const form = ref({
  laundry_account_id: "",
  berat_kg: "",
  catatan: "",
});

const accounts = ref([]);
const accountStats = ref(null);

const selectedAccountDetails = computed(() => {
  if (!form.value.laundry_account_id) return null;
  return accounts.value.find(a => a.id === form.value.laundry_account_id);
});

watch(() => form.value.laundry_account_id, async (newId) => {
  accountStats.value = null;
  if (newId) {
    try {
      const res = await api.get("/laundry/transactions/stats", { params: { account_id: newId } });
      accountStats.value = res.data;
    } catch (e) {
      console.error("Failed fetching stats", e);
    }
  }
});

async function fetchAccounts() {
  try {
    const res = await api.get("/laundry/accounts", { params: { per_page: 5000 } });
    const acctsData = res.data?.data || res.data || [];
    accounts.value = acctsData.map(a => ({
      ...a,
      displayText: `${a.nomor_laundry} - ${a.owner_name} (${a.vendor?.name || 'N/A'})`
    }));
  } catch (e) {
    console.error("Failed fetching accounts", e);
  }
}

function resetForm() {
  form.value = {
    laundry_account_id: "",
    berat_kg: "",
    catatan: "",
  };
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      if (!accounts.value.length) fetchAccounts();
      resetForm();
    }
  }
);

function closeModal() {
  emit("update:modelValue", false);
}

async function saveTransaction() {
  if (!form.value.laundry_account_id || !form.value.berat_kg) return;

  loading.value = true;
  try {
    const payload = {
      laundry_account_id: form.value.laundry_account_id,
      berat_kg: parseFloat(form.value.berat_kg),
      catatan: form.value.catatan,
      tanggal: new Date().toISOString().split('T')[0], // Defaults to today
      harga_per_kg: 4500 // Can be fetched from settings later, hardcode for now based on Laravel
    };
    
    await api.post("/laundry/transactions", payload);
    toast.success("Transaksi berhasil ditambahkan");
    emit("saved");
    closeModal();
  } catch (err) {
    console.error(err);
    if (err.response?.data?.error) {
      toast.error(err.response.data.message || "Gagal menyimpan transaksi");
    } else {
      toast.error("Terjadi kesalahan server");
    }
  } finally {
    loading.value = false;
  }
}
</script>
