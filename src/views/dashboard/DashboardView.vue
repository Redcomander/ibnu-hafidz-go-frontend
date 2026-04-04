<template>
  <div class="dashboard-root">
  <div class="space-y-6 pt-2 pb-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl text-primary">
          Selamat Datang, {{ authStore.user?.name || 'User' }}!
        </h1>
        <p class="mt-1.5 text-sm text-gray-500 font-medium tracking-wide">
          {{ currentDate }}
        </p>
      </div>
      <!-- Period Selector -->
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Periode:</span>
        <select v-model="selectedPeriod" class="bg-white border border-gray-200 text-gray-700 font-medium text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 shadow-sm">
          <option v-for="p in periodOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-24">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
      <div class="flex">
        <div class="flex-shrink-0">
          <SvgIcon name="close" :size="20" class="text-red-400" />
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700 font-medium">{{ error }}</p>
        </div>
      </div>
    </div>

    <div v-else class="space-y-6">
      
      <!-- ============================================== -->
      <!-- STATISTIK KEHADIRAN KESELURUHAN (GLOBAL STATS) -->
      <!-- ============================================== -->
      <div v-if="stats.roles?.is_teacher || stats.roles?.is_admin">
        <h3 class="text-sm font-bold tracking-widest text-gray-500 uppercase mb-4">STATISTIK KEHADIRAN KESELURUHAN</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
          <!-- FORMAL CARD (Indigo) -->
          <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:border-indigo-200 transition-colors">
            <div class="flex items-center gap-3 mb-6 relative z-10">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50">
                <SvgIcon name="document" :size="20" />
              </div>
              <h4 class="font-bold text-gray-900 text-lg">Absensi Formal</h4>
            </div>
            
            <div class="flex gap-6 relative z-10">
              <div class="w-24 h-24 shrink-0 relative">
                 <TeacherAttendanceRing 
                    :percentage="stats.global_attendance?.formal?.percentage || 0" 
                    :size="96" 
                    :strokeWidth="10" 
                    color="text-indigo-600"
                    trackColor="text-gray-100"
                 />
              </div>
              
              <div class="flex-1 grid grid-cols-2 gap-y-3 gap-x-2 text-sm pt-1">
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Hadir</span><span class="font-bold text-emerald-600 break-words">{{ stats.teacher?.formal_stats?.hadir || 0 }}</span></div>
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Izin</span><span class="font-bold text-blue-600 break-words">{{ stats.teacher?.formal_stats?.izin || 0 }}</span></div>
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Sakit</span><span class="font-bold text-amber-500 break-words">{{ stats.teacher?.formal_stats?.sakit || 0 }}</span></div>
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Alpha</span><span class="font-bold text-red-500 break-words">{{ stats.teacher?.formal_stats?.alpha || 0 }}</span></div>
              </div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs relative z-10">
              <div class="flex items-center gap-1.5 font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                 Pengganti: {{ stats.teacher?.formal_stats?.pengganti || 0 }}
              </div>
              <div class="text-gray-500 font-medium">
                Total <span class="text-gray-900 font-bold ml-0.5">{{ stats.teacher?.formal_stats?.total || 0 }}</span> sesi
              </div>
            </div>
          </div>

          <!-- DINIYYAH CARD (Emerald) -->
          <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div class="flex items-center gap-3 mb-6 relative z-10">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
                <SvgIcon name="document" :size="20" />
              </div>
              <h4 class="font-bold text-gray-900 text-lg">Absensi Diniyyah</h4>
            </div>
            
            <div class="flex gap-6 relative z-10">
              <div class="w-24 h-24 shrink-0 relative">
                 <TeacherAttendanceRing 
                    :percentage="stats.global_attendance?.diniyyah?.percentage || 0" 
                    :size="96" 
                    :strokeWidth="10" 
                    color="text-emerald-500"
                    trackColor="text-gray-100"
                 />
              </div>
              
              <div class="flex-1 grid grid-cols-2 gap-y-3 gap-x-2 text-sm pt-1">
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Hadir</span><span class="font-bold text-emerald-600 break-words">{{ stats.global_attendance?.diniyyah?.hadir || 0 }}</span></div>
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Izin</span><span class="font-bold text-blue-600 break-words">{{ stats.global_attendance?.diniyyah?.izin || 0 }}</span></div>
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Sakit</span><span class="font-bold text-amber-500 break-words">{{ stats.global_attendance?.diniyyah?.sakit || 0 }}</span></div>
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Alpha</span><span class="font-bold text-red-500 break-words">{{ stats.global_attendance?.diniyyah?.alpha || 0 }}</span></div>
              </div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs relative z-10">
              <div class="flex items-center gap-1.5 font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                 Pengganti: {{ stats.global_attendance?.diniyyah?.pengganti || 0 }}
              </div>
              <div class="text-gray-500 font-medium">
                Total <span class="text-gray-900 font-bold ml-0.5">{{ stats.global_attendance?.diniyyah?.total || 0 }}</span> sesi
              </div>
            </div>
          </div>

          <!-- HALAQOH CARD (Amber) -->
          <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:border-amber-200 transition-colors">
            <div class="flex items-center gap-3 mb-6 relative z-10">
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50">
                <SvgIcon name="document" :size="20" />
              </div>
              <h4 class="font-bold text-gray-900 text-lg">Absensi Halaqoh</h4>
            </div>
            
            <div class="flex gap-6 relative z-10">
              <div class="w-24 h-24 shrink-0 relative">
                 <TeacherAttendanceRing 
                    :percentage="stats.global_attendance?.halaqoh?.percentage || 0" 
                    :size="96" 
                    :strokeWidth="10" 
                    color="text-amber-500"
                    trackColor="text-gray-100"
                 />
              </div>
              
              <div class="flex-1 grid grid-cols-2 gap-y-3 gap-x-2 text-sm pt-1">
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Hadir</span><span class="font-bold text-emerald-600 break-words">{{ stats.global_attendance?.halaqoh?.hadir || 0 }}</span></div>
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Izin</span><span class="font-bold text-blue-600 break-words">{{ stats.global_attendance?.halaqoh?.izin || 0 }}</span></div>
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Sakit</span><span class="font-bold text-amber-500 break-words">{{ stats.global_attendance?.halaqoh?.sakit || 0 }}</span></div>
                <div class="flex flex-col"><span class="text-xs text-gray-400 font-medium">Alpha</span><span class="font-bold text-red-500 break-words">{{ stats.global_attendance?.halaqoh?.alpha || 0 }}</span></div>
              </div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs relative z-10">
              <div class="flex items-center gap-1.5 font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                 Pengganti: {{ stats.global_attendance?.halaqoh?.pengganti || 0 }}
              </div>
              <div class="text-gray-500 font-medium">
                Total <span class="text-gray-900 font-bold ml-0.5">{{ stats.global_attendance?.halaqoh?.total || 0 }}</span> sesi
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <!-- ============================================== -->
      <!-- REKAP KEHADIRAN GURU / TEACHER RECAP WIDGET  -->
      <!-- ============================================== -->
      <div>
        <h3 class="text-sm font-bold tracking-widest text-gray-500 uppercase mb-4 mt-8">REKAP KEHADIRAN GURU (ANDA)</h3>
        <div class="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden">

          <div class="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <!-- Combined Ring -->
            <div class="w-32 h-32 shrink-0 bg-gray-50 rounded-full p-2 border border-gray-100 shadow-inner">
               <TeacherAttendanceRing 
                  :percentage="stats.teacher?.teacher_recap?.percentage || 0" 
                  :size="110" 
                  :strokeWidth="12" 
                  color="text-emerald-500"
                  trackColor="text-gray-100"
               />
            </div>
            
            <div class="flex-1 w-full">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                 <div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Total {{ stats.teacher?.teacher_recap?.total || 0 }} Sesi</h2>
                    <p class="text-sm text-gray-500 font-medium">Kehadiran Gabungan (Formal + Diniyyah + Halaqoh)</p>
                 </div>
                 
                 <!-- Subtle breakdown string pill -->
                 <div class="bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 inline-flex items-center gap-3 self-start">
                   <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Formal</span>
                   <div class="text-xs space-x-2 font-mono bg-white rounded-md px-2 py-1 border border-gray-100">
                     <span class="text-emerald-600" title="Hadir">H:{{ stats.teacher?.formal_stats?.hadir || 0 }}</span>
                     <span class="text-blue-600" title="Izin">I:{{ stats.teacher?.formal_stats?.izin || 0 }}</span>
                     <span class="text-amber-600" title="Sakit">S:{{ stats.teacher?.formal_stats?.sakit || 0 }}</span>
                     <span class="text-red-600" title="Alpha">A:{{ stats.teacher?.formal_stats?.alpha || 0 }}</span>
                     <span class="text-purple-600" title="Pengganti">P:{{ stats.teacher?.formal_stats?.pengganti || 0 }}</span>
                   </div>
                 </div>
              </div>
              
              <!-- Segmented Badges -->
              <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <!-- Hadir -->
                <div class="bg-emerald-50 border border-emerald-100 rounded-xl py-4 px-4 text-center hover:bg-emerald-100/60 transition-colors">
                  <div class="text-3xl font-black text-emerald-600">{{ stats.teacher?.teacher_recap?.hadir || 0 }}</div>
                  <div class="text-[11px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Hadir</div>
                </div>
                <!-- Izin -->
                <div class="bg-blue-50 border border-blue-100 rounded-xl py-4 px-4 text-center hover:bg-blue-100/60 transition-colors">
                  <div class="text-3xl font-black text-blue-600">{{ stats.teacher?.teacher_recap?.izin || 0 }}</div>
                  <div class="text-[11px] text-blue-600 font-bold uppercase tracking-widest mt-1">Izin</div>
                </div>
                <!-- Sakit -->
                <div class="bg-amber-50 border border-amber-100 rounded-xl py-4 px-4 text-center hover:bg-amber-100/60 transition-colors">
                  <div class="text-3xl font-black text-amber-600">{{ stats.teacher?.teacher_recap?.sakit || 0 }}</div>
                  <div class="text-[11px] text-amber-600 font-bold uppercase tracking-widest mt-1">Sakit</div>
                </div>
                <!-- Alpha -->
                <div class="bg-red-50 border border-red-100 rounded-xl py-4 px-4 text-center hover:bg-red-100/60 transition-colors">
                  <div class="text-3xl font-black text-red-600">{{ stats.teacher?.teacher_recap?.alpha || 0 }}</div>
                  <div class="text-[11px] text-red-600 font-bold uppercase tracking-widest mt-1">Alpha</div>
                </div>
                <!-- Pengganti -->
                <div class="bg-purple-50 border border-purple-100 rounded-xl py-4 px-4 text-center hover:bg-purple-100/60 transition-colors col-span-2 lg:col-span-1">
                  <div class="text-3xl font-black text-purple-600">{{ stats.teacher?.teacher_recap?.pengganti || 0 }}</div>
                  <div class="text-[11px] text-purple-600 font-bold uppercase tracking-widest mt-1">Pengganti</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- BOTTOM SPLIT (JADWAL & AKSI CEPAT)             -->
      <!-- ============================================== -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        <!-- JADWAL HARI INI -->
        <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div class="flex items-center justify-between mb-6 shrink-0">
            <h3 class="text-sm font-bold tracking-widest text-gray-500 uppercase">JADWAL HARI INI</h3>
            <span class="text-xs font-bold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">{{ currentDate }}</span>
          </div>

          <div v-if="stats.teacher?.personal_schedule?.length" class="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            <div v-for="s in stats.teacher.personal_schedule" :key="s.id" class="flex gap-4 group/item">
              <!-- Timeline Line & Dot -->
              <div class="flex flex-col items-center">
                <div class="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-50 z-10 flex-shrink-0 mt-3"></div>
                <div class="w-px h-full bg-gray-100 flex-1 my-1 group-last/item:bg-transparent"></div>
              </div>
              
              <!-- Card -->
              <div class="flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl p-4 hover:shadow-md hover:border-blue-100 transition-all mb-2">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2 mb-1.5">
                      <h4 class="text-base font-bold text-gray-900">{{ s.assignment?.lesson?.name || s.assignment?.subject?.name || '-' }}</h4>
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">Formal</span>
                    </div>
                    <div class="text-sm font-medium text-gray-600 mb-2">{{ s.assignment?.kelas?.nama || '-' }} {{ s.assignment?.kelas?.tingkat || '-' }}</div>
                    
                    <div class="flex items-center gap-2 text-xs text-gray-500 font-mono bg-gray-50 inline-flex px-2.5 py-1 rounded-lg border border-gray-100">
                      <SvgIcon name="clock" :size="12" class="text-blue-500" />
                      {{ s.start_time?.slice(0,5) || '-' }} - {{ s.end_time?.slice(0,5) || '-' }}
                    </div>
                  </div>
                  
                  <button @click="openAttendanceForm(s)" class="self-start sm:self-center shrink-0 bg-primary/10 hover:bg-primary text-primary hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm w-full sm:w-auto text-center">
                    Isi Absen
                  </button>
                </div>
              </div>
            </div>
          </div>
          <!-- Empty State -->
          <div v-else class="flex-1 flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <div class="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 border border-gray-100">
               <SvgIcon name="calendar" :size="28" class="text-gray-400" />
             </div>
             <p class="text-gray-500 font-medium">Tidak ada jadwal formal/diniyyah hari ini.</p>
          </div>
        </div>

        <!-- AKSI CEPAT & LAPORAN -->
        <div class="space-y-6 flex flex-col h-[500px]">
          <!-- Aksi Cepat Grid -->
          <div class="bg-indigo-50 border border-indigo-100/50 rounded-3xl p-6 shadow-sm flex-1 flex flex-col dark:bg-slate-900 dark:border-slate-700">
            <h3 class="text-sm font-bold tracking-widest text-indigo-900/40 uppercase mb-6 shrink-0 dark:text-slate-300">AKSI CEPAT</h3>
            
            <div class="grid grid-cols-2 gap-4 flex-1">
              <!-- Siswa -->
              <router-link :to="{ name: 'students' }" class="bg-white border border-emerald-100 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)] hover:shadow-[0_8px_25px_-4px_rgba(16,185,129,0.2)] rounded-2xl p-6 flex flex-col items-center justify-center transition-all group hover:-translate-y-1 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-emerald-600/50">
                <div class="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300">
                  <SvgIcon name="user-group" :size="28" />
                </div>
                <span class="text-emerald-900 font-bold dark:text-emerald-200">Data Santri</span>
              </router-link>
              
              <!-- Galeri -->
              <router-link :to="{ name: 'gallery' }" class="bg-white border border-amber-100 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.1)] hover:shadow-[0_8px_25px_-4px_rgba(245,158,11,0.2)] rounded-2xl p-6 flex flex-col items-center justify-center transition-all group hover:-translate-y-1 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-amber-600/50">
                <div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm dark:bg-amber-900/40 dark:text-amber-300">
                  <SvgIcon name="photo" :size="28" />
                </div>
                <span class="text-amber-900 font-bold dark:text-amber-200">Galeri Foto</span>
              </router-link>

               <!-- Guru -->
              <router-link :to="{ name: 'users' }" class="bg-white border border-blue-100 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)] hover:shadow-[0_8px_25px_-4px_rgba(59,130,246,0.2)] rounded-2xl p-6 flex flex-col items-center justify-center transition-all group hover:-translate-y-1 col-span-2 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-600/50">
                <div class="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm dark:bg-blue-900/40 dark:text-blue-300">
                  <SvgIcon name="document" :size="28" />
                </div>
                <span class="text-blue-900 font-bold dark:text-blue-200">Direktori Guru</span>
              </router-link>
            </div>
          </div>

          <!-- Laporan Banner -->
          <div class="bg-primary rounded-3xl p-6 shadow-lg shadow-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 relative overflow-hidden group">
             <!-- decorative shape -->
             <div class="absolute right-0 top-0 w-32 h-full bg-white/10 skew-x-12 translate-x-10 group-hover:translate-x-0 transition-transform duration-500 pointer-events-none"></div>
             
             <div class="flex items-center gap-4 relative z-10">
                <div class="w-12 h-12 rounded-2xl bg-white/20 flex flex-shrink-0 items-center justify-center text-white backdrop-blur-sm border border-white/20 shadow-inner">
                   <SvgIcon name="chart-bar" :size="24" />
                </div>
                <div>
                  <h4 class="text-white font-bold text-lg">Laporan & Analitik</h4>
                  <p class="text-[13px] text-indigo-100 mt-0.5 font-medium">Lihat statistik lengkap dan data pengunjung</p>
                </div>
             </div>
             <button class="bg-white hover:bg-gray-50 text-primary px-5 py-2.5 text-sm font-bold rounded-xl transition-colors shadow-md relative z-10 whitespace-nowrap">
               Buka Laporan
             </button>
          </div>

        </div>

      </div>
    </div>
  </div>

  <!-- Attendance Form Modal -->
  <AttendanceForm 
    :show="showAttendanceForm" 
    :schedule="currentSchedule" 
    type="formal" 
    :date="todayDateStr"
    @close="showAttendanceForm = false; currentSchedule = null" 
    @updated="fetchStats" 
  />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/api';
