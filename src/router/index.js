import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { applySeoMetadata, nonPublicSeo, publicSeo } from '@/utils/seo'

const routes = [
  // ---- Public Pages ----
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'public-home',
        component: () => import('@/views/public/PublicWelcomeView.vue'),
        meta: { title: 'Beranda Ibnu Hafidz', seo: publicSeo.home },
      },
      {
        path: 'profil',
        name: 'public-profil',
        component: () => import('@/views/public/PublicProfileView.vue'),
        meta: { title: 'Profil Ibnu Hafidz', seo: publicSeo.profile },
      },
      {
        path: 'galeri-prestasi',
        name: 'public-prestasi',
        component: () => import('@/views/public/PublicPrestasiView.vue'),
        meta: { title: 'Galeri Prestasi', seo: publicSeo.home },
      },
      {
        path: 'gallery/photo',
        name: 'public-gallery-photo',
        component: () => import('@/views/public/PublicGalleryPhotoView.vue'),
        meta: { title: 'Galeri Foto', seo: publicSeo.home },
      },
      {
        path: 'gallery/video',
        name: 'public-gallery-video',
        component: () => import('@/views/public/PublicGalleryVideoView.vue'),
        meta: { title: 'Galeri Video', seo: publicSeo.home },
      },
      {
        path: 'all-article',
        name: 'public-articles-all',
        component: () => import('@/views/public/PublicArticleAllView.vue'),
        meta: { title: 'Semua Artikel', seo: publicSeo.home },
      },
      {
        path: 'berita/:slug',
        name: 'public-article-detail',
        component: () => import('@/views/public/PublicArticleDetailView.vue'),
        meta: { title: 'Detail Artikel', seo: publicSeo.home },
      },
      {
        path: 'kedatangan/:token',
        name: 'public-arrivals-form',
        component: () => import('@/views/public/PublicArrivalFormView.vue'),
        meta: { title: 'Form Kedatangan', seo: publicSeo.home },
      },
      {
        path: 'absen-kedatangan/:token',
        name: 'public-arrivals-form-legacy',
        component: () => import('@/views/public/PublicArrivalFormView.vue'),
        meta: { title: 'Form Kedatangan', seo: publicSeo.home },
      },
    ],
  },

  // ---- Auth (public) ----
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true, title: 'Login', seo: { ...nonPublicSeo, title: 'Login' } },
  },

  // ---- Admin (protected) ----
  {
    path: '/dashboard',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, seo: nonPublicSeo },
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
        path: 'users/activity-logs',
        name: 'users-activity-logs',
        component: () => import('@/views/users/ActivityLogView.vue'),
        meta: { permission: 'users.view', title: 'Log Aktivitas Pengguna' },
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
        meta: { title: 'Jadwal Formal' },
      },
      {
        path: 'jadwal-ramadhan',
        name: 'schedule-ramadhan',
        component: () => import('@/views/academic/ScheduleList.vue'),
        meta: { title: 'Jadwal Ramadhan' },
      },
      {
        path: 'absensi/statistik',
        name: 'attendance-formal',
        component: () => import('@/views/attendance/AttendanceHistory.vue'),
        meta: { permission: 'absensi.view', title: 'Riwayat Absensi Formal' },
      },
      {
        path: 'absensi-ramadhan/statistik',
        name: 'attendance-ramadhan',
        component: () => import('@/views/attendance/AttendanceHistory.vue'),
        meta: { permission: 'absensi.view', title: 'Riwayat Absensi Ramadhan' },
      },
      {
        path: 'absensi/guru',
        name: 'attendance-guru-formal',
        component: () => import('@/views/attendance/TeacherAttendanceStats.vue'),
        meta: { permission: 'absensi.view', title: 'Rekapan Guru Formal' },
      },
      {
        path: 'absensi-ramadhan/guru',
        name: 'attendance-guru-ramadhan',
        component: () => import('@/views/attendance/TeacherAttendanceStats.vue'),
        meta: { permission: 'absensi.view', title: 'Rekapan Guru Ramadhan' },
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
        meta: { title: 'Jadwal Diniyyah' },
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
        meta: { title: 'Halaqoh' },
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
      {
        path: 'arrivals',
        name: 'arrivals-dashboard',
        component: () => import('@/views/arrivals/ArrivalDashboardView.vue'),
        meta: { permission: 'dashboard.view', title: 'Kedatangan Harian' },
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
        path: 'galeri',
        name: 'gallery',
        component: () => import('@/views/gallery/GalleryList.vue'),
        meta: { permission: 'gallery.view', title: 'Galeri' },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { title: 'Pengaturan' },
      },
      {
        path: 'sidebar-menu-settings',
        name: 'sidebar-menu-settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { title: 'Pengaturan Sidebar', roles: ['super_admin'] },
      },
    ],
  },

  // ---- 404 ----
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: 'Halaman Tidak Ditemukan',
      seo: {
        ...nonPublicSeo,
        title: 'Halaman Tidak Ditemukan',
        description: 'Halaman yang Anda tuju tidak tersedia di situs Ibnu Hafidz.',
      },
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Allow refresh retries with a short cooldown to avoid redirect loops
let refreshPromise = null
let lastRefreshAttemptAt = 0
const REFRESH_COOLDOWN_MS = 15000

// Navigation guard — auth + permission checking
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // Try to restore session when required, but throttle attempts.
  if (!auth.isAuthenticated && !to.meta.guest) {
    const now = Date.now()
    const canRetry = now-lastRefreshAttemptAt >= REFRESH_COOLDOWN_MS

    if (!refreshPromise && canRetry) {
      lastRefreshAttemptAt = now
      refreshPromise = auth.tryRefresh().finally(() => {
        refreshPromise = null
      })
    }

    if (refreshPromise) {
      await refreshPromise
    }
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

  // Role check (if route requires specific role)
  if (to.meta.roles && Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
    const hasRequiredRole = (auth.userRoles || []).some((role) => to.meta.roles.includes(role.name))
    if (!hasRequiredRole) {
      return next({ name: 'dashboard' })
    }
  }

  applySeoMetadata(
    to.meta.seo || {
      ...nonPublicSeo,
      title: to.meta.title || nonPublicSeo.title,
      url: to.fullPath,
      canonical: to.path,
    },
  )

  next()
})

export default router
