import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api';
import { useAuthStore } from './auth';

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref([]);
    const isConnected = ref(false);
    const eventSource = ref(null);
    const authStore = useAuthStore();

    const unreadCount = computed(() => 
        notifications.value.filter(n => !n.is_read).length
    );

    const fetchRecent = async () => {
        try {
            const { data } = await api.get('/notifications?limit=10');
            notifications.value = data.data;
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const markAsRead = async (id = 'all') => {
        try {
            await api.put(`/notifications/${id}/read`);
            if (id === 'all') {
                notifications.value.forEach(n => n.is_read = true);
            } else {
                const notif = notifications.value.find(n => n.id === id);
                if (notif) notif.is_read = true;
            }
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const connectSSE = () => {
        if (isConnected.value || !authStore.token) return;

        // Use native EventSource
        // Note: Standard EventSource doesn't support custom headers easily.
        // We generally pass token via query param or use a polyfill if headers are strictly required.
        // For simplicity in this protected internal app, we might check if cookie auth works
        // OR we just use query param `?token=...` if backend supports it.
        // Let's assume standard Authorization header injection via a polyfill or 
        // passing it in URL for this MVP (less secure but functional for now).
        // EDIT: Fiber middleware checks Authorization header. Native EventSource CANNOT send headers.
        // Better approach: Use a library 'event-source-polyfill' OR
        // append token to URL: `/api/notifications/stream?token=${token}`
        
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/notifications/stream?token=${authStore.token}`;
        
        eventSource.value = new EventSource(url);

        eventSource.value.onopen = () => {
            isConnected.value = true;
            console.log('SSE Connected');
        };

        eventSource.value.onmessage = (event) => {
            try {
                const newNotif = JSON.parse(event.data);
                notifications.value.unshift(newNotif);
                
                // Show browser notification or toast here if needed
                // const audio = new Audio('/notification.mp3');
                // audio.play().catch(e => {}); // Play sound if user interacted
            } catch (e) {
                console.error('Error parsing SSE message', e);
            }
        };

        eventSource.value.onerror = (err) => {
            console.error('SSE Error', err);
            eventSource.value?.close();
            isConnected.value = false;
            // Retry logic could go here
            setTimeout(connectSSE, 5000);
        };
    };

    const disconnectSSE = () => {
        if (eventSource.value) {
            eventSource.value.close();
            eventSource.value = null;
            isConnected.value = false;
        }
    };

    return {
        notifications,
        unreadCount,
        isConnected,
        fetchRecent,
        markAsRead,
        connectSSE,
        disconnectSSE
    };
});
