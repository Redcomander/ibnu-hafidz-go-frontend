<template>
  <div>
    <!-- Page Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
    >
      <div>
        <h1 class="text-2xl font-bold text-primary-dark tracking-tight">
          Data Guru & Staff
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Kelola data pengguna dan hak akses sistem
        </p>
      </div>
      <button
        v-if="auth.hasPermission('users.create')"
        @click="createUser"
        class="btn-primary flex items-center gap-2"
      >
        <SvgIcon name="plus" :size="16" />
        <span>Tambah Pengguna</span>
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
      <div class="flex-1 min-w-[200px]">
        <input
          v-model="search"
          type="text"
          placeholder="Cari nama atau email..."
          class="input-field !py-2 !pl-10"
        />
      </div>
      <!-- Role Filter will be added later when we have Role Store -->
      <!-- <select v-model="filters.role_id" class="input-field !py-2 !w-auto">
        <option value="">Semua Role</option>
        <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
      </select> -->
    </div>

    <!-- Data Table -->
    <div class="glass-card overflow-hidden animate-fade-in">
      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center text-gray-400">
        <div
          class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"
        ></div>
        <p class="text-sm">Memuat data...</p>
      </div>

      <!-- Table -->
      <table v-else class="data-table hidden md:table">
        <thead>
          <tr>
            <th @click="setSort('name')" class="cursor-pointer">
              Nama Lengkap
              {{
                sort.field === "name" ? (sort.order === "asc" ? "↑" : "↓") : ""
              }}
            </th>
            <th @click="setSort('email')" class="cursor-pointer">
              Email
              {{
                sort.field === "email" ? (sort.order === "asc" ? "↑" : "↓") : ""
              }}
            </th>
            <th>Role</th>
            <th>Status</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in data" :key="user.id">
            <td class="font-medium text-gray-800">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase"
                >
                  {{ user.name.substring(0, 2) }}
                </div>
                <div>
                  <div>{{ user.name }}</div>
                  <div class="text-xs text-gray-400 font-normal">
                    @{{ user.username }}
                  </div>
                </div>
              </div>
            </td>
            <td class="text-gray-600">{{ user.email }}</td>
            <td>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="role in user.roles"
                  :key="role.id"
                  class="badge-primary"
                  :style="
                    role.color
                      ? {
                          backgroundColor: role.color + '20',
                          color: role.color,
                          borderColor: role.color + '40',
                        }
                      : {}
                  "
                >
                  {{ role.display_name || role.name }}
                </span>
                <span
                  v-if="!user.roles || user.roles.length === 0"
                  class="text-xs text-gray-400 italic"
                  >No Role</span
                >
              </div>
            </td>
            <td>
              <!-- Assuming 'email_verified_at' as active status proxy for now, or just active -->
              <span class="badge-success">Aktif</span>
            </td>
            <td class="text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  v-if="auth.hasPermission('users.edit')"
                  @click="editUser(user)"
                  class="text-blue-600 hover:text-blue-800 transition text-sm px-2 py-1 rounded hover:bg-blue-50"
                  title="Edit Pengguna"
                >
                  <SvgIcon name="edit" :size="16" />
                </button>
                <button
                  v-if="auth.hasPermission('users.delete')"
                  @click="confirmDelete(user)"
                  class="text-red-500 hover:text-red-700 transition text-sm px-2 py-1 rounded hover:bg-red-50"
                  title="Hapus Pengguna"
                >
                  <SvgIcon name="trash" :size="16" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="data.length === 0">
            <td colspan="5" class="text-center py-8 text-gray-400">
              Tidak ada data ditemukan
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile Card View -->
      <div
        v-if="!loading && data.length > 0"
        class="grid grid-cols-1 gap-4 md:hidden p-4"
      >
        <div
          v-for="user in data"
          :key="user.id"
          class="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase"
            >
              {{ user.name.substring(0, 2) }}
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">{{ user.name }}</h3>
              <p class="text-xs text-gray-500">@{{ user.username }}</p>
            </div>
          </div>
          <div class="text-sm text-gray-600 break-all">
            {{ user.email }}
          </div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="role in user.roles"
              :key="role.id"
              class="badge-primary text-xs"
              :style="
                role.color
                  ? {
                      backgroundColor: role.color + '20',
                      color: role.color,
                      borderColor: role.color + '40',
                    }
                  : {}
              "
            >
              {{ role.display_name || role.name }}
            </span>
          </div>
          <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              v-if="auth.hasPermission('users.edit')"
              @click="editUser(user)"
              class="p-2 text-blue-600 hover:bg-blue-100 rounded"
            >
              <SvgIcon name="edit" :size="18" />
            </button>
            <button
              v-if="auth.hasPermission('users.delete')"
              @click="confirmDelete(user)"
              class="p-2 text-red-600 hover:bg-red-100 rounded"
            >
              <SvgIcon name="trash" :size="18" />
            </button>
          </div>
        </div>
      </div>
      <div
        v-else-if="!loading && data.length === 0"
        class="md:hidden text-center py-8 text-gray-400"
      >
        Tidak ada data
      </div>

      <!-- Pagination -->
      <div
        v-if="meta.totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t border-gray-100"
      >
        <p class="text-sm text-gray-500">
          Menampilkan {{ (meta.page - 1) * meta.perPage + 1 }}–{{
            Math.min(meta.page * meta.perPage, meta.total)
          }}
          dari {{ meta.total }} pengguna
        </p>

        <div class="flex items-center gap-4">
          <!-- Rows Per Page -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500 hidden sm:inline"
              >Per halaman:</span
            >
            <select
              v-model="meta.perPage"
              class="input-field !py-1 !text-sm !w-auto bg-white border-gray-300 rounded focus:ring-primary focus:border-primary"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>

          <!-- Page Buttons -->
          <div class="flex items-center gap-1">
            <button
              @click="setPage(meta.page - 1)"
              :disabled="meta.page === 1"
              class="px-2 py-1 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SvgIcon name="chevron-left" :size="16" />
            </button>

            <button
              v-for="(page, i) in visiblePages"
              :key="i"
              @click="typeof page === 'number' ? setPage(page) : null"
              :class="[
                'px-3 py-1 rounded text-sm transition',
                typeof page === 'number'
                  ? meta.page === page
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                  : 'text-gray-400 cursor-default',
              ]"
              :disabled="typeof page !== 'number'"
            >
              {{ page }}
            </button>

            <button
              @click="setPage(meta.page + 1)"
              :disabled="meta.page === meta.totalPages"
              class="px-2 py-1 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SvgIcon name="chevron-right" :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- User Form Modal -->
    <UserForm v-model="showForm" :user="selectedUser" @saved="handleSaved" />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model:show="showDeleteModal"
      title="Hapus Pengguna"
      :message="`Apakah Anda yakin ingin menghapus pengguna ${userToDelete?.name}?`"
      confirm-text="Hapus"
      cancel-text="Batal"
      type="danger"
      :loading="deleteLoading"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useTable } from "@/composables/useTable";
