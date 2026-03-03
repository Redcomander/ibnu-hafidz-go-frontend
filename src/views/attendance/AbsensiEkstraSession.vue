<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="p-12 text-center text-gray-400">
      <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-sm">Memuat data sesi...</p>
    </div>

    <div v-else-if="session">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <router-link :to="`/absensi-ekstra/${groupId}`" class="text-gray-400 hover:text-primary transition">
              <SvgIcon name="chevron-left" :size="20" />
            </router-link>
            <h1 class="text-2xl font-bold text-primary-dark tracking-tight">{{ session.nama_sesi }}</h1>
            <span :class="['px-2 py-0.5 rounded-full text-xs font-bold',
              session.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
              {{ session.status === 'open' ? 'Terbuka' : 'Ditutup' }}
            </span>
          </div>
          <p class="text-gray-500 text-sm">{{ session.group?.nama_grup }} • {{ formatDate(session.tanggal) }}</p>
        </div>
        <div class="flex gap-2">
          <button v-if="canEdit && session.status === 'open'" @click="handleClose"
            class="btn-secondary text-sm !bg-orange-50 !text-orange-700 !border-orange-200">
            Tutup Sesi
          </button>
          <button v-if="canEdit" @click="handleSave" :disabled="saving"
            class="btn-primary text-sm">
            {{ saving ? 'Menyimpan...' : 'Simpan Kehadiran' }}
          </button>
        </div>
      </div>

      <!-- Statistics Summary -->
      <div class="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <div class="glass-card p-3 text-center">
          <p class="text-lg font-bold text-gray-800">{{ statistics.total }}</p>
          <p class="text-[10px] text-gray-500 uppercase">Total</p>
        </div>
        <div class="glass-card p-3 text-center">
          <p class="text-lg font-bold text-green-600">{{ statistics.hadir }}</p>
          <p class="text-[10px] text-gray-500 uppercase">Hadir</p>
        </div>
        <div class="glass-card p-3 text-center">
          <p class="text-lg font-bold text-blue-600">{{ statistics.izin }}</p>
          <p class="text-[10px] text-gray-500 uppercase">Izin</p>
        </div>
        <div class="glass-card p-3 text-center">
          <p class="text-lg font-bold text-yellow-600">{{ statistics.sakit }}</p>
          <p class="text-[10px] text-gray-500 uppercase">Sakit</p>
        </div>
        <div class="glass-card p-3 text-center">
          <p class="text-lg font-bold text-red-600">{{ statistics.alpha }}</p>
          <p class="text-[10px] text-gray-500 uppercase">Alpha</p>
        </div>
        <div class="glass-card p-3 text-center">
          <p class="text-lg font-bold text-orange-600">{{ statistics.terlambat }}</p>
          <p class="text-[10px] text-gray-500 uppercase">Terlambat</p>
        </div>
      </div>

      <!-- Attendance Form -->
      <div class="glass-card overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <h3 class="font-semibold text-gray-800">Daftar Kehadiran</h3>
          <div v-if="canEdit" class="flex gap-2">
            <button @click="setAll('hadir')" class="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition">
              Semua Hadir
            </button>
            <button @click="setAll('alpha')" class="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition">
              Semua Alpha
            </button>
          </div>
        </div>

        <!-- Desktop Table -->
        <table class="data-table hidden md:table">
          <thead>
            <tr>
              <th class="w-10">No</th>
              <th>Nama Santri</th>
              <th class="text-center">Kehadiran</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, i) in records" :key="record.id || record.student_id">
              <td class="text-center text-gray-500">{{ i + 1 }}</td>
              <td class="font-medium text-gray-800">{{ record.student?.nama_lengkap }}</td>
              <td class="text-center">
                <div class="flex justify-center gap-1">
                  <button v-for="status in statusOptions" :key="status.value"
                    @click="canEdit && (record.kehadiran = status.value)"
                    :class="['px-2 py-1 text-[10px] font-bold rounded-full transition',
                      record.kehadiran === status.value ? status.activeClass : 'bg-gray-100 text-gray-400',
                      canEdit ? 'cursor-pointer' : 'cursor-default']"
                    :disabled="!canEdit">
                    {{ status.label }}
                  </button>
                </div>
              </td>
              <td>
                <input v-if="canEdit" v-model="record.keterangan" type="text"
                  class="input-field !py-1 text-xs" placeholder="Opsional..." />
                <span v-else class="text-xs text-gray-500">{{ record.keterangan || '-' }}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile View -->
        <div class="md:hidden space-y-2 p-4">
          <div v-for="(record, i) in records" :key="record.id || record.student_id"
            class="border border-gray-100 rounded-lg p-3">
            <div class="flex justify-between items-start mb-2">
              <p class="font-medium text-gray-800 text-sm">{{ i + 1 }}. {{ record.student?.nama_lengkap }}</p>
            </div>
            <div class="flex flex-wrap gap-1 mb-2">
              <button v-for="status in statusOptions" :key="status.value"
                @click="canEdit && (record.kehadiran = status.value)"
                :class="['px-2 py-1 text-[10px] font-bold rounded-full transition',
                  record.kehadiran === status.value ? status.activeClass : 'bg-gray-100 text-gray-400',
                  canEdit ? 'cursor-pointer' : 'cursor-default']"
                :disabled="!canEdit">
                {{ status.label }}
              </button>
            </div>
            <input v-if="canEdit" v-model="record.keterangan" type="text"
              class="input-field !py-1 text-xs w-full" placeholder="Keterangan (opsional)..." />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();
