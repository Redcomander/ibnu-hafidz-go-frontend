<template>
  <Modal :show="show" title="Tetapkan Guru Pengganti" max-width="md" @close="$emit('close')">
    <div class="space-y-4">
        <!-- Info -->
         <div class="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200">
            <p><strong>Pelajaran:</strong> {{ scheduleName }}</p>
            <p><strong>Guru Asli:</strong> {{ originalTeacherName }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Select Substitute -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Guru Pengganti</label>
                <UserSelect 
                    v-model="form.substitute_teacher_id" 
                    :initial-label="initialSubstituteName"
                    placeholder="Cari nama guru / staff..."
                    @select="handleUserSelect"
                />
                <p class="text-xs text-gray-500 mt-1">Biarkan kosong untuk menghapus guru pengganti.</p>
            </div>

            <!-- Date -->
            <div>
                 <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Pengganti</label>
                 <input type="date" v-model="form.date" class="input-field w-full" required>
            </div>

            <!-- Original Status -->
            <div v-if="form.substitute_teacher_id">
                <label class="block text-sm font-medium text-gray-700 mb-1">Status Guru Asli</label>
                <select v-model="form.status" class="input-field w-full" required>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Dinas Luar">Dinas Luar</option>
                    <option value="Lainnya">Lainnya</option>
                </select>
            </div>

            <!-- Reason -->
            <div v-if="form.substitute_teacher_id">
                <label class="block text-sm font-medium text-gray-700 mb-1">Alasan / Catatan</label>
                <textarea 
                    v-model="form.reason" 
                    rows="2" 
                    class="input-field w-full"
                    placeholder="Alasan pergantian..."
                ></textarea>
            </div>

             <!-- Footer -->
             <div class="flex justify-end gap-3 pt-2 border-t mt-4">
                <button type="button" class="btn-secondary" @click="$emit('close')">Batal</button>
                <button type="submit" class="btn-primary bg-yellow-600 hover:bg-yellow-700 text-white" :disabled="submitting">
                    <span v-if="submitting">Menyimpan...</span>
                    <span v-else>Simpan Perubahan</span>
                </button>
            </div>
        </form>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import Modal from '@/components/ui/Modal.vue';
import UserSelect from '@/components/ui/UserSelect.vue';
import { useAbsensiStore } from '@/stores/absensi';

const props = defineProps({
    show: Boolean,
    schedule: Object,
    type: { type: String, default: 'formal' } // 'formal' or 'diniyyah'
});

const emit = defineEmits(['close', 'updated']);
const store = useAbsensiStore();
const submitting = ref(false);

const form = reactive({
    substitute_teacher_id: null,
    date: new Date().toISOString().split('T')[0],
    status: 'Izin',
    reason: ''
});

// Info
const scheduleName = computed(() => {
    return props.schedule?.assignment?.lesson?.name || props.schedule?.assignment?.diniyyah_lesson?.name || '-';
});

const originalTeacherName = computed(() => {
    return props.schedule?.assignment?.teacher?.name || props.schedule?.assignment?.user?.name || '-';
});

const initialSubstituteName = computed(() => {
    return props.schedule?.substitute_teacher?.name || '';
});

// Watch show to reset form or set existing data
watch(() => props.show, (val) => {
    if (val && props.schedule) {
        form.substitute_teacher_id = props.schedule.substitute_teacher_id || null;
        if (props.schedule.substitute_date) {
            form.date = props.schedule.substitute_date.split('T')[0];
        } else {
             form.date = new Date().toISOString().split('T')[0];
        }
        form.reason = ''; // Reset reason as it's a new log usually
    }
});

const handleUserSelect = (user) => {
    if (user) {
        // Optional: Could auto-fill reason or status based on user role?
    }
};

const handleSubmit = async () => {
    submitting.value = true;
    try {
        await store.assignSubstitute({
            jadwal_id: props.schedule.id,
            substitute_teacher_id: form.substitute_teacher_id,
            date: form.date,
            status: form.status,
            reason: form.reason,
            type: props.type
        });
        emit('updated');
        emit('close');
    } catch (e) {
        console.error(e);
    } finally {
        submitting.value = false;
    }
};
</script>
