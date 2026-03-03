<template>
  <Modal :show="show" title="Absensi Santri" max-width="4xl" @close="$emit('close')">
    <div v-if="loading" class="flex justify-center py-8">
       <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
    
    <div v-else class="space-y-4">
        <!-- Header Info -->
        <div class="bg-blue-50 p-4 rounded-lg flex flex-col md:flex-row justify-between gap-4 text-sm">
            <div>
                <p class="text-gray-500">Pelajaran</p>
                <p class="font-bold text-gray-800">{{ scheduleName }}</p>
            </div>
            <div>
                 <p class="text-gray-500">Kelas</p>
                 <p class="font-bold text-gray-800">{{ className }}</p>
            </div>
            <div>
                 <p class="text-gray-500">Pengajar</p>
                 <p class="font-bold text-gray-800">{{ teacherName }}</p>
            </div>
            <div>
                 <p class="text-gray-500">Tanggal</p>
                 <input type="date" v-model="date" class="input-field py-1 px-2 text-sm" @change="loadAttendance">
            </div>
        </div>

        <!-- Stats / Quick Actions -->
        <div class="flex flex-wrap gap-2 items-center justify-between">
            <div class="text-sm text-gray-600">
                Total Santri: <span class="font-bold">{{ students.length }}</span>
            </div>
            <div class="flex gap-2">
                 <button type="button" @click="setAll('hadir')" class="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition">
                    Set Semua Hadir
                 </button>
            </div>
        </div>

        <!-- Student List -->
        <div class="border rounded-lg overflow-hidden">
            <table class="w-full text-sm text-left">
                <thead class="bg-gray-50 text-gray-700 uppercase font-medium">
                    <tr>
                        <th class="px-4 py-3 w-10">No</th>
                        <th class="px-4 py-3">Nama Santri</th>
                        <th class="px-4 py-3 text-center w-64">Status</th>
                        <th class="px-4 py-3">Catatan</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <tr v-for="(student, index) in students" :key="student.student_id" class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-center text-gray-500">{{ index + 1 }}</td>
                        <td class="px-4 py-3">
                            <p class="font-medium text-gray-800">{{ student.student_name }}</p>
                            <p class="text-xs text-gray-400">{{ student.nis }}</p>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex justify-center gap-1 bg-gray-100 p-1 rounded-lg w-fit mx-auto">
                                <button 
                                    v-for="status in ['hadir', 'izin', 'sakit', 'alpa']" 
                                    :key="status"
                                    type="button"
                                    @click="student.status = status"
                                    :class="[
                                        'px-3 py-1 rounded-md text-xs font-bold capitalize transition',
                                        student.status === status 
                                            ? statusColor(status) 
                                            : 'text-gray-500 hover:text-gray-700'
                                    ]"
                                >
                                    {{ status.charAt(0).toUpperCase() + status.slice(1) }}
                                </button>
                            </div>
                        </td>
                        <td class="px-4 py-3">
                            <input 
                                v-model="student.catatan" 
                                type="text" 
                                placeholder="Ket. tambahan..." 
                                class="input-field py-1 px-2 text-xs w-full"
                            >
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Footer -->
        <div class="flex justify-end gap-3 pt-2 border-t mt-4">
             <button type="button" class="btn-secondary" @click="$emit('close')">Batal</button>
             <button type="button" class="btn-primary" @click="saveAttendance" :disabled="submitting">
                <span v-if="submitting">Menyimpan...</span>
                <span v-else>Simpan Absensi</span>
             </button>
        </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import Modal from '@/components/ui/Modal.vue';
import { useAbsensiStore } from '@/stores/absensi';

const props = defineProps({
    show: Boolean,
    schedule: Object,
    type: {
        type: String,
        default: 'formal'
    },
    date: {
        type: String,
        default: new Date().toISOString().split('T')[0]
    }
});

const emit = defineEmits(['close', 'updated']);

const store = useAbsensiStore();
const loading = ref(true);
const submitting = ref(false);
const students = ref([]);
const date = ref(props.date);

// Derived Info
const scheduleName = computed(() => {
    return props.schedule?.assignment?.lesson?.name || props.schedule?.assignment?.diniyyah_lesson?.name || '-';
});

const className = computed(() => {
    const c = props.schedule?.assignment?.kelas;
    return c ? `${c.nama} ${c.tingkat}` : '-';
});

const teacherName = computed(() => {
    if (props.schedule?.substitute_teacher) {
        return `${props.schedule.substitute_teacher.name} (Pengganti)`;
    }
    return props.schedule?.assignment?.teacher?.name || props.schedule?.assignment?.user?.name || '-';
});

const loadAttendance = async () => {
    if (!props.schedule) return;
    loading.value = true;
    try {
        const data = await store.fetchAttendance(props.schedule.id, date.value, props.type);
        // Map response to local state for editing
        students.value = (data.students || []).map(s => ({
            ...s,
            student_id: s.student_id,
            status: s.status || 'hadir', // Default to hadir if empty
            catatan: s.catatan || ''
        }));
    } catch (e) {
        console.error("Failed to load attendance", e);
    } finally {
        loading.value = false;
    }
};

// Watch show prop and date prop to load data
watch([() => props.show, () => props.date], ([showVal, dateVal]) => {
    if (showVal && props.schedule) {
        if(dateVal) date.value = dateVal;
        loadAttendance();
    }
}, { immediate: true });



const setAll = (status) => {
    students.value.forEach(s => s.status = status);
};

const statusColor = (status) => {
    switch(status) {
        case 'hadir': return 'bg-white shadow text-green-600';
        case 'izin': return 'bg-white shadow text-blue-600';
        case 'sakit': return 'bg-white shadow text-yellow-600';
        case 'alpa': return 'bg-white shadow text-red-600';
        default: return 'bg-gray-200';
    }
};

const saveAttendance = async () => {
    submitting.value = true;
    try {
        const payload = {
            jadwal_id: props.schedule.id,
            date: date.value,
            type: props.type,
            records: students.value.map(s => ({
                student_id: s.student_id,
                status: s.status,
                catatan: s.catatan
            }))
        };
        await store.submitAttendance(payload);
        emit('updated');
        emit('close');
    } catch (e) {
        console.error(e);
    } finally {
        submitting.value = false;
    }
};
</script>
