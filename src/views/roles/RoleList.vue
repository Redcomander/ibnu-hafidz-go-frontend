<template>
  <div>
    <!-- Page Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
    >
      <div>
        <h1 class="text-2xl font-bold text-primary-dark tracking-tight">
          Role & Permissions
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Atur hak akses pengguna dalam sistem
        </p>
      </div>
      <button
        v-if="auth.hasPermission('roles.create')"
        @click="createRole"
        class="btn-primary flex items-center gap-2"
      >
        <SvgIcon name="plus" :size="16" />
        <span>Tambah Role</span>
      </button>
    </div>

    <!-- Summary / Info Card (Optional) -->
    <!-- <div class="glass-card p-6 mb-6">
        <h3 class="font-semibold text-lg text-primary-dark mb-2">Access Control</h3>
        <p class="text-gray-600 text-sm">Use roles to group permissions and assign them to users. System roles cannot be deleted.</p>
    </div> -->

    <!-- Loading State -->
    <div v-if="loading" class="p-12 text-center text-gray-400">
      <div
        class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"
      ></div>
      <p class="text-sm">Memuat data role...</p>
    </div>

    <!-- Roles Grid -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in"
    >
      <div
        v-for="role in roles"
        :key="role.id"
        class="glass-card p-5 flex flex-col h-full hover:shadow-xl transition-shadow border-t-4"
        :style="{ borderTopColor: role.color || 'var(--primary)' }"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-lg text-gray-800">
              {{ role.display_name || role.name }}
            </h3>
            <span
              v-if="role.is_system_role"
              class="badge-gray text-[10px] uppercase tracking-wider"
              >System</span
            >
          </div>
          <!-- Actions -->
          <div class="flex gap-1" v-if="!role.is_system_role">
            <button
              v-if="auth.hasPermission('roles.edit')"
              @click="editRole(role)"
              class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
              title="Edit Role"
            >
              <SvgIcon name="edit" :size="16" />
            </button>
            <button
              v-if="auth.hasPermission('roles.delete')"
              @click="confirmDelete(role)"
              class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
              title="Hapus Role"
            >
              <SvgIcon name="trash" :size="16" />
            </button>
          </div>
          <div class="flex gap-1" v-else>
            <button
              v-if="auth.hasPermission('roles.edit')"
              @click="editRole(role)"
              class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
              title="Lihat Detail / Edit"
            >
              <SvgIcon name="eye" :size="16" />
            </button>
          </div>
        </div>

        <p class="text-sm text-gray-500 mb-4 flex-1">
          {{ role.description || "Tidak ada deskripsi" }}
        </p>

        <div class="border-t border-gray-100 pt-4 mt-auto">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500">Users</span>
            <span
              class="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full"
              >{{ role.users_count || 0 }}</span
            >
          </div>
          <div class="flex justify-between items-center text-sm mt-2">
            <span class="text-gray-500">Permissions</span>
            <span class="font-medium text-primary"
              >{{ role.permissions ? role.permissions.length : 0 }} akses</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Role Form Modal -->
    <RoleForm
      v-model="showForm"
      :role="selectedRole"
      :all-permissions="allPermissions"
      @saved="handleSaved"
      @refresh-permissions="fetchData"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model:show="showDeleteModal"
      title="Hapus Role"
      :message="`Apakah Anda yakin ingin menghapus role ${roleToDelete?.display_name}? Pengguna dengan role ini akan kehilangan akses terkait.`"
      confirm-text="Hapus"
      cancel-text="Batal"
      type="danger"
      :loading="deleteLoading"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import RoleForm from "@/components/roles/RoleForm.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";

const auth = useAuthStore();
const toast = useToastStore();

const loading = ref(true);
const roles = ref([]);
const allPermissions = ref([]); // Store all available permissions here

// Form state
const showForm = ref(false);
const selectedRole = ref(null);
const showDeleteModal = ref(false);
const roleToDelete = ref(null);
const deleteLoading = ref(false);

onMounted(() => {
  fetchData();
});

async function fetchData() {
  loading.value = true;
  try {
    const response = await api.get("/roles");
    // Backend returns { roles: [...], permissions: [...] }
    roles.value = response.data.roles || [];
    allPermissions.value = response.data.permissions || [];
  } catch (e) {
    console.error(e);
    toast.error("Gagal memuat data role");
  } finally {
    loading.value = false;
  }
}

function createRole() {
  selectedRole.value = null;
  showForm.value = true;
}

function editRole(role) {
  selectedRole.value = { ...role };
  showForm.value = true;
}

function confirmDelete(role) {
  roleToDelete.value = role;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!roleToDelete.value) return;

  deleteLoading.value = true;
  try {
    await api.delete(`/roles/${roleToDelete.value.id}`);
    toast.success("Role berhasil dihapus");
    fetchData();
    showDeleteModal.value = false;
  } catch (e) {
    console.error(e);
    toast.error("Gagal menghapus role. Pastikan tidak ada user aktif.");
  } finally {
    deleteLoading.value = false;
    roleToDelete.value = null;
  }
}

function handleSaved() {
  fetchData();
}
</script>
