const API_BASE = import.meta.env.VITE_API_URL || '/api'

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE
    this._authTokenGetter = null
  }

  setAuthTokenGetter(getter) {
    this._authTokenGetter = getter
  }

  getHeaders(customHeaders = {}) {
    const headers = { 'Content-Type': 'application/json', ...customHeaders }
    if (this._authTokenGetter) {
      const token = this._authTokenGetter()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    return headers
  }

  async request(method, path, { body, headers, params } = {}) {
    let url = `${this.baseUrl}${path}`
    if (params) {
      const qs = new URLSearchParams(params).toString()
      if (qs) url += `?${qs}`
    }

    const options = {
      method,
      headers: this.getHeaders(headers),
      credentials: 'include',
    }
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    const res = await fetch(url, options)
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const error = new Error(data?.message || data?.error || `Request failed: ${res.status}`)
      error.status = res.status
      error.data = data
      throw error
    }

    return data
  }

  get(path, params) { return this.request('GET', path, { params }) }
  post(path, body, opts) { return this.request('POST', path, { body, ...opts }) }
  put(path, body, opts) { return this.request('PUT', path, { body, ...opts }) }
  patch(path, body, opts) { return this.request('PATCH', path, { body, ...opts }) }
  delete(path, opts) { return this.request('DELETE', path, opts) }

  async upload(path, formData) {
    const url = `${this.baseUrl}${path}`
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const error = new Error(data?.message || `Upload failed: ${res.status}`)
      error.status = res.status
      error.data = data
      throw error
    }
    return data
  }
}

export const api = new ApiClient()
export default api
