import { BASE_URL } from '../constants/crm';

let currentAccessToken = '';
let currentRefreshToken = '';

try {
    currentAccessToken = localStorage.getItem('admin_token') || '';
    currentRefreshToken = localStorage.getItem('admin_refresh_token') || '';
} catch {
    // SSR / Private browsing fallback
}

export const tokenStorage = {
    getAccessToken: () => currentAccessToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''),
    getRefreshToken: () => currentRefreshToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_refresh_token') || '' : ''),
    getUser: () => {
        try {
            const raw = localStorage.getItem('admin_user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },
    setSession: (token, refreshToken, user) => {
        currentAccessToken = token || '';
        if (refreshToken) currentRefreshToken = refreshToken;
        try {
            if (token) localStorage.setItem('admin_token', token);
            if (refreshToken) localStorage.setItem('admin_refresh_token', refreshToken);
            if (user) localStorage.setItem('admin_user', JSON.stringify(user));
        } catch {}
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('crm-auth-changed', { detail: { token, refreshToken, user } }));
        }
    },
    clearSession: () => {
        currentAccessToken = '';
        currentRefreshToken = '';
        try {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_refresh_token');
            localStorage.removeItem('admin_user');
        } catch {}
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('crm-auth-logout'));
        }
    }
};

let refreshPromise = null;

const handleResponse = async (response) => {
    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData.message || `HTTP error! status: ${response.status}`);
    }
    return resData;
};

// ⚡ In-Flight Request Deduplication to prevent overlapping concurrent network fetches
const inFlightRequests = new Map();
function deduplicatedFetch(url, options) {
    const cacheKey = `${options?.method || 'GET'}:${url}:${options?.headers?.Authorization || ''}`;
    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey);
    }
    const promise = fetch(url, options)
        .then(async (response) => {
            const data = await handleResponse(response);
            inFlightRequests.delete(cacheKey);
            return data;
        })
        .catch((err) => {
            inFlightRequests.delete(cacheKey);
            throw err;
        });
    inFlightRequests.set(cacheKey, promise);
    return promise;
}


