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
                {{ isEditing ? "Edit Akun Laundry" : "Tambah Akun Laundry" }}
              </DialogTitle>

              <form @submit.prevent="saveAccount" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Laundry *
                  </label>
                  <select v-model="form.vendor_id" required class="input-field" :disabled="isEditing">
                    <option value="" disabled>Pilih Vendor</option>
                    <option v-for="v in vendors" :key="v.id" :value="v.id">
                      {{ v.name }} ({{ v.gender_type }})
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Pemilik *
                  </label>
                  <select v-model="ownerType" class="input-field" :disabled="isEditing">
                    <option value="student">Santri</option>
                    <option value="user">User / Guru</option>
                  </select>
                </div>

                <!-- Select Student -->
                <div v-if="ownerType === 'student'">
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Santri *
                  </label>
                  <SearchableSelect
                    v-model="form.student_id"
                    :options="students"
                    labelKey="nama_lengkap"
                    valueKey="id"
                    placeholder="Pilih santri..."
                    :disabled="isEditing"
                    required
                  />
                </div>

                <!-- Select User -->
                <div v-if="ownerType === 'user'">
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    User / Guru *
                  </label>
                  <SearchableSelect
                    v-model="form.user_id"
                    :options="users"
                    labelKey="name"
                    valueKey="id"
                    placeholder="Pilih user..."
                    :disabled="isEditing"
                    required
                  />
                </div>

                <div class="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="active-account"
                    v-model="form.active"
                    class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <label
                    for="active-account"
                    class="text-sm font-medium text-gray-700 select-none"
                  >
                    Akun Aktif
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
                      <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Menyimpan...
                    </span>
                    <span v-else>Simpan Akun</span>
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
import { ref, watch, computed, onMounted } from "vue";
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

const props = defineProps({
  modelValue: Boolean,
  account: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "saved"]);
const toast = useToastStore();
const loading = ref(false);

const isEditing = computed(() => !!props.account);

const ownerType = ref("student");
const form = ref({
  vendor_id: "",
  student_id: "",
  user_id: "",
  active: true,
});

const vendors = ref([]);
const students = ref([]);
const users = ref([]);

async function fetchData() {
  try {
    const [vRes, sRes, uRes] = await Promise.all([
      api.get("/laundry/vendors", { params: { per_page: 100 } }),
      api.get("/students", { params: { per_page: 2000 } }), // Ideal if we have an endpoint for people w/o accounts, simplified here
      api.get("/users", { params: { per_page: 500 } })
    ]);
    vendors.value = vRes.data.data;
    students.value = sRes.data.data;
    users.value = uRes.data.data;
  } catch(e) {
    console.error(e);
  }
}

function resetForm() {
  if (props.account) {
    form.value = {
      vendor_id: props.account.vendor_id || "",
      student_id: props.account.student_id || "",
      user_id: props.account.user_id || "",
      active: props.account.active ?? true,
    };
    ownerType.value = props.account.student_id ? "student" : "user";
  } else {
    form.value = {
      vendor_id: vendors.value.length ? vendors.value[0].id : "",
      student_id: "",
      user_id: "",
      active: true,
    };
    ownerType.value = "student";
  }
}

onMounted(() => {
  fetchData();
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      if (!vendors.value.length) fetchData();
      resetForm();
    }
  }
);

function closeModal() {
  emit("update:modelValue", false);
}

async function saveAccount() {
  if (!form.value.vendor_id) {
    toast.error("Pilih vendor terlebih dahulu");
    return;
  }
  if (ownerType.value === 'student' && !form.value.student_id) {
    toast.error("Pilih santri terlebih dahulu");
    return;
  }
  if (ownerType.value === 'user' && !form.value.user_id) {
    toast.error("Pilih user terlebih dahulu");
    return;
  }

  // Clear the unwated ID based on type
  const payload = { ...form.value };
  if (ownerType.value === 'student') payload.user_id = null;
  if (ownerType.value === 'user') payload.student_id = null;

  loading.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/laundry/accounts/${props.account.id}`, payload);
      toast.success("Akun berhasil diperbarui");
    } else {
      await api.post("/laundry/accounts", payload);
      toast.success("Akun berhasil ditambah");
    }
    emit("saved");
    closeModal();
  } catch (err) {
    console.error(err);
    if (err.response?.data?.error) {
      toast.error(err.response.data.message || "Gagal menyimpan akun");
    } else {
      toast.error("Terjadi kesalahan pada server");
    }
  } finally {
    loading.value = false;
  }
}
</script>
