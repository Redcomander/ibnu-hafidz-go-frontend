import { defineStore } from 'pinia';
import api from '@/api';
import { useToastStore } from './toast';

export const useAbsensiStore = defineStore('absensi', {
  state: () => ({
    attendanceData: null, // { date, students: [], assigned_teacher_id, substitute_teacher_id }
    loading: false,
    submitting: false,
  }),

  actions: {
    async fetchAttendance(jadwalId, date, type = 'formal') {
      this.loading = true;
      try {
        const response = await api.get('/attendance', {
          params: { jadwal_id: jadwalId, date, type }
        });
        this.attendanceData = response.data;
        return response.data;
      } catch (error) {
        useToastStore().error(error.response?.data?.error || 'Gagal memuat data absensi');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async submitAttendance(payload) {
        this.submitting = true;
        try {
            await api.post('/attendance', payload);
            useToastStore().success('Absensi santri berhasil disimpan');
        } catch (error) {
            useToastStore().error(error.response?.data?.error || 'Gagal menyimpan absensi');
            throw error;
        } finally {
            this.submitting = false;
        }
    },

    async submitTeacherAttendance(payload) {
        this.submitting = true;
        try {
            // Payload is FormData
            await api.post('/attendance/teacher', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            useToastStore().success('Absensi guru berhasil disimpan');
        } catch (error) {
            useToastStore().error(error.response?.data?.error || 'Gagal menyimpan absensi guru');
            throw error;
        } finally {
            this.submitting = false;
        }
    },

    async assignSubstitute(payload) {
        this.submitting = true;
        try {
            await api.post('/attendance/substitute', payload);
            useToastStore().success('Guru pengganti berhasil ditetapkan');
        } catch (error) {
            useToastStore().error(error.response?.data?.error || 'Gagal menetapkan guru pengganti');
            throw error;
        } finally {
            this.submitting = false;
        }
    }
  }
});
