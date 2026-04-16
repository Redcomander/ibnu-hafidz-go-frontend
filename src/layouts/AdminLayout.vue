<template>
  <div :class="['min-h-screen', theme.isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-slate-900']">
    <!-- Sidebar -->
    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ease-out shadow-xl border-r border-white/10',
        // Mobile: translate
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0',
        // Generic width (mobile)
        'w-64',
        // Desktop width
        collapsed ? 'md:w-20' : 'md:w-64',
      ]"
      style="background: var(--bg-sidebar)"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <img
          src="/logo_putih.png"
          alt="Logo"
          class="w-10 h-10 object-contain flex-shrink-0"
        />
        <transition name="fade">
          <span
            v-if="!collapsed"
            class="text-white text-sm font-semibold leading-tight font-sans tracking-wide"
          >
            Ibnu Hafidz
          </span>
        </transition>
      </div>

      <!-- Nav Items -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <template v-for="(item, index) in visibleNavItems" :key="index">
          <!-- Header -->
          <div v-if="item.header" class="px-4 mt-6 mb-2 first:mt-2">
             <transition name="fade">
                <span v-if="!collapsed" class="text-xs font-bold text-white/40 uppercase tracking-wider">
                  {{ item.header }}
                </span>
                <div v-else class="h-px bg-white/10 w-full mx-auto my-2"></div>
             </transition>
          </div>

          <!-- Link -->
          <router-link
            v-else
            :to="item.to"
            custom
            v-slot="{ isExactActive, navigate }"
          >
            <div
              @click="navigate"
              :class="[
                'sidebar-nav-item',
                { active: isNavActive(item, isExactActive) },
              ]"
              :title="collapsed ? item.label : ''"
            >
              <SvgIcon :name="item.icon" :size="20" class="flex-shrink-0" />
              <transition name="fade">
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
              </transition>
            </div>
          </router-link>
        </template>
      </nav>

      <!-- Collapse toggle -->
      <!-- Collapse toggle (Desktop Only) -->
      <button
        @click="collapsed = !collapsed"
        class="hidden md:block p-3 text-white/50 hover:text-white hover:bg-white/10 transition-colors text-center"
      >
        <SvgIcon
          :name="collapsed ? 'chevron-right' : 'chevron-left'"
          :size="18"
        />
      </button>

      <!-- User section -->
      <div class="border-t border-white/10 p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-full overflow-hidden bg-secondary flex items-center justify-center text-primary-dark font-bold text-sm flex-shrink-0"
          >
            <img
              v-if="sidebarAvatarUrl"
              :src="sidebarAvatarUrl"
              alt="Avatar"
              class="w-full h-full object-cover"
              @error="avatarLoadFailed = true"
            />
            <span v-else>
              {{ auth.userName?.charAt(0)?.toUpperCase() || "U" }}
            </span>
          </div>
          <transition name="fade">
            <div v-if="!collapsed" class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">
                {{ auth.userName }}
              </p>
              <p class="text-white/50 text-xs truncate">{{ auth.userEmail }}</p>
            </div>
          </transition>
        </div>
        <button
          v-if="!collapsed"
          @click="auth.logout()"
          class="mt-3 w-full text-sm text-white/60 hover:text-white py-1.5 rounded-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
        >
          <SvgIcon name="logout" :size="16" />
          Keluar
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div
      id="main-content"
      :class="[
        'flex-1 transition-all duration-300 flex flex-col min-h-screen',
        collapsed ? 'md:ml-20' : 'md:ml-64',
        'ml-0',
      ]"
    >
      <!-- Top Bar -->
      <header
        :class="['sticky top-0 z-20 backdrop-blur-md border-b px-4 md:px-6 py-3 flex items-center justify-between', theme.isDark ? 'bg-slate-900/80 border-slate-700 text-slate-100' : 'bg-white/80 border-gray-200 text-slate-900']"
      >
        <!-- Mobile Search Overlay -->
        <div
          v-if="showMobileSearch"
          class="absolute inset-0 bg-white z-30 flex items-center px-4 gap-2 animate-fade-in"
        >
          <SvgIcon name="search" :size="20" class="text-gray-400" />
          <input
            type="text"
            placeholder="Cari..."
            class="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
            autofocus
          />
          <button @click="showMobileSearch = false" class="p-1 text-gray-500">
            <SvgIcon name="x" :size="20" />
          </button>
        </div>

        <div :class="['flex items-center gap-2 text-sm', theme.isDark ? 'text-slate-300' : 'text-gray-500']">
          <!-- Mobile Menu Toggle -->
          <button
            @click="isSidebarOpen = !isSidebarOpen"
            class="md:hidden mr-2 p-1 text-gray-600 hover:text-primary rounded hover:bg-gray-100"
          >
            <SvgIcon name="menu" :size="24" />
          </button>

          <router-link to="/dashboard" class="hover:text-primary transition"
            >Dashboard</router-link
          >
          <span v-if="$route.meta.title && $route.name !== 'dashboard'">/</span>
          <span
            v-if="$route.meta.title && $route.name !== 'dashboard'"
            class="text-gray-800 font-medium"
          >
            {{ $route.meta.title }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div class="relative hidden md:block">
            <input
              type="text"
              placeholder="Cari..."
              class="input-field !py-2 !pl-10 !pr-4 w-64 text-sm"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              ><SvgIcon name="search" :size="16"
            /></span>
          </div>
          <button
            @click="showMobileSearch = true"
            class="md:hidden text-gray-500 hover:text-primary transition"
          >
            <SvgIcon name="search" :size="20" />
          </button>
          <button
            @click="theme.toggleTheme()"
            class="p-2 rounded-md text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            :title="theme.isDark ? 'Light mode' : 'Dark mode'"
          >
            <SvgIcon :name="theme.isDark ? 'sun' : 'moon'" :size="18" />
          </button>
          <div class="relative">
            <button
              @click.stop="showNotifications = !showNotifications"
              class="relative text-gray-500 hover:text-primary transition text-xl p-1"
            >
              <SvgIcon name="bell" :size="22" />
              <span
                v-if="notifStore.unreadCount > 0"
                class="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white"
              >
                {{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}
              </span>
            </button>
            
            <transition name="fade">
              <NotificationDropdown 
                v-if="showNotifications" 
                v-click-outside="() => showNotifications = false"
              />
            </transition>
          </div>
        </div>
      </header>


      <!-- Page Content -->
      <main class="p-4 md:p-6">
        <router-view v-slot="{ Component }">
          <transition name="page">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";
import { useThemeStore } from "@/stores/theme";
import { useRoute } from "vue-router";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import NotificationDropdown from "@/components/ui/NotificationDropdown.vue";
import { fetchSidebarMenuSettings } from "@/api/sidebarMenuSettings";

const auth = useAuthStore();
const notifStore = useNotificationStore();
const theme = useThemeStore();
const route = useRoute();
const collapsed = ref(false);
const isSidebarOpen = ref(false);
const showMobileSearch = ref(false);
const showNotifications = ref(false);
const avatarLoadFailed = ref(false);
const sidebarMenuSettings = ref({});

const sidebarAvatarUrl = computed(() => {
  if (avatarLoadFailed.value) return '';
  const raw = auth.user?.foto_guru;
  if (!raw) return '';

  const value = String(raw);
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  const normalized = value.replace(/^\/+/, '');
  return normalized.startsWith('uploads/') ? `/${normalized}` : `/uploads/${normalized}`;
});

onUnmounted(() => {
  notifStore.disconnectSSE();
  window.removeEventListener('sidebar-menu-settings-updated', reloadSidebarMenuSettings)
});

watch(
  () => auth.isAuthenticated,
  (isAuthed) => {
    if (isAuthed) {
      notifStore.initialize();
    } else {
      notifStore.disconnectSSE();
    }
  },
  { immediate: true }
);

watch(
  () => auth.accessToken,
  (newToken, oldToken) => {
    if (!newToken || newToken === oldToken) return;
    notifStore.disconnectSSE();
    notifStore.initialize();
  }
);

watch(
  () => auth.user?.foto_guru,
  () => {
    avatarLoadFailed.value = false;
  }
);

watch(
  () => auth.isAuthenticated,
  (isAuthed) => {
    if (!isAuthed) {
      sidebarMenuSettings.value = {};
      return;
    }
    reloadSidebarMenuSettings();
  },
  { immediate: true },
);

watch(
  () => auth.user?.roles,
  () => {
    if (auth.isAuthenticated) {
      reloadSidebarMenuSettings();
    }
  },
  { deep: true },
);

// Close sidebar on route change (mobile)
watch(
  () => route.fullPath,
  () => {
    isSidebarOpen.value = false;
  },
);

const hasRole = (roleName) => auth.userRoles?.some((role) => role.name === roleName)

const navItems = [
  { header: 'Main' },
  {
    to: "/dashboard",
    icon: "dashboard",
    label: "Dashboard",
    permission: "dashboard.view",
    exact: true,
  },
  
  { header: 'Data Master' },
  {
    to: "/dashboard/students",
    icon: "students",
    label: "Santri",
    permission: "students.view",
    menuKey: 'students',
  },
  {
    to: "/dashboard/users",
    icon: "users",
    label: "Pengajar",
    permission: "users.view",
    exact: true,
    menuKey: 'teachers',
  },
  {
    to: "/dashboard/users/activity-logs",
    icon: "clock",
    label: "Log Aktivitas",
    permission: "users.view",
  },
  {
    to: "/dashboard/kelas",
    icon: "bookmark",
    label: "Kelas",
    permission: "kelas.view",
    menuKey: 'kelas',
  },
  {
    to: "/dashboard/kamar",
    icon: "room",
    label: "Data Kamar",
    permission: "kamar.view",
    menuKey: 'kamar',
  },

  { header: 'Akademik' },
  {
    to: "/dashboard/lessons",
    icon: "book",
    label: "Pelajaran Formal",
    permission: "lessons.view",
    activeOn: ["/dashboard/lessons"],
    menuKey: 'lessons',
  },
  {
    to: "/dashboard/diniyyah-lesson",
    icon: "book",
    label: "Pelajaran Diniyyah",
    permission: "diniyyah_lesson.view",
    menuKey: 'diniyyah_lesson',
  },
  {
    to: "/dashboard/jadwal-formal",
    icon: "clock",
    label: "Jadwal Formal",
    permission: "jadwal_formal.view",
    activeOn: ["/dashboard/jadwal-formal"],
    activeExcept: ["/dashboard/jadwal-ramadhan"],
    menuKey: 'jadwal_formal',
  },
  {
    to: "/dashboard/jadwal-ramadhan",
    icon: "clock",
    label: "Jadwal Formal Ramadhan",
    permission: "jadwal_formal.view",
    activeOn: ["/dashboard/jadwal-ramadhan"],
    menuKey: 'jadwal_formal_ramadhan',
  },
  {
    to: "/dashboard/jadwal-diniyyah",
    icon: "clock",
    label: "Jadwal Diniyyah",
    permission: "jadwal_diniyyah.view",
    activeOn: ["/dashboard/jadwal-diniyyah"],
    menuKey: 'jadwal_diniyyah',
  },

  { header: 'Kesantrian' },
  {
    to: "/dashboard/absensi/statistik",
    icon: "attendance",
    label: "Riwayat Absensi Formal",
    permission: "absensi.view",
    activeOn: ["/dashboard/absensi/statistik"],
    menuKey: 'absensi_formal_history',
  },
  {
    to: "/dashboard/absensi-ramadhan/statistik",
    icon: "attendance",
    label: "Absensi Formal Ramadhan",
    permission: "absensi.view",
    activeOn: ["/dashboard/absensi-ramadhan"],
    menuKey: 'absensi_formal_ramadhan',
  },
  {
    to: "/dashboard/absensi-diniyyah/statistik",
    icon: "attendance",
    label: "Riwayat Absensi Diniyyah",
    permission: "absensi_diniyyah.view",
    activeOn: ["/dashboard/absensi-diniyyah/statistik"],
    menuKey: 'absensi_diniyyah_history',
  },
  {
    to: "/dashboard/absensi/guru",
    icon: "users",
    label: "Rekapan Guru Formal",
    permission: "absensi.view",
    exact: true,
  },
  {
    to: "/dashboard/absensi-ramadhan/guru",
    icon: "users",
    label: "Rekapan Guru Ramadhan",
    permission: "absensi.view",
    exact: true,
  },
  {
    to: "/dashboard/absensi-diniyyah/guru",
    icon: "users",
    label: "Rekapan Guru Diniyyah",
    permission: "absensi_diniyyah.view",
    exact: true,
  },
  {
    to: "/dashboard/halaqoh-assignments",
    icon: "halaqoh",
    label: "Halaqoh",
    permission: null,
    menuKey: 'halaqoh',
  },
  {
    to: "/dashboard/halaqoh/statistik/santri",
    icon: "attendance",
    label: "Riwayat Absensi Halaqoh",
    permission: "halaqoh.view",
    menuKey: 'halaqoh_history',
  },
  {
    to: "/dashboard/halaqoh/statistik/guru",
    icon: "users",
    label: "Rekapan Halaqoh Guru",
    permission: "halaqoh.view",
  },
  {
    to: "/dashboard/absensi-ekstra",
    icon: "check-circle",
    label: "Absensi Ekstra",
    permission: "absensi_ekstra.view_all",
    menuKey: 'absensi_ekstra',
  },
  {
    to: "/dashboard/arrivals",
    icon: "attendance",
    label: "Absen Kedatangan",
    permission: "dashboard.view",
    menuKey: 'student_arrival',
  },
  {
    to: "/dashboard/prestasi",
    icon: "trophy",
    label: "Prestasi",
    permission: "prestasi.view",
    menuKey: 'prestasi',
  },

  { header: 'Laundry & Sarpras' },
  {
    to: "/dashboard/laundry/accounts",
    icon: "users",
    label: "Manajemen Akun Laundry",
    permission: "laundry_accounts.view",
    activeOn: ["/dashboard/laundry/accounts"],
    menuKey: 'laundry_accounts',
  },
  {
    to: "/dashboard/laundry/vendors",
    icon: "users",
    label: "Vendor Laundry",
    permission: "laundry_accounts.view",
    activeOn: ["/dashboard/laundry/vendors"],
    menuKey: 'laundry_vendors',
  },
  {
    to: "/dashboard/laundry/accounts",
    icon: "users",
    label: "Manajemen Akun",
    permission: "laundry_accounts.view",
    hiddenInSidebar: true,
  },
  {
    to: "/dashboard/laundry/transactions",
    icon: "laundry",
    label: "Transaksi Laundry",
    permission: "laundry_accounts.view",
    menuKey: 'laundry_transactions',
  },
  {
    to: "/dashboard/laundry/pickups",
    icon: "check-circle",
    label: "Pengambilan Laundry",
    permission: "laundry_accounts.view",
  },

  { header: 'Konten & Galeri' },
  {
    to: "/dashboard/articles",
    icon: "article",
    label: "Berita",
    permission: "content.view",
    menuKey: 'content',
  },
  {
    to: "/dashboard/galeri",
    icon: "gallery",
    label: "Galeri",
    permission: "gallery.view",
    menuKey: 'gallery',
  },

  { header: 'Sistem' },
  {
    to: "/dashboard/roles",
    icon: "roles",
    label: "Roles & Permissions",
    permission: "roles.view",
  },
  {
    to: "/dashboard/settings",
    icon: "settings",
    label: "Pengaturan",
    permission: null,
  },
  {
    to: "/dashboard/sidebar-menu-settings",
    icon: "settings",
    label: "Pengaturan Sidebar",
    permission: null,
    roles: ['super_admin'],
    activeOn: ["/dashboard/sidebar-menu-settings"],
  },
];

async function reloadSidebarMenuSettings() {
  try {
    const items = await fetchSidebarMenuSettings()
    sidebarMenuSettings.value = items.reduce((acc, item) => {
      acc[item.key] = item.is_active !== false
      return acc
    }, {})
  } catch {
    sidebarMenuSettings.value = {}
  }
}

function canViewNavItem(item) {
  if (item.hiddenInSidebar) return false
  if (item.permission && !auth.hasPermission(item.permission)) return false
  if (item.roles && !item.roles.some((roleName) => hasRole(roleName))) return false
  if (item.menuKey && sidebarMenuSettings.value[item.menuKey] === false) return false
  return true
}

const visibleNavItems = computed(() => {
  const grouped = []
  let currentHeader = null
  let currentItems = []

  const flushSection = () => {
    if (currentHeader && currentItems.length) {
      grouped.push(currentHeader, ...currentItems)
    }
    currentHeader = null
    currentItems = []
  }

  navItems.forEach((item) => {
    if (item.header) {
      flushSection()
      currentHeader = item
      return
    }

    if (!canViewNavItem(item)) {
      return
    }

    if (currentHeader) {
      currentItems.push(item)
      return
    }

    grouped.push(item)
  })

  flushSection()
  return grouped
})

function isNavActive(item, isExactActive) {
  if (item.to === '/dashboard') return isExactActive
  if (item.activeExcept && item.activeExcept.some((path) => route.path.startsWith(path))) {
    return false
  }
  if (item.exact) {
    return route.path === item.to
  }
  if (item.activeOn) {
    return item.activeOn.some((p) => route.path.startsWith(p))
  }
  return route.path.startsWith(item.to)
}

onMounted(() => {
	window.addEventListener('sidebar-menu-settings-updated', reloadSidebarMenuSettings)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style scoped>
@media (max-width: 767px) {
  #main-content {
    margin-left: 0 !important;
  }
}
</style>
