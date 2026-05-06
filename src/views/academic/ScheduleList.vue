<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useScheduleStore } from '@/stores/schedule';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { useRouter, useRoute } from 'vue-router';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/id';

import ScheduleForm from './components/ScheduleForm.vue';
import AttendanceForm from '@/views/attendance/AttendanceForm.vue';
import TeacherAttendanceModal from '@/views/attendance/TeacherAttendanceModal.vue';
import SubstituteModal from '@/components/academic/SubstituteModal.vue';

dayjs.extend(isBetween);
dayjs.locale('id');

const router = useRouter();
const route = useRoute();
const store = useScheduleStore();
const authStore = useAuthStore();
const toast = useToastStore();

// ── State ──
const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
const search = ref('');
const debouncedSearch = ref('');
const gender = ref('');
const day = ref('');
const selectedItems = ref([]);
const expandedItems = ref([]);

const scheduleType = computed(() => {
    if (route.name?.includes('diniyyah')) return 'diniyyah';
    if (route.name?.includes('ramadhan')) return 'ramadhan';
    return 'formal';
});
const activeTab = ref(scheduleType.value);
watch(scheduleType, (val) => { activeTab.value = val; }, { immediate: true });

const switchTab = (tab) => {
    activeTab.value = tab;
    const routeName = tab === 'diniyyah' ? 'schedule-diniyyah' : tab === 'ramadhan' ? 'schedule-ramadhan' : 'schedule-formal';
    if (route.name !== routeName) router.push({ name: routeName });
};

// ── Debounce ──
let debounceTimer = null;
watch(search, (val) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { debouncedSearch.value = val; }, 300);
});
onUnmounted(() => clearTimeout(debounceTimer));

// ── Modals ──
const showScheduleForm = ref(false);
const editingSchedule = ref(null);
const selectedClassId = ref(null);
const showAttendanceForm = ref(false);
const showTeacherAttendance = ref(false);
const showSubstituteModal = ref(false);
const currentSchedule = ref(null);

// ── Permissions ──
const hasRole = (r) => authStore.userRoles?.some(role => role.name === r) || false;
const canCreate = computed(() => authStore.hasPermission('schedule.create') || hasRole('super_admin') || hasRole('admin') || hasRole('staff'));
const canManage = computed(() => hasRole('super_admin') || hasRole('admin') || hasRole('staff') || hasRole('tim_presensi'));
const canFilterDate = computed(() => hasRole('super_admin') || hasRole('admin') || hasRole('staff') || hasRole('tim_presensi'));
const isSuperAdmin = computed(() => hasRole('super_admin'));
const isAdmin = computed(() => hasRole('admin') || hasRole('super_admin'));
const isStaff = computed(() => hasRole('staff') || hasRole('tim_presensi'));

// ── Days ──
const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
const todayName = computed(() => ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dayjs().day()]);
const formattedDate = computed(() => dayjs(selectedDate.value).format('dddd, D MMMM YYYY'));

// ── Fetch ──
const fetchSchedules = async () => {
    try {
        await store.fetchSchedules({
            type: activeTab.value,
            search: debouncedSearch.value,
            gender: gender.value,
            day: day.value,
            date: selectedDate.value,
        });
    } catch (e) {
        toast.error('Gagal memuat jadwal');
    }
};

onMounted(() => {
    if (!canFilterDate.value) selectedDate.value = dayjs().format('YYYY-MM-DD');
    fetchSchedules();
});

watch([selectedDate, debouncedSearch, gender, day, activeTab], () => {
    selectedItems.value = [];
    expandedItems.value = [];
    fetchSchedules();
});

