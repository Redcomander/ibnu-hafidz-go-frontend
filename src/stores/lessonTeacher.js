import { defineStore } from 'pinia';
import api from '@/api';

export const useLessonTeacherStore = defineStore('lessonTeacher', {
    state: () => ({
        assignments: [],
        loading: false,
        error: null,
    }),

    actions: {
        async fetchAssignmentsByLesson(lessonId, type = 'formal') {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get(`/lessons/${lessonId}/assignments`, { params: { type } });
                this.assignments = response.data;
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to fetch assignments';
                console.error(err);
            } finally {
                this.loading = false;
            }
        },

        async assignToLesson(lessonId, classId, teacherId, type = 'formal') {
            this.loading = true;
            try {
                const payload = { 
                    kelas_id: classId, 
                    teacher_id: teacherId,
                    type 
                };
                await api.post(`/lessons/${lessonId}/assignments`, payload);
                await this.fetchAssignmentsByLesson(lessonId, type); // Refresh list
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to assign teacher';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async unassignTeacher(assignmentId, type = 'formal') {
            this.loading = true;
            try {
                // Using the specific lesson assignment delete route
                await api.delete(`/lessons/assignments/${assignmentId}`, { params: { type } });
                this.assignments = this.assignments.filter(a => a.id !== assignmentId);
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to remove assignment';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        // Legacy/Class-centric actions (Optional: keep if needed for migration safely)
        async fetchAssignments(classId, type = 'formal') {
             // ... existing logic if still used temporarily
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get(`/kelas/${classId}/teachers`, { params: { type } });
                this.assignments = response.data;
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to fetch assignments';
                console.error(err);
            } finally {
                this.loading = false;
            }
        },
    }
});
