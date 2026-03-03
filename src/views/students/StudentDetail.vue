<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <button
          @click="$router.push('/students')"
          class="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <SvgIcon name="arrow-left" :size="20" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-primary-dark tracking-tight">
            Detail Santri
          </h1>
          <p class="text-gray-500 text-sm mt-1">Informasi lengkap santri</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <button
          v-if="student"
          @click="editStudent"
          class="btn-secondary flex items-center gap-2"
        >
          <SvgIcon name="edit" :size="16" />
          <span>Edit</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-12 text-center text-gray-400">
      <div
        class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"
      ></div>
      <p class="text-sm">Memuat data...</p>
    </div>

    <!-- Content -->
    <div
      v-else-if="student"
      class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in"
    >
      <!-- Sidebar / Profile Card -->
      <div class="lg:col-span-1 space-y-6">
        <div class="glass-card p-6 text-center">
          <div
            class="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center text-gray-400"
          >
            <SvgIcon v-if="!student.foto_santri" name="users" :size="48" />
            <img
              v-else
              :src="student.foto_santri"
              class="w-full h-full object-cover"
            />
          </div>
          <h2 class="text-xl font-bold text-gray-900">
            {{ student.nama_lengkap }}
          </h2>
          <p class="text-gray-500 font-mono text-sm mt-1">
            {{ student.nisn || "No NISN" }}
          </p>

          <div class="mt-4 flex justify-center gap-2">
            <span
              :class="
                student.jenis_kelamin === 'Laki-laki'
                  ? 'badge-info'
                  : 'badge-warning'
              "
            >
              {{ student.jenis_kelamin }}
            </span>
            <span class="badge-success">{{ student.status_periode }}</span>
          </div>
        </div>

        <div class="glass-card p-6">
          <h3 class="font-semibold text-gray-800 mb-3">Kontak & Alamat</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <SvgIcon name="room" :size="16" class="text-gray-400 mt-1" />
              <span class="text-gray-600">{{ student.alamat || "-" }}</span>
            </div>
            <!-- Add more fields -->
          </div>
        </div>
      </div>

      <!-- Main Content / Tabs -->
      <div class="lg:col-span-2">
        <div class="glass-card p-6 min-h-[400px]">
          <h3 class="font-semibold text-gray-800 mb-4 border-b pb-2">
            Informasi Detail
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <span
                class="block text-gray-500 text-xs uppercase tracking-wider mb-1"
                >NIK</span
              >
              <p class="font-medium">{{ student.nik || "-" }}</p>
            </div>
            <div>
              <span
                class="block text-gray-500 text-xs uppercase tracking-wider mb-1"
                >Tempat, Tanggal Lahir</span
              >
              <p class="font-medium">
                {{ student.tempat_lahir || "-" }},
                {{ student.tanggal_lahir || "-" }}
              </p>
            </div>
            <div>
              <span
                class="block text-gray-500 text-xs uppercase tracking-wider mb-1"
                >Ayah</span
              >
              <p class="font-medium">{{ student.nama_ayah || "-" }}</p>
            </div>
            <div>
              <span
                class="block text-gray-500 text-xs uppercase tracking-wider mb-1"
                >Ibu</span
              >
              <p class="font-medium">{{ student.nama_ibu || "-" }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <StudentForm
      v-model="showEditModal"
      :student="student"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import api from "@/api";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import StudentForm from "@/components/students/StudentForm.vue";
import { useToastStore } from "@/stores/toast";

const route = useRoute();
const toast = useToastStore();
const student = ref(null);
const loading = ref(true);
const showEditModal = ref(false);

const fetchStudent = async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/students/${route.params.id}`);
    student.value = data;
  } catch (e) {
    toast.error("Gagal memuat data santri");
    student.value = null;
  } finally {
    loading.value = false;
  }
};

const editStudent = () => {
  showEditModal.value = true;
};

const handleSaved = (updatedData) => {
  // Determine if we need to reload or just update local data
  // Usually updatedData contains the new object
  if (updatedData) {
    student.value = updatedData;
  } else {
    fetchStudent();
  }
};

onMounted(fetchStudent);
</script>
