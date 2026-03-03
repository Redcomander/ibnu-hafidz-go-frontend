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
                  Bulk Create Akun Laundry
                </DialogTitle>
                <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
                  <SvgIcon name="x" :size="20" />
                </button>
              </div>

              <div class="mb-4">
                <p class="text-sm text-gray-600">
                  Pilih vendor dan cari santri/guru yang belum memiliki akun laundry aktif untuk dibuatkan secara massal.
                </p>
              </div>

              <div class="space-y-4">
                <!-- Vendor Selection -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Laundry *
                  </label>
                  <select v-model="vendorId" class="input-field" @change="fetchPeople">
                    <option value="" disabled>Pilih Vendor</option>
                    <option v-for="v in vendors" :key="v.id" :value="v.id">
                      {{ v.name }} ({{ v.gender_type }})
                    </option>
                  </select>
                </div>

                <!-- Search Input -->
                <div v-if="vendorId">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Cari Nama</label>
                  <div class="relative">
                    <input
                      v-model="searchQuery"
                      type="text"
                      class="input-field !pl-10"
                      placeholder="Ketik untuk mencari (minimal 3 karakter)..."
                    />
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SvgIcon name="search" :size="16" class="text-gray-400" />
                    </div>
                  </div>
                </div>

                <!-- Selection List -->
                <div v-if="vendorId" class="border border-gray-200 rounded-lg overflow-hidden h-64 flex flex-col">
                  <!-- Header with Check All -->
                  <div class="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        :checked="isAllSelected"
                        @change="toggleSelectAll"
                        class="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary"
                      />
                      <span class="text-sm font-medium text-gray-700">Pilih Semua ({{ filteredPeople.length }})</span>
                    </label>
                    <span class="text-xs text-gray-500">{{ selectedPeople.length }} terpilih</span>
                  </div>
                  
                  <!-- List -->
                  <div class="flex-1 overflow-y-auto p-2 bg-gray-50/50">
                    <div v-if="loadingPeople" class="flex justify-center py-4">
                      <div class="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                    <div v-else-if="filteredPeople.length === 0" class="text-center py-4 text-sm text-gray-500">
                      {{ searchQuery ? 'Tidak ada data cocok' : 'Tidak ada data' }}
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" v-else>
                      <label 
                        v-for="person in filteredPeople" 
                        :key="person.id_string"
                        class="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-primary-light transition-colors"
                        :class="{'border-primary bg-primary-50/10': selectedPeople.includes(person.id_string)}"
                      >
                        <input
                          type="checkbox"
                          :value="person.id_string"
                          v-model="selectedPeople"
                          class="w-4 h-4 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900 truncate">{{ person.name }}</p>
                          <p class="text-xs text-gray-500">{{ person.type === 'student' ? 'Santri' : 'Guru / User' }}</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    class="btn-secondary"
                    @click="closeModal"
                    :disabled="loadingSubmit"
                  >
                    Batal
                  </button>
                  <button
                    @click="submitBulkCreate"
                    class="btn-primary"
                    :disabled="loadingSubmit || selectedPeople.length === 0 || !vendorId"
                  >
                    <span v-if="loadingSubmit" class="flex items-center gap-2">
                       <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       Memproses...
                    </span>
                    <span v-else>Buat {{ selectedPeople.length }} Akun</span>
                  </button>
                </div>
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
import { useToastStore } from "@/stores/toast";

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(["update:show", "saved"]);
const toast = useToastStore();

const vendorId = ref("");
const vendors = ref([]);
const people = ref([]);
const filteredPeople = ref([]);
const selectedPeople = ref([]);
const searchQuery = ref("");
const loadingPeople = ref(false);
const loadingSubmit = ref(false);

const isAllSelected = computed(() => {
  return filteredPeople.value.length > 0 && 
         selectedPeople.value.length === filteredPeople.value.length;
});

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      fetchVendors();
      vendorId.value = "";
      people.value = [];
      filteredPeople.value = [];
      selectedPeople.value = [];
      searchQuery.value = "";
    }
  }
);

watch(searchQuery, (newVal) => {
  if (!newVal) {
    filteredPeople.value = people.value;
  } else {
    const q = newVal.toLowerCase();
    filteredPeople.value = people.value.filter(p => p.name.toLowerCase().includes(q));
  }
});

async function fetchVendors() {
  try {
    const res = await api.get("/laundry/vendors", { params: { per_page: 100 } });
    vendors.value = res.data.data;
  } catch (e) {
    console.error(e);
  }
}

async function fetchPeople() {
  if (!vendorId.value) return;
  loadingPeople.value = true;
  selectedPeople.value = [];
  try {
    // In a real optimized system we'd have a specific endpoint: `/laundry/accounts/available-people`
    // Returning both Students and Users not already having an account for the selected vendor.
    // For now we assume a large data fetch or we implement the endpoint later.
    // Let's assume we do a full fetch and filter client side for simplicity since backend doesn't have it yet,
    // OR just display all and let backend skip if duplicate.
    // Fetch students
    const [sRes, uRes, accRes] = await Promise.all([
      api.get("/students", { params: { per_page: 2000 } }),
      api.get("/users", { params: { per_page: 500 } }),
      api.get("/laundry/accounts", { params: { per_page: 5000 } })
    ]);
    
    // Quick map of existing accounts
    const hasAccount = new Set();
    accRes.data.data.forEach(acc => {
      // if account is active, they shouldn't be bulk created
      if(acc.active) {
        if(acc.student_id) hasAccount.add(`student_${acc.student_id}`);
        if(acc.user_id) hasAccount.add(`user_${acc.user_id}`);
      }
    });

    const combined = [];
    sRes.data.data.forEach(s => {
      const idStr = `student_${s.id}`;
      if (!hasAccount.has(idStr)) {
        combined.push({ id_string: idStr, name: s.nama_lengkap, type: 'student' });
      }
    });
    uRes.data.data.forEach(u => {
      const idStr = `user_${u.id}`;
      if (!hasAccount.has(idStr)) {
        combined.push({ id_string: idStr, name: u.name, type: 'user' });
      }
    });
    
    people.value = combined;
    filteredPeople.value = combined;
    
  } catch(e) {
    console.error(e);
    toast.error("Gagal memuat data santri/guru");
  } finally {
    loadingPeople.value = false;
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedPeople.value = [];
  } else {
    selectedPeople.value = filteredPeople.value.map(p => p.id_string);
  }
}

function closeModal() {
  emit("update:show", false);
}

async function submitBulkCreate() {
  loadingSubmit.value = true;
  try {
    const res = await api.post("/laundry/accounts/bulk", {
      vendor_id: vendorId.value,
      selected_people: selectedPeople.value,
    });
    
    toast.success(`Berhasil membuat ${res.data.created_count} akun laundry. ${res.data.skipped_count} dilewati.`);
    emit("saved");
    closeModal();
  } catch (err) {
    console.error(err);
    toast.error("Gagal melakukan Bulk Create");
  } finally {
    loadingSubmit.value = false;
  }
}
</script>
