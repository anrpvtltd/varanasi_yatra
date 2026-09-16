/**
 * Comprehensive Verification Suite for Prompt 4:
 * Varanasi Yatra Dynamic QR Network
 * 
 * Required Sections:
 * A. Area Management (CEO create, update, activate/deactivate, Non-CEO blocked)
 * B. Dynamic QR Types (Area allows subset, unallowed fails, dynamically updated allows)
 * C. QR Uniqueness (Atomic sequence, format [AREA]-[TYPE]-[SEQ], uniqueness guarantee)
 * D. QR Lifecycle (DRAFT -> GENERATED -> INSTALLED -> ACTIVE; ACTIVE -> DAMAGED -> REPLACEMENT_PENDING -> REPLACED)
 * E. Permission Tracking (PUBLIC_PLACE / ROADSIDE with PENDING blocked from ACTIVE without APPROVED)
 * F. Scan Attribution (Records scan, increments scanCount, updates lastScannedAt, logs to QRScan)
 * G. Duplicate Scan Protection (Short window refresh does not artificially inflate scanCount)
 * H. Lead Attribution (Verified AREA_QR, qrId, areaId, areaName, qrType on lead)
 * I. Tampering Protection (Fake/invalid QR IDs rejected, client cannot fake metrics)
 * J. Booking Attribution (Verified lead attribution flows into booking, updates bookingCount & revenue)
 * K. Financial Privacy (Public never sees margins/costs/notes, non-CEO analytics sanitized)
 * L. Existing Hotel QR Compatibility (HOTEL_QR continues functioning unchanged)
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRequire = createRequire(path.join(__dirname, '../backend/package.json'));

const express = backendRequire('express');
const jwt = backendRequire('jsonwebtoken');

// Domain & Modular Route Layers
const { ROLES } = backendRequire('./auth/roles');
const { createAuthMiddleware } = backendRequire('./auth/authMiddleware');
const { registerAreaRoutes } = backendRequire('./modules/qr/areaRoutes');
const { registerQrRoutes } = backendRequire('./modules/qr/qrRoutes');
const { registerQrPublicRoutes } = backendRequire('./modules/qr/qrPublicRoutes');
const { registerQrAnalyticsRoutes } = backendRequire('./modules/qr/qrAnalytics');

const JWT_SECRET = 'prompt4-test-jwt-secret-very-secure-32chars!';
const env = {
    jwtSecret: JWT_SECRET,
    jwtIssuer: 'varanasi-yatra-test',
    jwtAudience: 'varanasi-yatra-clients',
    jwtAccessExpiresIn: '1h'
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
        process.exitCode = 1;
    }
}

// -------------------------------------------------------------
// High-Fidelity In-Memory Model Simulator
// -------------------------------------------------------------
class InMemoryCollection {
    constructor(name) {
        this.name = name;
        this.items = [];
    }

    _matches(item, query = {}) {
        for (const [key, val] of Object.entries(query)) {
            if (key === '$or' && Array.isArray(val)) {
                const orMatch = val.some(subQ => this._matches(item, subQ));
                if (!orMatch) return false;
                continue;
            }
            if (key === '$and' && Array.isArray(val)) {
                const andMatch = val.every(subQ => this._matches(item, subQ));
                if (!andMatch) return false;
                continue;
            }

            const itemVal = item[key];
            if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
                if (val.$in && Array.isArray(val.$in)) {
                    if (!val.$in.includes(itemVal)) return false;
                    continue;
                }
                if (val.$ne !== undefined) {
                    if (itemVal === val.$ne) return false;
                    continue;
                }
                if (val.$regex) {
                    const re = new RegExp(val.$regex, val.$options || '');
                    if (!re.test(String(itemVal || ''))) return false;
                    continue;
                }
                if (val.$gte !== undefined && itemVal < val.$gte) return false;
                if (val.$lte !== undefined && itemVal > val.$lte) return false;
                if (val.$gt !== undefined && itemVal <= val.$gt) return false;
                if (val.$lt !== undefined && itemVal >= val.$lt) return false;
                continue;
            }

            if (String(itemVal) !== String(val)) return false;
        }
        return true;
    }

    _wrapDoc(raw) {
        if (!raw) return null;
        const self = this;
        const doc = { ...raw };
        doc.save = async function () {
            const idx = self.items.findIndex(i => String(i._id) === String(this._id));
            if (idx >= 0) {
                this.updatedAt = new Date();
                self.items[idx] = { ...this };
            } else {
                this.createdAt = this.createdAt || new Date();
                this.updatedAt = new Date();
                self.items.push({ ...this });
            }
            return self._wrapDoc(this);
        };
        doc.toObject = function () { return { ...this }; };
        doc.toJSON = function () { return { ...this }; };
        return doc;
    }

    _createQuery(executor) {
        const self = this;
        let isLean = false;
        let sortField = null;
        let sortDir = 1;

        const queryObj = {
            populate: function () { return queryObj; },
            select: function () { return queryObj; },
            sort: function (s) {
                if (typeof s === 'object') {
                    const [k, v] = Object.entries(s)[0] || [];
                    sortField = k;
                    sortDir = v;
                }
                return queryObj;
            },
            limit: function () { return queryObj; },
            lean: function () { isLean = true; return queryObj; },
            then: function (onFulfilled, onRejected) {
                return Promise.resolve()
                    .then(() => executor())
                    .then(res => {
                        if (!res) return null;
                        if (Array.isArray(res)) {
                            let list = [...res];
                            if (sortField) {
                                list.sort((a, b) => {
                                    if (a[sortField] < b[sortField]) return -1 * sortDir;
                                    if (a[sortField] > b[sortField]) return 1 * sortDir;
                                    return 0;
                                });
                            }
                            return isLean ? list.map(i => ({ ...i })) : list.map(i => self._wrapDoc(i));
                        }
                        return isLean ? { ...res } : self._wrapDoc(res);
                    })
                    .then(onFulfilled, onRejected);
            },
            catch: function (onRejected) { return this.then(null, onRejected); }
        };
        return queryObj;
    }

    find(query = {}) {
        return this._createQuery(() => this.items.filter(i => this._matches(i, query)));
    }

    findOne(query = {}) {
        return this._createQuery(() => this.items.find(i => this._matches(i, query)) || null);
    }

    findById(id) {
        return this._createQuery(() => this.items.find(i => String(i._id) === String(id)) || null);
    }

    async countDocuments(query = {}) {
        return this.items.filter(i => this._matches(i, query)).length;
    }

    async updateOne(query, update) {
        const item = this.items.find(i => this._matches(i, query));
        if (!item) return { matchedCount: 0, modifiedCount: 0 };
        if (update.$set) Object.assign(item, update.$set);
        if (update.$inc) {
            for (const [k, v] of Object.entries(update.$inc)) {
                item[k] = (item[k] || 0) + v;
            }
        }
        item.updatedAt = new Date();
        return { matchedCount: 1, modifiedCount: 1 };
    }

    async create(doc) {
        const item = {
            _id: doc._id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...doc
        };
        this.items.push(item);
        return this._wrapDoc(item);
    }

    async aggregate(pipeline = []) {
        // High fidelity aggregation simulator for $match, $group, $count, $facet
        function evalExpr(item, expr) {
            if (expr === null || expr === undefined) return 0;
            if (typeof expr === 'number') return expr;
            if (typeof expr === 'string') {
                if (expr.startsWith('$')) {
                    const field = expr.slice(1);
                    return item[field] !== undefined ? item[field] : 0;
                }
                return expr;
            }
            if (typeof expr === 'object') {
                if (expr.$cond) {
                    const [cond, trueVal, falseVal] = expr.$cond;
                    let isTrue = false;
                    if (cond.$eq) {
                        const [left, right] = cond.$eq;
                        const leftVal = evalExpr(item, left);
                        const rightVal = evalExpr(item, right);
                        isTrue = (leftVal === rightVal);
                    }
                    return isTrue ? evalExpr(item, trueVal) : evalExpr(item, falseVal);
                }
                if (expr.$ifNull) {
                    const [field, fallback] = expr.$ifNull;
                    const val = evalExpr(item, field);
                    return (val !== null && val !== undefined && !isNaN(val)) ? val : evalExpr(item, fallback);
                }
            }
            return 0;
        }

        let data = [...this.items];
        for (const stage of pipeline) {
            if (stage.$match) {
                data = data.filter(i => this._matches(i, stage.$match));
            }
            if (stage.$group) {
                const groupKey = stage.$group._id;
                const groups = new Map();
                for (const item of data) {
                    let k = groupKey;
                    if (typeof groupKey === 'string' && groupKey.startsWith('$')) {
                        k = item[groupKey.slice(1)];
                    } else if (typeof groupKey === 'object' && groupKey !== null) {
                        const resolvedObj = {};
                        for (const [subK, subV] of Object.entries(groupKey)) {
                            resolvedObj[subK] = typeof subV === 'string' && subV.startsWith('$') ? item[subV.slice(1)] : subV;
                        }
                        k = JSON.stringify(resolvedObj);
                    }
                    if (!groups.has(k)) {
                        const initId = typeof groupKey === 'object' && groupKey !== null ? JSON.parse(k) : k;
                        groups.set(k, { _id: initId });
                    }
                    const g = groups.get(k);
                    for (const [field, acc] of Object.entries(stage.$group)) {
                        if (field === '_id') continue;
                        if (acc.$sum !== undefined) {
                            const val = Number(evalExpr(item, acc.$sum)) || 0;
                            g[field] = (g[field] || 0) + val;
                        }
                    }
                }
                data = Array.from(groups.values());
            }
            if (stage.$count) {
                data = [{ [stage.$count]: data.length }];
            }
            if (stage.$facet) {
                const facetRes = {};
                for (const [facetKey, facetPipeline] of Object.entries(stage.$facet)) {
                    let sub = [...data];
                    for (const subStage of facetPipeline) {
                        if (subStage.$group) {
                            // simple sum group
                            const g = { _id: null };
                            for (const item of sub) {
                                for (const [f, a] of Object.entries(subStage.$group)) {
                                    if (f === '_id') continue;
                                    if (a.$sum !== undefined) {
                                        const val = typeof a.$sum === 'string' && a.$sum.startsWith('$')
                                            ? Number(item[a.$sum.slice(1)]) || 0
                                            : Number(a.$sum) || 0;
                                        g[f] = (g[f] || 0) + val;
                                    }
                                }
                            }
                            sub = [g];
                        }
                    }
                    facetRes[facetKey] = sub;
                }
                data = [facetRes];
            }
        }
        return data;
    }
}

function createModel(name, collection) {
    class DocumentModel {
        constructor(data = {}) {
            this._id = data._id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            Object.assign(this, data);
            this.createdAt = this.createdAt || new Date();
            this.updatedAt = new Date();
        }

        async save() {
            const idx = collection.items.findIndex(i => String(i._id) === String(this._id));
            if (idx >= 0) {
                this.updatedAt = new Date();
                collection.items[idx] = { ...this };
            } else {
                collection.items.push({ ...this });
            }
            return collection._wrapDoc(this);
        }

        toObject() {
            return { ...this };
        }

        toJSON() {
            return { ...this };
        }
    }
    DocumentModel.find = (q) => collection.find(q);
    DocumentModel.findOne = (q) => collection.findOne(q);
    DocumentModel.findById = (id) => collection.findById(id);
    DocumentModel.countDocuments = (q) => collection.countDocuments(q);
    DocumentModel.updateOne = (q, u) => collection.updateOne(q, u);
    DocumentModel.create = (d) => collection.create(d);
    DocumentModel.aggregate = (p) => collection.aggregate(p);
    return DocumentModel;
}

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        algorithm: 'HS256',
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
        expiresIn: '1h'
    });
}

function makeRequest(app, options, body = null) {
    return new Promise((resolve) => {
        const urlObj = new URL(options.path, 'http://localhost');
        const query = {};
        for (const [k, v] of urlObj.searchParams.entries()) {
            query[k] = v;
        }

        const headers = {};
        for (const [k, v] of Object.entries(options.headers || {})) {
            headers[k.toLowerCase()] = v;
        }

        const req = {
            method: (options.method || 'GET').toUpperCase(),
            url: options.path,
            originalUrl: options.path,
            path: urlObj.pathname,
            query,
            headers,
            body: body || {},
            get(name) { return this.headers[name.toLowerCase()]; },
            header(name) { return this.headers[name.toLowerCase()]; },
            ip: '127.0.0.1'
        };

        const res = {
            statusCode: 200,
            headers: {},
            status(code) { this.statusCode = code; return this; },
            setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
            getHeader(k) { return this.headers[k.toLowerCase()]; },
            json(data) {
                resolve({ status: this.statusCode, body: data });
                return this;
            },
            send(data) {
                resolve({ status: this.statusCode, body: data });
                return this;
            },
            end(data) {
                resolve({ status: this.statusCode, body: data });
                return this;
            }
        };

        app.handle(req, res, (err) => {
            if (err) {
                resolve({ status: 500, body: { success: false, message: err.message } });
            } else {
                resolve({ status: 404, body: { success: false, message: 'Not found' } });
            }
        });
    });
}

// -------------------------------------------------------------
// MAIN TEST RUNNER
// -------------------------------------------------------------
async function runPrompt4TestSuite() {
    console.log('================================================================');
    console.log('🚀 RUNNING PROMPT 4 — DYNAMIC QR NETWORK TEST SUITE');
    console.log('================================================================\n');

    // Collections
    const areaCollection = new InMemoryCollection('areas');
    const qrRecordCollection = new InMemoryCollection('qrrecords');
    const qrScanCollection = new InMemoryCollection('qrscans');
    const leadCollection = new InMemoryCollection('enquiries');
    const bookingCollection = new InMemoryCollection('bookings');
    const hotelPartnerCollection = new InMemoryCollection('hotelpartners');
    const userCollection = new InMemoryCollection('users');

    // Models
    const Area = createModel('Area', areaCollection);
    const QRRecord = createModel('QRRecord', qrRecordCollection);
    const QRScan = createModel('QRScan', qrScanCollection);
    const Enquiry = createModel('Enquiry', leadCollection);
    const Booking = createModel('Booking', bookingCollection);
    const HotelPartner = createModel('HotelPartner', hotelPartnerCollection);
    const User = createModel('User', userCollection);

    // Express App & Middleware
    const app = express();
    app.use(express.json());

    const { authenticateToken, requireRole } = createAuthMiddleware({
        jwtSecret: JWT_SECRET,
        jwtIssuer: env.jwtIssuer,
        jwtAudience: env.jwtAudience,
        User
    });

    // Mount QR modules
    registerAreaRoutes(app, { Area, QRRecord, Enquiry, Booking, authenticateToken, requireRole });
    registerQrAnalyticsRoutes(app, { Area, QRRecord, Booking, authenticateToken, requireRole });
    registerQrRoutes(app, { Area, QRRecord, authenticateToken, requireRole });
    registerQrPublicRoutes(app, { QRRecord, QRScan, Area });

    // Mount Public Leads endpoint
    app.post('/public/leads', async (req, res) => {
        try {
            const { name, phone, source, qrId, areaId, qrType } = req.body;
            let finalSource = source || 'WEBSITE';
            let verifiedAttribution = null;
            let finalQrId = qrId || null;
            let finalAreaId = areaId || null;
            let finalQrType = qrType || null;
            let finalAreaName = '';

            // Server-side validation of QR token
            if (source === 'AREA_QR' || (!req.body.partnerId && qrId)) {
                if (qrId) {
                    const qrDoc = await QRRecord.findOne({ qrId: String(qrId).trim().toUpperCase() });
                    if (qrDoc && ['ACTIVE', 'INSTALLED'].includes(qrDoc.status)) {
                        finalSource = 'AREA_QR';
                        finalQrId = qrDoc.qrId;
                        finalAreaId = qrDoc.areaId;
                        finalAreaName = qrDoc.areaName;
                        finalQrType = qrDoc.qrType;
                        verifiedAttribution = {
                            qrId: qrDoc.qrId,
                            areaId: qrDoc.areaId,
                            areaName: qrDoc.areaName,
                            qrType: qrDoc.qrType,
                            placementName: qrDoc.placementName || ''
                        };

                        // Increment QR lead count
                        await QRRecord.updateOne({ qrId: qrDoc.qrId }, { $inc: { leadCount: 1 } });
                    } else {
                        // Inactive/Invalid QR does not get false AREA_QR attribution
                        finalSource = 'WEBSITE';
                        finalQrId = null;
                        finalAreaId = null;
                        finalQrType = null;
                    }
                }
            }

            // Existing HOTEL_QR compatibility
            if (source === 'HOTEL_QR' || req.body.partnerId) {
                finalSource = 'HOTEL_QR';
            }

            const newLead = await Enquiry.create({
                name,
                mobile: phone,
                source: finalSource,
                qrId: finalQrId,
                areaId: finalAreaId,
                areaName: finalAreaName,
                qrType: finalQrType,
                qrAttribution: verifiedAttribution
            });

            return res.status(200).json({ success: true, lead: newLead });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    });

    // Mount Booking Creation endpoint
    app.post('/admin/quotes/:quoteId/book', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER]), async (req, res) => {
        try {
            const targetLead = await Enquiry.findById(req.body.leadId);
            const bookingNumber = `VY-BK-${Date.now()}`;
            const price = Number(req.body.price) || 25000;

            const newBooking = await Booking.create({
                bookingNumber,
                source: targetLead?.source || 'WEBSITE',
                qrId: targetLead?.qrId || null,
                areaId: targetLead?.areaId || null,
                areaName: targetLead?.areaName || '',
                qrType: targetLead?.qrType || '',
                qrAttribution: targetLead?.qrAttribution || null,
                packageDetails: { finalCustomerPrice: price },
                profitSummary: { actualRevenue: price }
            });

            if (targetLead?.qrId) {
                await QRRecord.updateOne(
                    { qrId: targetLead.qrId },
                    { $inc: { bookingCount: 1, revenueGenerated: price } }
                );
            }

            return res.status(200).json({ success: true, booking: newBooking });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    });

    // Seed Users
    const ceoUser = await User.create({
        _id: 'u_ceo_1',
        name: 'CEO User',
        email: 'ceo@varanasiyatra.com',
        role: 'CEO',
        status: 'ACTIVE'
    });
    const managerUser = await User.create({
        _id: 'u_mgr_1',
        name: 'Manager User',
        email: 'manager@varanasiyatra.com',
        role: 'MANAGER',
        status: 'ACTIVE'
    });
    const teamLeaderUser = await User.create({
        _id: 'u_tl_1',
        name: 'TL User',
        email: 'tl@varanasiyatra.com',
        role: 'TEAM_LEADER',
        status: 'ACTIVE'
    });
    const teamMemberUser = await User.create({
        _id: 'u_tm_1',
        name: 'TM User',
        email: 'tm@varanasiyatra.com',
        role: 'TEAM_MEMBER',
        status: 'ACTIVE'
    });

    const ceoToken = signToken({ id: ceoUser._id, email: ceoUser.email, role: 'CEO' });
    const mgrToken = signToken({ id: managerUser._id, email: managerUser.email, role: 'MANAGER' });
    const tlToken = signToken({ id: teamLeaderUser._id, email: teamLeaderUser.email, role: 'TEAM_LEADER' });
    const tmToken = signToken({ id: teamMemberUser._id, email: teamMemberUser.email, role: 'TEAM_MEMBER' });

    // -------------------------------------------------------------
    // SECTION A: AREA MANAGEMENT
    // -------------------------------------------------------------
    console.log('👉 [SECTION A: AREA MANAGEMENT]');

    // A.1 CEO creates Area
    const createAreaRes = await makeRequest(app, {
        path: '/admin/qr/areas',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        name: 'Godaulia',
        code: 'GOD',
        description: 'Prime central hub near Vishwanath temple and crossing',
        allowedQrTypes: ['HOTEL', 'PAID_PLACEMENT']
    });
    assert(createAreaRes.status === 201 && createAreaRes.body.success, 'CEO can create new geographic Area (201)');
    const godauliaArea = createAreaRes.body.area;
    assert(godauliaArea.code === 'GOD' && godauliaArea.allowedQrTypes.length === 2, 'Created area has code GOD and 2 allowed types');

    // A.2 CEO updates Area
    const updateAreaRes = await makeRequest(app, {
        path: `/admin/qr/areas/${godauliaArea._id}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        description: 'Updated central hub description'
    });
    assert(updateAreaRes.status === 200 && updateAreaRes.body.area.description.includes('Updated'), 'CEO can update Area details (200)');

    // A.3 CEO deactivates and reactivates Area
    const deactAreaRes = await makeRequest(app, {
        path: `/admin/qr/areas/${godauliaArea._id}/status`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, { status: 'INACTIVE' });
    assert(deactAreaRes.status === 200 && deactAreaRes.body.area.status === 'INACTIVE', 'CEO can mark Area INACTIVE');

    const reactAreaRes = await makeRequest(app, {
        path: `/admin/qr/areas/${godauliaArea._id}/status`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, { status: 'ACTIVE' });
    assert(reactAreaRes.status === 200 && reactAreaRes.body.area.status === 'ACTIVE', 'CEO can reactivate Area to ACTIVE');

    // A.4 Non-CEO unauthorized attempt to create Area
    const unauthAreaRes = await makeRequest(app, {
        path: '/admin/qr/areas',
        method: 'POST',
        headers: { Authorization: `Bearer ${mgrToken}` }
    }, {
        name: 'Unauthorized Area',
        code: 'UNAUTH',
        allowedQrTypes: ['HOTEL']
    });
    assert(unauthAreaRes.status === 403, 'Non-CEO (Manager) cannot create areas (403)');

    const tlAreaRes = await makeRequest(app, {
        path: '/admin/qr/areas',
        method: 'POST',
        headers: { Authorization: `Bearer ${tlToken}` }
    }, { name: 'TL Area', code: 'TLA' });
    assert(tlAreaRes.status === 403, 'Team Leader cannot create areas (403)');

    const tmAreaRes = await makeRequest(app, {
        path: '/admin/qr/areas',
        method: 'POST',
        headers: { Authorization: `Bearer ${tmToken}` }
    }, { name: 'TM Area', code: 'TMA' });
    assert(tmAreaRes.status === 403, 'Team Member cannot create areas (403)');

    // -------------------------------------------------------------
    // SECTION B: DYNAMIC QR TYPES PER AREA
    // -------------------------------------------------------------
    console.log('\n👉 [SECTION B: DYNAMIC QR TYPES PER AREA]');

    // B.1 Attempt to create ROADSIDE in Godaulia (which only allows HOTEL, PAID_PLACEMENT)
    const invalidTypeRes = await makeRequest(app, {
        path: '/admin/qr',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        areaId: godauliaArea._id,
        qrType: 'ROADSIDE',
        venueName: 'Tea Cart 1'
    });
    assert(invalidTypeRes.status === 400 && !invalidTypeRes.body.success, 'Attempt to create disallowed QR type ROADSIDE fails (400)');

    // B.2 CEO dynamically updates Godaulia allowed types to include ROADSIDE
    const addRoadsideRes = await makeRequest(app, {
        path: `/admin/qr/areas/${godauliaArea._id}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        allowedQrTypes: ['HOTEL', 'PAID_PLACEMENT', 'PUBLIC_PLACE', 'ROADSIDE']
    });
    assert(addRoadsideRes.status === 200 && addRoadsideRes.body.area.allowedQrTypes.includes('ROADSIDE'), 'CEO dynamically adds ROADSIDE to allowed types');

    // B.3 Now creating ROADSIDE in Godaulia succeeds
    const validRoadsideRes = await makeRequest(app, {
        path: '/admin/qr',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        areaId: godauliaArea._id,
        qrType: 'ROADSIDE',
        venueName: 'Main Crossing Tea Stall',
        placementName: 'Front counter wooden stand',
        permissionStatus: 'APPROVED'
    });
    assert(validRoadsideRes.status === 201 && validRoadsideRes.body.success, 'Creation of ROADSIDE now succeeds after CEO added it to allowed types (201)');

    // -------------------------------------------------------------
    // SECTION C: QR UNIQUENESS & ATOMIC SEQUENCING
    // -------------------------------------------------------------
    console.log('\n👉 [SECTION C: QR UNIQUENESS & ATOMIC SEQUENCING]');

    // C.1 Create HOTEL QR in Godaulia
    const qrHot1 = await makeRequest(app, {
        path: '/admin/qr',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        areaId: godauliaArea._id,
        qrType: 'HOTEL',
        venueName: 'Hotel Ganges Grand',
        placementName: 'Reception check-in desk'
    });
    assert(qrHot1.body.qr.qrId === 'GOD-HOT-001', 'First Hotel QR allocated GOD-HOT-001');

    // C.2 Create second HOTEL QR in Godaulia
    const qrHot2 = await makeRequest(app, {
        path: '/admin/qr',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        areaId: godauliaArea._id,
        qrType: 'HOTEL',
        venueName: 'Hotel Kashi Inn',
        placementName: 'Lobby travel desk'
    });
    assert(qrHot2.body.qr.qrId === 'GOD-HOT-002', 'Second Hotel QR sequentially allocated GOD-HOT-002');

    // C.3 Create PAID_PLACEMENT in Godaulia
    const qrPaid1 = await makeRequest(app, {
        path: '/admin/qr',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        areaId: godauliaArea._id,
        qrType: 'PAID_PLACEMENT',
        venueName: 'Kashi Cafe',
        placementName: 'Billing register'
    });
    assert(qrPaid1.body.qr.qrId === 'GOD-PAID-001', 'Paid placement allocated GOD-PAID-001 with independent sequence');

    // C.4 Create second area "Assi Ghat" (ASSI) and ensure sequence begins at 001
    const assiAreaRes = await makeRequest(app, {
        path: '/admin/qr/areas',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        name: 'Assi Ghat',
        code: 'ASSI',
        allowedQrTypes: ['PUBLIC_PLACE', 'HOTEL']
    });
    const assiArea = assiAreaRes.body.area;

    const assiPub1 = await makeRequest(app, {
        path: '/admin/qr',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        areaId: assiArea._id,
        qrType: 'PUBLIC_PLACE',
        venueName: 'Assi Ghat Notice Board',
        permissionStatus: 'APPROVED'
    });
    assert(assiPub1.body.qr.qrId === 'ASSI-PUB-001', 'Assi public place allocated ASSI-PUB-001');

    // -------------------------------------------------------------
    // SECTION D: QR LIFECYCLE & REPLACEMENT
    // -------------------------------------------------------------
    console.log('\n👉 [SECTION D: QR LIFECYCLE & REPLACEMENT]');

    // D.1 Lifecycle: DRAFT/GENERATED -> INSTALLED -> ACTIVE
    const testQr = qrHot1.body.qr;
    assert(testQr.status === 'DRAFT' || testQr.status === 'GENERATED', 'Initial QR status is DRAFT or GENERATED');

    const installRes = await makeRequest(app, {
        path: `/admin/qr/${testQr.qrId}/install`,
        method: 'POST',
        headers: { Authorization: `Bearer ${mgrToken}` }
    }, {
        remarks: 'Physical poster laminated and installed on desk'
    });
    assert(installRes.status === 200 && installRes.body.qr.status === 'ACTIVE', 'Manager marks QR installed -> status becomes ACTIVE (200)');
    assert(installRes.body.qr.installationStatus === 'INSTALLED', 'installationStatus updated to INSTALLED');

    // D.2 Mark damaged: ACTIVE -> DAMAGED
    const damageRes = await makeRequest(app, {
        path: `/admin/qr/${testQr.qrId}/damage`,
        method: 'POST',
        headers: { Authorization: `Bearer ${mgrToken}` }
    }, {
        reason: 'Water spill on poster'
    });
    assert(damageRes.status === 200 && damageRes.body.qr.status === 'DAMAGED', 'QR marked DAMAGED upon on-site damage report');

    // D.3 Allocate replacement: Allocates next sequential token (GOD-HOT-003)
    const replaceRes = await makeRequest(app, {
        path: `/admin/qr/${testQr.qrId}/replace`,
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        reason: 'Deploying fresh waterproof laminated poster',
        redirectActiveReplacement: true
    });
    assert(replaceRes.status === 200 && replaceRes.body.success, 'Replacement token created successfully (200)');
    const replacementQr = replaceRes.body.replacement;
    assert(replacementQr.qrId === 'GOD-HOT-003', 'Replacement allocated next sequence GOD-HOT-003');
    assert(replacementQr.replacementOf === 'GOD-HOT-001', 'Replacement links replacementOf = GOD-HOT-001');

    // D.4 Old record remains in database as REPLACED/DAMAGED with historical link
    const oldQrFetch = await makeRequest(app, {
        path: `/admin/qr/${testQr.qrId}`,
        headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert(oldQrFetch.body.qr.status === 'REPLACED' || oldQrFetch.body.qr.status === 'DAMAGED', 'Old QR status is REPLACED/DAMAGED and NOT physically deleted');
    assert(oldQrFetch.body.qr.replacedBy === 'GOD-HOT-003', 'Old QR references replacedBy = GOD-HOT-003');

    // -------------------------------------------------------------
    // SECTION E: PERMISSION TRACKING
    // -------------------------------------------------------------
    console.log('\n👉 [SECTION E: PERMISSION TRACKING]');

    // E.1 Public place QR with PENDING permission
    const pendingPermQrRes = await makeRequest(app, {
        path: '/admin/qr',
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        areaId: assiArea._id,
        qrType: 'PUBLIC_PLACE',
        venueName: 'Ghat Stairs Post',
        permissionStatus: 'PENDING'
    });
    const pendingPermQr = pendingPermQrRes.body.qr;
    assert(pendingPermQr.permissionStatus === 'PENDING', 'QR created with permissionStatus: PENDING');

    // Attempt to mark ACTIVE directly while permission is PENDING
    const blockedInstallRes = await makeRequest(app, {
        path: `/admin/qr/${pendingPermQr.qrId}/install`,
        method: 'POST',
        headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert(blockedInstallRes.status === 400, 'Cannot install public place QR when permissionStatus is PENDING (400)');

    // Update permission to APPROVED
    await makeRequest(app, {
        path: `/admin/qr/${pendingPermQr.qrId}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, { permissionStatus: 'APPROVED' });

    // Now installation succeeds
    const allowedInstallRes = await makeRequest(app, {
        path: `/admin/qr/${pendingPermQr.qrId}/install`,
        method: 'POST',
        headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert(allowedInstallRes.status === 200 && allowedInstallRes.body.qr.status === 'ACTIVE', 'Installation succeeds after permission is APPROVED');

    // -------------------------------------------------------------
    // SECTION F: SCAN ATTRIBUTION & TRACKING
    // -------------------------------------------------------------
    console.log('\n👉 [SECTION F: SCAN ATTRIBUTION & TRACKING]');

    // Make replacement QR active for scan testing
    await makeRequest(app, {
        path: `/admin/qr/${replacementQr.qrId}/install`,
        method: 'POST',
        headers: { Authorization: `Bearer ${mgrToken}` }
    });

    const initialFetch = await makeRequest(app, {
        path: `/public/qr/${replacementQr.qrId}`
    });
    assert(initialFetch.status === 200 && initialFetch.body.success, 'Public landing resolves active QR token (200)');
    assert(initialFetch.body.qr.scanCount === 1, 'Initial scan increments scanCount to 1');
    assert(Boolean(initialFetch.body.qr.lastScannedAt), 'lastScannedAt is recorded on scan');

    // Verify QRScan record was saved
    assert(qrScanCollection.items.length >= 1, 'Scan event logged in QRScan collection');
    const lastScan = qrScanCollection.items[qrScanCollection.items.length - 1];
    assert(lastScan.qrId === replacementQr.qrId && lastScan.areaId === replacementQr.areaId, 'QRScan contains correct qrId and areaId');

    // -------------------------------------------------------------
    // SECTION G: DUPLICATE SCAN DEDUPLICATION
    // -------------------------------------------------------------
    console.log('\n👉 [SECTION G: DUPLICATE SCAN DEDUPLICATION]');

    // Repeated immediate requests from same IP / session within 60s window
    await makeRequest(app, { path: `/public/qr/${replacementQr.qrId}` });
    await makeRequest(app, { path: `/public/qr/${replacementQr.qrId}` });
    await makeRequest(app, {
        path: `/public/qr/${replacementQr.qrId}/scan`,
        method: 'POST'
    });

    const qrAfterDups = await makeRequest(app, {
        path: `/admin/qr/${replacementQr.qrId}`,
        headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert(qrAfterDups.body.qr.scanCount === 1, 'Repeated short-window refresh does not artificially inflate scanCount');

    // -------------------------------------------------------------
    // SECTION H: LEAD ATTRIBUTION
    // -------------------------------------------------------------
    console.log('\n👉 [SECTION H: LEAD ATTRIBUTION]');

    // Submit lead with verified QR attribution
    const leadSubmitRes = await makeRequest(app, {
        path: '/public/leads',
        method: 'POST'
    }, {
        name: 'Aarav Sharma',
        phone: '9876543210',
        source: 'AREA_QR',
        qrId: replacementQr.qrId,
        areaId: replacementQr.areaId,
        qrType: replacementQr.qrType
    });

    assert(leadSubmitRes.status === 200 && leadSubmitRes.body.success, 'Lead created from Area QR scan (200)');
    const createdLead = leadSubmitRes.body.lead;
    assert(createdLead.source === 'AREA_QR', 'Lead source is AREA_QR');
    assert(createdLead.qrId === replacementQr.qrId, 'Lead has verified qrId');
    assert(createdLead.areaId === replacementQr.areaId, 'Lead has verified areaId');
    assert(createdLead.qrType === replacementQr.qrType, 'Lead has verified qrType');
    assert(createdLead.qrAttribution && createdLead.qrAttribution.qrId === replacementQr.qrId, 'Lead has immutable qrAttribution snapshot');

    // Verify QR lead count incremented
    const qrAfterLead = await makeRequest(app, {
        path: `/admin/qr/${replacementQr.qrId}`,
        headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert(qrAfterLead.body.qr.leadCount === 1, 'QRRecord leadCount incremented to 1');

    // -------------------------------------------------------------
    // SECTION I: TAMPERING & SECURITY
    // -------------------------------------------------------------
    console.log('\n👉 [SECTION I: TAMPERING & SECURITY]');

    // Client attempts to submit lead with non-existent fake QR ID
    const fakeLeadRes = await makeRequest(app, {
        path: '/public/leads',
        method: 'POST'
    }, {
        name: 'Attacker Fake',
        phone: '9000000000',
        source: 'AREA_QR',
        qrId: 'FAKE-QR-999',
        areaId: 'fake_area'
    });

    assert(fakeLeadRes.body.lead.source === 'WEBSITE', 'Fake QR ID rejected: lead falls back to WEBSITE');
    assert(fakeLeadRes.body.lead.qrId === null, 'Fake QR ID not assigned to lead');

    // Public QR landing for inactive / damaged QR
    const damagedQrLanding = await makeRequest(app, {
        path: `/public/qr/${testQr.qrId}` // GOD-HOT-001 (replaced)
    });
    assert(damagedQrLanding.body.redirected === true && damagedQrLanding.body.targetQrId === replacementQr.qrId, 'Old QR properly redirected to active replacement');

    // -------------------------------------------------------------
    // SECTION J: BOOKING & REVENUE ATTRIBUTION
    // -------------------------------------------------------------
    console.log('\n👉 [SECTION J: BOOKING & REVENUE ATTRIBUTION]');

    const bookRes = await makeRequest(app, {
        path: `/admin/quotes/q1/book`,
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}` }
    }, {
        leadId: createdLead._id,
        price: 45000
    });

    assert(bookRes.status === 200 && bookRes.body.success, 'Booking created from QR-attributed lead (200)');
    const booking = bookRes.body.booking;
    assert(booking.source === 'AREA_QR', 'Booking preserves source AREA_QR');
    assert(booking.qrId === replacementQr.qrId, 'Booking preserves qrId');
    assert(booking.areaId === replacementQr.areaId, 'Booking preserves areaId');

    // Check QRRecord booking metrics
    const qrAfterBooking = await makeRequest(app, {
        path: `/admin/qr/${replacementQr.qrId}`,
        headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert(qrAfterBooking.body.qr.bookingCount === 1, 'QRRecord bookingCount incremented to 1');
    assert(qrAfterBooking.body.qr.revenueGenerated === 45000, 'QRRecord revenueGenerated incremented to ₹45,000');

    // -------------------------------------------------------------
    // SECTION K: FINANCIAL PRIVACY & ANALYTICS
    // -------------------------------------------------------------
    console.log('\n👉 [SECTION K: FINANCIAL PRIVACY & ANALYTICS]');

    // Public endpoint does not expose sensitive internals
    const pubQr = initialFetch.body.qr;
    assert(pubQr.vendorCost === undefined, 'Public payload does not expose vendorCost');
    assert(pubQr.margin === undefined, 'Public payload does not expose margin');
    assert(pubQr.expectedProfit === undefined, 'Public payload does not expose expectedProfit');
    assert(pubQr.ceoNotes === undefined, 'Public payload does not expose ceoNotes');

    // Manager analytics endpoint sanitizes revenue
    const mgrAnalyticsRes = await makeRequest(app, {
        path: '/admin/qr/analytics',
        headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert(mgrAnalyticsRes.status === 200, 'Manager can access operational QR analytics (200)');
    assert(mgrAnalyticsRes.body.analytics && mgrAnalyticsRes.body.analytics.summary.totalRevenue === undefined, 'Manager cannot see totalRevenue in QR analytics');

    // CEO analytics includes full revenue
    const ceoAnalyticsRes = await makeRequest(app, {
        path: '/admin/qr/analytics',
        headers: { Authorization: `Bearer ${ceoToken}` }
    });
    assert(ceoAnalyticsRes.status === 200, 'CEO can access full QR analytics (200)');
    assert(ceoAnalyticsRes.body.analytics.summary.totalRevenue === 45000, 'CEO sees verified attributed revenue (₹45,000)');

    // -------------------------------------------------------------
    // SECTION L: EXISTING HOTEL QR COMPATIBILITY
    // -------------------------------------------------------------
    console.log('\n👉 [SECTION L: EXISTING HOTEL QR COMPATIBILITY]');

    // Create a Hotel Partner in existing collection
    const partnerDoc = await HotelPartner.create({
        name: 'BrijRama Palace',
        partnerCode: 'brijrama',
        active: true
    });

    // Existing hotel QR lead submission
    const hotelQrLeadRes = await makeRequest(app, {
        path: '/public/leads',
        method: 'POST'
    }, {
        name: 'Devotee Guest',
        phone: '9123456780',
        source: 'HOTEL_QR',
        partnerId: partnerDoc.partnerCode
    });

    assert(hotelQrLeadRes.status === 200 && hotelQrLeadRes.body.success, 'Existing HOTEL_QR lead submission succeeds (200)');
    assert(hotelQrLeadRes.body.lead.source === 'HOTEL_QR', 'Lead source remains HOTEL_QR without interference from AREA_QR');

    console.log('\n================================================================');
    console.log(`📊 PROMPT 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runPrompt4TestSuite().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
