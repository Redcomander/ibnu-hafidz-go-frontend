import api from './index.js'

const BASE = '/ocr'

// Health check
export const ocrHealth = () => api.get(`${BASE}/health`)

// Scan an uploaded image file
export const ocrScan = (formData) => api.post(`${BASE}/scan`, formData)

// Bulk scan multiple images
export const ocrScanBulk = (formData) => api.post(`${BASE}/scan-bulk`, formData)

// Hardware scanner endpoints
export const ocrScannerDevices = () => api.get(`${BASE}/scanner/devices`)
export const ocrScanHardware = (formData) => api.post(`${BASE}/scan-hardware`, formData)

// Calibration
export const ocrGetCalibration = () => api.get(`${BASE}/calibration`)
export const ocrSaveCalibration = (data) => api.post(`${BASE}/calibration`, data)
export const ocrDeleteCalibration = () => api.delete(`${BASE}/calibration`)
export const ocrGetCalibrationPreview = () => api.get(`${BASE}/calibration/preview`)

// Answer keys
export const ocrGetAnswerKeys = () => api.get(`${BASE}/answer-key`)
export const ocrGetAnswerKey = (id) => api.get(`${BASE}/answer-key/${id}`)
export const ocrSaveAnswerKey = (data) => api.post(`${BASE}/answer-key`, data)
export const ocrUpdateAnswerKey = (id, data) => api.put(`${BASE}/answer-key/${id}`, data)
export const ocrDeleteAnswerKey = (id) => api.delete(`${BASE}/answer-key/${id}`)

// Scan results / history
export const ocrGetResults = (params) => api.get(`${BASE}/results`, { params })
export const ocrDeleteResult = (id) => api.delete(`${BASE}/results/${id}`)

// Service capabilities
export const ocrCapabilities = () => api.get(`${BASE}/capabilities`)
