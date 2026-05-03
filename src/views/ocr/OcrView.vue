<template>
  <div class="ocr-root space-y-6 pb-16">

    <!-- Page Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-primary-dark tracking-tight">Scanner Lembar Jawab</h1>
        <p class="text-gray-500 text-sm mt-1">Scan dan koreksi lembar jawab santri secara otomatis</p>
      </div>
      <button @click="showAnswerKeyModal = true"
        class="btn-secondary flex items-center gap-2 text-sm shrink-0">
        <SvgIcon name="document" :size="16" />
        <span class="hidden sm:inline">Kunci Jawaban</span>
      </button>
    </div>

    <!-- Service Offline Banner -->
    <div v-if="serviceOffline" class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <SvgIcon name="close" :size="18" class="text-red-500 mt-0.5 shrink-0" />
      <div>
        <p class="text-sm font-semibold text-red-700">Layanan OCR tidak aktif</p>
        <p class="text-xs text-red-600 mt-0.5">Pastikan <code class="bg-red-100 px-1 rounded">ibnu-hafidz-ocr-service</code> sudah berjalan di port 3099.</p>
      </div>
    </div>

    <!-- Answer Key Selector -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4">
      <div class="flex items-center justify-between gap-3 mb-3">
        <span class="text-sm font-semibold text-gray-700">Kunci Jawaban Aktif</span>
        <button @click="loadAnswerKeys" class="text-xs text-primary hover:underline">Refresh</button>
      </div>
      <div v-if="answerKeys.length === 0" class="text-sm text-gray-400 italic">
        Belum ada kunci jawaban. Buat terlebih dahulu.
      </div>
      <div v-else class="flex flex-wrap gap-2">
        <button v-for="ak in answerKeys" :key="ak.id"
          @click="selectedAnswerKeyId = ak.id"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
            selectedAnswerKeyId === ak.id
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary/50'
          ]">
          {{ ak.name || `Kunci #${ak.id}` }}
        </button>
      </div>
    </div>

    <!-- Academic Integration -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm font-semibold text-gray-700">Integrasi Akademik</span>
        <button @click="loadAcademicData" class="text-xs text-primary hover:underline">Refresh</button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="text-xs font-medium text-gray-500">Tipe Pelajaran</label>
          <select v-model="lessonType" @change="handleLessonTypeChange"
            class="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option value="formal">Formal</option>
            <option value="diniyyah">Diniyyah</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500">Pelajaran</label>
          <select v-model="selectedLessonId" @change="handleLessonOrClassChange"
            class="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option :value="null">Pilih pelajaran</option>
            <option v-for="lesson in lessons" :key="lesson.id" :value="lesson.id">{{ lesson.name || `Pelajaran #${lesson.id}` }}</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500">Kelas</label>
          <select v-model="selectedClassId" @change="handleLessonOrClassChange"
            class="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option :value="null">Pilih kelas</option>
            <option v-for="k in classes" :key="k.id" :value="k.id">{{ classLabel(k) }}</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500">Guru</label>
          <select v-model="selectedTeacherId"
            class="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option :value="null">Pilih guru</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name || `Guru #${t.id}` }}</option>
          </select>
        </div>
      </div>

      <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ringkasan Integrasi</p>
        <div class="mt-2 text-sm text-gray-700 space-y-1">
          <p><span class="text-gray-400">Pelajaran:</span> {{ selectedLessonObj?.name || 'Belum dipilih' }}</p>
          <p><span class="text-gray-400">Kelas:</span> {{ selectedClassObj ? classLabel(selectedClassObj) : 'Belum dipilih' }}</p>
          <p><span class="text-gray-400">Guru:</span> {{ selectedTeacherObj?.name || 'Belum dipilih' }}</p>
          <p><span class="text-gray-400">Santri Kelas:</span> {{ selectedClassStudents.length }}</p>
        </div>
      </div>
    </div>

    <!-- Scan Mode Tabs -->
    <div class="flex gap-2 bg-gray-100 rounded-xl p-1">
      <button v-for="mode in scanModes" :key="mode.key"
        @click="activeScanMode = mode.key"
        :class="[
          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
          activeScanMode === mode.key
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        ]">
        <SvgIcon :name="mode.icon" :size="16" />
        <span>{{ mode.label }}</span>
      </button>
    </div>

    <!-- === CAMERA MODE === -->
    <div v-if="activeScanMode === 'camera'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        
        <!-- Camera Preview / Drop Zone -->
        <div v-if="!previewSrc"
          @click="triggerCamera"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
          :class="[
            'relative flex flex-col items-center justify-center gap-4 cursor-pointer transition-all',
            'min-h-[260px] sm:min-h-[320px]',
            dragOver ? 'bg-primary/5 border-2 border-dashed border-primary' : 'bg-gray-50'
          ]">
          <div class="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center border border-gray-100">
            <SvgIcon name="photo" :size="28" class="text-primary" />
          </div>
          <div class="text-center px-6">
            <p class="font-semibold text-gray-800">Ambil Foto Lembar Jawab</p>
            <p class="text-sm text-gray-400 mt-1">Tap untuk kamera · atau drag & drop gambar</p>
          </div>
          <input ref="cameraInput" type="file" accept="image/*" capture="environment"
            class="hidden" @change="onFileSelected" />
        </div>

        <!-- Image Preview -->
        <div v-else class="relative">
          <img :src="previewSrc" class="w-full max-h-[420px] object-contain bg-gray-900" alt="Preview" />
          <button @click="clearPreview"
            class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
            <SvgIcon name="close" :size="14" />
          </button>
        </div>

        <!-- Scan Button -->
        <div v-if="previewSrc" class="p-4 border-t border-gray-100">
          <button @click="doScan" :disabled="scanning"
            class="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base font-semibold rounded-xl disabled:opacity-60">
            <span v-if="scanning" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            <SvgIcon v-else name="document" :size="18" />
            {{ scanning ? 'Memproses...' : 'Scan Sekarang' }}
          </button>
        </div>
      </div>
    </div>

    <!-- === UPLOAD MODE === -->
    <div v-else-if="activeScanMode === 'upload'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        
        <div v-if="uploadFiles.length === 0"
          @click="triggerUpload"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDropMultiple"
          :class="[
            'relative flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[220px]',
            dragOver ? 'bg-primary/5 border-2 border-dashed border-primary' : 'bg-gray-50'
          ]">
          <div class="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center border border-gray-100">
            <SvgIcon name="download" :size="24" class="text-primary rotate-180" />
          </div>
          <div class="text-center px-6">
            <p class="font-semibold text-gray-800">Upload Banyak Gambar</p>
            <p class="text-sm text-gray-400 mt-1">Pilih satu atau lebih file gambar</p>
          </div>
          <input ref="uploadInput" type="file" accept="image/*" multiple class="hidden" @change="onMultipleFilesSelected" />
        </div>

        <!-- File list -->
        <div v-else class="p-4 space-y-2">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-gray-700">{{ uploadFiles.length }} file dipilih</span>
            <button @click="clearUploadFiles" class="text-xs text-red-500 hover:underline">Hapus semua</button>
          </div>
          <div v-for="(f, i) in uploadFiles" :key="i"
            class="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <SvgIcon name="photo" :size="14" class="text-primary" />
            </div>
            <span class="text-sm text-gray-700 truncate flex-1">{{ f.name }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ formatFileSize(f.size) }}</span>
          </div>
          <button @click="doScanBulk" :disabled="scanning"
            class="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-2 text-base font-semibold rounded-xl disabled:opacity-60">
            <span v-if="scanning" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            <SvgIcon v-else name="document" :size="18" />
            {{ scanning ? 'Memproses ' + scanProgress + '%...' : `Scan ${uploadFiles.length} Gambar` }}
          </button>
        </div>
      </div>
    </div>

    <!-- === SCANNER HARDWARE MODE === -->
    <div v-else-if="activeScanMode === 'scanner'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700">Perangkat Scanner</span>
          <button @click="loadScannerDevices" :disabled="loadingDevices"
            class="text-xs text-primary hover:underline disabled:opacity-50">
            {{ loadingDevices ? 'Memuat...' : 'Refresh' }}
          </button>
        </div>
        <div v-if="scannerDevices.length === 0" class="text-sm text-gray-400 italic">
          Tidak ada scanner terdeteksi. Pastikan driver terpasang.
        </div>
        <div v-else class="space-y-2">
          <button v-for="d in scannerDevices" :key="d.id"
            @click="selectedScannerId = d.id"
            :class="[
              'w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all',
              selectedScannerId === d.id
                ? 'border-primary/50 bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            ]">
            <div :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              selectedScannerId === d.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
            ]">
              <SvgIcon name="document" :size="14" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ d.name }}</p>
              <p class="text-xs text-gray-400 truncate">{{ d.id }}</p>
            </div>
          </button>
        </div>
        <button @click="doHardwareScan" :disabled="scanning || !selectedScannerId"
          class="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base font-semibold rounded-xl disabled:opacity-60">
          <span v-if="scanning" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
          <SvgIcon v-else name="document" :size="18" />
          {{ scanning ? 'Memindai...' : 'Scan dengan Scanner' }}
        </button>
      </div>
    </div>

    <!-- Scan Error -->
    <div v-if="scanError" class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <SvgIcon name="close" :size="18" class="text-red-500 mt-0.5 shrink-0" />
      <div class="flex-1">
        <p class="text-sm font-semibold text-red-700">Gagal memproses</p>
        <p class="text-xs text-red-600 mt-0.5 whitespace-pre-wrap">{{ scanError }}</p>
      </div>
      <button @click="scanError = null" class="text-red-400 hover:text-red-600 shrink-0">
        <SvgIcon name="close" :size="14" />
      </button>
    </div>

    <!-- Scan Result -->
    <transition name="fade-up">
      <div v-if="lastResult" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-gray-800">Hasil Scan</h2>
          <button @click="lastResult = null" class="text-xs text-gray-400 hover:text-gray-600">Tutup</button>
        </div>

        <!-- Score Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
          <div class="flex items-center gap-4 mb-4">
            <div :class="[
              'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0',
              scoreGrade(lastResult.score) === 'A' ? 'bg-green-100 text-green-700' :
              scoreGrade(lastResult.score) === 'B' ? 'bg-blue-100 text-blue-700' :
              scoreGrade(lastResult.score) === 'C' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            ]">
              {{ scoreGrade(lastResult.score) }}
            </div>
            <div class="flex-1">
              <div class="text-3xl font-bold text-gray-900">{{ lastResult.score ?? '–' }}<span class="text-base font-normal text-gray-400">/100</span></div>
              <div class="flex gap-3 mt-1 text-sm">
                <span class="text-green-600 font-medium">✓ {{ lastResult.correct ?? 0 }} benar</span>
                <span class="text-red-500 font-medium">✗ {{ lastResult.wrong ?? 0 }} salah</span>
                <span v-if="lastResult.blank" class="text-gray-400">– {{ lastResult.blank }} kosong</span>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Integrasi Data</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div class="rounded-lg bg-white border border-gray-100 px-3 py-2">
                <p class="text-[11px] uppercase tracking-wide text-gray-400">Pelajaran</p>
                <p class="font-semibold text-gray-800 mt-0.5">{{ getResultContext(lastResult).lessonName || 'Belum dipilih' }}</p>
              </div>
              <div class="rounded-lg bg-white border border-gray-100 px-3 py-2">
                <p class="text-[11px] uppercase tracking-wide text-gray-400">Kelas</p>
                <p class="font-semibold text-gray-800 mt-0.5">{{ getResultContext(lastResult).className || 'Belum dipilih' }}</p>
              </div>
              <div class="rounded-lg bg-white border border-gray-100 px-3 py-2">
                <p class="text-[11px] uppercase tracking-wide text-gray-400">Guru</p>
                <p class="font-semibold text-gray-800 mt-0.5">{{ getResultContext(lastResult).teacherName || 'Belum dipilih' }}</p>
              </div>
            </div>

            <div class="mt-3 rounded-lg bg-white border border-gray-100 p-3">
              <p class="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Daftar Santri Kelas ({{ getResultContext(lastResult).students.length }})</p>
              <div v-if="getResultContext(lastResult).students.length" class="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                <div v-for="(s, idx) in getResultContext(lastResult).students" :key="s.id || idx"
                  class="flex items-center justify-between gap-2 text-sm rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1.5">
                  <span class="font-medium text-gray-700 truncate">{{ studentLabel(s) }}</span>
                  <span class="text-[11px] text-gray-400">#{{ idx + 1 }}</span>
                </div>
              </div>
              <p v-else class="text-xs text-gray-400 italic">Belum ada data santri untuk kelas ini.</p>
            </div>
          </div>

          <!-- Answers Grid -->
          <div v-if="lastResult.answers" class="mt-3">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Jawaban</p>
            <div class="grid grid-cols-5 gap-1.5">
              <div v-for="(ans, idx) in lastResult.answers" :key="idx"
                :class="[
                  'rounded-lg py-2 text-center text-sm font-bold border',
                  ans.correct === true ? 'bg-green-50 border-green-200 text-green-700' :
                  ans.correct === false ? 'bg-red-50 border-red-200 text-red-700' :
                  'bg-gray-50 border-gray-200 text-gray-400'
                ]">
                <div class="text-[10px] text-gray-400 leading-none">{{ idx + 1 }}</div>
                <div class="leading-tight mt-0.5">{{ ans.detected || '–' }}</div>
              </div>
            </div>
          </div>

          <!-- Scanned image thumbnail -->
          <div v-if="lastResult.previewUrl || lastResultPreview" class="mt-4 border-t border-gray-100 pt-4">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview</p>
            <img :src="lastResult.previewUrl || lastResultPreview"
              class="rounded-xl max-h-48 w-full object-contain bg-gray-50 border border-gray-100" />
          </div>
        </div>
      </div>
    </transition>

    <!-- Bulk Results -->
    <transition name="fade-up">
      <div v-if="bulkResults.length > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-gray-800">Hasil Bulk Scan ({{ bulkResults.length }})</h2>
          <button @click="bulkResults = []" class="text-xs text-gray-400 hover:text-gray-600">Tutup</button>
        </div>
        
        <div class="space-y-3">
          <div v-for="(res, i) in bulkResults" :key="i"
            class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 space-y-3">
            <div class="flex items-center gap-4">
            <div :class="[
              'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0',
              res.error ? 'bg-red-100 text-red-600' :
              scoreGrade(res.score) === 'A' ? 'bg-green-100 text-green-700' :
              scoreGrade(res.score) === 'B' ? 'bg-blue-100 text-blue-700' :
              scoreGrade(res.score) === 'C' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            ]">
              {{ res.error ? '!' : scoreGrade(res.score) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 truncate">{{ res.filename || `File ${i + 1}` }}</p>
              <p v-if="res.error" class="text-xs text-red-500 mt-0.5">{{ res.error }}</p>
              <p v-else class="text-xs text-gray-500 mt-0.5">
                Skor: <strong>{{ res.score ?? '–' }}</strong> · ✓ {{ res.correct }} · ✗ {{ res.wrong }}
              </p>
            </div>
            <div v-if="!res.error" class="text-xl font-bold" :class="[
              scoreGrade(res.score) === 'A' ? 'text-green-600' :
              scoreGrade(res.score) === 'B' ? 'text-blue-600' :
              scoreGrade(res.score) === 'C' ? 'text-yellow-600' :
              'text-red-600'
            ]">{{ res.score ?? '–' }}</div>
            </div>

            <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <div class="rounded-lg bg-white border border-gray-100 px-3 py-2">
                  <p class="text-[11px] uppercase tracking-wide text-gray-400">Pelajaran</p>
                  <p class="font-semibold text-gray-800 mt-0.5">{{ getResultContext(res).lessonName || 'Belum dipilih' }}</p>
                </div>
                <div class="rounded-lg bg-white border border-gray-100 px-3 py-2">
                  <p class="text-[11px] uppercase tracking-wide text-gray-400">Kelas</p>
                  <p class="font-semibold text-gray-800 mt-0.5">{{ getResultContext(res).className || 'Belum dipilih' }}</p>
                </div>
                <div class="rounded-lg bg-white border border-gray-100 px-3 py-2">
                  <p class="text-[11px] uppercase tracking-wide text-gray-400">Guru</p>
                  <p class="font-semibold text-gray-800 mt-0.5">{{ getResultContext(res).teacherName || 'Belum dipilih' }}</p>
                </div>
              </div>

              <details class="mt-3 rounded-lg bg-white border border-gray-100 p-2.5">
                <summary class="text-xs font-semibold text-gray-600 cursor-pointer">Daftar Santri Kelas ({{ getResultContext(res).students.length }})</summary>
                <div v-if="getResultContext(res).students.length" class="max-h-36 overflow-y-auto space-y-1.5 pr-1 mt-2">
                  <div v-for="(s, idx) in getResultContext(res).students" :key="s.id || idx"
                    class="flex items-center justify-between gap-2 text-sm rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1.5">
                    <span class="font-medium text-gray-700 truncate">{{ studentLabel(s) }}</span>
                    <span class="text-[11px] text-gray-400">#{{ idx + 1 }}</span>
                  </div>
                </div>
                <p v-else class="text-xs text-gray-400 italic mt-2">Belum ada data santri untuk kelas ini.</p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Persisted Integrated Result Cards -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-gray-800">Result Page Integrasi</h2>
        <button @click="loadSavedResultLinks" class="text-xs text-primary hover:underline">Refresh</button>
      </div>

      <div v-if="loadingSavedResultLinks" class="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">
        Memuat data hasil tersimpan...
      </div>

      <div v-else-if="savedResultGroups.length === 0" class="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-400 italic">
        Belum ada hasil tersimpan.
      </div>

      <div v-else class="space-y-3">
        <div v-for="group in savedResultGroups" :key="group.key"
          class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div class="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
              <p class="text-[11px] uppercase tracking-wide text-gray-400">Pelajaran</p>
              <p class="font-semibold text-gray-800 mt-0.5">{{ group.lessonName }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
              <p class="text-[11px] uppercase tracking-wide text-gray-400">Kelas</p>
              <p class="font-semibold text-gray-800 mt-0.5">{{ group.kelasName }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
              <p class="text-[11px] uppercase tracking-wide text-gray-400">Guru</p>
              <p class="font-semibold text-gray-800 mt-0.5">{{ group.teacherName }}</p>
            </div>
          </div>

          <div class="rounded-lg bg-gray-50 border border-gray-100 p-3">
            <p class="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Semua Santri Kelas ({{ group.students.length }})</p>
            <div v-if="group.students.length" class="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              <div v-for="(s, idx) in group.students" :key="s.id || idx"
                class="flex items-center justify-between gap-2 text-sm rounded-md border border-gray-100 bg-white px-2.5 py-1.5">
                <span class="font-medium text-gray-700 truncate">{{ studentLabel(s) }}</span>
                <span class="text-[11px] text-gray-400">#{{ idx + 1 }}</span>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400 italic">Belum ada data santri untuk kelas ini.</p>
          </div>

          <details class="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <summary class="text-xs font-semibold text-gray-600 cursor-pointer">Riwayat Scan ({{ group.results.length }})</summary>
            <div class="mt-2 space-y-1.5">
              <div v-for="item in group.results.slice(0, 8)" :key="item.id"
                class="flex items-center justify-between rounded-md border border-gray-100 bg-white px-2.5 py-1.5 text-sm">
                <span class="truncate text-gray-700">{{ item.filename || `${item.source || 'scan'} #${item.id}` }}</span>
                <span class="font-semibold text-gray-800">{{ item.score ?? '–' }}</span>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>

    <!-- Answer Key Modal -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="showAnswerKeyModal"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          @click.self="showAnswerKeyModal = false">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div class="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h3 class="text-base font-bold text-gray-900">Kelola Kunci Jawaban</h3>
              <button @click="showAnswerKeyModal = false" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <SvgIcon name="close" :size="14" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="overflow-y-auto flex-1 p-5 space-y-5">
              <!-- Add New Key Form -->
              <div class="bg-gray-50 rounded-xl p-4 space-y-3">
                <p class="text-sm font-semibold text-gray-700">Tambah Kunci Jawaban Baru</p>
                <input v-model="newKey.name" placeholder="Nama (misal: UTS Kelas 6)"
                  class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                <div class="space-y-2">
                  <p class="text-xs text-gray-500">Jawaban soal 1–35 (A/B/C/D/E)</p>
                  <div class="grid grid-cols-5 gap-1.5">
                    <div v-for="n in 35" :key="n" class="space-y-0.5">
                      <div class="text-[10px] text-gray-400 text-center">{{ n }}</div>
                      <input v-model="newKey.answers[n-1]"
                        maxlength="1"
                        @input="e => { newKey.answers[n-1] = e.target.value.toUpperCase(); if(e.target.value && n < 35) focusNext(n); }"
                        :ref="el => { if(el) answerInputRefs[n-1] = el }"
                        class="w-full text-center text-sm font-bold border border-gray-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary uppercase" />
                    </div>
                  </div>
                </div>
                <button @click="saveNewAnswerKey" :disabled="savingKey"
                  class="w-full btn-primary py-2.5 text-sm font-semibold rounded-xl disabled:opacity-60">
                  {{ savingKey ? 'Menyimpan...' : 'Simpan Kunci Jawaban' }}
                </button>
              </div>

              <!-- Existing Keys -->
              <div v-if="answerKeys.length > 0" class="space-y-2">
                <p class="text-sm font-semibold text-gray-700">Kunci Tersimpan</p>
                <div v-for="ak in answerKeys" :key="ak.id"
                  class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800">{{ ak.name || `Kunci #${ak.id}` }}</p>
                    <p class="text-xs text-gray-400 mt-0.5 truncate">{{ formatAnswerPreview(ak.answers) }}</p>
                  </div>
                  <button @click="deleteAnswerKey(ak.id)"
                    class="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors">
                    <SvgIcon name="close" :size="12" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import SvgIcon from '@/components/ui/SvgIcon.vue'
import api from '@/api'
import {
  ocrHealth, ocrScan, ocrScanBulk, ocrScanHardware,
  ocrScannerDevices, ocrGetAnswerKeys, ocrSaveAnswerKey, ocrDeleteAnswerKey,
  ocrGetResultLinks, ocrCreateResultLink,
} from '@/api/ocr.js'

// ─── State ────────────────────────────────────────────────────────────────────

const serviceOffline = ref(false)
const activeScanMode = ref('camera')
const scanModes = [
  { key: 'camera', label: 'Kamera', icon: 'photo' },
  { key: 'upload', label: 'Upload', icon: 'download' },
  { key: 'scanner', label: 'Scanner', icon: 'document' },
]

// Camera / file
const cameraInput = ref(null)
const uploadInput = ref(null)
const previewSrc = ref(null)
const previewFile = ref(null)
const uploadFiles = ref([])
const dragOver = ref(false)
const lastResultPreview = ref(null)

// Scanning
const scanning = ref(false)
const scanProgress = ref(0)
const scanError = ref(null)
const lastResult = ref(null)
const bulkResults = ref([])
const savedResultLinks = ref([])
const loadingSavedResultLinks = ref(false)

// Scanner hardware
const scannerDevices = ref([])
const selectedScannerId = ref(null)
const loadingDevices = ref(false)

// Answer keys
const answerKeys = ref([])
const selectedAnswerKeyId = ref(null)
const showAnswerKeyModal = ref(false)
const savingKey = ref(false)
const newKey = reactive({
  name: '',
  answers: Array(35).fill(''),
})
const answerInputRefs = ref([])

// Academic integration
const lessonType = ref('formal')
const lessons = ref([])
const classes = ref([])
const teachers = ref([])
const selectedLessonId = ref(null)
const selectedClassId = ref(null)
const selectedTeacherId = ref(null)
const selectedClassStudents = ref([])

const selectedLessonObj = computed(() => lessons.value.find(l => Number(l.id) === Number(selectedLessonId.value)) || null)
const selectedClassObj = computed(() => classes.value.find(k => Number(k.id) === Number(selectedClassId.value)) || null)
const selectedTeacherObj = computed(() => teachers.value.find(t => Number(t.id) === Number(selectedTeacherId.value)) || null)

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    await ocrHealth()
    serviceOffline.value = false
  } catch {
    serviceOffline.value = true
  }
  await loadAnswerKeys()
  await loadAcademicData()
  await loadSavedResultLinks()
})

