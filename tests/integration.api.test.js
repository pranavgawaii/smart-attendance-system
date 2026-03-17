const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';
process.env.JWT_SECRET = 'jwt-secret-test-key';
process.env.QR_HMAC_SECRET = 'qr-secret-test-key';
process.env.PUBLIC_FORM_RATE_LIMIT_WINDOW_MS = '60000';
process.env.PUBLIC_FORM_RATE_LIMIT_MAX = '1';

const makeRes = () => {
    return {
        statusCode: 200,
        headers: {},
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        },
        setHeader(key, value) {
            this.headers[key.toLowerCase()] = value;
        }
    };
};

class QueryBuilder {
    constructor(tableName, tables) {
        this.tableName = tableName;
        this.tables = tables;
        this.filters = [];
        this.selectOptions = null;
    }

    select(_columns = '*', options = null) {
        this.selectOptions = options;
        return this;
    }

    eq(field, value) {
        this.filters.push({ field, value });
        return this;
    }

    order() {
        return this;
    }

    limit() {
        return this;
    }

    insert(payload) {
        const table = this.tables[this.tableName] || [];
        table.push({ ...payload });
        this.tables[this.tableName] = table;
        return Promise.resolve({ data: payload, error: null });
    }

    async single() {
        const rows = this._rows();
        if (rows.length === 0) {
            return { data: null, error: { message: 'No rows found' } };
        }
        return { data: rows[0], error: null };
    }

    async maybeSingle() {
        const rows = this._rows();
        return { data: rows[0] || null, error: null };
    }

    then(resolve, reject) {
        return this._execute().then(resolve, reject);
    }

    async _execute() {
        const rows = this._rows();
        if (this.selectOptions?.head && this.selectOptions?.count === 'exact') {
            return { data: null, error: null, count: rows.length };
        }
        return { data: rows, error: null };
    }

    _rows() {
        let rows = [...(this.tables[this.tableName] || [])];
        for (const filter of this.filters) {
            rows = rows.filter((row) => row?.[filter.field] === filter.value);
        }
        return rows;
    }
}

const createSupabaseMock = () => {
    const now = Date.now();

    const tables = {
        user_profiles: [
            { id: 'student-1', email: 'student1@example.com', role: 'student', user_status: 'active' },
            { id: 'admin-1', email: 'admin1@example.com', role: 'admin', user_status: 'active' },
            { id: 'super-1', email: 'super1@example.com', role: 'super_admin', user_status: 'active' }
        ],
        events: [
            { id: 'event-1', session_state: 'ACTIVE' },
            { id: 'event-2', session_state: 'STOPPED' }
        ],
        forms: [
            {
                id: 'form-past',
                slug: 'past-form',
                status: 'active',
                is_public: true,
                deadline: new Date(now - 60_000).toISOString(),
                title: 'Past Form'
            },
            {
                id: 'form-open',
                slug: 'open-form',
                status: 'active',
                is_public: true,
                deadline: new Date(now + 3_600_000).toISOString(),
                title: 'Open Form'
            }
        ],
        form_fields: [
            { id: 'field-required', form_id: 'form-open', required: true },
            { id: 'field-required-past', form_id: 'form-past', required: true }
        ],
        form_responses: []
    };

    return {
        auth: {
            async getUser(token) {
                if (token === 'valid-student-token') {
                    return { data: { user: { id: 'student-1', email: 'student1@example.com' } }, error: null };
                }
                if (token === 'valid-admin-token') {
                    return { data: { user: { id: 'admin-1', email: 'admin1@example.com' } }, error: null };
                }
                if (token === 'valid-super-token') {
                    return { data: { user: { id: 'super-1', email: 'super1@example.com' } }, error: null };
                }
                if (token === 'expired-token') {
                    return { data: { user: null }, error: { message: 'JWT expired' } };
                }
                return { data: { user: null }, error: { message: 'Invalid token' } };
            }
        },
        from(tableName) {
            return new QueryBuilder(tableName, tables);
        }
    };
};

const dbModulePath = require.resolve('../src/config/db');
require.cache[dbModulePath] = {
    id: dbModulePath,
    filename: dbModulePath,
    loaded: true,
    exports: {
        supabase: createSupabaseMock()
    }
};

const { authenticateToken, verifySuperAdmin } = require('../src/middlewares/auth.middleware');
const formsRouter = require('../src/routes/forms.routes');
const healthController = require('../src/controllers/health.controller');
const attendanceController = require('../src/controllers/attendance.controller');

const getRouteHandlers = (router, path, method) => {
    const layer = router.stack.find((entry) => entry.route && entry.route.path === path && entry.route.methods[method]);
    if (!layer) throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
    return layer.route.stack.map((entry) => entry.handle);
};

