const test = require('node:test');
const assert = require('node:assert/strict');
const { requireRole, requireSelfOrRole } = require('../src/middlewares/auth.middleware');

const createRes = () => {
    const res = {
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        }
    };
    return res;
};

test('requireRole allows configured role', () => {
    const middleware = requireRole(['admin', 'super_admin']);
    const req = { user: { role: 'admin' } };
    const res = createRes();
    let called = false;

    middleware(req, res, () => {
        called = true;
    });

    assert.equal(called, true);
    assert.equal(res.statusCode, 200);
});

test('requireRole blocks non-allowed role', () => {
    const middleware = requireRole(['admin']);
    const req = { user: { role: 'student' } };
    const res = createRes();

    middleware(req, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.equal(res.payload.code, 'AUTH_FORBIDDEN');
});

test('requireSelfOrRole allows self access', () => {
    const middleware = requireSelfOrRole({ param: 'studentId', roles: ['admin'] });
    const req = {
        user: { id: 'u-1', role: 'student' },
        params: { studentId: 'u-1' }
    };
    const res = createRes();
    let called = false;

    middleware(req, res, () => {
        called = true;
    });

    assert.equal(called, true);
});

test('requireSelfOrRole allows admin access to another user', () => {
    const middleware = requireSelfOrRole({ param: 'studentId', roles: ['admin'] });
    const req = {
        user: { id: 'admin-1', role: 'admin' },
        params: { studentId: 'u-2' }
    };
    const res = createRes();
    let called = false;

    middleware(req, res, () => {
        called = true;
    });

    assert.equal(called, true);
});

test('requireSelfOrRole blocks different user without allowed role', () => {
    const middleware = requireSelfOrRole({ param: 'studentId', roles: ['admin'] });
    const req = {
        user: { id: 'u-1', role: 'student' },
        params: { studentId: 'u-2' }
    };
    const res = createRes();

    middleware(req, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.equal(res.payload.code, 'AUTH_FORBIDDEN');
});