// ─── File Handling ────────────────────────────────────────────────────────────

function triggerCamera() {
  cameraInput.value?.click()
}

function triggerUpload() {
  uploadInput.value?.click()
}

function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  loadPreview(file)
}

function onDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) loadPreview(file)
}

function onDropMultiple(e) {
  dragOver.value = false
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
  if (files.length) uploadFiles.value = files
}

function onMultipleFilesSelected(e) {
  uploadFiles.value = Array.from(e.target.files)
}

function loadPreview(file) {
  previewFile.value = file
  const reader = new FileReader()
  reader.onload = ev => { previewSrc.value = ev.target.result }
  reader.readAsDataURL(file)
  lastResult.value = null
  scanError.value = null
}

function clearPreview() {
  previewSrc.value = null
  previewFile.value = null
  lastResult.value = null
  if (cameraInput.value) cameraInput.value.value = ''
}

function clearUploadFiles() {
  uploadFiles.value = []
  bulkResults.value = []
  if (uploadInput.value) uploadInput.value.value = ''
}

// ─── Scan Actions ─────────────────────────────────────────────────────────────

async function doScan() {
  if (!previewFile.value || scanning.value) return
  scanning.value = true
  scanError.value = null
  lastResultPreview.value = previewSrc.value

  try {
    const fd = new FormData()
    fd.append('image', previewFile.value)
    if (selectedAnswerKeyId.value) fd.append('answerKeyId', selectedAnswerKeyId.value)
    if (selectedLessonId.value) fd.append('lessonId', selectedLessonId.value)
    if (selectedClassId.value) fd.append('kelasId', selectedClassId.value)
    if (selectedTeacherId.value) fd.append('teacherId', selectedTeacherId.value)

    const res = await ocrScan(fd)
    lastResult.value = addResultContext(res.data)
    await saveResultLink(lastResult.value, 'scan')
    await loadSavedResultLinks()
  } catch (err) {
    scanError.value = err.response?.data?.message || err.response?.data?.error || err.message || 'Gagal memproses gambar'
  } finally {
    scanning.value = false
  }
}

