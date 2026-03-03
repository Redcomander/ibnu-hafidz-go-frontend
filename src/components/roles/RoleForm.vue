<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    @click.self="close"
  >
    <div
      class="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"
      >
        <h3 class="text-lg font-bold text-gray-800">
          {{ isEdit ? "Edit Role" : "Tambah Role Baru" }}
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
        <form @submit.prevent="save" class="space-y-6">
          <!-- Basic Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Display Name -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Nama Tampilan <span class="text-red-500">*</span></label
              >
              <input
                v-model="form.display_name"
                type="text"
                class="input-field"
                placeholder="Contoh: Staff Keuangan"
                required
              />
            </div>

            <!-- Internal Name (Slug) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Kode Role (Unik) <span class="text-red-500">*</span></label
              >
              <input
                v-model="form.name"
                type="text"
                class="input-field font-mono text-xs"
                placeholder="staff_keuangan"
                :disabled="isEdit && form.is_system_role"
                required
              />
              <p
                v-if="isEdit && form.is_system_role"
                class="text-xs text-yellow-600 mt-1"
              >
                Role sistem tidak dapat mengubah kode.
              </p>
            </div>

            <!-- Color Picker -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Warna Badge</label
              >
              <div class="flex items-center gap-2">
                <input
                  v-model="form.color"
                  type="color"
                  class="h-10 w-16 p-1 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  v-model="form.color"
                  type="text"
                  class="input-field !py-2 !w-full"
                  placeholder="#000000"
                />
              </div>
            </div>

            <!-- Description -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Deskripsi</label
              >
              <textarea
                v-model="form.description"
                class="input-field"
                rows="2"
                placeholder="Jelaskan fungsi role ini..."
              ></textarea>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Permissions -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="block text-sm font-bold text-gray-800"
                >Hak Akses / Permissions</label
              >
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  @click="showAddPermission = !showAddPermission"
                  class="text-xs flex items-center gap-1 text-primary hover:text-primary-dark font-medium px-2 py-1 rounded hover:bg-green-50 transition"
                >
                  <SvgIcon
                    :name="showAddPermission ? 'x' : 'plus'"
                    :size="14"
                  />
                  {{ showAddPermission ? "Batal" : "Permission Baru" }}
                </button>
                <div class="text-xs text-gray-500">
                  <span class="font-bold text-primary">{{
                    form.permission_ids.length
                  }}</span>
                  dipilih
                </div>
              </div>
            </div>

            <!-- Add Permission Inline Form -->
            <div
              v-if="showAddPermission"
              class="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/10 animate-fade-in text-sm"
            >
              <h4 class="font-bold text-primary-dark mb-3">
                Tambah Permission Baru
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1"
                    >Nama Tampilan</label
                  >
                  <input
                    v-model="newPermission.display_name"
                    type="text"
                    class="input-field !py-1.5 !text-xs"
                    placeholder="Lihat Dashboard"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1"
                    >Kode (Slug)</label
                  >
                  <input
                    v-model="newPermission.name"
                    type="text"
                    class="input-field !py-1.5 !text-xs"
                    placeholder="dashboard.view"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1"
                    >Kategori</label
                  >
                  <input
                    v-model="newPermission.category"
                    type="text"
                    class="input-field !py-1.5 !text-xs"
                    placeholder="Dashboard"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1"
                    >Deskripsi</label
                  >
                  <input
                    v-model="newPermission.description"
                    type="text"
                    class="input-field !py-1.5 !text-xs"
                    placeholder="Mengizinkan akses..."
                  />
                </div>
              </div>
              <div class="flex justify-end">
                <button
                  type="button"
                  @click="savePermission"
                  :disabled="creatingPermission"
                  class="btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-2"
                >
                  <div
                    v-if="creatingPermission"
                    class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  ></div>
                  Simpan Permission
                </button>
              </div>
            </div>

            <div
              v-if="Object.keys(groupedPermissions).length === 0"
              class="text-center py-4 text-gray-400 text-sm"
            >
              Tidak ada permission tersedia.
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(perms, category) in groupedPermissions"
                :key="category"
                class="bg-gray-50 rounded-lg p-3 border border-gray-100"
              >
                <h4
                  class="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1 flex justify-between"
                >
                  {{ category || "Lainnya" }}
                  <button
                    type="button"
                    @click="toggleSelectGroup(perms)"
                    class="text-primary text-xs normal-case hover:underline"
                  >
                    Toggle All
                  </button>
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    v-for="perm in perms"
                    :key="perm.id"
                    class="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-white rounded transition"
                  >
                    <input
                      type="checkbox"
                      :value="perm.id"
                      v-model="form.permission_ids"
                      class="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <div
                        class="text-sm font-medium text-gray-700 leading-tight"
                      >
                        {{ perm.display_name || perm.name }}
                      </div>
                      <div class="text-xs text-gray-400 break-all">
                        {{ perm.name }}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
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
import { ref, computed, watch } from "vue";
import api from "@/api";
import { useToastStore } from "@/stores/toast";
import SvgIcon from "@/components/ui/SvgIcon.vue";