import api from "@/api";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import UserForm from "@/components/users/UserForm.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { useToastStore } from "@/stores/toast";

const auth = useAuthStore();
const toast = useToastStore();

// Form state
const showForm = ref(false);
const selectedUser = ref(null);
const showDeleteModal = ref(false);
const userToDelete = ref(null);
const deleteLoading = ref(false);

// useTable
const {
  data,
  loading,
  meta,
  search,
  filters,
  sort,
  setPage,
  setSort,
  fetchData,
} = useTable("/users", {
  defaultSort: "created_at",
  initialFilters: {},
});

// Pagination Logic
const visiblePages = computed(() => {
  const { page, totalPages } = meta; // Reactive object
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];
  if (page > 3) pages.push("...");

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (page < totalPages - 2) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return pages;
});

function createUser() {
  selectedUser.value = null;
  showForm.value = true;
}

function editUser(user) {
  selectedUser.value = { ...user };
  showForm.value = true;
}

async function confirmDelete(user) {
  userToDelete.value = user;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!userToDelete.value) return;

  deleteLoading.value = true;
  try {
    await api.delete(`/users/${userToDelete.value.id}`);
    toast.success(`Pengguna ${userToDelete.value.name} berhasil dihapus`);
    fetchData();
    showDeleteModal.value = false;
  } catch (e) {
    console.error(e);
    toast.error("Gagal menghapus pengguna");
  } finally {
    deleteLoading.value = false;
    userToDelete.value = null;
  }
}

function handleSaved() {
  fetchData();
}
</script>
