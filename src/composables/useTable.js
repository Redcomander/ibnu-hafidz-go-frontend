import { ref, watch, reactive } from 'vue'
import api from '@/api'

/**
 * Reusable composable for search/filter/sort/pagination.
 * Every CRUD page gets this for free.
 *
 * Usage:
 *   const { data, loading, meta, search, filters, sort, fetchData, setPage } = useTable('/students')
 */
export function useTable(endpoint, options = {}) {
  const {
    defaultSort = 'created_at',
    defaultOrder = 'desc',
    defaultPerPage = 20,
    searchDebounce = 300,
    initialFilters = {},
  } = options

  // State
  const data = ref([])
  const loading = ref(false)
  const meta = reactive({
    total: 0,
    page: 1,
    perPage: defaultPerPage,
    totalPages: 0,
  })
  const search = ref('')
  const filters = reactive({ ...initialFilters })
  const sort = reactive({ field: defaultSort, order: defaultOrder })

  // Debounce timer
  let debounceTimer = null

  // Fetch data from API
  async function fetchData() {
    loading.value = true
    try {
      const params = {
        page: meta.page,
        per_page: meta.perPage,
        sort: sort.field,
        order: sort.order,
      }

      if (search.value) params.search = search.value

      // Add active filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '' && value !== undefined) {
          params[key] = value
        }
      })

      const { data: response } = await api.get(endpoint, { params })
      data.value = response.data || []
      meta.total = response.total || 0
      meta.totalPages = response.total_pages || 0
    } catch (error) {
      console.error('Table fetch error:', error)
      data.value = []
    } finally {
      loading.value = false
    }
  }

  // Set page
  function setPage(page) {
    meta.page = page
    fetchData()
  }

  // Set sort
  function setSort(field) {
    if (sort.field === field) {
      sort.order = sort.order === 'asc' ? 'desc' : 'asc'
    } else {
      sort.field = field
      sort.order = 'asc'
    }
    meta.page = 1
    fetchData()
  }

  // Watch search with debounce
  watch(search, () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      meta.page = 1
      fetchData()
    }, searchDebounce)
  })

  // Watch filters
  watch(filters, () => {
    meta.page = 1
    fetchData()
  }, { deep: true })

  // Watch perPage
  watch(() => meta.perPage, () => {
    meta.page = 1
    fetchData()
  })

  // Initial fetch
  fetchData()

  return {
    data,
    loading,
    meta,
    search,
    filters,
    sort,
    fetchData,
    setPage,
    setSort,
  }
}
