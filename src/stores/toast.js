import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toast = reactive({
    visible: false,
    message: '',
    type: 'success', // success | error | info
  })

  let timer = null

  function show(message, type = 'success', duration = 3000) {
    if (timer) clearTimeout(timer)
    toast.message = message
    toast.type = type
    toast.visible = true
    timer = setTimeout(() => { toast.visible = false }, duration)
  }

  function success(message) { show(message, 'success') }
  function error(message) { show(message, 'error') }
  function info(message) { show(message, 'info') }

  return { toast, show, success, error, info }
})
