<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-primary-dark tracking-tight">Absensi Ekstrakurikuler</h1>
        <p class="text-gray-500 text-sm mt-1">Kelola grup dan kehadiran kegiatan ekstrakurikuler santri.</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary flex items-center gap-2">
        <SvgIcon name="plus" :size="16" />
        <span>Buat Grup Baru</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
      <div class="flex-1 min-w-[200px]">
        <input v-model="search" type="text" placeholder="Cari nama grup..." class="input-field !py-2" />
      </div>
      <select v-model="filters.jenis_kelamin" class="input-field !py-2 w-auto" @change="fetchData">
        <option value="all">Semua Kategori</option>
        <option value="putra">Putra</option>
        <option value="putri">Putri</option>
        <option value="campur">Campur</option>
      </select>
      <select v-model="filters.is_active" class="input-field !py-2 w-auto" @change="fetchData">
        <option value="">Semua Status</option>
        <option value="true">Aktif</option>
        <option value="false">Non-Aktif</option>
      </select>
    </div>

    <!-- Groups Grid -->
    <div class="glass-card overflow-hidden animate-fade-in">
      <div v-if="loading" class="p-12 text-center text-gray-400">
        <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm">Memuat data grup...</p>
      </div>

      <div v-else>
        <!-- Desktop Table -->
        <table class="data-table hidden lg:table">
          <thead>
            <tr>
              <th>Nama Grup</th>
              <th class="text-center">Kategori</th>
              <th class="text-center">Santri</th>
              <th class="text-center">Sesi</th>
              <th class="text-center">Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id">
              <td>
                <div class="font-medium text-gray-800">{{ item.nama_grup }}</div>
                <div class="text-xs text-gray-500 mt-0.5 line-clamp-1">{{ item.deskripsi || '-' }}</div>
              </td>
              <td class="text-center">
                <span :class="['px-2 py-1 rounded-full text-xs font-medium',
                  item.jenis_kelamin === 'putra' ? 'bg-blue-100 text-blue-700' :
                  item.jenis_kelamin === 'putri' ? 'bg-pink-100 text-pink-700' :
                  'bg-purple-100 text-purple-700']">
                  {{ item.jenis_kelamin }}
                </span>
              </td>
              <td class="text-center font-medium">{{ item.students_count }}</td>
              <td class="text-center font-medium">{{ item.sessions_count }}</td>
              <td class="text-center">
                <span :class="['px-2 py-1 rounded-full text-xs font-bold',
                  item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                  {{ item.is_active ? 'Aktif' : 'Non-Aktif' }}
                </span>
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <router-link :to="`/absensi-ekstra/${item.id}`"
                    class="text-primary hover:text-primary-dark transition text-sm px-2 py-1 rounded hover:bg-primary-50">
                    <SvgIcon name="eye" :size="16" />
                  </router-link>
                  <button @click="editGroup(item)"
                    class="text-primary hover:text-primary-dark transition text-sm px-2 py-1 rounded hover:bg-primary-50">
                    <SvgIcon name="edit" :size="16" />
                  </button>
                  <button @click="confirmDelete(item)"
                    class="text-red-500 hover:text-red-700 transition text-sm px-2 py-1 rounded hover:bg-red-50">
                    <SvgIcon name="trash" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="data.length === 0">
              <td colspan="6" class="text-center py-8 text-gray-400">Belum ada grup ekstrakurikuler.</td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile View -->
        <div class="grid grid-cols-1 gap-4 lg:hidden p-4">
          <div v-for="item in data" :key="item.id"
            class="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow relative">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="font-bold text-gray-800">{{ item.nama_grup }}</h3>
                <p class="text-xs text-gray-500 mt-0.5">{{ item.deskripsi || '-' }}</p>
              </div>
              <span :class="['px-2 py-1 rounded-full text-[10px] font-bold uppercase shrink-0',
                item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                {{ item.is_active ? 'Aktif' : 'Non-Aktif' }}
              </span>
            </div>
            <div class="flex gap-3 text-xs text-gray-600 my-2">
              <span :class="['px-1.5 py-0.5 rounded text-[10px]',
                item.jenis_kelamin === 'putra' ? 'bg-blue-100 text-blue-700' :
                item.jenis_kelamin === 'putri' ? 'bg-pink-100 text-pink-700' :
                'bg-purple-100 text-purple-700']">
                {{ item.jenis_kelamin }}
              </span>
              <span>{{ item.students_count }} Santri</span>
              <span>{{ item.sessions_count }} Sesi</span>
            </div>
            <div class="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
              <router-link :to="`/absensi-ekstra/${item.id}`"
                class="flex items-center justify-center p-1.5 text-primary hover:bg-primary-50 rounded transition">
                <SvgIcon name="eye" :size="16" />
              </router-link>
              <button @click="editGroup(item)"
                class="flex items-center justify-center p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                <SvgIcon name="edit" :size="16" />
              </button>
              <button @click="confirmDelete(item)"
                class="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded transition">
                <SvgIcon name="trash" :size="16" />
              </button>
            </div>
          </div>
          <div v-if="data.length === 0"
            class="text-center py-8 text-gray-400 col-span-full border border-dashed border-gray-200 rounded-xl">
            Belum ada grup ekstrakurikuler.
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="meta.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-sm text-gray-500">Halaman {{ meta.page }} dari {{ meta.totalPages }}</p>
        <div class="flex items-center gap-2">
          <button @click="setPage(meta.page - 1)" :disabled="meta.page === 1"
            class="p-1 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50">
            <SvgIcon name="chevron-left" :size="20" />
          </button>
          <button @click="setPage(meta.page + 1)" :disabled="meta.page === meta.totalPages"
            class="p-1 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50">
            <SvgIcon name="chevron-right" :size="20" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal v-model:show="showCreateModal" :title="editingGroup ? 'Edit Grup' : 'Buat Grup Baru'" maxWidth="md">
      <form @submit.prevent="handleSave" class="space-y-4">
        <div>
          <label class="label">Nama Grup <span class="text-red-500">*</span></label>
          <input v-model="form.nama_grup" type="text" class="input-field" placeholder="Contoh: Pramuka" required />
        </div>
        <div>
          <label class="label">Deskripsi</label>
          <textarea v-model="form.deskripsi" class="input-field" rows="2" placeholder="Deskripsi singkat..."></textarea>
        </div>
        <div>
          <label class="label">Kategori <span class="text-red-500">*</span></label>
          <select v-model="form.jenis_kelamin" class="input-field" required>
            <option value="putra">Putra</option>
            <option value="putri">Putri</option>
            <option value="campur">Campur</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="form.is_active" id="activeCheck" class="rounded border-gray-300" />
          <label for="activeCheck" class="text-sm text-gray-700">Grup Aktif</label>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t">
          <button type="button" @click="showCreateModal = false" class="btn-secondary">Batal</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Menyimpan...' : (editingGroup ? 'Perbarui' : 'Simpan') }}
          </button>
        </div>
      </form>
    </Modal>

    <!-- Delete Confirmation -->
    <ConfirmModal v-model:show="showDeleteModal" title="Hapus Grup"
      :message="`Apakah Anda yakin ingin menghapus grup '${groupToDelete?.nama_grup}'? Semua data sesi dan kehadiran dalam grup ini akan ikut terhapus.`"
      confirm-text="Hapus" cancel-text="Batal" type="danger" :loading="deleting" @confirm="handleDelete" />
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useTable } from "@/composables/useTable";
import api from "@/api";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Modal from "@/components/ui/Modal.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