export const crmApi = {
    async login({ email, password, loginMode }) {
        const response = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, loginType: loginMode })
        });
        const resData = await handleResponse(response);
        if (resData.success && resData.token) {
            tokenStorage.setSession(resData.token, resData.refreshToken, resData.user);
        }
        return resData;
    },

    async refreshToken(refreshToken = null) {
        const tokenToUse = refreshToken || tokenStorage.getRefreshToken();
        if (!tokenToUse) {
            throw new Error('No refresh token available');
        }

        if (!refreshPromise) {
            refreshPromise = (async () => {
                const response = await fetch(`${BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: tokenToUse })
                });
                const resData = await handleResponse(response);
                if (resData.success && resData.token) {
                    tokenStorage.setSession(resData.token, resData.refreshToken || tokenToUse, resData.user);
                }
                return resData;
            })().finally(() => {
                refreshPromise = null;
            });
        }

        return refreshPromise;
    },

    async logout(refreshToken = null) {
        const tokenToUse = refreshToken || tokenStorage.getRefreshToken();
        try {
            if (tokenToUse) {
                await fetch(`${BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: tokenToUse })
                });
            }
        } catch (e) {
            console.warn('Backend logout notification note:', e.message);
        } finally {
            tokenStorage.clearSession();
        }
    },

    async verifySession(token) {
        const authToken = token || tokenStorage.getAccessToken();
        const response = await fetch(`${BASE_URL}/admin/verify-token`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return handleResponse(response);
    },

    async forgotPassword({ email }) {
        const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return handleResponse(response);
    },

    async resetPassword({ token, newPassword }) {
        const response = await fetch(`${BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });
        return handleResponse(response);
    },

    async changePassword(token, { currentPassword, newPassword }) {
        const authToken = token || tokenStorage.getAccessToken();
        const response = await fetch(`${BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        return handleResponse(response);
    },

    async createUser(token, userData) {
        const authToken = token || tokenStorage.getAccessToken();
        const response = await fetch(`${BASE_URL}/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },

    async fetchUsers(token) {
        const authToken = token || tokenStorage.getAccessToken();
        const response = await fetch(`${BASE_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return handleResponse(response);
    },

    async toggleUserStatus(token, userId, isActive) {
        const authToken = token || tokenStorage.getAccessToken();
        const response = await fetch(`${BASE_URL}/admin/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ isActive })
        });
        return handleResponse(response);
    },

    async resetUserPassword(token, userId, temporaryPassword) {
        const authToken = token || tokenStorage.getAccessToken();
        const response = await fetch(`${BASE_URL}/admin/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ temporaryPassword })
        });
        return handleResponse(response);
    },

    async updateUser(token, userId, updateData) {
        const authToken = token || tokenStorage.getAccessToken();
        const response = await fetch(`${BASE_URL}/admin/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updateData)
        });
        return handleResponse(response);
    },

    async activateUser(token, userId) {
        const authToken = token || tokenStorage.getAccessToken();
        const response = await fetch(`${BASE_URL}/admin/users/${userId}/activate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        return handleResponse(response);
    },

    async deactivateUser(token, userId) {
        const authToken = token || tokenStorage.getAccessToken();
        const response = await fetch(`${BASE_URL}/admin/users/${userId}/deactivate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        return handleResponse(response);
    },

    async fetchTeamOverview(token) {
        const authToken = token || tokenStorage.getAccessToken();
        const response = await fetch(`${BASE_URL}/admin/team/overview`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return handleResponse(response);
    },

    async fetchTeamLeads(token, params = {}) {
        const authToken = token || tokenStorage.getAccessToken();
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        if (params.status) query.append('status', params.status);
        if (params.assignedTo) query.append('assignedTo', params.assignedTo);
        const qs = query.toString() ? `?${query.toString()}` : '';
        const response = await fetch(`${BASE_URL}/admin/team/leads${qs}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return handleResponse(response);
    },

    async assignTeamLead(token, assignmentData) {
        const authToken = token || tokenStorage.getAccessToken();
        const response = await fetch(`${BASE_URL}/admin/team/leads/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(assignmentData)
        });
        return handleResponse(response);
    },

    async fetchEnquiries(token, params = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        if (params.status) query.append('status', params.status);
        if (params.search) query.append('search', params.search);
        const qs = query.toString() ? `?${query.toString()}` : '';
        return deduplicatedFetch(`${BASE_URL}/admin/enquiries${qs}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    async updateEnquiry(token, enquiryId, data) {
        const response = await fetch(`${BASE_URL}/admin/enquiry/update/${enquiryId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    async createManualEnquiry(token, data) {
        const response = await fetch(`${BASE_URL}/admin/enquiry/manual`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    // Phase 4 Extensions: Quotes & Vendors
    async fetchQuotes(token, leadId) {
        const url = leadId ? `${BASE_URL}/admin/quotes/lead/${leadId}` : `${BASE_URL}/admin/quotes`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },


    async createQuote(token, quoteData) {
        const response = await fetch(`${BASE_URL}/admin/quote/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(quoteData)
        });
        return handleResponse(response);
    },

    async updateQuote(token, id, quoteData) {
        const response = await fetch(`${BASE_URL}/admin/quote/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(quoteData)
        });
        return handleResponse(response);
    },

    async fetchVendors(token, category = '', status = '', search = '') {
        const queryParams = new URLSearchParams();
        if (category) queryParams.append('category', category);
        if (status) queryParams.append('status', status);
        if (search) queryParams.append('search', search);

        const url = `${BASE_URL}/admin/vendors?${queryParams.toString()}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchVendorsByCategory(token, category) {
        const response = await fetch(`${BASE_URL}/admin/vendors/category/${category}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchVendor(token, id) {
        const response = await fetch(`${BASE_URL}/admin/vendor/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async createVendor(token, vendorData) {
        const response = await fetch(`${BASE_URL}/admin/vendor/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(vendorData)
        });
        return handleResponse(response);
    },

    async updateVendor(token, id, vendorData) {
        const response = await fetch(`${BASE_URL}/admin/vendor/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(vendorData)
        });
        return handleResponse(response);
    },

    async updateVendorStatus(token, id, status) {
        const response = await fetch(`${BASE_URL}/admin/vendor/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        return handleResponse(response);
    },

    async deleteVendor(token, id) {
        const response = await fetch(`${BASE_URL}/admin/vendor/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },


    // Booking Helpers (Prompt 4)
    async fetchBookings(token, params = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        const qs = query.toString() ? `?${query.toString()}` : '';
        return deduplicatedFetch(`${BASE_URL}/admin/bookings${qs}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    // Customer 360 Helpers (Phase 13 Performance Optimization)
    async fetchCustomers(token, params = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        if (params.search) query.append('search', params.search);
        const qs = query.toString() ? `?${query.toString()}` : '';
        return deduplicatedFetch(`${BASE_URL}/admin/customers${qs}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    async fetchCustomer(token, id) {
        return deduplicatedFetch(`${BASE_URL}/admin/customers/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    async fetchBooking(token, id) {
        const response = await fetch(`${BASE_URL}/admin/booking/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchBookingByQuote(token, quoteId) {
        const response = await fetch(`${BASE_URL}/admin/booking/quote/${quoteId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async createBooking(token, quoteId) {
        const response = await fetch(`${BASE_URL}/admin/booking/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quoteId })
        });
        return handleResponse(response);
    },

    async updateBookingStatus(token, id, status, remarks = '') {
        const response = await fetch(`${BASE_URL}/admin/booking/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, remarks })
        });
        return handleResponse(response);
    },

    async updateBookingChecklist(token, id, serviceCategory, status, notes = '') {
        const response = await fetch(`${BASE_URL}/admin/booking/${id}/checklist`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ serviceCategory, status, notes })
        });
        return handleResponse(response);
    },

    // Payment & Expense Helpers (Prompt 6)
    async fetchCustomerPayments(token, bookingId) {
        const response = await fetch(`${BASE_URL}/admin/booking/${bookingId}/customer-payments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async recordCustomerPayment(token, paymentData) {
        const response = await fetch(`${BASE_URL}/admin/booking/customer-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(paymentData)
        });
        return handleResponse(response);
    },

    async fetchVendorPayments(token, bookingId) {
        const response = await fetch(`${BASE_URL}/admin/booking/${bookingId}/vendor-payments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async recordVendorPayment(token, paymentData) {
        const response = await fetch(`${BASE_URL}/admin/booking/vendor-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(paymentData)
        });
        return handleResponse(response);
    },

    async fetchExpenses(token, bookingId = '', category = '', search = '') {
        const queryParams = new URLSearchParams();
        if (bookingId) queryParams.append('bookingId', bookingId);
        if (category) queryParams.append('category', category);
        if (search) queryParams.append('search', search);

        const response = await fetch(`${BASE_URL}/admin/expenses?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async recordExpense(token, expenseData) {
        const response = await fetch(`${BASE_URL}/admin/expense/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(expenseData)
        });
        return handleResponse(response);
    },

    async fetchFinancialSummary(token, bookingId) {
        const response = await fetch(`${BASE_URL}/admin/booking/${bookingId}/financial-summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    // Dashboard Helpers (Prompt 7)
    async fetchManagerDashboard(token) {
        const response = await fetch(`${BASE_URL}/admin/dashboard/manager`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchCEODashboard(token) {
        const response = await fetch(`${BASE_URL}/admin/dashboard/ceo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    // Security & Auth Session Helpers (Phase 5.1)
    async refreshAccessToken(refreshToken) {
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        return handleResponse(response);
    },

    async logoutSession(refreshToken) {
        const response = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        return handleResponse(response);
    },

    async logoutAllSessions(token) {
        const response = await fetch(`${BASE_URL}/auth/logout-all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return handleResponse(response);
    },

    // ⚡ Automation Center API Methods (Phase 5.2)
    async fetchAutomationSettings(token) {
        const response = await fetch(`${BASE_URL}/admin/automation/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async updateAutomationSettings(token, enabled) {
        const response = await fetch(`${BASE_URL}/admin/automation/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ enabled })
        });
        return handleResponse(response);
    },

    async fetchAutomationTemplates(token) {
        const response = await fetch(`${BASE_URL}/admin/automation/templates`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async saveAutomationTemplate(token, templateData) {
        const url = templateData._id || templateData.templateId
            ? `${BASE_URL}/admin/automation/templates/${templateData.templateId || templateData._id}`
            : `${BASE_URL}/admin/automation/templates`;
        const method = templateData._id || templateData.templateId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(templateData)
        });
        return handleResponse(response);
    },

    async fetchAutomationLogs(token, filter = {}) {
        const query = new URLSearchParams(filter).toString();
        const response = await fetch(`${BASE_URL}/admin/automation/logs${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async retryAutomationLog(token, logId) {
        const response = await fetch(`${BASE_URL}/admin/automation/retry/${logId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async previewAutomationMessage(token, previewData) {
        const response = await fetch(`${BASE_URL}/admin/automation/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(previewData)
        });
        return handleResponse(response);
    },

    // 📄 Document Engine API Methods (Phase 5.3)
    async fetchDocuments(token, filter = {}) {
        const query = new URLSearchParams(filter).toString();
        const response = await fetch(`${BASE_URL}/admin/documents${query ? `?${query}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async generateDocument(token, docData) {
        const response = await fetch(`${BASE_URL}/admin/documents/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(docData)
        });
        return handleResponse(response);
    },

    async regenerateDocument(token, documentId) {
        const response = await fetch(`${BASE_URL}/admin/documents/${documentId}/regenerate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async shareDocument(token, documentId, options = {}) {
        const response = await fetch(`${BASE_URL}/admin/documents/${documentId}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(options)
        });
        return handleResponse(response);
    },

    async archiveDocument(token, documentId) {
        const response = await fetch(`${BASE_URL}/admin/documents/${documentId}/archive`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    // File Attachment & Infrastructure API Helpers (Phase 5.4)
    async uploadFile(token, fileData) {
        const response = await fetch(`${BASE_URL}/admin/files/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(fileData)
        });
        return handleResponse(response);
    },

    async fetchFiles(token, entityType = '', entityId = '') {
        const queryParams = new URLSearchParams();
        if (entityType) queryParams.append('entityType', entityType);
        if (entityId) queryParams.append('entityId', entityId);

        const response = await fetch(`${BASE_URL}/admin/files?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async deleteFile(token, attachmentId) {
        const response = await fetch(`${BASE_URL}/admin/files/${attachmentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchBookingProfit(token, bookingId) {
        const response = await fetch(`${BASE_URL}/admin/booking/${bookingId}/financial-summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchSystemHealth(token) {
        const response = await fetch(`${BASE_URL}/admin/system/health`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    // 🏨 Hotel Partner & QR Management API (Phase 3)
    async fetchHotelPartners(token) {
        const response = await fetch(`${BASE_URL}/admin/hotel-partners`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async createHotelPartner(token, partnerData) {
        const response = await fetch(`${BASE_URL}/admin/hotel-partners`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(partnerData)
        });
        return handleResponse(response);
    },

    async updateHotelPartner(token, id, partnerData) {
        const response = await fetch(`${BASE_URL}/admin/hotel-partners/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(partnerData)
        });
        return handleResponse(response);
    },

    // 🌐 Dynamic QR Network API (Prompt 4)
    async fetchQrAreas(token) {
        const response = await fetch(`${BASE_URL}/admin/qr/areas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const res = await handleResponse(response);
        if (res.success && Array.isArray(res.areas) && !res.data) {
            res.data = res.areas;
        }
        return res;
    },

    async createQrArea(token, areaData) {
        const response = await fetch(`${BASE_URL}/admin/qr/areas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(areaData)
        });
        return handleResponse(response);
    },

    async fetchQrArea(token, id) {
        const response = await fetch(`${BASE_URL}/admin/qr/areas/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async updateQrArea(token, id, areaData) {
        const response = await fetch(`${BASE_URL}/admin/qr/areas/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(areaData)
        });
        return handleResponse(response);
    },

    async updateQrAreaStatus(token, id, status) {
        const response = await fetch(`${BASE_URL}/admin/qr/areas/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        return handleResponse(response);
    },

    async fetchQrRecords(token, filters = {}) {
        const query = new URLSearchParams(filters).toString();
        const url = `${BASE_URL}/admin/qr${query ? `?${query}` : ''}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const res = await handleResponse(response);
        if (res.success && Array.isArray(res.records) && !res.data) {
            res.data = res.records;
        }
        return res;
    },

    async createQrRecord(token, qrData) {
        const response = await fetch(`${BASE_URL}/admin/qr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(qrData)
        });
        return handleResponse(response);
    },

    async fetchQrRecord(token, qrId) {
        const response = await fetch(`${BASE_URL}/admin/qr/${qrId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async updateQrRecord(token, qrId, data) {
        const response = await fetch(`${BASE_URL}/admin/qr/${qrId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    async generateQr(token, qrId) {
        const response = await fetch(`${BASE_URL}/admin/qr/${qrId}/generate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async markQrInstalled(token, qrId, installData = {}) {
        const response = await fetch(`${BASE_URL}/admin/qr/${qrId}/install`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(installData)
        });
        return handleResponse(response);
    },

    async markQrDamaged(token, qrId, damageData = {}) {
        const response = await fetch(`${BASE_URL}/admin/qr/${qrId}/damage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(damageData)
        });
        return handleResponse(response);
    },

    async createQrReplacement(token, qrId, replacementData = {}) {
        const response = await fetch(`${BASE_URL}/admin/qr/${qrId}/replace`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(replacementData)
        });
        return handleResponse(response);
    },

    async deactivateQr(token, qrId, data = {}) {
        const response = await fetch(`${BASE_URL}/admin/qr/${qrId}/deactivate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    async fetchQrAnalytics(token, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = `${BASE_URL}/admin/qr/analytics${query ? `?${query}` : ''}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchAreaQrAnalytics(token, areaId) {
        const response = await fetch(`${BASE_URL}/admin/qr/analytics/areas/${areaId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchPublicQr(qrId) {
        const response = await fetch(`${BASE_URL}/public/qr/${qrId}`);
        return handleResponse(response);
    },

    async recordPublicQrScan(qrId) {
        const response = await fetch(`${BASE_URL}/public/qr/${qrId}/scan`, {
            method: 'POST'
        });
        return handleResponse(response);
    },

    // -------------------------------------------------------------
    // AI FOUNDATION & CEO CONTROL CENTER (Prompt 5)
    // -------------------------------------------------------------
    async fetchAiHealth() {
        const response = await fetch(`${BASE_URL}/admin/ai/health`);
        return handleResponse(response);
    },

    async fetchAiConfig(token) {
        const response = await fetch(`${BASE_URL}/admin/ai/config`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async updateAiConfig(token, configData) {
        const response = await fetch(`${BASE_URL}/admin/ai/config`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(configData)
        });
        return handleResponse(response);
    },

    async toggleAiEmergencyStop(token, active) {
        const response = await fetch(`${BASE_URL}/admin/ai/config/emergency-stop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ active })
        });
        return handleResponse(response);
    },

    async toggleAiSafeMode(token, enabled) {
        const response = await fetch(`${BASE_URL}/admin/ai/config/safe-mode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ enabled })
        });
        return handleResponse(response);
    },

    async toggleAiMaster(token, enabled) {
        const response = await fetch(`${BASE_URL}/admin/ai/config/master-toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ enabled })
        });
        return handleResponse(response);
    },

    async executeAiRun(token, runPayload) {
        const response = await fetch(`${BASE_URL}/admin/ai/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(runPayload)
        });
        return handleResponse(response);
    },

    async fetchAiRuns(token, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = `${BASE_URL}/admin/ai/runs${query ? `?${query}` : ''}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchAiRunDetails(token, id) {
        const response = await fetch(`${BASE_URL}/admin/ai/runs/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchAiAuditLogs(token, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = `${BASE_URL}/admin/ai/audit${query ? `?${query}` : ''}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchAiOpportunities(token, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = `${BASE_URL}/admin/ai/opportunities${query ? `?${query}` : ''}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async updateAiOpportunity(token, id, data) {
        const response = await fetch(`${BASE_URL}/admin/ai/opportunities/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    async fetchAiAssistantMetrics(token) {
        const response = await fetch(`${BASE_URL}/admin/ai/assistant/metrics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    // -------------------------------------------------------------
    // AI Sales Assistant Endpoints (Prompt 7)
    // -------------------------------------------------------------
    async analyzeLeadWithAi(token, leadId, additionalNotes = '') {
        const response = await fetch(`${BASE_URL}/admin/ai/sales/analyze-lead`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ leadId, additionalNotes })
        });
        return handleResponse(response);
    },

    async generateAiFollowUp(token, leadId, options = {}) {
        const response = await fetch(`${BASE_URL}/admin/ai/sales/generate-followup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ leadId, ...options })
        });
        return handleResponse(response);
    },

    async analyzeAiObjection(token, leadId, customerText) {
        const response = await fetch(`${BASE_URL}/admin/ai/sales/analyze-objection`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ leadId, customerText })
        });
        return handleResponse(response);
    },

    async prepareAiQuoteInputs(token, leadId) {
        const response = await fetch(`${BASE_URL}/admin/ai/sales/prepare-quote-inputs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ leadId })
        });
        return handleResponse(response);
    },

    async fetchAiSalesSummary(token, leadId) {
        const response = await fetch(`${BASE_URL}/admin/ai/sales/summary/${leadId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchAiSalesRecommendations(token, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = `${BASE_URL}/admin/ai/sales/recommendations${query ? `?${query}` : ''}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async updateAiRecommendation(token, id, data) {
        const response = await fetch(`${BASE_URL}/admin/ai/sales/recommendations/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    async fetchAiSalesMetrics(token) {
        const response = await fetch(`${BASE_URL}/admin/ai/sales/metrics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    // -------------------------------------------------------------
    // AI Customer Hunter API (Prompt 8)
    // -------------------------------------------------------------
    async fetchHunterStatus(token) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async startHunterRun(token, payload = {}) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },

    async pauseHunter(token) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/pause`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async resumeHunter(token) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/resume`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async stopHunter(token) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/stop`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchHunterSources(token) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/sources`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchHunterSource(token, sourceId) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/sources/${sourceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async testHunterSource(token, sourceId) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/sources/${sourceId}/test`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async runHunterSource(token, sourceId, options = {}) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/sources/${sourceId}/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(options)
        });
        return handleResponse(response);
    },

    async runAllHunterSources(token, options = {}) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/sources/run-all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(options)
        });
        return handleResponse(response);
    },

    async updateHunterSourceConfig(token, sourceId, updates = {}) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/sources/${sourceId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        return handleResponse(response);
    },

    async fetchHunterSourceHealth(token, sourceId) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/sources/${sourceId}/health`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchHunterSourceStats(token, sourceId) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/sources/${sourceId}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchHunterSignals(token, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = `${BASE_URL}/admin/ai/hunter/signals${query ? `?${query}` : ''}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchHunterOpportunities(token, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = `${BASE_URL}/admin/ai/hunter/opportunities${query ? `?${query}` : ''}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchHunterOpportunity(token, id) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/opportunities/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async updateHunterOpportunity(token, id, data) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/opportunities/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    async approveHunterOpportunity(token, id) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/opportunities/${id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async rejectHunterOpportunity(token, id, reason = '') {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/opportunities/${id}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
        });
        return handleResponse(response);
    },

    async duplicateHunterOpportunity(token, id) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/opportunities/${id}/duplicate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async convertHunterOpportunityToLead(token, id, leadData = {}) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/opportunities/${id}/convert-to-lead`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(leadData)
        });
        return handleResponse(response);
    },

    async fetchHunterAnalytics(token) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async fetchHunterConfig(token) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/config`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async updateHunterConfig(token, updates) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/config`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        return handleResponse(response);
    },

    // Prompt 9.8: Contactability Layer API
    async fetchOpportunityContactability(token, id) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/opportunities/${id}/contactability`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async discoverContactRoutes(token, id, options = {}) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/opportunities/${id}/contactability/discover`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(options)
        });
        return handleResponse(response);
    },

    async addManualContactRoute(token, id, routeData) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/opportunities/${id}/contactability/add-route`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(routeData)
        });
        return handleResponse(response);
    },

    async verifyContactRoute(token, id, routeIndex, verificationData = {}) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/opportunities/${id}/contactability/routes/${routeIndex}/verify`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(verificationData)
        });
        return handleResponse(response);
    },

    async recordContactOutcome(token, id, outcomeData) {
        const response = await fetch(`${BASE_URL}/admin/ai/hunter/opportunities/${id}/contact-outcome`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(outcomeData)
        });
        return handleResponse(response);
    }
};

export default crmApi;
