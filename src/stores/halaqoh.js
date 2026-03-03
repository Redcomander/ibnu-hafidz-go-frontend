import { defineStore } from 'pinia'
import api from '@/api'

export const useHalaqohStore = defineStore('halaqoh', {
  state: () => ({
    groups: [],
    badges: [],           // student + teacher attendance badges per teacher
    substituteInfos: [],  // substitute info per teacher
    accessInfos: [],      // access control per teacher
    sessionTimes: [],     // session time windows from backend
    currentUserId: null,
    selectedDate: new Date().toISOString().slice(0, 10),
    canFilterByDate: false,
    loading: false,
    error: null,

    // Attendance form
    attendanceData: null,

    // Teacher attendance form
    teacherAttendanceData: null,

    // History
    studentHistory: { data: [], total: 0, page: 1, per_page: 15, total_pages: 0 },
    teacherHistory: { data: [], total: 0, page: 1, per_page: 15, total_pages: 0 },

    // Statistics
    studentStats: null,
    teacherStats: null,
  }),

  actions: {
    // ── Assignments ──────────────────────────────────────
    async fetchAssignments(date = null) {
      this.loading = true
      this.error = null
      try {
        const params = {}
        if (date) params.date = date
        const { data } = await api.get('/halaqoh/assignments', { params })
        this.groups = data.groups || []
        this.badges = data.badges || []
        this.substituteInfos = data.substitute_infos || []
        this.accessInfos = data.access_infos || []
        this.sessionTimes = data.session_times || []
        this.currentUserId = data.current_user_id
        this.canFilterByDate = data.can_filter_by_date
        this.selectedDate = data.selected_date
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to load assignments'
        throw err
      } finally {
        this.loading = false
      }
    },

    async createAssignment(payload) {
      const { data } = await api.post('/halaqoh/assignments', payload)
      return data
    },

    async updateAssignment(teacherId, payload) {
      const { data } = await api.put(`/halaqoh/assignments/${teacherId}`, payload)
      return data
    },

    async deleteAssignment(id) {
      const { data } = await api.delete(`/halaqoh/assignments/${id}`)
      return data
    },

    async deleteAssignmentsByTeacher(teacherId) {
      const { data } = await api.delete(`/halaqoh/assignments/teacher/${teacherId}`)
      return data
    },

    // ── Substitute ──────────────────────────────────────
    async assignSubstitute(assignmentId, payload) {
      const { data } = await api.post(`/halaqoh/assignments/${assignmentId}/substitute`, payload)
      return data
    },

    async unassignSubstitute(assignmentId, payload) {
      const { data } = await api.delete(`/halaqoh/assignments/${assignmentId}/substitute`, { data: payload })
      return data
    },

    // ── Student Attendance ──────────────────────────────
    async fetchAttendance(assignmentId, date = null) {
      const params = {}
      if (date) params.date = date
      const { data } = await api.get(`/halaqoh/attendance/${assignmentId}`, { params })
      this.attendanceData = data
      return data
    },

    async submitSessionAttendance(session, payload) {
      const { data } = await api.post(`/halaqoh/attendance/session/${session}`, payload)
      return data
    },

    // ── Teacher Attendance ──────────────────────────────
    async fetchTeacherAttendance(assignmentId, date = null) {
      const params = {}
      if (date) params.date = date
      const { data } = await api.get(`/halaqoh/teacher-attendance/${assignmentId}`, { params })
      this.teacherAttendanceData = data
      return data
    },

    async submitTeacherAttendance(assignmentId, session, formData) {
      const { data } = await api.post(
        `/halaqoh/teacher-attendance/${assignmentId}/session/${session}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },

    // ── History ──────────────────────────────────────────
    async fetchStudentHistory(params = {}) {
      const { data } = await api.get('/halaqoh/history/students', { params })
      this.studentHistory = data
      return data
    },

    async fetchTeacherHistory(params = {}) {
      const { data } = await api.get('/halaqoh/history/teachers', { params })
      this.teacherHistory = data
      return data
    },

    // ── Statistics ───────────────────────────────────────
    async fetchStudentStats(params = {}) {
      const { data } = await api.get('/halaqoh/statistics/students', { params })
      this.studentStats = data
      return data
    },

    async fetchTeacherStats(params = {}) {
      const { data } = await api.get('/halaqoh/statistics/teachers', { params })
      this.teacherStats = data
      return data
    },
  },
})