const props = defineProps({
  modelValue: Boolean,
  role: Object, // If null, create mode
  allPermissions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "saved", "refresh-permissions"]);
const toast = useToastStore();
const loading = ref(false);

const showAddPermission = ref(false);
const creatingPermission = ref(false);
const newPermission = ref({
  name: "",
  display_name: "",
  description: "",
  category: "",
});

const form = ref({
  name: "",
  display_name: "",
  description: "",
  color: "#217b34",
  is_system_role: false,
  permission_ids: [],
});

const isEdit = computed(() => !!props.role);

// Group permissions by category
const groupedPermissions = computed(() => {
  const groups = {};
  props.allPermissions.forEach((p) => {
    const cat = p.category || "Lainnya";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });
  // Sort categories (optional) or keep backend order
  return groups;
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      showAddPermission.value = false;
      if (props.role) {
        // Edit Mode
        form.value = {
          name: props.role.name,
          display_name: props.role.display_name || props.role.name,
          description: props.role.description || "",
          color: props.role.color || "#217b34",
          is_system_role: props.role.is_system_role || false,
          permission_ids: props.role.permissions
            ? props.role.permissions.map((p) => p.id)
            : [],
        };
      } else {
        // Create Mode
        form.value = {
          name: "",
          display_name: "",
          description: "",
          color: "#217b34",
          is_system_role: false,
          permission_ids: [],
        };
      }
    }
  },
);

// Auto-fill slug from display name if empty
watch(
  () => newPermission.value.display_name,
  (val) => {
    if (!newPermission.value.name && val) {
      newPermission.value.name = val
        .toLowerCase()
        .replace(/\s+/g, ".")
        .replace(/[^a-z0-9.]/g, "");
    }
  },
);

async function savePermission() {
  if (
    !newPermission.value.name ||
    !newPermission.value.display_name ||
    !newPermission.value.category
  ) {
    toast.error("Mohon lengkapi Nama Tampilan, Kode, dan Kategori");
    return;
  }

  // Check duplicate in existing props
  const exists = props.allPermissions.find(
    (p) => p.name === newPermission.value.name,
  );
  if (exists) {
    toast.error("Permission dengan kode ini sudah ada.");
    return;
  }

  creatingPermission.value = true;
  try {
    await api.post("/permissions", newPermission.value);
    toast.success("Permission berhasil dibuat");

    // Reset form
    newPermission.value = {
      name: "",
      display_name: "",
      description: "",
      category: "",
    };
    showAddPermission.value = false;

    // Emit event for parent to reload permissions
    emit("refresh-permissions");
  } catch (e) {
    console.error(e);
    toast.error("Gagal membuat permission");
  } finally {
    creatingPermission.value = false;
  }
}

function toggleSelectGroup(perms) {
  const allIds = perms.map((p) => p.id);
  const selectedInGroup = form.value.permission_ids.filter((id) =>
    allIds.includes(id),
  );

  if (selectedInGroup.length === allIds.length) {
    // Deselect all
    form.value.permission_ids = form.value.permission_ids.filter(
      (id) => !allIds.includes(id),
    );
  } else {
    // Select all
    const toAdd = allIds.filter(
      (id) => !form.value.permission_ids.includes(id),
    );
    form.value.permission_ids.push(...toAdd);
  }
}

function close() {
  emit("update:modelValue", false);
}

async function save() {
  if (!form.value.name || !form.value.display_name) {
    toast.error("Nama dan Kode Role wajib diisi.");
    return;
  }

  loading.value = true;
  try {
    const payload = { ...form.value };

    if (isEdit.value) {
      await api.put(`/roles/${props.role.id}`, payload);
      toast.success("Role berhasil diperbarui");
    } else {
      await api.post("/roles", payload);
      toast.success("Role berhasil diperbarui");
    }
    emit("saved");
    close();
  } catch (e) {
    console.error(e);
    const msg = e.response?.data?.message || "Gagal menyimpan role";
    toast.error(msg);
  } finally {
    loading.value = false;
  }
}
</script>
