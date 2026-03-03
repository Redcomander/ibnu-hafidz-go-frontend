<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div>
           <h3 class="font-bold text-gray-800 text-lg">
             Assign Guru & Kelas
           </h3>
           <p class="text-sm text-gray-500">
             {{ lesson.name }} ({{ type === 'formal' ? 'Formal' : 'Diniyyah' }})
           </p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition">
          <SvgIcon name="x" class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
         <!-- Existing Assignments List -->
         <div>
            <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
               <SvgIcon name="list" class="w-4 h-4" />
               Daftar Kelas & Guru Pengajar
            </h4>
            
            <div v-if="loadingList" class="text-center py-4 text-gray-500">Loading...</div>
            <div v-else-if="assignments.length === 0" class="text-center py-8 border border-dashed rounded-lg bg-gray-50 text-gray-400">
               Belum ada kelas yang mengambil pelajaran ini.
            </div>
            <div v-else class="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                <table class="w-full text-sm text-left">
                    <thead class="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th class="px-4 py-3">Kelas</th>
                            <th class="px-4 py-3">Guru Pengajar</th>
                            <th class="px-4 py-3 text-right" style="width: 50px">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr v-for="assign in assignments" :key="assign.id" class="hover:bg-gray-50 transition group">
                            <td class="px-4 py-3 font-medium text-gray-800">
                                {{ assign.kelas?.nama }} <span class="text-gray-400 text-xs ml-1">({{ assign.kelas?.tingkat }})</span>
                            </td>
                            <td class="px-4 py-3 text-gray-600 flex items-center gap-2">
                                <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                    {{ assign.teacher?.name?.charAt(0) || '?' }}
                                </div>
                                {{ assign.teacher?.name || 'Unknown' }}
                            </td>
                            <td class="px-4 py-3 text-right">
                                <button 
                                    @click="handleUnassign(assign.id)"
                                    class="text-gray-300 hover:text-red-500 transition p-1"
                                    title="Hapus Assignment"
                                >
                                    <SvgIcon name="trash" class="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
         </div>

         <!-- Add New Form -->
         <div class="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <h4 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
               <SvgIcon name="plus" class="w-4 h-4 text-primary" />
               Tambah Assignment Baru
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
                  <SearchableSelect 
                     v-model="form.kelas_id" 
                     :options="kelasList" 
                     placeholder="Cari Kelas..." 
                  />
               </div>
               <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Pilih Guru</label>
                  <SearchableSelect 
                     v-model="form.teacher_id" 
                     :options="teachers" 
                     placeholder="Cari Guru..." 
                  />
               </div>
            </div>
            <div class="mt-4 flex justify-end">
               <button 
                  @click="handleAssign" 
                  :disabled="creating || !form.kelas_id || !form.teacher_id"
                  class="btn-primary flex items-center gap-2"
               >
                  <span v-if="creating" class="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                  <span v-else>Tambahkan</span>
               </button>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import SvgIcon from '@/components/ui/SvgIcon.vue';
import SearchableSelect from '@/components/ui/SearchableSelect.vue';
import api from '@/api';
import { useLessonTeacherStore } from '@/stores/lessonTeacher';
import { useToastStore } from '@/stores/toast';

const props = defineProps({
  lesson: { type: Object, required: true },
  type: { type: String, default: 'formal' }
});

const emit = defineEmits(['close']);
const ltStore = useLessonTeacherStore();
const toast = useToastStore();

const loadingList = ref(false);
const creating = ref(false);
const kelasList = ref([]);
const teachers = ref([]);

const form = ref({
   kelas_id: null,
   teacher_id: null
});

// Computed from store
const assignments = computed(() => ltStore.assignments);

onMounted(async () => {
   loadingList.value = true;
   try {
      // Fetch Assignments
      await ltStore.fetchAssignmentsByLesson(props.lesson.id, props.type);

      // Fetch Options
      const [resKelas, resTeachers] = await Promise.all([
         api.get('/kelas'),
         api.get('/users?per_page=1000') // All users
      ]);
      
      // Map class data for SearchableSelect
      kelasList.value = (resKelas.data.data || resKelas.data).map(k => ({
         id: k.id,
         name: `${k.nama} (${k.tingkat})`
      }));
      
      const usersData = resTeachers.data.data || resTeachers.data;
      teachers.value = usersData;

   } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data");
   } finally {
      loadingList.value = false;
   }
});

const handleAssign = async () => {
   if (!form.value.kelas_id || !form.value.teacher_id) return;
   
   creating.value = true;
   try {
      await ltStore.assignToLesson(
         props.lesson.id, 
         form.value.kelas_id, 
         form.value.teacher_id, 
         props.type
      );
      toast.success("Assignment berhasil ditambahkan");
      form.value.kelas_id = null; // Reset class selection only? or both?
      // Keep teacher might be useful if assigning same teacher to multiple classes.
      // Let's reset class only for UX convenience or reset both. Reset both is safer.
      form.value.kelas_id = null;
      form.value.teacher_id = null; 
   } catch (e) {
      toast.error(ltStore.error || "Gagal menambahkan assignment");
   } finally {
      creating.value = false;
   }
};

const handleUnassign = async (id) => {
   if (!confirm("Hapus assignment kelas ini?")) return;
   try {
      await ltStore.unassignTeacher(id, props.type);
      toast.success("Assignment dihapus");
   } catch (e) {
      toast.error("Gagal menghapus assignment");
   }
};
</script>