const [getPublicFormHandler] = getRouteHandlers(formsRouter, '/public/:slug', 'get');
const [publicSubmitLimiter, postPublicFormHandler] = getRouteHandlers(formsRouter, '/public/:slug/submit', 'post');

test('authenticateToken returns 401 for missing token', async () => {
    const req = { headers: {}, body: {} };
    const res = makeRes();

    await authenticateToken(req, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.equal(res.payload.code, 'AUTH_TOKEN_MISSING');
});

test('authenticateToken returns 401 for invalid token', async () => {
    const req = { headers: { authorization: 'Bearer invalid-token' }, body: {} };
    const res = makeRes();

    await authenticateToken(req, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.equal(res.payload.code, 'AUTH_TOKEN_INVALID');
});

test('verifySuperAdmin blocks admin and allows super admin', () => {
    const adminReq = { user: { role: 'admin' } };
    const adminRes = makeRes();

    verifySuperAdmin(adminReq, adminRes, () => {});
    assert.equal(adminRes.statusCode, 403);
    assert.equal(adminRes.payload.code, 'AUTH_SUPER_ADMIN_REQUIRED');

    const superReq = { user: { role: 'super_admin' } };
    const superRes = makeRes();
    let nextCalled = false;

    verifySuperAdmin(superReq, superRes, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(superRes.statusCode, 200);
});

test('attendance controllers return normalized payload validation errors', async () => {
    const missingPayloadReq = {
        user: { id: 'student-1' },
        body: {},
        headers: {}
    };
    const missingPayloadRes = makeRes();
    await attendanceController.markAttendance(missingPayloadReq, missingPayloadRes);

    assert.equal(missingPayloadRes.statusCode, 400);
    assert.equal(missingPayloadRes.payload.code, 'ATTENDANCE_PAYLOAD_INVALID');

    const missingTokenReq = {
        user: { id: 'student-1' },
        body: { qr_data: {}, device_info: { fingerprint: 'fp-1' } },
        headers: {}
    };
    const missingTokenRes = makeRes();
    await attendanceController.markAttendance(missingTokenReq, missingTokenRes);

    assert.equal(missingTokenRes.statusCode, 400);
    assert.equal(missingTokenRes.payload.code, 'QR_TOKEN_MISSING');
});

test('public form GET returns 410 when deadline has passed', async () => {
    const req = {
        method: 'GET',
        params: { slug: 'past-form' },
        headers: {},
        body: {}
    };
    const res = makeRes();

    await getPublicFormHandler(req, res);

    assert.equal(res.statusCode, 410);
    assert.equal(res.payload.code, 'FORM_DEADLINE_PASSED');
});

test('public form POST returns 410 when deadline has passed', async () => {
    const req = {
        method: 'POST',
        params: { slug: 'past-form' },
        headers: {},
        body: { answers: { 'field-required-past': 'value' } },
        ip: '10.0.0.1'
    };
    const res = makeRes();

    await postPublicFormHandler(req, res);

    assert.equal(res.statusCode, 410);
    assert.equal(res.payload.code, 'FORM_DEADLINE_PASSED');
});

test('public form submit limiter returns 429 after allowed burst', async () => {
    const firstReq = {
        method: 'POST',
        params: { slug: 'open-form' },
        headers: {},
        body: { answers: { 'field-required': 'value-1' } },
        ip: '10.0.0.2'
    };
    const firstRes = makeRes();

    let firstNextCalled = false;
    publicSubmitLimiter(firstReq, firstRes, () => {
        firstNextCalled = true;
    });

    assert.equal(firstNextCalled, true);
    assert.equal(firstRes.statusCode, 200);

    const secondReq = {
        method: 'POST',
        params: { slug: 'open-form' },
        headers: {},
        body: { answers: { 'field-required': 'value-2' } },
        ip: '10.0.0.2'
    };
    const secondRes = makeRes();

    let secondNextCalled = false;
    publicSubmitLimiter(secondReq, secondRes, () => {
        secondNextCalled = true;
    });

    assert.equal(secondNextCalled, false);
    assert.equal(secondRes.statusCode, 429);
    assert.equal(secondRes.payload.code, 'FORM_RATE_LIMIT_EXCEEDED');
});

test('health controllers return expected payloads', async () => {
    const healthRes = makeRes();
    healthController.checkHealth({}, healthRes);

    assert.equal(healthRes.statusCode, 200);
    assert.equal(healthRes.payload.success, true);

    const deepRes = makeRes();
    await healthController.checkDeep({}, deepRes);

    assert.equal(deepRes.statusCode, 200);
    assert.equal(deepRes.payload.status, 'OK');
});
