<template>
  <Modal :show="show" title="Absensi Guru" max-width="md" @close="$emit('close')">
    <div class="space-y-4">
        <!-- Info -->
         <div class="bg-purple-50 p-3 rounded text-sm text-purple-800">
            <p><strong>Pelajaran:</strong> {{ scheduleName }}</p>
            <p><strong>Isi Absensi untuk tanggal:</strong> {{ date }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Status -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Status Kehadiran</label>
                <div class="grid grid-cols-2 gap-2">
                    <label 
                        v-for="s in ['Hadir', 'Izin', 'Sakit', 'Alpha']" 
                        :key="s"
                        class="cursor-pointer border rounded-lg p-2 flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                        :class="{'border-purple-500 bg-purple-50 text-purple-700 font-bold': form.status === s}"
                    >
                        <input type="radio" v-model="form.status" :value="s" class="hidden">
                        <span>{{ s }}</span>
                    </label>
                </div>
            </div>

            <!-- Notes -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Catatan / Alasan</label>
                <textarea 
                    v-model="form.notes" 
                    rows="3" 
                    class="input-field w-full"
                    placeholder="Contoh: Materi sampai bab 3..."
                ></textarea>
            </div>

            <!-- Photo -->
            <div>
                 <label class="block text-sm font-medium text-gray-700 mb-1">Foto Bukti (Opsional)</label>
                 <input type="file" @change="handleFileChange" accept="image/*" class="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100">
            </div>

            <!-- Footer -->
             <div class="flex justify-end gap-3 pt-2 border-t mt-4">
                <button type="button" class="btn-secondary" @click="$emit('close')">Batal</button>
                <button type="submit" class="btn-primary bg-purple-600 hover:bg-purple-700" :disabled="submitting">
                    <span v-if="submitting">Menyimpan...</span>
                    <span v-else>Simpan Absensi Guru</span>
                </button>
            </div>
        </form>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
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
const submitting = ref(false);

const form = reactive({
    status: 'Hadir',
    notes: '',
    photo: null
});

const scheduleName = computed(() => {
    return props.schedule?.assignment?.lesson?.name || props.schedule?.assignment?.diniyyah_lesson?.name || '-';
});

const handleFileChange = (e) => {
    form.photo = e.target.files[0];
};

const handleSubmit = async () => {
    submitting.value = true;
    try {
        const formData = new FormData();
        formData.append('jadwal_id', props.schedule.id);
        formData.append('date', props.date);
        formData.append('type', props.type);
        formData.append('status', form.status);
        formData.append('notes', form.notes);
        if (form.photo) {
            formData.append('photo', form.photo);
        }

        await store.submitTeacherAttendance(formData);
        emit('updated');
        emit('close');
    } catch (e) {
        console.error(e);
    } finally {
        submitting.value = false;
    }
};
</script>
