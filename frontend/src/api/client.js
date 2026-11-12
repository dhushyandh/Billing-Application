const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.errors = data.errors || [err.message];
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  getDashboard: () => request('/reports/dashboard'),
  getAnalytics: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString();
    return request(`/reports/analytics${qs ? `?${qs}` : ''}`);
  },
  getGstReport: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString();
    return request(`/reports/gst${qs ? `?${qs}` : ''}`);
  },
  getSettings: () => request('/settings'),
  updateSettings: (body) => request('/settings', { method: 'PUT', body: JSON.stringify(body) }),

  getCustomers: (search = '') =>
    request(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createCustomer: (body) => request('/customers', { method: 'POST', body: JSON.stringify(body) }),
  updateCustomer: (id, body) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  getProducts: (search = '') =>
    request(`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createProduct: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  getNextInvoiceNumber: (documentType) =>
    request(`/invoices/next-number?documentType=${encodeURIComponent(documentType)}`),
  getInvoices: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString();
    return request(`/invoices${qs ? `?${qs}` : ''}`);
  },
  getInvoice: (id) => request(`/invoices/${id}`),
  createInvoice: (body) => request('/invoices', { method: 'POST', body: JSON.stringify(body) }),
  updateInvoice: (id, body) =>
    request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateInvoiceStatus: (id, status) =>
    request(`/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),

  getStorefrontAdmin: () => request('/storefront/admin'),
  saveStorefrontDraft: (body) =>
    request('/storefront/draft', { method: 'PUT', body: JSON.stringify(body) }),
  publishStorefront: (body) =>
    request('/storefront/publish', { method: 'POST', body: JSON.stringify(body || {}) }),
  revertStorefront: () => request('/storefront/revert', { method: 'POST' }),
  getStorefrontPublic: (previewDraft = false) =>
    request(`/storefront/public${previewDraft ? '?preview=draft' : ''}`),

  createBooking: (body) => request('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  lookupBooking: (body) =>
    request('/bookings/lookup', { method: 'POST', body: JSON.stringify(body) }),
  getBookings: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString();
    return request(`/bookings${qs ? `?${qs}` : ''}`);
  },
  getBooking: (id) => request(`/bookings/${id}`),
  updateBookingStatus: (id, status) =>
    request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

