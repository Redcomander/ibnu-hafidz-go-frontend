<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    @click.self="close"
  >
    <div
      class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"
      >
        <h3 class="text-lg font-bold text-gray-800">
          {{ isEdit ? "Edit Pengguna" : "Tambah Pengguna Baru" }}
        </h3>
        <button
          @click="close"
          class="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
        >
          <SvgIcon name="x" :size="20" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto custom-scrollbar">
        <form @submit.prevent="save" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Nama Lengkap <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              class="input-field"
              placeholder="Contoh: Ahmad Fulan"
              required
            />
          </div>

          <!-- Username -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Username <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.username"
              type="text"
              class="input-field"
              placeholder="username_unik"
              required
            />
            <p class="text-xs text-gray-500 mt-1">Digunakan untuk login.</p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Email <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.email"
              type="email"
              class="input-field"
              placeholder="email@sekolah.com"
              required
            />
          </div>

          <!-- Password (Required for Create, Optional for Edit) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Password
              <span v-if="!isEdit" class="text-red-500">*</span>
              <span v-else class="text-xs text-gray-400 font-normal"
                >(Kosongkan jika tidak ingin mengubah)</span
              >
            </label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="input-field pr-10"
                :placeholder="isEdit ? '********' : 'Minimal 6 karakter'"
                :required="!isEdit"
                minlength="6"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <SvgIcon :name="showPassword ? 'eye-off' : 'eye'" :size="18" />
              </button>
            </div>
          </div>

          <!-- Roles -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Role / Jabatan</label
            >
            <div v-if="loadingRoles" class="text-sm text-gray-400">
              Memuat role...
            </div>
            <div
              v-else
              class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50/50"
            >
              <label
                v-for="role in availableRoles"
                :key="role.id"
                class="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-100 rounded"
              >
                <input
                  type="checkbox"
                  :value="role.id"
                  v-model="form.role_ids"
                  class="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span class="text-sm font-medium text-gray-700">{{
                  role.display_name || role.name
                }}</span>
                <span v-if="role.description" class="text-xs text-gray-400"
                  >- {{ role.description }}</span
                >
              </label>
              <div
                v-if="availableRoles.length === 0"
                class="text-sm text-gray-400 italic"
              >
                Belum ada role tersedia.
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Pengguna dapat memiliki lebih dari satu role.
            </p>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3"
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

const props = defineProps({
  modelValue: Boolean,
  user: Object, // If null, create mode
});

const emit = defineEmits(["update:modelValue", "saved"]);
const toast = useToastStore();

const loading = ref(false);
const loadingRoles = ref(false);
const availableRoles = ref([]);
const showPassword = ref(false);

const form = ref({
  name: "",
  username: "",
  email: "",
  password: "",
  role_ids: [],
});

const isEdit = computed(() => !!props.user);

// Fetch roles on mount (or when modal opens?)
// Better to fetch once or use a store, but simple fetch is fine
onMounted(() => {
  fetchRoles();
});

async function fetchRoles() {
  loadingRoles.value = true;
  try {
    // Fetch roles (assuming endpoint exists)
    const response = await api.get("/roles?per_page=100");
    availableRoles.value = response.data.data || [];
  } catch (e) {
    console.error("Failed to fetch roles", e);
    // Fallback empty
    availableRoles.value = [];
  } finally {
    loadingRoles.value = false;
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (props.user) {
        // Edit Mode
        form.value = {
          name: props.user.name,
          username: props.user.username,
          email: props.user.email,
          password: "", // Don't fill password
          role_ids: props.user.roles ? props.user.roles.map((r) => r.id) : [],
        };
      } else {
        // Create Mode
        form.value = {
          name: "",
          username: "",
          email: "",
          password: "",
          role_ids: [],
        };
      }
      showPassword.value = false;
    }
  },
);

function close() {
  emit("update:modelValue", false);
}

async function save() {
  // Client-side Validation
  if (!form.value.name || !form.value.username || !form.value.email) {
    toast.error("Mohon lengkapi data wajib.");
    return;
  }
  if (!isEdit.value && !form.value.password) {
    toast.error("Password wajib diisi untuk pengguna baru.");
    return;
  }
  if (form.value.password && form.value.password.length < 6) {
    toast.error("Password minimal 6 karakter.");
    return;
  }

  loading.value = true;
  try {
    const payload = { ...form.value };

    // Clean payload
    if (!payload.password) delete payload.password;

    if (isEdit.value) {
      await api.put(`/users/${props.user.id}`, payload);
      toast.success("Pengguna berhasil diperbarui");
    } else {
      await api.post("/users", payload);
      toast.success("Pengguna berhasil ditambahkan");
    }
    emit("saved");
    close();
  } catch (e) {
    console.error(e);
    const msg = e.response?.data?.message || "Gagal menyimpan data pengguna";
    toast.error(msg);
  } finally {
    loading.value = false;
  }
}
</script>
