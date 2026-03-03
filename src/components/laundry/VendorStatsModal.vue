<template>
  <TransitionRoot appear :show="show" as="template">
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
              class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
            >
              <div class="flex justify-between items-start mb-4">
                <DialogTitle as="h3" class="text-lg font-bold leading-6 text-gray-900">
                  {{ isGlobal ? "Statistik Global Laundry" : `Statistik Vendor: ${vendor?.name}` }}
                </DialogTitle>
                <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
                  <SvgIcon name="x" :size="20" />
                </button>
              </div>

              <!-- Filter Section -->
              <div class="glass-card p-4 mb-6 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="flex-1">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Periode</label>
                    <select v-model="filters.period" class="input-field py-1.5 text-sm">
                      <option value="this_week">Minggu Ini</option>
                      <option value="last_week">Minggu Lalu</option>
                      <option value="custom">Pilih Tanggal</option>
                    </select>
                  </div>
                  
                  <template v-if="filters.period === 'custom'">
                    <div class="flex-1">
                      <label class="block text-xs font-medium text-gray-500 mb-1">Mulai</label>
                      <input type="date" v-model="filters.start_date" class="input-field py-1.5 text-sm" />
                    </div>
                    <div class="flex-1">
                      <label class="block text-xs font-medium text-gray-500 mb-1">Sampai</label>
                      <input type="date" v-model="filters.end_date" class="input-field py-1.5 text-sm" />
                    </div>
                  </template>
                  
                  <div class="flex items-end">
                    <button @click="fetchStats" class="btn-primary py-1.5 px-4 text-sm whitespace-nowrap">Terapkan</button>
                  </div>
                </div>
              </div>

              <!-- Content Area -->
              <div v-if="loading" class="py-12 flex justify-center">
                <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>

              <div v-else-if="statsData">
                <!-- Data Summary Cards -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <SvgIcon name="scale" :size="20" />
                    </div>
                    <div>
                      <p class="text-xs text-blue-600 font-medium">Total Berat (Kg)</p>
                      <p class="text-xl font-bold text-gray-900">{{ formatNumber(isGlobal ? statsData.grand_total_kg : statsData.total_kg) }} Kg</p>
                    </div>
                  </div>
                  <div class="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <SvgIcon name="cash" :size="20" />
                    </div>
                    <div>
                      <p class="text-xs text-green-600 font-medium">Total Rupiah</p>
                      <p class="text-xl font-bold text-gray-900">{{ formatRupiah(isGlobal ? statsData.grand_total_rupiah : statsData.total_rupiah) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Global Table -->
                <div v-if="isGlobal" class="overflow-x-auto border border-gray-200 rounded-lg">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                        <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Berat (Kg)</th>
                        <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rp</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="v in statsData.vendors" :key="v.id">
                        <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ v.name }}</td>
                        <td class="px-4 py-2 text-sm text-gray-500 text-right">{{ formatNumber(v.total_kg) }}</td>
                        <td class="px-4 py-2 text-sm font-medium text-gray-900 text-right">{{ formatRupiah(v.total_rupiah) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Export Buttons -->
                <div class="mt-6 flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-100">
                  <button @click="exportData('excel')" class="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition text-sm">
                    <SvgIcon name="document-text" :size="16" />
                    Export Excel
                  </button>
                  <button @click="exportData('pdf')" class="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition text-sm">
                    <SvgIcon name="document-download" :size="16" />
                    Export PDF
                  </button>
                  <button @click="exportData('weekly')" class="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition text-sm">
                    <SvgIcon name="calendar" :size="16" />
                    Rekap Mingguan (PDF)
                  </button>
                </div>
                
                <p class="text-xs text-center text-gray-400 mt-4">
                  Menampilkan data periode: {{ statsData.start_date }} s/d {{ statsData.end_date }}
                </p>
              </div>
              
              <div v-else class="text-center py-8 text-gray-500">
                Gagal memuat statistik.
              </div>
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
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  show: Boolean,
  vendor: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:show"]);

const auth = useAuthStore();

const isGlobal = computed(() => !props.vendor);
const loading = ref(false);
const statsData = ref(null);

const filters = ref({
  period: "this_week",
  start_date: "",
  end_date: "",
});

function closeModal() {
  emit("update:show", false);
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      filters.value.period = "this_week";
      fetchStats();
    }
  }
);

async function fetchStats() {
  loading.value = true;
  try {
    let url = "/laundry/vendors/statistics";
    if (!isGlobal.value) {
      url += `/${props.vendor.id}`;
    }

    const params = {
      period: filters.value.period,
    };
    if (filters.value.period === "custom") {
      params.start_date = filters.value.start_date;
      params.end_date = filters.value.end_date;
    }

    const response = await api.get(url, { params });
    statsData.value = response.data;
  } catch (err) {
    console.error(err);
    statsData.value = null;
  } finally {
    loading.value = false;
  }
}

function exportData(format) {
  let endpoint = format;
  if (format === 'weekly') {
    endpoint = isGlobal.value ? 'all-weekly/pdf' : 'weekly/pdf';
  }
  
  let url = `/laundry/export/vendors/${endpoint}?period=${filters.value.period}`;
  
  if (filters.value.period === "custom") {
    url += `&start_date=${filters.value.start_date}&end_date=${filters.value.end_date}`;
  }
  
  if (!isGlobal.value && format !== 'weekly') {
    // If it's single vendor, standard exports need vendor_id (except all-weekly doesn't need it, but weekly/pdf does)
    url += `&vendor_id=${props.vendor.id}`;
  } else if (!isGlobal.value && format === 'weekly') {
    url += `&vendor_id=${props.vendor.id}`;
  }

  // Use full URL to trigger browser download
  const fullUrl = `${api.defaults.baseURL || 'http://localhost:8080/api'}${url}`;
  
  // Create hidden link and click
  const a = document.createElement("a");
  a.href = fullUrl;
  a.target = "_blank";
  
  // Must append auth token if API requires it for downloads
  const token = auth.accessToken;
  if (token) {
    a.href += `&token=${token}`;
  }
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function formatRupiah(amount) {
  if (!amount) return "Rp 0";
  return "Rp " + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatNumber(num) {
  if (!num) return "0";
  return parseFloat(num).toFixed(2);
}
</script>
