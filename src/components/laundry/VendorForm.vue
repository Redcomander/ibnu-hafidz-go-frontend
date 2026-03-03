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
                {{ isEditing ? "Edit Vendor Laundry" : "Tambah Vendor Laundry" }}
              </DialogTitle>

              <form @submit.prevent="saveVendor" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Nama Vendor *
                  </label>
                  <input
                    v-model="form.name"
                    type="text"
                    required
                    class="input-field"
                    placeholder="Masukkan nama vendor..."
                  />
                  <p v-if="errors.name" class="mt-1 text-sm text-red-500">
                    {{ errors.name }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Kategori *
                  </label>
                  <select v-model="form.gender_type" required class="input-field">
                    <option value="" disabled>Pilih Kategori</option>
                    <option value="banin">Banin</option>
                    <option value="banat">Banat</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Telepon
                  </label>
                  <input
                    v-model="form.phone"
                    type="tel"
                    class="input-field"
                    placeholder="Contoh: 081234567890"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    v-model="form.address"
                    rows="3"
                    class="input-field resize-none"
                    placeholder="Alamat lengkap vendor..."
                  ></textarea>
                </div>

                <div class="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="active-checkbox"
                    v-model="form.active"
                    class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <label
                    for="active-checkbox"
                    class="text-sm font-medium text-gray-700 select-none"
                  >
                    Vendor Aktif (Ditampilkan dalam pilihan)
                  </label>
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
                  <button type="submit" class="btn-primary" :disabled="loading">
                    <span v-if="loading" class="flex items-center gap-2">
                      <div
                        class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      ></div>
                      Menyimpan...
                    </span>
                    <span v-else>Simpan Vendor</span>
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

const props = defineProps({
  modelValue: Boolean,
  vendor: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "saved"]);
const toast = useToastStore();
const loading = ref(false);
const errors = ref({});

const isEditing = computed(() => !!props.vendor);

const form = ref({
  name: "",
  gender_type: "",
  phone: "",
  address: "",
  active: true,
});

function resetForm() {
  errors.value = {};
  if (props.vendor) {
    form.value = {
      name: props.vendor.name || "",
      gender_type: props.vendor.gender_type || "",
      phone: props.vendor.phone || "",
      address: props.vendor.address || "",
      active: props.vendor.active ?? true,
    };
  } else {
    form.value = {
      name: "",
      gender_type: "",
      phone: "",
      address: "",
      active: true,
    };
  }
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      resetForm();
    }
  }
);

function closeModal() {
  emit("update:modelValue", false);
}

async function saveVendor() {
  errors.value = {};
  if (!form.value.name.trim()) {
    errors.value.name = "Nama vendor tidak boleh kosong";
    return;
  }

  loading.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/laundry/vendors/${props.vendor.id}`, form.value);
      toast.success("Vendor berhasil diperbarui");
    } else {
      await api.post("/laundry/vendors", form.value);
      toast.success("Vendor berhasil ditambah");
    }
    emit("saved");
    closeModal();
  } catch (err) {
    console.error(err);
    if (err.response?.data?.error) {
      toast.error(err.response.data.message || "Gagal menyimpan vendor");
    } else {
      toast.error("Terjadi kesalahan pada server");
    }
  } finally {
    loading.value = false;
  }
}
</script>
