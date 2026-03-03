<template>
  <div
    class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fade-in"
  >
    <div class="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
      <h3 class="font-bold text-gray-800 text-sm">Notifikasi</h3>
      <button
        @click="store.markAsRead('all')"
        class="text-xs text-primary hover:text-primary-dark transition"
      >
        Tandai semua dibaca
      </button>
    </div>

    <div class="max-h-80 overflow-y-auto">
      <div v-if="store.notifications.length === 0" class="px-4 py-8 text-center text-gray-400 text-sm">
        Tidak ada notifikasi baru
      </div>

      <div
        v-for="notif in store.notifications"
        :key="notif.id"
        @click="handleClick(notif)"
        :class="[
          'px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition',
          !notif.is_read ? 'bg-blue-50/50' : ''
        ]"
      >
        <div class="flex gap-3">
          <div
            :class="[
              'w-2 h-2 mt-1.5 rounded-full flex-shrink-0',
              !notif.is_read ? 'bg-primary' : 'bg-gray-300'
            ]"
          ></div>
          <div class="flex-1">
            <h4 :class="['text-sm', !notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600']">
              {{ notif.title }}
            </h4>
            <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {{ notif.message }}
            </p>
            <span class="text-[10px] text-gray-400 mt-1 block">
              {{ formatTime(notif.created_at) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notification';
import { useRouter } from 'vue-router';

const store = useNotificationStore();
const router = useRouter();

const handleClick = async (notif) => {
  if (!notif.is_read) {
    await store.markAsRead(notif.id);
  }
  if (notif.action_url) {
    router.push(notif.action_url);
  }
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
  return date.toLocaleDateString('id-ID');
};
</script>
