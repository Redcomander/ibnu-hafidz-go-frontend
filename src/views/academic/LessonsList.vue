<template>
  <div class="space-y-6">
    <!-- Header & Tabs (Existing) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex w-fit mb-6">
      <button
        v-for="tab in ['formal', 'diniyyah']"
        :key="tab"
        @click="handleTabChange(tab)"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition capitalize',
          activeTab === tab
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
        ]"
      >
        {{ tab }}
      </button>
    </div>
    
    <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Data Pelajaran ({{ activeTab }})</h1>
        <button @click="openForm()" class="btn-primary flex items-center gap-2">
            <SvgIcon name="plus" :size="20" />
            <span class="hidden sm:inline">Tambah Pelajaran</span>
        </button>
    </div>

    <!-- Listings -->
    <div v-if="store.loading" class="flex justify-center py-12">
       <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="lesson in store.lessons" :key="lesson.id" class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="font-bold text-lg text-gray-800">{{ lesson.name }}</h3>
                    <p v-if="lesson.code" class="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">{{ lesson.code }}</p>
                </div>
                <!-- Actions -->
                <div class="flex gap-1">
                     <button @click="openAssignments(lesson)" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Kelola Guru Mapel">
                        <SvgIcon name="users" :size="18" />
                    </button>
                    <button @click="openForm(lesson)" class="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Edit">
                        <SvgIcon name="edit" :size="18" />
                    </button>
                    <button @click="handleDelete(lesson.id)" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Hapus">
                        <SvgIcon name="trash" :size="18" />
                    </button>
                </div>
            </div>
            
            <!-- Assignments Summary -->
            <div class="mt-3 pt-3 border-t border-gray-50">
               <div v-if="lesson.assignments && lesson.assignments.length > 0" class="flex flex-wrap gap-2">
                   <span 
                      v-for="assign in lesson.assignments.slice(0, 3)" 
                      :key="assign.id" 
                      class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                   >
                       {{ assign.kelas?.nama }} {{ assign.kelas?.tingkat }}: {{ assign.teacher?.name }}
                   </span>
                   <span v-if="lesson.assignments.length > 3" class="text-xs text-gray-400 py-1">
                      +{{ lesson.assignments.length - 3 }} lainnya
                   </span>
               </div>
               <div v-else class="text-xs text-gray-400 italic">
                  Belum ada kelas/guru assigned
               </div>
            </div>

            <p v-if="lesson.description" class="text-sm text-gray-600 line-clamp-2 mt-2">{{ lesson.description }}</p>
        </div>
    </div>

    <!-- Modals -->
    <LessonForm
      v-if="showForm"
      :lesson="editingLesson"
      :type="activeTab"
      @close="showForm = false"
      @submit="handleSubmit"
    />
    
    <LessonAssignmentsModal
      v-if="showAssignmentsModal"
      :lesson="selectedLessonForAssign"
      :type="activeTab"
      @close="showAssignmentsModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useLessonStore } from '@/stores/lesson';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import SvgIcon from '@/components/ui/SvgIcon.vue';
import LessonForm from './components/LessonForm.vue';
import LessonAssignmentsModal from './components/LessonAssignmentsModal.vue';
import { useRoute } from 'vue-router';

const store = useLessonStore();
const auth = useAuthStore();
const toast = useToastStore();
const route = useRoute();

const activeTab = ref('formal');
const showForm = ref(false);
const showAssignmentsModal = ref(false);
const editingLesson = ref(null);
const selectedLessonForAssign = ref(null);

onMounted(() => {
    // Check route or default
    if (route.path.includes('diniyyah')) {
        activeTab.value = 'diniyyah';
    }
    store.fetchLessons(activeTab.value);
});

const handleTabChange = (tab) => {
    activeTab.value = tab;
    store.fetchLessons(tab);
};

// Open Form (Create or Edit)
const openForm = (lesson = null) => {
    editingLesson.value = lesson; // null for Create, object for Edit
    showForm.value = true;
};

// Open Assignments Modal
const openAssignments = (lesson) => {
    selectedLessonForAssign.value = lesson;
    showAssignmentsModal.value = true;
};

const handleSubmit = async (formData) => {
    try {
        if (editingLesson.value) {
            await store.updateLesson(editingLesson.value.id, formData);
            toast.success("Pelajaran berhasil diperbarui");
        } else {
            await store.createLesson(formData);
            toast.success("Pelajaran berhasil ditambahkan");
        }
        showForm.value = false;
        // Refresh list
        store.fetchLessons(activeTab.value);
    } catch (error) {
        console.error(error);
        toast.error("Gagal menyimpan data");
    }
};

const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pelajaran ini?")) return;

    try {
        await store.deleteLesson(id, activeTab.value);
        toast.success("Pelajaran berhasil dihapus");
    } catch (error) {
        console.error(error);
        toast.error("Gagal menghapus pelajaran");
    }
};

// Watch route changes (optional if tab logic is strictly by click, but good for direct links)
watch(() => route.path, (path) => {
    if (path.includes('diniyyah')) {
        activeTab.value = 'diniyyah';
    } else if (path.includes('lessons')) {
        activeTab.value = 'formal';
    }
}, { immediate: true });
</script>
