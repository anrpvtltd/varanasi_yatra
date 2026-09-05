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

    async fetchEnquiries(token) {
        const response = await fetch(`${BASE_URL}/admin/enquiries`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
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
    async fetchBookings(token) {
        const response = await fetch(`${BASE_URL}/admin/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
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
    }
};

export default crmApi;
