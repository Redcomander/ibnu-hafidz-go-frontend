<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 transition-opacity" @click="$emit('close')"></div>

    <!-- Modal -->
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-fade-in">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 class="font-bold text-gray-800">
          {{ isEdit ? 'Edit Pelajaran' : 'Tambah Pelajaran' }}
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <SvgIcon name="x" class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Pelajaran *</label>
          <input
            v-model="form.name"
            type="text"
            required
            class="input-field w-full"
            placeholder="Contoh: Matematika"
          />
        </div>

        <!-- Code (Formal only) -->
        <div v-if="form.type === 'formal'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Kode Pelajaran</label>
          <input
            v-model="form.code"
            type="text"
            class="input-field w-full uppercase"
            placeholder="Contoh: MTK"
          />
          <p class="text-xs text-gray-500 mt-1">Opsional, untuk singkatan di jadwal.</p>
        </div>

        <!-- Type (Read-only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
          <div class="px-3 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm capitalize">
            {{ form.type }}
          </div>
        </div>

        <!-- Description (Formal only) -->
        <div v-if="form.type === 'formal'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="input-field w-full"
            placeholder="Deskripsi singkat pelajaran..."
          ></textarea>
        </div>

        <!-- Error Message -->
        <div v-if="store.error" class="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {{ store.error }}
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="store.loading"
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 flex items-center gap-2"
          >
            <span v-if="store.loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ isEdit ? 'Simpan Perubahan' : 'Buat Pelajaran' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue';
import { useLessonStore } from '@/stores/lesson';
import SvgIcon from '@/components/ui/SvgIcon.vue';

const props = defineProps({
  lesson: Object,
  initialType: String,
});

const emit = defineEmits(['close', 'submit']);
const store = useLessonStore();

const isEdit = computed(() => !!props.lesson);

const form = reactive({
  name: '',
  code: '',
  type: props.initialType || 'formal',
  description: '',
});

onMounted(() => {
  if (props.lesson) {
    form.name = props.lesson.name;
    form.code = props.lesson.code;
    form.type = props.lesson.type;
    form.description = props.lesson.description;
  }
});

const handleSubmit = async () => {
  try {
    if (isEdit.value) {
      await store.updateLesson(props.lesson.id, form);
    } else {
      await store.createLesson(form);
    }
    emit('submit');
  } catch (e) {
    // Error handled by store
  }
};
</script>
