<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    @click.self="close"
  >
    <div
      class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"
      >
        <h3 class="text-lg font-bold text-gray-800">
          {{ isEdit ? "Edit Kamar" : "Tambah Kamar Baru" }}
        </h3>
        <button
          @click="close"
          class="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
        >
          <SvgIcon name="x" :size="20" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
        <form @submit.prevent="save" class="space-y-4">
          <!-- Nama Kamar -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Nama Kamar <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.nama_kamar"
              type="text"
              class="input-field"
              placeholder="Contoh: Kamar A1 - Abu Bakar"
              required
            />
          </div>

          <!-- Kapasitas -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Kapasitas (Orang) <span class="text-red-500">*</span></label
            >
            <input
              v-model.number="form.kapasitas"
              type="number"
              min="1"
              class="input-field"
              placeholder="0"
              required
            />
          </div>

          <!-- Wali Kamar -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Wali Kamar <span class="text-red-500">*</span></label
            >
            <SearchableSelect
              v-model="form.wali_kamar_id"
              :options="users"
              placeholder="Pilih Wali Kamar"
            />
          </div>

          <!-- Musyrif / Pendamping (Secondary Walies) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Musyrif / Pendamping (Opsional)</label
            >
            <div
              class="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50"
            >
              <div
                v-if="users.length === 0"
                class="text-xs text-gray-400 text-center py-2"
              >
                Belum ada data user
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="user in availableSecondaryWalies"
                  :key="user.id"
                  class="flex items-center gap-2"
                >
                  <input
                    type="checkbox"
                    :id="`sec-${user.id}`"
                    :value="user.id"
                    v-model="form.secondary_wali_ids"
                    class="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    :for="`sec-${user.id}`"
                    class="text-sm text-gray-700 cursor-pointer select-none"
                  >
                    {{ user.name }}
                  </label>
                </div>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Dapat memilih lebih dari satu.
            </p>
          </div>

          <!-- Deskripsi -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Keterangan</label
            >
            <textarea
              v-model="form.keterangan"
              class="input-field"
              rows="3"
              placeholder="Keterangan tambahan (opsional)..."
            ></textarea>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 z-10"
      >
        <button
          @click="close"
          class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition"
        >
          Batal
        </button>
        <button
          @click="save"
          :disabled="loading"
          class="btn-primary px-6 py-2 flex items-center gap-2"
        >
          <div
            v-if="loading"
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></div>
          <span>{{ isEdit ? "Simpan Perubahan" : "Simpan" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import api from "@/api";
import { useToastStore } from "@/stores/toast";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import SearchableSelect from "@/components/ui/SearchableSelect.vue";

const props = defineProps({
  modelValue: Boolean,
  kamar: Object, // If null, create mode
});

const emit = defineEmits(["update:modelValue", "saved"]);
const toast = useToastStore();
const loading = ref(false);
const users = ref([]);

const form = ref({
  nama_kamar: "",
  kapasitas: 1,
  keterangan: "",
  wali_kamar_id: 0,
  secondary_wali_ids: [],
});

const isEdit = computed(() => !!props.kamar);

const availableSecondaryWalies = computed(() => {
  return users.value.filter((u) => u.id !== form.value.wali_kamar_id);
});

// Fetch users for dropdown
onMounted(async () => {
  try {
    const { data } = await api.get("/users?per_page=1000");
    users.value = data.data;
  } catch (e) {
    console.error("Failed to fetch users", e);
  }
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (props.kamar) {
        // Edit Mode
        form.value = {
          nama_kamar: props.kamar.nama_kamar,
          kapasitas: props.kamar.kapasitas,
          keterangan: props.kamar.keterangan || "",
          wali_kamar_id: props.kamar.wali_kamar_id || 0,
          secondary_wali_ids: props.kamar.secondary_walies
            ? props.kamar.secondary_walies.map((u) => u.id)
            : [],
        };
      } else {
        // Create Mode
        form.value = {
          nama_kamar: "",
          kapasitas: 1,
          keterangan: "",
          wali_kamar_id: 0,
          secondary_wali_ids: [],
        };
      }
    }
  },
);

function close() {
  emit("update:modelValue", false);
}

async function save() {
  if (
    !form.value.nama_kamar ||
    form.value.kapasitas < 1 ||
    !form.value.wali_kamar_id
  ) {
    toast.error("Mohon lengkapi data wajib (termasuk Wali Kamar).");
    return;
  }

  loading.value = true;
  try {
    const payload = { ...form.value };

    if (isEdit.value) {
      await api.put(`/kamar/${props.kamar.id}`, payload);
      toast.success("Data kamar berhasil diperbarui");
    } else {
      await api.post("/kamar", payload);
      toast.success("Kamar baru berhasil ditambahkan");
    }
    emit("saved");
    close();
  } catch (e) {
    console.error(e);
    const msg = e.response?.data?.message || "Gagal menyimpan data";
    toast.error(msg);
  } finally {
    loading.value = false;
  }
}
</script>
