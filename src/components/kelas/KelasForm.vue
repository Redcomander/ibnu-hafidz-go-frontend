<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    @click.self="close"
  >
    <div
      class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
    >
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"
      >
        <h3 class="text-lg font-bold text-gray-800">
          {{ kelas ? "Edit Kelas" : "Tambah Kelas" }}
        </h3>
        <button
          @click="close"
          class="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
        >
          <SvgIcon name="x" :size="20" />
        </button>
      </div>

      <form @submit.prevent="save" class="p-6 overflow-y-auto custom-scrollbar">
        <div class="space-y-4">
          <!-- Nama Kelas & Tingkat -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label"
                >Nama Kelas <span class="text-red-500">*</span></label
              >
              <input
                v-model="form.nama"
                type="text"
                class="input-field"
                placeholder="Contoh: 10A"
                required
              />
            </div>
            <div>
              <label class="label"
                >Tingkat <span class="text-red-500">*</span></label
              >
              <input
                v-model="form.tingkat"
                type="text"
                class="input-field"
                placeholder="Contoh: 10"
                required
              />
            </div>
          </div>

          <!-- Gender -->
          <div>
            <label class="label">Gender (Jenis Kelamin)</label>
            <div class="grid grid-cols-2 gap-4">
              <label
                class="flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all"
                :class="
                  form.gender === 'banin'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300'
                "
              >
                <input
                  type="radio"
                  v-model="form.gender"
                  value="banin"
                  class="hidden"
                />
                <span class="font-medium">Banin (Putra)</span>
              </label>
              <label
                class="flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all"
                :class="
                  form.gender === 'banat'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-pink-300'
                "
              >
                <input
                  type="radio"
                  v-model="form.gender"
                  value="banat"
                  class="hidden"
                />
                <span class="font-medium">Banat (Putri)</span>
              </label>
            </div>
          </div>

          <!-- Wali Kelas (Formal) -->
          <div>
            <label class="label">Wali Kelas (Formal)</label>
            <SearchableSelect
              v-model="form.wali_kelas_id"
              :options="users"
              placeholder="Pilih Wali Kelas"
            />
            <p class="text-xs text-gray-500 mt-1">
              Penanggung jawab akademik/formal.
            </p>
          </div>

          <!-- Wali Diniyyah -->
          <div>
            <label class="label">Wali Kelas Diniyyah</label>
            <SearchableSelect
              v-model="form.wali_kelas_diniyyah_id"
              :options="users"
              placeholder="Pilih Wali Diniyyah"
            />
            <p class="text-xs text-gray-500 mt-1">
              Penanggung jawab kegiatan diniyyah.
            </p>
          </div>
        </div>
      </form>

      <div
        class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50"
      >
        <button
          type="button"
          @click="close"
          class="btn-secondary"
          :disabled="loading"
        >
          Batal
        </button>
        <button
          @click="save"
          type="submit"
          class="btn-primary"
          :disabled="loading"
        >
          <span v-if="loading">Menyimpan...</span>
          <span v-else>Simpan</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import api from "@/api";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import SearchableSelect from "@/components/ui/SearchableSelect.vue";
import { useToastStore } from "@/stores/toast";

const props = defineProps({
  modelValue: Boolean,
  kelas: Object,
});

const emit = defineEmits(["update:modelValue", "saved"]);
const toast = useToastStore();
const loading = ref(false);
const users = ref([]);

const form = ref({
  nama: "",
  tingkat: "",
  gender: "banin",
  wali_kelas_id: null,
  wali_kelas_diniyyah_id: null,
});

// Load users for dropdowns
onMounted(async () => {
  try {
    // Fetch all users for now. Optimize with search if needed later.
    const { data } = await api.get("/users?per_page=1000");
    users.value = data.data;
  } catch (e) {
    console.error("Failed to load users", e);
  }
});

watch(
  () => props.kelas,
  (val) => {
    if (val) {
      form.value = {
        nama: val.nama,
        tingkat: val.tingkat,
        gender: val.gender || "banin",
        wali_kelas_id: val.wali_kelas_id,
        wali_kelas_diniyyah_id: val.wali_kelas_diniyyah_id,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

function resetForm() {
  form.value = {
    nama: "",
    tingkat: "",
    gender: "banin",
    wali_kelas_id: null,
    wali_kelas_diniyyah_id: null,
  };
}

function close() {
  emit("update:modelValue", false);
  resetForm();
}

async function save() {
  loading.value = true;
  try {
    if (props.kelas) {
      await api.put(`/kelas/${props.kelas.id}`, form.value);
      toast.success("Kelas berhasil diperbarui");
    } else {
      await api.post("/kelas", form.value);
      toast.success("Kelas berhasil dibuat");
    }
    emit("saved");
    close();
  } catch (e) {
    console.error(e);
    toast.error("Gagal menyimpan kelas");
  } finally {
    loading.value = false;
  }
}
</script>