import SvgIcon from '@/components/ui/SvgIcon.vue';
import TeacherAttendanceRing from '@/components/dashboard/TeacherAttendanceRing.vue';
import AttendanceForm from '@/views/attendance/AttendanceForm.vue';

const authStore = useAuthStore();
const stats = ref({});
const loading = ref(true);
const error = ref(null);

// Attendance modal state
const showAttendanceForm = ref(false);
const currentSchedule = ref(null);
const todayDateStr = new Date().toISOString().split('T')[0];

const openAttendanceForm = (schedule) => {
  currentSchedule.value = schedule;
  showAttendanceForm.value = true;
};

// ---- Period filter ----
const now = new Date();
const selectedPeriod = ref(`${now.getFullYear()}-${now.getMonth() + 1}`);

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const periodOptions = computed(() => {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    options.push({
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    });
  }
  return options;
});

watch(selectedPeriod, () => {
  fetchStats();
});

const currentDate = computed(() => {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());
});

const fetchStats = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [year, month] = selectedPeriod.value.split('-');
    const response = await api.get('/dashboard/stats', {
      params: { month, year }
    });
    stats.value = response.data;
  } catch (err) {
    console.error('Failed to fetch stats:', err);
    error.value = "Gagal memuat statistik. Silakan coba lagi.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>
