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
              class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]"
            >
              <div class="flex justify-between items-start mb-4">
                <div>
                  <DialogTitle as="h3" class="text-xl font-bold leading-6 text-gray-900">
                    Gabung Vendor PDF
                  </DialogTitle>
                  <p class="text-xs text-gray-500 mt-1">Buat grup gabungan dengan memilih beberapa vendor dari daftar.</p>
                </div>
                <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
                  <SvgIcon name="x" :size="20" />
                </button>
              </div>

              <!-- Filter Section for Period -->
              <div class="glass-card p-4 mb-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
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
                </div>
              </div>

              <!-- Merge Groups -->
              <div class="flex-1 overflow-y-auto space-y-4 pr-1">
                <div
                  v-for="(group, idx) in mergeGroups"
                  :key="idx"
                  class="border-2 border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                        {{ idx + 1 }}
                      </span>
                      Grup Gabungan {{ idx + 1 }}
                    </h4>
                    <button
                      @click="removeGroup(idx)"
                      class="text-red-500 hover:text-red-700"
                    >
                      <SvgIcon name="trash" :size="16" />
                    </button>
                  </div>

                  <div class="space-y-1 mb-3 max-h-48 overflow-y-auto p-1">
                    <label
                      v-for="v in vendors"
                      :key="v.id"
                      class="flex items-center p-2 rounded hover:bg-white cursor-pointer transition border border-transparent hover:border-gray-200"
                    >
                      <input
                        type="checkbox"
                        v-model="group.selectedIds"
                        :value="v.id"
                        class="form-checkbox text-primary rounded h-4 w-4"
                      />
                      <span class="ml-3 text-sm font-medium text-gray-800">
                        {{ v.name }}
                      </span>
                    </label>
                  </div>

                  <div
                    v-if="group.selectedIds.length >= 2"
                    class="p-3 bg-primary-50 rounded border border-primary-100 text-sm"
                  >
                    <p class="text-xs font-medium text-primary-dark mb-1">Vendor digabung:</p>
                    <p class="text-primary font-medium">
                      {{ getSelectedNames(group.selectedIds) }}
                    </p>
                  </div>
                </div>

                <button
                  @click="addGroup"
                  class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition flex items-center justify-center gap-2"
                >
                  <SvgIcon name="plus" :size="16" />
                  Tambah Grup Gabungan
                </button>
              </div>

              <!-- Footer -->
              <div class="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  @click="closeModal"
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                >
                  Batal
                </button>
                <button
                  @click="submitMerge"
                  :disabled="!hasValidGroups"
                  class="btn-primary py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <SvgIcon name="document-download" :size="16" />
                  Cetak PDF
                </button>
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
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  show: Boolean,
  vendors: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:show"]);
const toast = useToastStore();
const auth = useAuthStore();

const filters = ref({
  period: "this_week",
  start_date: "",
  end_date: "",
});

const mergeGroups = ref([{ selectedIds: [] }]);

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      filters.value.period = "this_week";
      mergeGroups.value = [{ selectedIds: [] }];
    }
  }
);

function addGroup() {
  mergeGroups.value.push({ selectedIds: [] });
}

function removeGroup(idx) {
  mergeGroups.value.splice(idx, 1);
  if (mergeGroups.value.length === 0) {
    addGroup();
  }
}

function getSelectedNames(ids) {
  const selected = props.vendors.filter((v) => ids.includes(v.id));
  return selected.map((v) => v.name).join(' + ');
}

const hasValidGroups = computed(() => {
  return mergeGroups.value.some((g) => g.selectedIds.length >= 2);
});

function closeModal() {
  emit("update:show", false);
}

function submitMerge() {
  let url = `/laundry/export/vendors/pdf?period=${filters.value.period}`;
  
  if (filters.value.period === "custom") {
    url += `&start_date=${filters.value.start_date}&end_date=${filters.value.end_date}`;
  }
  
  // Append merge groups
  mergeGroups.value.forEach((group) => {
    if (group.selectedIds.length >= 2) {
      url += `&merge_groups[]=${group.selectedIds.join(',')}`;
    }
  });

  const fullUrl = `${api.defaults.baseURL || 'http://localhost:8080/api'}${url}`;
  
  const a = document.createElement("a");
  a.href = fullUrl;
  a.target = "_blank";
  
  const token = auth.accessToken;
  if (token) {
    a.href += `&token=${token}`;
  }
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
</script>