async function doScanBulk() {
  if (!uploadFiles.value.length || scanning.value) return
  scanning.value = true
  scanError.value = null
  bulkResults.value = []
  scanProgress.value = 0

  try {
    const fd = new FormData()
    uploadFiles.value.forEach(f => fd.append('images', f))
    if (selectedAnswerKeyId.value) fd.append('answerKeyId', selectedAnswerKeyId.value)
    if (selectedLessonId.value) fd.append('lessonId', selectedLessonId.value)
    if (selectedClassId.value) fd.append('kelasId', selectedClassId.value)
    if (selectedTeacherId.value) fd.append('teacherId', selectedTeacherId.value)

    const res = await ocrScanBulk(fd)
    const raw = res.data?.results || []
    bulkResults.value = raw.map(item => addResultContext(item))
    const savable = bulkResults.value.filter(item => !item?.error)
    await Promise.all(savable.map(item => saveResultLink(item, 'scan-bulk')))
    await loadSavedResultLinks()
  } catch (err) {
    scanError.value = err.response?.data?.message || err.message || 'Gagal memproses gambar'
  } finally {
    scanning.value = false
    scanProgress.value = 0
  }
}

async function doHardwareScan() {
  if (!selectedScannerId.value || scanning.value) return
  scanning.value = true
  scanError.value = null
  lastResult.value = null

  try {
    const fd = new FormData()
    fd.append('deviceId', selectedScannerId.value)
    if (selectedAnswerKeyId.value) fd.append('answerKeyId', selectedAnswerKeyId.value)
    if (selectedLessonId.value) fd.append('lessonId', selectedLessonId.value)
    if (selectedClassId.value) fd.append('kelasId', selectedClassId.value)
    if (selectedTeacherId.value) fd.append('teacherId', selectedTeacherId.value)

    const res = await ocrScanHardware(fd)
    lastResult.value = addResultContext(res.data)
    await saveResultLink(lastResult.value, 'scan-hardware')
    await loadSavedResultLinks()
  } catch (err) {
    scanError.value = err.response?.data?.message || err.message || 'Gagal scan dengan scanner'
  } finally {
    scanning.value = false
  }
}