const showCreateModal = ref(false);
const editingGroup = ref(null);
const saving = ref(false);
const showDeleteModal = ref(false);
const groupToDelete = ref(null);
const deleting = ref(false);

const form = reactive({
  nama_grup: "",
  deskripsi: "",
  jenis_kelamin: "campur",
  is_active: true,
});

const { data, loading, meta, search, filters, fetchData, setPage } = useTable(
  "/absensi-ekstra/groups",
  {
    defaultSort: "created_at",
    defaultOrder: "desc",
    initialFilters: { jenis_kelamin: "all", is_active: "" },
  }
);

function editGroup(group) {
  editingGroup.value = group;
  form.nama_grup = group.nama_grup;
  form.deskripsi = group.deskripsi || "";
  form.jenis_kelamin = group.jenis_kelamin;
  form.is_active = group.is_active;
  showCreateModal.value = true;
}

function confirmDelete(group) {
  groupToDelete.value = group;
  showDeleteModal.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingGroup.value) {
      await api.put(`/absensi-ekstra/groups/${editingGroup.value.id}`, form);
      toast.success("Grup berhasil diperbarui");
    } else {
      await api.post("/absensi-ekstra/groups", form);
      toast.success("Grup berhasil dibuat");
    }
    showCreateModal.value = false;
    editingGroup.value = null;
    form.nama_grup = "";
    form.deskripsi = "";
    form.jenis_kelamin = "campur";
    form.is_active = true;
    fetchData();
  } catch (e) {
    console.error(e);
    toast.error("Gagal menyimpan grup");
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!groupToDelete.value) return;
  deleting.value = true;
  try {
    await api.delete(`/absensi-ekstra/groups/${groupToDelete.value.id}`);
    toast.success("Grup berhasil dihapus");
    fetchData();
    showDeleteModal.value = false;
  } catch (e) {
    console.error(e);
    toast.error("Gagal menghapus grup");
  } finally {
    deleting.value = false;
    groupToDelete.value = null;
  }
}
</script>