const route = useRoute();
const router = useRouter();

const groupId = computed(() => route.params.id);
const sessionId = computed(() => route.params.session_id);

const loading = ref(true);
const saving = ref(false);
const session = ref(null);
const statistics = ref({ total: 0, hadir: 0, izin: 0, sakit: 0, alpha: 0, terlambat: 0 });
const canEdit = ref(false);
const records = ref([]);

const statusOptions = [
  { value: "hadir", label: "H", activeClass: "bg-green-500 text-white" },
  { value: "izin", label: "I", activeClass: "bg-blue-500 text-white" },
  { value: "sakit", label: "S", activeClass: "bg-yellow-500 text-white" },
  { value: "alpha", label: "A", activeClass: "bg-red-500 text-white" },
  { value: "terlambat", label: "T", activeClass: "bg-orange-500 text-white" },
];

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function setAll(status) {
  records.value.forEach((r) => (r.kehadiran = status));
}

async function fetchSession() {
  loading.value = true;
  try {
    const { data: res } = await api.get(`/absensi-ekstra/sessions/${sessionId.value}`);
    session.value = res.session;
    statistics.value = res.statistics || {};
    canEdit.value = res.can_edit;
    records.value = (res.session.records || []).map((r) => ({
      ...r,
      keterangan: r.keterangan || "",
    }));
  } catch (e) {
    console.error(e);
    toast.error("Gagal memuat data sesi");
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  try {
    await api.post(`/absensi-ekstra/sessions/${sessionId.value}/attendance`, {
      attendance: records.value.map((r) => ({
        student_id: r.student_id,
        kehadiran: r.kehadiran,
        keterangan: r.keterangan,
      })),
    });
    toast.success("Data kehadiran berhasil disimpan");
    fetchSession();
  } catch (e) {
    console.error(e);
    toast.error("Gagal menyimpan data kehadiran");
  } finally {
    saving.value = false;
  }
}

async function handleClose() {
  if (!confirm("Apakah Anda yakin ingin menutup sesi ini?")) return;
  try {
    await api.post(`/absensi-ekstra/sessions/${sessionId.value}/close`);
    toast.success("Sesi berhasil ditutup");
    fetchSession();
  } catch (e) {
    console.error(e);
    toast.error("Gagal menutup sesi");
  }
}

onMounted(() => {
  fetchSession();
});
</script>
