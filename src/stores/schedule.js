import { defineStore } from 'pinia';
import api from '@/api';

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchSchedules(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/schedules', { params });
        this.schedules = response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Gagal memuat jadwal';
        console.error('Fetch schedules error:', error);
      } finally {
        this.loading = false;
      }
    },

    async createSchedule(data) {
      this.loading = true;
      try {
        await api.post('/schedules', data);
        // Refresh list if needed, or let component handle it
      } catch (error) {
        throw error.response?.data?.error || 'Gagal membuat jadwal';
      } finally {
        this.loading = false;
      }
    },

    async updateSchedule(id, data) {
      this.loading = true;
      try {
        await api.put(`/schedules/${id}`, data);
      } catch (error) {
        throw error.response?.data?.error || 'Gagal memperbarui jadwal';
      } finally {
        this.loading = false;
      }
    },

    async deleteSchedule(id, type = 'formal') {
      this.loading = true;
      try {
        await api.delete(`/schedules/${id}`, { params: { type } });
        // Remove from local state
        this.schedules = this.schedules.filter(s => s.id !== id);
      } catch (error) {
        throw error.response?.data?.error || 'Gagal menghapus jadwal';
      } finally {
        this.loading = false;
      }
    }
  }
});