// ── Grouping (for column layout) ──
const groupedSchedules = computed(() => {
    const groups = {};
    daysOrder.forEach(d => groups[d] = []);
    store.schedules.forEach(item => {
        const d = item.day || 'Lainnya';
        if (!groups[d]) groups[d] = [];
        groups[d].push(item);
    });
    Object.values(groups).forEach(arr => arr.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')));
    return Object.fromEntries(Object.entries(groups).filter(([_, items]) => items.length > 0));
});

const totalSchedules = computed(() => store.schedules.length);

// ── Selection ──
const toggleSelection = (id) => {
    const i = selectedItems.value.indexOf(id);
    if (i === -1) selectedItems.value.push(id);
    else selectedItems.value.splice(i, 1);
};
const clearSelection = () => { selectedItems.value = []; };

const confirmMassDelete = async () => {
    if (!confirm(`Hapus ${selectedItems.value.length} jadwal terpilih?`)) return;
    try {
        for (const id of selectedItems.value) await store.deleteSchedule(id, activeTab.value);
        toast.success(`${selectedItems.value.length} jadwal dihapus`);
        selectedItems.value = [];
        fetchSchedules();
    } catch { toast.error('Gagal menghapus'); }
};

const confirmDelete = async (item) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
        await store.deleteSchedule(item.id, activeTab.value);
        toast.success('Jadwal dihapus');
        fetchSchedules();
    } catch { toast.error('Gagal menghapus'); }
};

// ── CRUD ──
const openCreate = () => { editingSchedule.value = null; showScheduleForm.value = true; };
const openEdit = (item) => {
    editingSchedule.value = item;
    selectedClassId.value = item.assignment?.kelas?.id || null;
    showScheduleForm.value = true;
};
const handleScheduleSubmit = async (formData) => {
    try {
        const payload = { ...formData, type: activeTab.value };
        if (editingSchedule.value) {
            await store.updateSchedule(editingSchedule.value.id, payload);
            toast.success('Jadwal diperbarui');
        } else {
            await store.createSchedule(payload);
            toast.success('Jadwal ditambahkan');
        }
        showScheduleForm.value = false;
        editingSchedule.value = null;
        fetchSchedules();
    } catch (e) { toast.error(typeof e === 'string' ? e : 'Gagal menyimpan'); }
};

// ── Attendance access ──
const canAccessStudentAbsensi = (item) => {
    if (isSuperAdmin.value || isAdmin.value || isStaff.value) return true;
    const isAssigned = authStore.user?.id === item.assignment?.teacher?.id;
    const isSubstitute = authStore.user?.id === item.substitute_teacher?.id && isSubstituteActive(item);
    if (!isAssigned && !isSubstitute) return false;
    const isToday = dayjs().isSame(dayjs(selectedDate.value), 'day');
    if (!isToday || todayName.value !== item.day) return false;
    const now = dayjs();
    const start = dayjs(`${dayjs().format('YYYY-MM-DD')} ${item.start_time}`);
    const end = dayjs(`${dayjs().format('YYYY-MM-DD')} ${item.end_time}`);
    return now.isBetween(start.subtract(15, 'minute'), end.add(15, 'minute'));
};
const canAccessTeacherAbsensi = (item) => {
    if (canManage.value) return true;
    const userId = authStore.user?.id;
    if (!userId) return false;
    const isAssigned = userId === item.assignment?.teacher?.id;
    const isSubstitute = userId === item.substitute_teacher?.id && isSubstituteActive(item);
    return isAssigned || isSubstitute;
};

const openStudentAttendance = (item) => {
    if (!canAccessStudentAbsensi(item)) return;
    currentSchedule.value = item;
    showAttendanceForm.value = true;
};
const openTeacherAttendance = (item) => {
    if (!canAccessTeacherAbsensi(item)) return;
    currentSchedule.value = item;
    showTeacherAttendance.value = true;
};
const openSubstitute = (item) => {
    currentSchedule.value = item;
    showSubstituteModal.value = true;
};
const onAttendanceUpdated = () => { fetchSchedules(); };

// ── Accordion ──
const toggleDetails = (id) => {
    const i = expandedItems.value.indexOf(id);
    if (i > -1) expandedItems.value.splice(i, 1);
    else expandedItems.value.push(id);
};

// ── Helpers ──
const isSubstituteActive = (item) => {
    if (!item.substitute_teacher || !item.substitute_date) return false;
    return dayjs(item.substitute_date).format('YYYY-MM-DD') === selectedDate.value;
};
const getLessonName = (item) => item.assignment?.lesson?.name || item.assignment?.diniyyah_lesson?.name || '-';
const getClassName = (item) => {
    const k = item.assignment?.kelas;
    return k ? `${k.nama || ''} ${k.tingkat || ''}`.trim() : '-';
};
const getTimeDisplay = (item) => {
    const s = item.start_time?.substring(0, 5) || '--:--';
    const e = item.end_time?.substring(0, 5) || '--:--';
    return `${s} - ${e}`;
};

