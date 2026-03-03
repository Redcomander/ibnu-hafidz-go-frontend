<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="p-12 text-center text-gray-400">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-sm">Memuat data grup...</p>
    </div>

    <div v-else-if="group">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <router-link to="/absensi-ekstra" class="text-gray-400 hover:text-primary transition">
              <SvgIcon name="chevron-left" :size="20" />
            </router-link>
            <h1 class="text-2xl font-bold text-primary-dark tracking-tight">{{ group.nama_grup }}</h1>
            <span :class="['px-2 py-0.5 rounded-full text-xs font-medium',
              group.jenis_kelamin === 'putra' ? 'bg-blue-100 text-blue-700' :
              group.jenis_kelamin === 'putri' ? 'bg-pink-100 text-pink-700' :
              'bg-purple-100 text-purple-700']">
              {{ group.jenis_kelamin }}
            </span>
          </div>
          <p class="text-gray-500 text-sm">{{ group.deskripsi || 'Tidak ada deskripsi' }}</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="glass-card p-4 text-center">
          <p class="text-2xl font-bold text-primary">{{ studentsCount }}</p>
          <p class="text-xs text-gray-500 mt-1">Santri Aktif</p>
        </div>
        <div class="glass-card p-4 text-center">
          <p class="text-2xl font-bold text-blue-600">{{ sessionsCount }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Sesi</p>
        </div>
        <div class="glass-card p-4 text-center">
          <p class="text-2xl font-bold text-orange-600">{{ openSessions }}</p>
          <p class="text-xs text-gray-500 mt-1">Sesi Terbuka</p>
        </div>
        <div class="glass-card p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ group.supervisors?.length || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Supervisor</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="glass-card overflow-hidden">
        <div class="flex border-b border-gray-100">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
            :class="['px-4 py-3 text-sm font-medium transition border-b-2', activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700']">
            {{ tab.label }}
          </button>
        </div>

        <div class="p-4">
          <!-- Sesi Kehadiran Tab -->
          <div v-if="activeTab === 'sessions'">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-base font-semibold text-gray-800">Sesi Kehadiran Terbaru</h3>
              <button @click="showCreateSessionModal = true" class="btn-primary text-sm flex items-center gap-1.5">
                <SvgIcon name="plus" :size="14" />
                <span>Buat Sesi</span>
              </button>
            </div>

            <div v-if="recentSessions.length === 0" class="text-center py-8 text-gray-400">
              Belum ada sesi kehadiran.
            </div>
            <div v-else class="space-y-3">
              <div v-for="session in recentSessions" :key="session.id"
                class="border border-gray-100 rounded-lg hover:shadow-sm transition p-4 flex justify-between items-center">
                <div>
                  <h4 class="font-medium text-gray-800">{{ session.nama_sesi }}</h4>
                  <div class="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>{{ formatDate(session.tanggal) }}</span>
                    <span :class="session.status === 'open' ? 'text-green-600' : 'text-red-500'">
                      {{ session.status === 'open' ? '● Terbuka' : '● Ditutup' }}
                    </span>
                  </div>
                </div>
                <router-link :to="`/absensi-ekstra/${group.id}/sessions/${session.id}`"
                  class="btn-secondary text-sm px-3 py-1.5">
                  Lihat
                </router-link>
              </div>
            </div>
          </div>

          <!-- Anggota Santri Tab -->
          <div v-if="activeTab === 'students'">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-base font-semibold text-gray-800">Anggota Santri ({{ members.length }})</h3>
              <button @click="showAddStudentModal = true" class="btn-primary text-sm flex items-center gap-1.5">
                <SvgIcon name="plus" :size="14" />
                <span>Tambah Santri</span>
              </button>
            </div>

            <div v-if="members.length === 0" class="text-center py-8 text-gray-400">
              Belum ada santri dalam grup ini.
            </div>
            <div v-else class="space-y-2">
              <div v-for="member in members" :key="member.student_id"
                class="border border-gray-100 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p class="font-medium text-gray-800 text-sm">{{ member.nama_lengkap }}</p>
                  <p class="text-xs text-gray-500">Bergabung: {{ formatDate(member.tanggal_masuk) }}</p>
                </div>
                <button @click="removeMember(member)" class="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50">
                  Keluarkan
                </button>
              </div>
            </div>
          </div>

          <!-- Supervisor Tab -->
          <div v-if="activeTab === 'supervisors'">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-base font-semibold text-gray-800">Supervisor</h3>
              <button @click="showAddSupervisorModal = true" class="btn-primary text-sm flex items-center gap-1.5">
                <SvgIcon name="plus" :size="14" />
                <span>Tambah Supervisor</span>
              </button>
            </div>

            <div v-if="supervisors.length === 0" class="text-center py-8 text-gray-400">
              Belum ada supervisor.
            </div>
            <div v-else class="space-y-2">
              <div v-for="sup in supervisors" :key="sup.user_id"
                class="border border-gray-100 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p class="font-medium text-gray-800 text-sm">{{ sup.name }}</p>
                  <span :class="['px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                    sup.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700']">
                    {{ sup.role }}
                  </span>
                </div>
                <button @click="removeSupervisor(sup)" class="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50">
                  Hapus
                </button>
              </div>
            </div>
          </div>

          <!-- Top Alpha Tab -->
          <div v-if="activeTab === 'alpha'">
            <h3 class="text-base font-semibold text-gray-800 mb-4">Top 5 Santri Alpha Terbanyak</h3>
            <div v-if="topAlpha.length === 0" class="text-center py-8 text-gray-400">Tidak ada data alpha.</div>
            <div v-else class="space-y-2">
              <div v-for="(a, i) in topAlpha" :key="a.student_id"
                class="border border-gray-100 rounded-lg p-3 flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <span :class="['w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                    i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : 'bg-yellow-500']">{{ i + 1 }}</span>
                  <p class="font-medium text-gray-800 text-sm">{{ a.student?.nama_lengkap || 'N/A' }}</p>
                </div>
                <span class="text-red-600 font-bold text-sm">{{ a.total_alpha }} Alpha</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Session Modal -->
    <Modal v-model:show="showCreateSessionModal" title="Buat Sesi Baru" maxWidth="md">
      <form @submit.prevent="handleCreateSession" class="space-y-4">
        <div>
          <label class="label">Nama Sesi <span class="text-red-500">*</span></label>
          <input v-model="sessionForm.nama_sesi" type="text" class="input-field" placeholder="Contoh: Latihan Rutin" required />
        </div>
        <div>
          <label class="label">Tanggal <span class="text-red-500">*</span></label>
          <input v-model="sessionForm.tanggal" type="date" class="input-field" required />
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t">
          <button type="button" @click="showCreateSessionModal = false" class="btn-secondary">Batal</button>
          <button type="submit" class="btn-primary" :disabled="savingSession">
            {{ savingSession ? 'Membuat...' : 'Buat Sesi' }}
          </button>
        </div>
      </form>
    </Modal>

    <!-- Add Student Modal -->
    <Modal v-model:show="showAddStudentModal" title="Tambah Santri" maxWidth="lg">
      <div class="space-y-4">
        <input v-model="studentSearchQuery" type="text" class="input-field" placeholder="Cari nama santri..." />
        <div class="max-h-60 overflow-y-auto space-y-1">
          <label v-for="s in filteredAvailableStudents" :key="s.id"
            class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" :value="s.id" v-model="selectedStudentIds" class="rounded border-gray-300" />
            <span class="text-sm text-gray-800">{{ s.nama_lengkap }}</span>
            <span class="text-[10px] text-gray-400 ml-auto">{{ s.jenis_kelamin }}</span>
          </label>
          <p v-if="filteredAvailableStudents.length === 0" class="text-center text-gray-400 text-sm py-4">Tidak ada santri tersedia.</p>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t">
          <button @click="showAddStudentModal = false" class="btn-secondary">Batal</button>
          <button @click="handleAddStudents" class="btn-primary" :disabled="selectedStudentIds.length === 0">
            Tambah {{ selectedStudentIds.length }} Santri
          </button>
        </div>
      </div>
    </Modal>

    <!-- Add Supervisor Modal -->
    <Modal v-model:show="showAddSupervisorModal" title="Tambah Supervisor" maxWidth="md">
      <form @submit.prevent="handleAddSupervisor" class="space-y-4">
        <div>
          <label class="label">Pilih User</label>
          <select v-model="supervisorForm.user_id" class="input-field" required>
            <option value="">-- Pilih --</option>
            <option v-for="u in availableUsers" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Role</label>
          <select v-model="supervisorForm.role" class="input-field">
            <option value="pengawas">Pengawas</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t">
          <button type="button" @click="showAddSupervisorModal = false" class="btn-secondary">Batal</button>
          <button type="submit" class="btn-primary">Tambah</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Modal from "@/components/ui/Modal.vue";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();
const route = useRoute();
const router = useRouter();

const groupId = computed(() => route.params.id);

const loading = ref(true);
const group = ref(null);
const recentSessions = ref([]);
const openSessions = ref(0);
const topAlpha = ref([]);
const studentsCount = ref(0);
const sessionsCount = ref(0);

const activeTab = ref("sessions");
const tabs = [
  { id: "sessions", label: "Sesi Kehadiran" },
  { id: "students", label: "Anggota Santri" },
  { id: "supervisors", label: "Supervisor" },
  { id: "alpha", label: "Top Alpha" },
];

// Students tab
const members = ref([]);
const availableStudents = ref([]);
const showAddStudentModal = ref(false);
const selectedStudentIds = ref([]);
const studentSearchQuery = ref("");
const filteredAvailableStudents = computed(() => {
  if (!studentSearchQuery.value) return availableStudents.value;
  const q = studentSearchQuery.value.toLowerCase();
  return availableStudents.value.filter((s) =>
    s.nama_lengkap.toLowerCase().includes(q)
  );
});

// Supervisor tab
const supervisors = ref([]);
const availableUsers = ref([]);
const showAddSupervisorModal = ref(false);
const supervisorForm = reactive({ user_id: "", role: "pengawas" });

// Session creation
const showCreateSessionModal = ref(false);
const savingSession = ref(false);
const sessionForm = reactive({
  nama_sesi: "",
  tanggal: new Date().toISOString().split("T")[0],
});

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

async function fetchGroupDetail() {
  loading.value = true;
  try {
    const { data: res } = await api.get(`/absensi-ekstra/groups/${groupId.value}`);
    group.value = res.group;
    recentSessions.value = res.recent_sessions || [];
    openSessions.value = res.open_sessions || 0;
    topAlpha.value = res.top_alpha || [];
    studentsCount.value = res.students_count || 0;
    sessionsCount.value = res.sessions_count || 0;
  } catch (e) {
    console.error(e);
    toast.error("Gagal memuat data grup");
  } finally {
    loading.value = false;
  }
}

async function fetchStudents() {
  try {
    const { data: res } = await api.get(`/absensi-ekstra/groups/${groupId.value}/students`);
    members.value = res.members || [];
    availableStudents.value = res.available_students || [];
  } catch (e) {
    console.error(e);
  }
}

async function fetchSupervisors() {
  try {
    const { data: res } = await api.get(`/absensi-ekstra/groups/${groupId.value}/supervisors`);
    supervisors.value = res.supervisors || [];
    availableUsers.value = res.available_users || [];
  } catch (e) {
    console.error(e);
  }
}

watch(activeTab, (newTab) => {
  if (newTab === "students") fetchStudents();
  if (newTab === "supervisors") fetchSupervisors();
});

async function handleCreateSession() {
  savingSession.value = true;
  try {
    const { data: res } = await api.post(`/absensi-ekstra/groups/${groupId.value}/sessions`, sessionForm);
    toast.success("Sesi berhasil dibuat");
    showCreateSessionModal.value = false;
    sessionForm.nama_sesi = "";
    // Navigate to session detail
    router.push(`/absensi-ekstra/${groupId.value}/sessions/${res.id}`);
  } catch (e) {
    console.error(e);
    toast.error("Gagal membuat sesi");
  } finally {
    savingSession.value = false;
  }
}

async function handleAddStudents() {
  try {
    await api.post(`/absensi-ekstra/groups/${groupId.value}/students`, {
      student_ids: selectedStudentIds.value,
    });
    toast.success("Santri berhasil ditambahkan");
    showAddStudentModal.value = false;
    selectedStudentIds.value = [];
    fetchStudents();
    fetchGroupDetail();
  } catch (e) {
    console.error(e);
    toast.error("Gagal menambahkan santri");
  }
}

async function removeMember(member) {
  if (!confirm(`Keluarkan ${member.nama_lengkap} dari grup?`)) return;
  try {
    await api.delete(`/absensi-ekstra/groups/${groupId.value}/students/${member.student_id}`);
    toast.success("Santri berhasil dikeluarkan");
    fetchStudents();
    fetchGroupDetail();
  } catch (e) {
    console.error(e);
    toast.error("Gagal mengeluarkan santri");
  }
}

async function handleAddSupervisor() {
  try {
    await api.post(`/absensi-ekstra/groups/${groupId.value}/supervisors`, supervisorForm);
    toast.success("Supervisor berhasil ditambahkan");
    showAddSupervisorModal.value = false;
    supervisorForm.user_id = "";
    supervisorForm.role = "pengawas";
    fetchSupervisors();
  } catch (e) {
    console.error(e);
    toast.error("Gagal menambahkan supervisor");
  }
}

async function removeSupervisor(sup) {
  if (!confirm(`Hapus ${sup.name} dari supervisor?`)) return;
  try {
    await api.delete(`/absensi-ekstra/groups/${groupId.value}/supervisors/${sup.user_id}`);
    toast.success("Supervisor berhasil dihapus");
    fetchSupervisors();
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.message || "Gagal menghapus supervisor");
  }
}

onMounted(() => {
  fetchGroupDetail();
});
</script>