// ─── Scanner Devices ──────────────────────────────────────────────────────────

async function loadScannerDevices() {
  loadingDevices.value = true
  try {
    const res = await ocrScannerDevices()
    scannerDevices.value = res.data?.devices || []
  } catch {
    scannerDevices.value = []
  } finally {
    loadingDevices.value = false
  }
}

// ─── Answer Keys ──────────────────────────────────────────────────────────────

async function loadAnswerKeys() {
  try {
    const res = await ocrGetAnswerKeys()
    answerKeys.value = res.data?.keys || res.data || []
    if (answerKeys.value.length && !selectedAnswerKeyId.value) {
      selectedAnswerKeyId.value = answerKeys.value[0].id
    }
  } catch {
    answerKeys.value = []
  }
}

async function loadAcademicData() {
  await Promise.all([
    loadLessons(),
    loadClasses(),
    loadTeachers(),
  ])
  await handleLessonOrClassChange()
}

async function loadSavedResultLinks() {
  loadingSavedResultLinks.value = true
  try {
    const params = { per_page: 200 }
    if (selectedClassId.value) params.kelas_id = selectedClassId.value
    if (selectedLessonId.value) params.lesson_id = selectedLessonId.value
    const res = await ocrGetResultLinks(params)
    savedResultLinks.value = Array.isArray(res.data?.data) ? res.data.data : []
  } catch {
    savedResultLinks.value = []
  } finally {
    loadingSavedResultLinks.value = false
  }
}

