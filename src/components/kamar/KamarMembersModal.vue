<template>
  <div
    v-if="show"
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
        <div>
          <h3 class="text-lg font-bold text-gray-800">Kelola Anggota Kamar</h3>
          <p class="text-sm text-gray-500">{{ kamar?.nama_kamar }}</p>
        </div>
        <button
          @click="close"
          class="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
        >
          <SvgIcon name="x" :size="20" />
        </button>
      </div>

      <!-- Body -->
      <div class="flex flex-col md:flex-row h-full overflow-hidden">
        <!-- Left: Add Member -->
        <div
          class="w-full md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col"
        >
          <h4 class="font-semibold text-gray-700 mb-3">Tambah Santri</h4>

          <div class="relative mb-3">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama santri..."
              class="input-field !pl-10 h-10"
              style="padding-left: 2.5rem !important"
            />
            <SvgIcon
              name="search"
              :size="16"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <div
            class="flex-1 overflow-y-auto custom-scrollbar border border-gray-100 rounded-lg"
          >
            <div v-if="isSearching" class="p-4 text-center text-gray-400">
              <div
                class="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"
              ></div>
              Mencari...
            </div>
            <div
              v-else-if="searchResults.length === 0 && searchQuery"
              class="p-4 text-center text-gray-500 text-sm"
            >
              Tidak ditemukan santri dengan nama tersebut.
            </div>
            <div
              v-else-if="!searchQuery"
              class="p-4 text-center text-gray-400 text-sm"
            >
              Ketik nama santri untuk mencari.
            </div>
            <div v-else class="divide-y divide-gray-100">
              <div
                v-for="student in searchResults"
                :key="student.id"
                class="p-3 hover:bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <p class="font-medium text-gray-800 text-sm">
                    {{ student.nama_lengkap }}
                  </p>
                  <p class="text-xs text-gray-500">{{ student.nisn || "-" }}</p>
                </div>
                <button
                  @click="addStudent(student)"
                  :disabled="
                    processingId === student.id || isMember(student.id)
                  "
                  class="btn-sm btn-primary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="isMember(student.id)">Terdaftar</span>
                  <span v-else>Tambah</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Current Members -->
        <div class="w-full md:w-1/2 p-4 flex flex-col bg-gray-50/30">
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-semibold text-gray-700">Daftar Anggota</h4>
            <span
              class="text-xs font-medium px-2 py-0.5 bg-primary-50 text-primary rounded-full"
            >
              {{ currentMembers.length }} / {{ kamar?.kapasitas || 0 }}
            </span>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar">
            <div v-if="loadingMembers" class="p-8 text-center text-gray-400">
              <div
                class="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"
              ></div>
            </div>
            <div
              v-else-if="currentMembers.length === 0"
              class="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg"
            >
              <p class="text-sm">Belum ada anggota di kamar ini.</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="student in currentMembers"
                :key="student.id"
                class="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center group"
              >
                <div>
                  <p class="font-medium text-gray-800 text-sm">
                    {{ student.nama_lengkap }}
                  </p>
                  <p class="text-xs text-gray-500">{{ student.nisn || "-" }}</p>
                </div>
                <button
                  @click="removeStudent(student)"
                  :disabled="processingId === student.id"
                  class="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Keluarkan"
                >
                  <SvgIcon name="x" :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import api from "@/api";
import { useToastStore } from "@/stores/toast";
import SvgIcon from "@/components/ui/SvgIcon.vue";

const props = defineProps({
  show: Boolean,
  kamar: Object,
});

const emit = defineEmits(["update:show", "updated"]);
const toast = useToastStore();

const searchQuery = ref("");
const searchResults = ref([]);
const isSearching = ref(false);
const currentMembers = ref([]);
const loadingMembers = ref(false);
const processingId = ref(null);

// Debounce search manually since lodash might not be installed
let searchTimeout = null;
const performSearch = async (query) => {
  if (!query) {
    searchResults.value = [];
    return;
  }
  isSearching.value = true;
  try {
    const { data } = await api.get("/students", {
      params: { search: query, per_page: 5 },
    });
    searchResults.value = data.data;
  } catch (e) {
    console.error(e);
  } finally {
    isSearching.value = false;
  }
};

watch(searchQuery, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => performSearch(val), 300);
});

// Fetch members when modal opens or kamar changes
watch(
  () => props.show,
  (val) => {
    if (val && props.kamar) {
      fetchMembers();
      searchQuery.value = "";
      searchResults.value = [];
    }
  },
);

async function fetchMembers() {
  if (!props.kamar) return;
  loadingMembers.value = true;
  try {
    // Fetch fresh kamar data to get students
    const { data } = await api.get(`/kamar/${props.kamar.id}`);
    // Assuming backend returns students in the kamar object (Preloaded)
    currentMembers.value = data.students || [];
  } catch (e) {
    console.error("Failed to fetch members", e);
    toast.error("Gagal memuat daftar anggota");
  } finally {
    loadingMembers.value = false;
  }
}

function isMember(studentId) {
  return currentMembers.value.some((m) => m.id === studentId);
}

async function addStudent(student) {
  if (processingId.value) return;
  processingId.value = student.id;
  try {
    await api.post(`/kamar/${props.kamar.id}/students`, {
      student_id: student.id,
    });
    toast.success(`${student.nama_lengkap} berhasil ditambahkan`);
    await fetchMembers();
    emit("updated"); // Signal parent to refresh list if needed (e.g. counts)
  } catch (e) {
    console.error(e);
    toast.error("Gagal menambahkan santri");
  } finally {
    processingId.value = null;
  }
}

async function removeStudent(student) {
  if (!confirm(`Keluarkan ${student.nama_lengkap} dari kamar ini?`)) return;

  if (processingId.value) return;
  processingId.value = student.id;
  try {
    await api.delete(`/kamar/${props.kamar.id}/students/${student.id}`);
    toast.success(`${student.nama_lengkap} berhasi dikeluarkan`);
    await fetchMembers();
    emit("updated");
  } catch (e) {
    console.error(e);
    toast.error("Gagal mengeluarkan santri");
  } finally {
    processingId.value = null;
  }
}

function close() {
  emit("update:show", false);
}
</script>
