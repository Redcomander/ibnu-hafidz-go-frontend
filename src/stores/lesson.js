import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api';

export const useLessonStore = defineStore('lesson', () => {
    const lessons = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const fetchLessons = async (type = '') => {
        loading.value = true;
        error.value = null;
        try {
            const url = type ? `/lessons?type=${type}` : '/lessons';
            const { data } = await api.get(url);
            lessons.value = data;
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch lessons';
            console.error(err);
        } finally {
            loading.value = false;
        }
    };

    const createLesson = async (lessonData) => {
        loading.value = true;
        try {
            const { data } = await api.post('/lessons', lessonData);
            lessons.value.push(data);
            return data;
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to create lesson';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const updateLesson = async (id, lessonData) => {
        loading.value = true;
        try {
            const { data } = await api.put(`/lessons/${id}`, lessonData);
            const index = lessons.value.findIndex(l => l.id === id);
            if (index !== -1) {
                lessons.value[index] = data;
            }
            return data;
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to update lesson';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const deleteLesson = async (id, type = 'formal') => {
        loading.value = true;
        try {
            await api.delete(`/lessons/${id}?type=${type}`);
            lessons.value = lessons.value.filter(l => l.id !== id);
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to delete lesson';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return {
        lessons,
        loading,
        error,
        fetchLessons,
        createLesson,
        updateLesson,
        deleteLesson
    };
});
