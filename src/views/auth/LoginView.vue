<template>
  <div class="min-h-screen flex islamic-pattern">
    <!-- Left Hero Section -->
    <div
      class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-dark"
    >
      <!-- Decorative circles -->
      <div
        class="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5"
      ></div>
      <div
        class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5"
      ></div>

      <div
        class="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center"
      >
        <!-- Logo -->
        <img
          src="/logo_putih.png"
          alt="Logo"
          class="w-24 h-24 object-contain mb-6 animate-fade-in"
        />

        <!-- Arabic Calligraphy -->
        <p
          class="font-amiri text-white/80 text-3xl mb-4 animate-fade-in"
          style="animation-delay: 0.2s"
        >
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>

        <!-- School Name -->
        <h1
          class="text-white text-2xl font-bold mb-3 animate-fade-in tracking-tight"
          style="animation-delay: 0.3s"
        >
          Pondok Pesantren Tahfidz
        </h1>
        <h2
          class="text-secondary text-3xl font-bold mb-6 animate-fade-in tracking-wide"
          style="animation-delay: 0.4s"
        >
          Ibnu Hafidz
        </h2>

        <!-- Tagline -->
        <p
          class="text-white/70 text-sm max-w-xs animate-fade-in"
          style="animation-delay: 0.5s"
        >
          Sistem Manajemen Pesantren Modern — Mengelola dengan Amanah, Mengajar
          dengan Hikmah
        </p>

        <!-- Hero image -->
        <div
          class="mt-8 w-full max-w-sm animate-slide-up"
          style="animation-delay: 0.6s"
        >
          <img
            src="/hero-background.png"
            alt="Pesantren"
            class="w-full rounded-xl shadow-2xl opacity-90"
            loading="eager"
          />
        </div>
      </div>
    </div>

    <!-- Right Login Form -->
    <div class="flex-1 flex items-center justify-center p-8 bg-gray-50">
      <div class="w-full max-w-md animate-fade-in">
        <!-- Mobile logo -->
        <div class="lg:hidden flex flex-col items-center mb-8">
          <img
            src="/logo_putih.png"
            alt="Logo"
            class="w-16 h-16 object-contain mb-3 bg-primary rounded-2xl p-2"
          />
          <h2 class="text-primary text-xl font-bold tracking-tight">
            Ibnu Hafidz
          </h2>
        </div>

        <!-- Login Card -->
        <div class="glass-card p-8">
          <h2 class="text-2xl font-bold text-primary-dark mb-1 tracking-tight">
            Selamat Datang
          </h2>
          <p class="text-gray-500 text-sm mb-8">
            Masuk ke dashboard admin pesantren
          </p>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <!-- Username -->
            <div>
              <label class="input-label">Username</label>
              <input
                v-model="form.username"
                type="text"
                placeholder="admin"
                class="input-field"
                required
                autocomplete="username"
              />
            </div>

            <!-- Password -->
            <div>
              <label class="input-label">Password</label>
              <div class="relative">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="input-field !pr-12"
                  required
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <SvgIcon
                    :name="showPassword ? 'eye-off' : 'eye'"
                    :size="18"
                  />
                </button>
              </div>
            </div>

            <!-- Remember + Forgot -->
            <div class="flex items-center justify-between">
              <label
                class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="form.remember"
                  class="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Ingat saya
              </label>
              <a
                href="#"
                class="text-sm text-primary hover:text-primary-dark font-medium transition"
              >
                Lupa password?
              </a>
            </div>

            <!-- Error Message -->
            <div
              v-if="errorMessage"
              class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm animate-fade-in"
            >
              {{ errorMessage }}
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="auth.loading"
              class="w-full py-3.5 rounded-lg font-semibold text-white text-sm bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out shadow-md hover:shadow-lg"
            >
              <span v-if="!auth.loading">Masuk</span>
              <span v-else class="flex items-center justify-center gap-2">
                <span
                  class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                ></span>
                Memproses...
              </span>
            </button>
          </form>
        </div>

        <!-- Footer -->
        <p class="text-center text-xs text-gray-400 mt-6">
          © {{ new Date().getFullYear() }} Pondok Pesantren Tahfidz Ibnu Hafidz.
          All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import SvgIcon from "@/components/ui/SvgIcon.vue";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({
  username: "",
  password: "",
  remember: false,
});
const showPassword = ref(false);
const errorMessage = ref("");

async function handleLogin() {
  errorMessage.value = "";
  const result = await auth.login(form.username, form.password);

  if (result.success) {
    const redirect = route.query.redirect || "/";
    router.push(redirect);
  } else {
    errorMessage.value = result.message;
  }
}
</script>