async function saveResultLink(result, source) {
  const ctx = getResultContext(result)
  const payload = {
    source,
    filename: result?.filename || result?.fileName || null,
    score: result?.score ?? null,
    correct: result?.correct ?? null,
    wrong: result?.wrong ?? null,
    blank: result?.blank ?? null,
    raw_result: result || null,
    lesson_type: lessonType.value,
    lesson_id: ctx.lessonId || null,
    kelas_id: ctx.classId || null,
    teacher_id: ctx.teacherId || null,
    answer_key_id: selectedAnswerKeyId.value || null,
  }

  try {
    await ocrCreateResultLink(payload)
  } catch {
    // Do not block OCR flow when persistence fails.
  }
}

async function loadLessons() {
  try {
    const res = await api.get('/lessons', { params: { type: lessonType.value } })
    lessons.value = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
        ? res.data.data
        : []
  } catch {
    lessons.value = []
  }
}

async function loadClasses() {
  try {
    const res = await api.get('/kelas', { params: { per_page: 1000 } })
    classes.value = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
        ? res.data.data
        : []
  } catch {
    classes.value = []
  }
}

async function loadTeachers() {
  try {
    const res = await api.get('/users', { params: { role: 'guru', per_page: 1000 } })
    teachers.value = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
        ? res.data.data
        : []
  } catch {
    teachers.value = []
  }
}

