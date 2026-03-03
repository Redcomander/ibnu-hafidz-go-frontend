import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // ---- Auth (public) ----
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true },
  },

  // ---- Admin (protected) ----
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { permission: 'dashboard.view', title: 'Dashboard' },
      },
      {
        path: 'students',
        name: 'students',
        component: () => import('@/views/students/StudentList.vue'),
        meta: { permission: 'students.view', title: 'Data Santri' },
      },
      {
        path: 'students/:id',
        name: 'student-detail',
        component: () => import('@/views/students/StudentDetail.vue'),
        meta: { permission: 'students.view', title: 'Detail Santri' },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/users/UserList.vue'),
        meta: { permission: 'users.view', title: 'Data Guru' },
      },
      {
        path: 'roles',
        name: 'roles',
        component: () => import('@/views/roles/RoleList.vue'),
        meta: { permission: 'roles.view', title: 'Role & Permissions' },
      },
      {
        path: 'kamar',
        name: 'kamar',
        component: () => import('@/views/kamar/KamarList.vue'),
        meta: { permission: 'kamar.view', title: 'Data Kamar' },
      },
      {
        path: 'kelas',
        name: 'kelas',
        component: () => import('@/views/kelas/KelasList.vue'),
        meta: { permission: 'kelas.view', title: 'Data Kelas' },
      },
      {
        path: 'kelas/:id',
        name: 'kelas-detail',
        component: () => import('@/views/kelas/KelasDetail.vue'),
        meta: { permission: 'kelas.view', title: 'Detail Kelas' },
      },
      // ---- Academic (Formal) ----
      {
        path: 'lessons',
        name: 'lessons-formal',
        component: () => import('@/views/academic/LessonsList.vue'),
        meta: { permission: 'lessons.view', title: 'Pelajaran Formal' },
      },
      {
        path: 'jadwal-formal',
        name: 'schedule-formal',
        component: () => import('@/views/academic/ScheduleList.vue'),
        meta: { permission: 'jadwal_formal.view', title: 'Jadwal Formal' },
      },
      {
        path: 'absensi/statistik',
        name: 'attendance-formal',
        component: () => import('@/views/attendance/AttendanceHistory.vue'),
        meta: { permission: 'absensi.view', title: 'Riwayat Absensi Formal' },
      },
      {
        path: 'absensi/guru',
        name: 'attendance-guru-formal',
        component: () => import('@/views/attendance/TeacherAttendanceStats.vue'),
        meta: { permission: 'absensi.view', title: 'Rekapan Guru Formal' },
      },
      // ---- Academic (Diniyyah) ----
      {
        path: 'diniyyah-lesson',
        name: 'lessons-diniyyah',
        component: () => import('@/views/academic/LessonsList.vue'),
        meta: { permission: 'diniyyah_lesson.view', title: 'Pelajaran Diniyyah' },
      },
      {
        path: 'jadwal-diniyyah',
        name: 'schedule-diniyyah',
        component: () => import('@/views/academic/ScheduleList.vue'),
        meta: { permission: 'jadwal_diniyyah.view', title: 'Jadwal Diniyyah' },
      },
      {
        path: 'absensi-diniyyah/statistik',
        name: 'attendance-diniyyah',
        component: () => import('@/views/attendance/AttendanceHistory.vue'),
        meta: { permission: 'absensi_diniyyah.view', title: 'Riwayat Absensi Diniyyah' },
      },
      {
        path: 'absensi-diniyyah/guru',
        name: 'attendance-guru-diniyyah',
        component: () => import('@/views/attendance/TeacherAttendanceStats.vue'),
        meta: { permission: 'absensi_diniyyah.view', title: 'Rekapan Guru Diniyyah' },
      },
      // ---- Halaqoh ----
      {
        path: 'halaqoh-assignments',
        name: 'halaqoh-assignments',
        component: () => import('@/views/halaqoh/HalaqohList.vue'),
        meta: { permission: 'halaqoh.view', title: 'Halaqoh' },
      },
      {
        path: 'halaqoh/statistik/santri',
        name: 'attendance-halaqoh',
        component: () => import('@/views/halaqoh/HalaqohStudentStats.vue'),
        meta: { permission: 'halaqoh.view', title: 'Rekapan Halaqoh Santri' },
      },
      {
        path: 'halaqoh/statistik/guru',
        name: 'attendance-guru-halaqoh',
        component: () => import('@/views/halaqoh/HalaqohTeacherStats.vue'),
        meta: { permission: 'halaqoh.view', title: 'Rekapan Halaqoh Guru' },
      },
      // ---- Absensi Ekstra ----
      {
        path: 'absensi-ekstra',
        name: 'absensi-ekstra',
        component: () => import('@/views/attendance/AbsensiEkstraList.vue'),
        meta: { title: 'Absensi Ekstra' },
      },
      {
        path: 'absensi-ekstra/:id',
        name: 'absensi-ekstra-detail',
        component: () => import('@/views/attendance/AbsensiEkstraDetail.vue'),
        meta: { title: 'Detail Grup Ekstra' },
      },
      {
        path: 'absensi-ekstra/:id/sessions/:session_id',
        name: 'absensi-ekstra-session',
        component: () => import('@/views/attendance/AbsensiEkstraSession.vue'),
        meta: { title: 'Sesi Kehadiran Ekstra' },
      },
      // ---- Prestasi ----
      {
        path: 'prestasi',
        name: 'prestasi',
        component: () => import('@/views/prestasi/PrestasiList.vue'),
        meta: { permission: 'prestasi.view', title: 'Prestasi' },
      },
      // ---- Laundry ----
      {
        path: 'laundry/vendors',
        name: 'laundry-vendors',
        component: () => import('@/views/laundry/VendorList.vue'),
        meta: { permission: 'laundry_accounts.view', title: 'Vendor Laundry' },
      },
      {
        path: 'laundry/accounts',
        name: 'laundry-accounts',
        component: () => import('@/views/laundry/AccountList.vue'),
        meta: { permission: 'laundry_accounts.view', title: 'Manajemen Akun Laundry' },
      },
      {
        path: 'laundry/accounts/trash',
        name: 'laundry-accounts-trash',
        component: () => import('@/views/laundry/AccountTrash.vue'),
        meta: { permission: 'laundry_accounts.delete', title: 'Tong Sampah Akun Laundry' },
      },
      {
        path: 'laundry/transactions',
        name: 'laundry-transactions',
        component: () => import('@/views/laundry/TransactionList.vue'),
        meta: { permission: 'laundry_accounts.view', title: 'Transaksi Laundry' },
      },
      {
        path: 'laundry/pickups',
        name: 'laundry-pickups',
        component: () => import('@/views/laundry/PickupList.vue'),
        meta: { permission: 'laundry_accounts.view', title: 'Pengambilan Laundry' },
      },
      // ---- Content & Prestasi ----
      {
        path: 'articles',
        name: 'articles',
        component: () => import('@/views/articles/ArticleList.vue'),
        meta: { permission: 'content.view', title: 'Berita & Artikel' },
      },
      {
        path: 'articles/create',
        name: 'article-create',
        component: () => import('@/views/articles/ArticleForm.vue'),
        meta: { permission: 'content.view', title: 'Tulis Artikel' },
      },
      {
        path: 'articles/:id/edit',
        name: 'article-edit',
        component: () => import('@/views/articles/ArticleForm.vue'),
        meta: { permission: 'content.view', title: 'Edit Artikel' },
      },
      {
        path: 'dashboard/galeri',
        name: 'gallery',
        component: () => import('@/views/gallery/GalleryList.vue'),
        meta: { permission: 'gallery.view', title: 'Galeri' },
      },
      {
        path: 'kelas/:id',
        name: 'kelas-detail',
        component: () => import('@/views/kelas/KelasDetail.vue'),
        meta: { permission: 'kelas.view', title: 'Detail Kelas' },
      },
    ],
  },

  // ---- 404 ----
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Track whether we've already tried to restore the session
let refreshAttempted = false

// Navigation guard — auth + permission checking
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // Try to restore session ONCE on first load (not on every navigation)
  if (!refreshAttempted && !auth.isAuthenticated && !to.meta.guest) {
    refreshAttempted = true
    await auth.tryRefresh()
  }

  // Guest-only pages (login) — redirect to dashboard if already authenticated
  if (to.meta.guest && auth.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  // Protected pages — redirect to login if not authenticated
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Permission check
  if (to.meta.permission && !auth.hasPermission(to.meta.permission)) {
    return next({ name: 'dashboard' }) // Redirect to dashboard if no permission
  }

  // Update page title
  document.title = to.meta.title
    ? `${to.meta.title} — Ibnu Hafidz`
    : 'Ibnu Hafidz — Sistem Manajemen Pesantren'

  next()
})

export default router