const dayColors = {
    'Senin':  { header: 'bg-blue-600',    card: 'border-l-blue-500',  badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/50' },
    'Selasa': { header: 'bg-emerald-600', card: 'border-l-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/50' },
    'Rabu':   { header: 'bg-purple-400',  card: 'border-l-purple-300', badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700/50' },
    'Kamis':  { header: 'bg-amber-600',   card: 'border-l-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/50' },
    'Jumat':  { header: 'bg-teal-600',    card: 'border-l-teal-500',  badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-700/50' },
    'Sabtu':  { header: 'bg-rose-600',    card: 'border-l-rose-500',  badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/50' },
    'Ahad':   { header: 'bg-slate-600',   card: 'border-l-slate-500', badge: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600/60' },
};
const dc = (d) => dayColors[d] || dayColors['Senin'];
</script>

<template>
    <div>
        <!-- ═══ Header ═══ -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
                <h1 class="text-2xl font-bold">
                    <span class="bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-600">{{ activeTab === 'ramadhan' ? 'Jadwal Ramadhan' : 'Jadwal Pelajaran' }}</span>
                </h1>
                <p class="text-sm text-gray-500 mt-0.5">{{ formattedDate }} · {{ totalSchedules }} jadwal {{ activeTab }}</p>
            </div>
            <div class="flex items-center gap-2">
                <router-link :to="{ name: activeTab === 'formal' ? 'attendance-formal' : activeTab === 'ramadhan' ? 'attendance-ramadhan' : 'attendance-diniyyah' }"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Riwayat Absensi
                </router-link>
                <button v-if="canCreate" @click="openCreate"
                    class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-green-700 active:scale-95 transition">
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Tambah Jadwal
                </button>
            </div>
        </div>

        <!-- ═══ Tabs ═══ -->
        <div class="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-4">
            <button @click="switchTab('formal')"
                :class="['px-4 py-2 rounded-md text-sm font-semibold transition', activeTab === 'formal' ? 'bg-white text-green-700 shadow' : 'text-gray-500 hover:text-gray-700']">
                <svg class="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                Formal
            </button>
            <button @click="switchTab('ramadhan')"
                :class="['px-4 py-2 rounded-md text-sm font-semibold transition', activeTab === 'ramadhan' ? 'bg-white text-green-700 shadow' : 'text-gray-500 hover:text-gray-700']">
                <svg class="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a8.997 8.997 0 008.354-5.646z"/></svg>
                Ramadhan
            </button>
            <button @click="switchTab('diniyyah')"
                :class="['px-4 py-2 rounded-md text-sm font-semibold transition', activeTab === 'diniyyah' ? 'bg-white text-green-700 shadow' : 'text-gray-500 hover:text-gray-700']">
                <svg class="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                Diniyyah
            </button>
        </div>

        <!-- ═══ Mass Delete ═══ -->
        <div v-if="selectedItems.length > 0"
            class="mb-4 bg-red-50 rounded-lg border border-red-200 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <span class="text-sm font-semibold text-red-800">{{ selectedItems.length }} jadwal dipilih</span>
            <div class="flex gap-2">
                <button @click="clearSelection" class="px-3 py-1 text-sm text-red-700 hover:bg-red-100 rounded-md transition">Batal</button>
                <button @click="confirmMassDelete" class="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition">Hapus</button>
            </div>
        </div>

        <!-- ═══ Filters ═══ -->
        <div class="bg-white rounded-lg border border-gray-200 p-4 mb-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div v-if="canFilterDate">
                    <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Tanggal</label>
                    <input type="date" v-model="selectedDate" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none transition">
                </div>
                <div :class="canFilterDate ? '' : 'sm:col-span-2'">
                    <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cari</label>
                    <div class="relative">
                        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        <input type="text" v-model="search" placeholder="Pelajaran, kelas, guru..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none transition">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Gender</label>
                    <select v-model="gender" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none transition">
                        <option value="">Semua</option>
                        <option value="banin">Banin</option>
                        <option value="banat">Banat</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Hari</label>
                    <select v-model="day" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none transition">
                        <option value="">Semua Hari</option>
                        <option v-for="d in daysOrder" :key="d" :value="d">{{ d }}</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- ═══ Loading ═══ -->
        <div v-if="store.loading" class="flex justify-center py-16">
            <div class="flex flex-col items-center gap-2">
                <div class="w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                <p class="text-sm text-gray-500">Memuat jadwal...</p>
            </div>
        </div>

        <!-- ═══ COLUMN-PER-DAY GRID (like old Laravel view) ═══ -->
        <div v-else-if="Object.keys(groupedSchedules).length > 0"
             class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            <!-- Each day = 1 column -->
            <div v-for="(items, dayName) in groupedSchedules" :key="dayName"
                class="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">

                <!-- Day Column Header -->
                <div :class="['flex items-center gap-2.5 px-4 py-3', dc(dayName).header]">
                    <svg class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span class="text-white font-bold text-sm">{{ dayName }}</span>
                    <span v-if="dayName === todayName"
                        class="ml-auto px-2 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-full">
                        Hari Ini
                    </span>
                </div>

                <!-- Cards stacked vertically inside column -->
                <div class="p-3 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    <div v-for="item in items" :key="item.id"
                        :class="['bg-white rounded-lg border-l-4 border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow', dc(dayName).card]">

                        <div class="p-3">
                            <!-- Time + Checkbox -->
                            <div class="flex items-center justify-between mb-2">
                                <span :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border', dc(dayName).badge]">
                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    {{ getTimeDisplay(item) }}
                                </span>
                                <label v-if="canManage" class="cursor-pointer">
                                    <input type="checkbox" :checked="selectedItems.includes(item.id)"
                                        @change="toggleSelection(item.id)"
                                        class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500">
                                </label>
                            </div>

                            <!-- Lesson -->
                            <h3 class="font-bold text-gray-900 text-sm mb-1.5 leading-tight">{{ getLessonName(item) }}</h3>

                            <!-- Class + Teacher -->
                            <div class="space-y-0.5 text-xs text-gray-600 mb-2">
                                <div class="flex items-center gap-1.5">
                                    <svg class="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                    <span>{{ getClassName(item) }}
                                        <span v-if="item.assignment?.kelas?.gender" class="text-gray-400"> · {{ item.assignment.kelas.gender }}</span>
                                    </span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <svg class="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                    <span :class="isSubstituteActive(item) ? 'line-through text-gray-400' : ''">{{ item.assignment?.teacher?.name || '-' }}</span>
                                </div>
                            </div>

                            <!-- Substitute badge -->
                            <div v-if="isSubstituteActive(item)"
                                class="flex items-center gap-1.5 px-2 py-1 mb-2 rounded bg-amber-50 border border-amber-200">
                                <svg class="w-3 h-3 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                                <span class="text-xs font-medium text-amber-700">{{ item.substitute_teacher?.name }}</span>
                            </div>

                            <!-- ✅ ATTENDANCE STATUS BADGES — always visible -->
                            <div v-if="item.has_attendance_today || item.has_teacher_attendance_today" class="flex flex-wrap gap-1.5 mb-2">
                                <span v-if="item.has_attendance_today"
                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-300 cursor-pointer hover:bg-green-200 transition dark:bg-green-900/30 dark:text-green-200 dark:border-green-700/50 dark:hover:bg-green-900/50"
                                    @click="toggleDetails(item.id)">
                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                                    Santri ✓
                                    <svg class="w-3 h-3 ml-1 transition-transform" :class="{'rotate-180': expandedItems.includes(item.id)}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                                </span>
                                <span v-if="item.has_teacher_attendance_today"
                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/50">
                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                                    Guru ✓
                                </span>
                            </div>

                            <!-- Expanded attendance counts -->
                            <div v-if="item.has_attendance_today && expandedItems.includes(item.id)"
                                class="grid grid-cols-2 gap-1.5 p-2 rounded bg-green-50 border border-green-200 text-xs mb-2 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200">
                                <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Hadir <strong class="ml-auto text-green-700 dark:text-green-300">{{ item.attendance_counts?.hadir || 0 }}</strong></span>
                                <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Sakit <strong class="ml-auto text-yellow-700 dark:text-yellow-300">{{ item.attendance_counts?.sakit || 0 }}</strong></span>
                                <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Izin <strong class="ml-auto text-blue-700 dark:text-blue-300">{{ item.attendance_counts?.izin || 0 }}</strong></span>
                                <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Alpha <strong class="ml-auto text-red-700 dark:text-red-300">{{ item.attendance_counts?.alpa || 0 }}</strong></span>
                            </div>

                            <!-- Actions -->
                            <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div class="flex items-center gap-0.5">
                                    <button v-if="authStore.user" @click="openStudentAttendance(item)"
                                        :disabled="!canAccessStudentAbsensi(item)"
                                        :class="['w-7 h-7 rounded flex items-center justify-center transition text-xs',
                                            canAccessStudentAbsensi(item) ? (item.has_attendance_today ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50') : 'text-gray-300 cursor-not-allowed']"
                                        :title="canAccessStudentAbsensi(item) ? (item.has_attendance_today ? 'Edit Absensi' : 'Isi Absensi') : 'Diluar jam pelajaran'">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                                    </button>
                                    <button v-if="authStore.user && canAccessTeacherAbsensi(item)"
                                        @click="openTeacherAttendance(item)"
                                        :disabled="!canAccessTeacherAbsensi(item)"
                                        :class="['w-7 h-7 rounded flex items-center justify-center transition text-xs',
                                            canAccessTeacherAbsensi(item) ? (item.has_teacher_attendance_today ? 'text-purple-600 hover:bg-purple-50' : 'text-blue-600 hover:bg-blue-50') : 'text-gray-300 cursor-not-allowed']"
                                        :title="canAccessTeacherAbsensi(item) ? 'Absensi Guru' : 'Diluar jam pelajaran'">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                    </button>
                                </div>
                                <div v-if="canManage" class="flex items-center gap-0.5">
                                    <button @click="openSubstitute(item)" class="w-7 h-7 rounded flex items-center justify-center text-amber-600 hover:bg-amber-50 transition" title="Pengganti">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                                    </button>
                                    <button @click="openEdit(item)" class="w-7 h-7 rounded flex items-center justify-center text-blue-600 hover:bg-blue-50 transition" title="Edit">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                    </button>
                                    <button @click="confirmDelete(item)" class="w-7 h-7 rounded flex items-center justify-center text-red-600 hover:bg-red-50 transition" title="Hapus">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══ Empty ═══ -->
        <div v-else-if="!store.loading" class="bg-white rounded-lg border border-gray-200">
            <div class="flex flex-col items-center py-16 text-center">
                <div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <h3 class="text-base font-semibold text-gray-900 mb-1">Belum ada jadwal {{ activeTab }}</h3>
                <p class="text-sm text-gray-500 mb-4">Klik "Tambah Jadwal" untuk mulai.</p>
                <button v-if="canCreate" @click="openCreate"
                    class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-green-700 transition">
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Tambah Jadwal
                </button>
            </div>
        </div>

        <!-- ═══ Modals ═══ -->
        <ScheduleForm :show="showScheduleForm" :schedule="editingSchedule" :class-id="selectedClassId" :type="activeTab" :loading="store.loading"
            @close="showScheduleForm = false; editingSchedule = null" @submit="handleScheduleSubmit" />
        <AttendanceForm :show="showAttendanceForm" :schedule="currentSchedule" :type="activeTab" :date="selectedDate"
            @close="showAttendanceForm = false; currentSchedule = null" @updated="onAttendanceUpdated" />
        <TeacherAttendanceModal :show="showTeacherAttendance" :schedule="currentSchedule" :type="activeTab" :date="selectedDate"
            @close="showTeacherAttendance = false; currentSchedule = null" @updated="onAttendanceUpdated" />
        <SubstituteModal :show="showSubstituteModal" :schedule="currentSchedule" :type="activeTab"
            @close="showSubstituteModal = false; currentSchedule = null" @updated="onAttendanceUpdated" />
    </div>
</template>
