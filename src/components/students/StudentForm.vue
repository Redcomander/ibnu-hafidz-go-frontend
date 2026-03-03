<template>
  <Modal
    :show="modelValue"
    :title="student ? 'Edit Data Santri' : 'Tambah Santri Baru'"
    @close="close"
    maxWidth="4xl"
  >
    <form @submit.prevent="submit" class="space-y-6">
      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click.prevent="currentTab = tab.id"
            :class="[
              currentTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            ]"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Tab Content: Data Pribadi -->
      <div
        v-show="currentTab === 'pribadi'"
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <!-- Nama Lengkap -->
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700"
            >Nama Lengkap <span class="text-red-500">*</span></label
          >
          <input
            v-model="form.nama_lengkap"
            type="text"
            class="input-field mt-1"
            required
          />
        </div>

        <!-- NISN & NIK -->
        <div>
          <label class="block text-sm font-medium text-gray-700">NISN</label>
          <input v-model="form.nisn" type="text" class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">NIK</label>
          <input v-model="form.nik" type="text" class="input-field mt-1" />
        </div>

        <!-- Gender & Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Jenis Kelamin</label
          >
          <select v-model="form.jenis_kelamin" class="input-field mt-1">
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Status Periode</label
          >
          <select v-model="form.status_periode" class="input-field mt-1">
            <option value="Baru">Baru</option>
            <option value="Pindahan">Pindahan</option>
            <option value="Lulus">Lulus</option>
            <option value="Keluar">Keluar</option>
          </select>
        </div>

        <!-- TTL -->
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Tempat Lahir</label
          >
          <input
            v-model="form.tempat_lahir"
            type="text"
            class="input-field mt-1"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Tanggal Lahir</label
          >
          <input
            v-model="form.tanggal_lahir"
            type="date"
            class="input-field mt-1"
          />
        </div>

        <!-- Kontak -->
        <div>
          <label class="block text-sm font-medium text-gray-700">No. HP</label>
          <input
            v-model="form.no_hp"
            type="text"
            class="input-field mt-1"
            placeholder="08..."
          />
        </div>
      </div>

      <!-- Tab Content: Alamat -->
      <div v-show="currentTab === 'alamat'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Alamat Lengkap</label
          >
          <textarea
            v-model="form.alamat"
            rows="3"
            class="input-field mt-1"
          ></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">RT</label>
            <input v-model="form.rt" type="text" class="input-field mt-1" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">RW</label>
            <input v-model="form.rw" type="text" class="input-field mt-1" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Desa/Kelurahan</label
            >
            <input
              v-model="form.desa_kelurahan"
              type="text"
              class="input-field mt-1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Kecamatan</label
            >
            <input
              v-model="form.kecamatan"
              type="text"
              class="input-field mt-1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Kabupaten/Kota</label
            >
            <input
              v-model="form.kabupaten_kota"
              type="text"
              class="input-field mt-1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Provinsi</label
            >
            <input
              v-model="form.provinsi"
              type="text"
              class="input-field mt-1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Kode Pos</label
            >
            <input
              v-model="form.kode_pos"
              type="text"
              class="input-field mt-1"
            />
          </div>
        </div>
      </div>

      <!-- Tab Content: Orang Tua -->
      <div
        v-show="currentTab === 'ortu'"
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <!-- Ayah -->
        <h4 class="col-span-2 font-medium text-gray-900 border-b pb-2">
          Data Ayah
        </h4>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Nama Ayah</label
          >
          <input
            v-model="form.nama_ayah"
            type="text"
            class="input-field mt-1"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >NIK Ayah</label
          >
          <input v-model="form.nik_ayah" type="text" class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Pekerjaan Ayah</label
          >
          <input
            v-model="form.pekerjaan_ayah"
            type="text"
            class="input-field mt-1"
          />
        </div>

        <!-- Ibu -->
        <h4 class="col-span-2 font-medium text-gray-900 border-b pb-2 mt-4">
          Data Ibu
        </h4>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Nama Ibu</label
          >
          <input v-model="form.nama_ibu" type="text" class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">NIK Ibu</label>
          <input v-model="form.nik_ibu" type="text" class="input-field mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Pekerjaan Ibu</label
          >
          <input
            v-model="form.pekerjaan_ibu"
            type="text"
            class="input-field mt-1"
          />
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="close">
        Batal
      </button>
      <button
        type="button"
        class="btn btn-primary flex items-center gap-2"
        @click="submit"
        :disabled="loading"
      >
        <SvgIcon v-if="!loading" name="save" :size="18" />
        <span
          v-else
          class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
        ></span>
        {{ student ? "Simpan Perubahan" : "Simpan" }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, reactive, watch, computed } from "vue";
import Modal from "@/components/ui/Modal.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import api from "@/api";
import { useToastStore } from "@/stores/toast";

const props = defineProps({
  modelValue: Boolean,
  student: Object,
});

const emit = defineEmits(["update:modelValue", "saved"]);

const loading = ref(false);
const currentTab = ref("pribadi");
const toast = useToastStore();

const tabs = [
  { id: "pribadi", name: "Data Pribadi" },
  { id: "alamat", name: "Alamat" },
  { id: "ortu", name: "Orang Tua" },
  // { id: 'dokumen', name: 'Dokumen' }, // Add later
];

const initialForm = {
  nama_lengkap: "",
  nisn: "",
  nik: "",
  jenis_kelamin: "Laki-laki",
  status_periode: "Baru",
  tempat_lahir: "",
  tanggal_lahir: "",
  no_hp: "",
  alamat: "",
  rt: "",
  rw: "",
  desa_kelurahan: "",
  kecamatan: "",
  kabupaten_kota: "",
  provinsi: "",
  kode_pos: "",
  nama_ayah: "",
  nik_ayah: "",
  pekerjaan_ayah: "",
  nama_ibu: "",
  nik_ibu: "",
  pekerjaan_ibu: "",
};

const form = reactive({ ...initialForm });

watch(
  () => props.student,
  (newVal) => {
    if (newVal) {
      Object.assign(form, newVal);
    } else {
      Object.assign(form, initialForm);
    }
  },
  { immediate: true },
);

const close = () => {
  emit("update:modelValue", false);
};

const submit = async () => {
  loading.value = true;
  try {
    let response;
    if (props.student) {
      response = await api.put(`/students/${props.student.id}`, form);
    } else {
      response = await api.post("/students", form);
    }
    emit("saved", response.data);
    close();
    toast.success("Data berhasil disimpan");
  } catch (error) {
    console.error(error);
    toast.error("Gagal menyimpan data");
  } finally {
    loading.value = false;
  }
};
</script>
