import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api';
import { useAuthStore } from './auth';
import { useToastStore } from './toast';

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref([]);
    const isConnected = ref(false);
    const eventSource = ref(null);
    const authStore = useAuthStore();
    const toastStore = useToastStore();
    let reconnectTimer = null;
    let reconnectAttempt = 0;
    const maxReconnectAttempts = 8;
    let initialized = false;

    const unreadCount = computed(() => 
        notifications.value.filter(n => !n.is_read).length
    );

    const scheduleReconnect = () => {
        if (reconnectTimer || !authStore.isAuthenticated) return;
        if (reconnectAttempt >= maxReconnectAttempts) return;
        const delay = Math.min(30000, 2000 * Math.max(1, reconnectAttempt));
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connectSSE();
        }, delay);
    };

    const buildSSEURL = async () => {
        if (!authStore.accessToken) return null;

        try {
            const { data } = await api.post('/notifications/stream/ticket');
            const ticket = data.ticket;
            if (!ticket) return null;

            const apiBase = import.meta.env.VITE_API_URL;
            if (apiBase) {
                const base = apiBase.replace(/\/$/, '');
                return `${base}/notifications/stream?ticket=${encodeURIComponent(ticket)}`;
            }
            return `/api/notifications/stream?ticket=${encodeURIComponent(ticket)}`;
        } catch (e) {
            console.error('Failed to get SSE ticket', e);
            return null;
        }
    };

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

    const connectSSE = async () => {
        if (eventSource.value || isConnected.value) return;

        const url = await buildSSEURL();
        if (!url) return;

        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        if (eventSource.value) {
            eventSource.value.close();
            eventSource.value = null;
        }

        eventSource.value = new EventSource(url, { withCredentials: true });

        eventSource.value.onopen = () => {
            isConnected.value = true;
            reconnectAttempt = 0;
        };

        eventSource.value.onmessage = (event) => {
            try {
                const newNotif = JSON.parse(event.data);
                const exists = notifications.value.some(n => n.id === newNotif.id);
                if (!exists) {
                    notifications.value.unshift(newNotif);
                    if (!newNotif.is_read) {
                        toastStore.info(newNotif.title || 'Notifikasi baru');
                    }
                }
                
            } catch (e) {
                console.error('Error parsing SSE message', e);
            }
        };

        eventSource.value.onerror = (err) => {
            console.error('SSE Error', err);
            isConnected.value = false;

            // Stop current stream instance to prevent native infinite retry loops.
            if (eventSource.value) {
                eventSource.value.close();
                eventSource.value = null;
            }

            // Only reconnect if token is still present (in-memory check, no API call).
            if (!authStore.accessToken || !authStore.isAuthenticated) {
                disconnectSSE();
                return;
            }

            reconnectAttempt += 1;
            scheduleReconnect();
        };
    };

    const disconnectSSE = () => {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        if (eventSource.value) {
            eventSource.value.close();
            eventSource.value = null;
        }
        isConnected.value = false;
        reconnectAttempt = 0;
        initialized = false;
    };

    const initialize = async () => {
        if (!authStore.isAuthenticated) return;
        if (initialized) return;
        initialized = true;
        await fetchRecent();
        connectSSE();
    };

    return {
        notifications,
        unreadCount,
        isConnected,
        fetchRecent,
        markAsRead,
        connectSSE,
        disconnectSSE,
        initialize
    };
});