async function handleLessonTypeChange() {
  selectedLessonId.value = null
  await loadLessons()
  await handleLessonOrClassChange()
}

async function handleLessonOrClassChange() {
  // Auto-pick teacher from lesson assignment when lesson and class are selected.
  const lesson = selectedLessonObj.value
  const classId = Number(selectedClassId.value)
  if (lesson && classId) {
    const assignment = (lesson.assignments || []).find(a => Number(a.kelas?.id) === classId)
    if (assignment?.teacher?.id) {
      selectedTeacherId.value = assignment.teacher.id
    }
  }
  await ensureSelectedClassStudents()
}

async function ensureSelectedClassStudents() {
  selectedClassStudents.value = []
  const cls = selectedClassObj.value
  if (!cls) return

  if (Array.isArray(cls.students) && cls.students.length) {
    selectedClassStudents.value = cls.students
    return
  }

  try {
    const res = await api.get(`/kelas/${cls.id}`)
    const detail = res.data?.data || res.data
    selectedClassStudents.value = Array.isArray(detail?.students) ? detail.students : []
  } catch {
    selectedClassStudents.value = []
  }
}

async function saveNewAnswerKey() {
  if (!newKey.name.trim()) {
    alert('Nama kunci jawaban wajib diisi')
    return
  }
  savingKey.value = true
  try {
    await ocrSaveAnswerKey({ name: newKey.name, answers: newKey.answers })
    newKey.name = ''
    newKey.answers = Array(35).fill('')
    await loadAnswerKeys()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan kunci jawaban')
  } finally {
    savingKey.value = false
  }
}

