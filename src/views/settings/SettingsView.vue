<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-primary-dark tracking-tight">Pengaturan Profil</h1>
      <p class="text-sm text-gray-500 mt-1">Kelola data akun dan keamanan akun Anda.</p>
    </div>

    <div class="glass-card p-6 rounded-xl border border-gray-100">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Profil</h2>

      <div class="mb-6 p-4 rounded-lg border border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="w-20 h-20 rounded-full overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
          <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="Avatar" class="w-full h-full object-cover" />
          <span v-else class="text-xl font-semibold text-gray-400">{{ (auth.user?.name || 'U').charAt(0).toUpperCase() }}</span>
        </div>

        <div class="flex-1">
          <p class="text-sm font-medium text-gray-700">Foto Profil</p>
          <p class="text-xs text-gray-500 mt-1">Format: JPG, PNG, WEBP. Maksimal 2MB.</p>
          <div class="mt-3 flex items-center gap-2">
            <input
              ref="avatarInput"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onAvatarSelected"
            />
            <button type="button" class="btn-secondary px-3 py-2" :disabled="uploadingAvatar" @click="triggerAvatarPick">
              Pilih Foto
            </button>
            <span v-if="uploadingAvatar" class="text-xs text-gray-500">Mengupload...</span>
          </div>
        </div>
      </div>

      <form @submit.prevent="saveProfile" class="space-y-4">
        <div>
          <label class="input-label">Nama Lengkap</label>
          <input v-model="form.name" type="text" class="input-field" required />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="input-label">Username</label>
            <input v-model="form.username" type="text" class="input-field" required />
          </div>
          <div>
            <label class="input-label">Email</label>
            <input v-model="form.email" type="email" class="input-field" required />
          </div>
        </div>

        <div class="border-t border-gray-100 pt-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Ganti Password (Opsional)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="input-label">Password Saat Ini</label>
              <input v-model="form.current_password" type="password" class="input-field" placeholder="Wajib jika ganti password" />
            </div>
            <div>
              <label class="input-label">Password Baru</label>
              <input v-model="form.new_password" type="password" class="input-field" placeholder="Minimal 6 karakter" minlength="6" />
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button :disabled="saving" class="btn-primary px-5 py-2.5">
            {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </form>
    </div>

    <div class="glass-card p-6 rounded-xl border border-red-200">
      <h2 class="text-lg font-semibold text-red-600 mb-2">Zona Berbahaya</h2>
      <p class="text-sm text-gray-600 mb-4">
        Menghapus akun akan menonaktifkan akses login akun ini.
      </p>

      <div class="space-y-3 max-w-md">
        <div>
          <label class="input-label">Konfirmasi Password</label>
          <input
            v-model="deletePassword"
            type="password"
            class="input-field"
            placeholder="Masukkan password saat ini"
          />
        </div>

        <button
          type="button"
          :disabled="deleting"
          @click="deleteAccount"
          class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
        >
          {{ deleting ? 'Menghapus...' : 'Hapus Akun Saya' }}
        </button>
      </div>
    </div>

    <div class="glass-card p-6 rounded-xl border border-amber-200">
      <h2 class="text-lg font-semibold text-amber-600 mb-2">Mode Ramadhan</h2>
      <p class="text-sm text-gray-600 mb-4">
        Aktifkan hanya saat periode Ramadhan untuk menyalakan fitur khusus Ramadhan.
      </p>
      <div class="flex items-center gap-3">
        <span class="badge" :class="ramadhanEnabled ? 'badge-success' : 'badge-secondary'">
          {{ ramadhanEnabled ? 'Aktif' : 'Nonaktif' }}
        </span>
        <button
          type="button"
          :disabled="togglingRamadhan"
          @click="toggleRamadhan"
          class="px-4 py-2 rounded-lg text-white transition"
          :class="ramadhanEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-amber-600 hover:bg-amber-700'"
        >
          {{ togglingRamadhan ? 'Memproses...' : ramadhanEnabled ? 'Deactivate' : 'Activate' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const auth = useAuthStore();
const toast = useToastStore();

const saving = ref(false);
const uploadingAvatar = ref(false);
const deleting = ref(false);
const deletePassword = ref('');
const ramadhanEnabled = ref(false);
const togglingRamadhan = ref(false);
const avatarInput = ref(null);
const avatarVersion = ref(0);

const form = reactive({
  name: '',
  username: '',
  email: '',
  current_password: '',
  new_password: '',
});

const fillFromAuth = () => {
  form.name = auth.user?.name || '';
  form.username = auth.user?.username || '';
  form.email = auth.user?.email || '';
  form.current_password = '';
  form.new_password = '';
};

const avatarPreviewUrl = computed(() => {
  const raw = auth.user?.foto_guru;
  if (!raw) return '';

  const value = String(raw).trim();
  if (!value) return '';

  let baseUrl = '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    baseUrl = value;
  } else if (value.startsWith('/uploads/')) {
    baseUrl = value;
  } else if (value.startsWith('uploads/')) {
    baseUrl = `/${value}`;
  } else if (value.startsWith('/')) {
    baseUrl = `/uploads/${value.replace(/^\/+/, '')}`;
  } else {
    baseUrl = `/uploads/${value.replace(/^\/+/, '')}`;
  }

  return `${baseUrl}?v=${avatarVersion.value}`;
});

onMounted(async () => {
  if (!auth.user) {
    await auth.fetchUser();
  }
  fillFromAuth();
  await fetchRamadhanFlag();
});

async function fetchRamadhanFlag() {
  try {
    const { data } = await api.get('/feature-flags/ramadhan');
    ramadhanEnabled.value = !!data?.is_enabled;
  } catch {
    ramadhanEnabled.value = false;
  }
}

async function toggleRamadhan() {
  togglingRamadhan.value = true;
  try {
    const { data } = await api.put('/feature-flags/ramadhan', {
      is_enabled: !ramadhanEnabled.value,
    });
    ramadhanEnabled.value = !!data?.is_enabled;
    toast.success(`Mode Ramadhan ${ramadhanEnabled.value ? 'diaktifkan' : 'dinonaktifkan'}`);
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal mengubah mode Ramadhan');
  } finally {
    togglingRamadhan.value = false;
  }
}

function triggerAvatarPick() {
  avatarInput.value?.click();
}

async function onAvatarSelected(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    toast.error('Ukuran avatar maksimal 2MB');
    event.target.value = '';
    return;
  }

  uploadingAvatar.value = true;
  try {
    const fd = new FormData();
    fd.append('avatar', file);
    const { data } = await api.post('/profile/avatar', fd);
    auth.user = data;
    avatarVersion.value = Date.now();
    toast.success('Avatar berhasil diperbarui');
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal upload avatar');
  } finally {
    uploadingAvatar.value = false;
    event.target.value = '';
  }
}

async function saveProfile() {
  saving.value = true;
  try {
    const payload = {
      name: form.name,
      username: form.username,
      email: form.email,
      current_password: form.current_password,
      new_password: form.new_password,
    };

    const { data } = await api.put('/profile', payload);
    auth.user = data;
    toast.success('Profil berhasil diperbarui');
    form.current_password = '';
    form.new_password = '';
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal memperbarui profil');
  } finally {
    saving.value = false;
  }
}

async function deleteAccount() {
  if (!deletePassword.value) {
    toast.error('Password saat ini wajib diisi');
    return;
  }

  const ok = window.confirm('Yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.');
  if (!ok) return;

  deleting.value = true;
  try {
    await api.delete('/profile', { data: { current_password: deletePassword.value } });
    toast.success('Akun berhasil dihapus');
    await auth.logout();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menghapus akun');
  } finally {
    deleting.value = false;
  }
}
</script>