async function deleteAnswerKey(id) {
  if (!confirm('Hapus kunci jawaban ini?')) return
  try {
    await ocrDeleteAnswerKey(id)
    if (selectedAnswerKeyId.value === id) selectedAnswerKeyId.value = null
    await loadAnswerKeys()
  } catch {
    alert('Gagal menghapus')
  }
}

function focusNext(n) {
  const next = answerInputRefs.value[n]
  if (next) next.focus()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreGrade(score) {
  if (score == null) return '?'
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  return 'D'
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function formatAnswerPreview(answers) {
  if (!answers || !answers.length) return 'Tidak ada jawaban'
  const arr = Array.isArray(answers) ? answers : Object.values(answers)
  return arr.slice(0, 10).join(' ') + (arr.length > 10 ? ' ...' : '')
}

function classLabel(k) {
  if (!k) return '-'
  return `${k.nama || '-'} ${k.tingkat || ''}`.trim()
}

function studentLabel(student) {
  return student?.nama_lengkap || student?.nama || student?.name || `Santri #${student?.id || '?'}`
}

function buildResultContext() {
  return {
    lessonId: selectedLessonId.value,
    lessonName: selectedLessonObj.value?.name || null,
    classId: selectedClassId.value,
    className: selectedClassObj.value ? classLabel(selectedClassObj.value) : null,
    teacherId: selectedTeacherId.value,
    teacherName: selectedTeacherObj.value?.name || null,
    students: [...selectedClassStudents.value],
  }
}

function addResultContext(result) {
  return {
    ...(result || {}),
    metaContext: buildResultContext(),
  }
}

function getResultContext(result) {
  return result?.metaContext || buildResultContext()
}

const savedResultGroups = computed(() => {
  const map = new Map()

  for (const item of savedResultLinks.value) {
    const lessonName = item?.lesson?.name || 'Pelajaran belum dipilih'
    const kelasName = item?.kelas ? classLabel(item.kelas) : 'Kelas belum dipilih'
    const key = `${item?.lesson_id || 0}-${item?.kelas_id || 0}`

    if (!map.has(key)) {
      map.set(key, {
        key,
        lessonName,
        kelasName,
        teacherName: item?.teacher?.name || 'Guru belum dipilih',
        students: Array.isArray(item?.kelas?.students) ? item.kelas.students : [],
        results: [],
      })
    }

    const group = map.get(key)
    if (!group.teacherName || group.teacherName === 'Guru belum dipilih') {
      group.teacherName = item?.teacher?.name || group.teacherName
    }
    if ((!group.students || group.students.length === 0) && Array.isArray(item?.kelas?.students)) {
      group.students = item.kelas.students
    }

    group.results.push(item)
  }

  return Array.from(map.values())
})
</script>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s ease;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
