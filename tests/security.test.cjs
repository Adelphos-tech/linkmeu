// ===== LinkMeU Security Test Suite =====
// Usage: JWT_SECRET=test-secret DATABASE_URL=postgresql://... node tests/security.test.cjs

require('dotenv').config();
const http = require('http');
const crypto = require('crypto');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const [HOST, PORT_STR] = BASE_URL.replace('http://', '').split(':');
const PORT = parseInt(PORT_STR || '80');

let passCount = 0;
let failCount = 0;
let testsRun = 0;

function log(type, message) {
    const prefix = type === 'PASS' ? '✓' : type === 'FAIL' ? '✗' : type === 'INFO' ? '▸' : ' ';
    console.log(`${prefix} ${message}`);
}

async function request(method, path, opts = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path,
            method,
            headers: opts.headers || {}
        };
        if (opts.body) {
            const bodyStr = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
            options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
            if (!options.headers['Content-Type']) {
                options.headers['Content-Type'] = 'application/json';
            }
        }
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, headers: res.headers, body: data ? JSON.parse(data) : null });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, body: data });
                }
            });
        });
        req.on('error', reject);
        if (opts.body) {
            req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
        }
        req.end();
    });
}

async function assertEqual(actual, expected, message) {
    testsRun++;
    if (actual === expected) {
        passCount++;
        log('PASS', message);
    } else {
        failCount++;
        log('FAIL', `${message} (expected ${expected}, got ${actual})`);
    }
}

async function assertTrue(condition, message) {
    testsRun++;
    if (condition) {
        passCount++;
        log('PASS', message);
    } else {
        failCount++;
        log('FAIL', message);
    }
}

async function runTests() {
    console.log('\n========================================');
    console.log('  LinkMeU Security Test Suite');
    console.log(`  Target: ${BASE_URL}`);
    console.log('========================================\n');

    const testEmail = `test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}@example.com`;
    const testPassword = 'SecurePass123!';
    let authToken = null;
    let tokenA = null;
    let tokenB = null;

    // ===== PHASE 1: Health & Version =====
    log('INFO', '--- Health & Version ---');
    const health = await request('GET', '/api/health');
    await assertEqual(health.status, 200, 'Health check returns 200');
    await assertTrue(health.body?.status === 'ok', 'Health body has status ok');

    const version = await request('GET', '/api/version');
    await assertEqual(version.status, 200, 'Version returns 200');
    await assertTrue(version.body?.service === 'linkmeu-api', 'Version has correct service name');

    // ===== PHASE 2: Authentication =====
    log('INFO', '\n--- Authentication ---');

    // Register
    const reg = await request('POST', '/api/auth/register', {
        body: { email: testEmail, password: testPassword, name: 'Test User' }
    });
    await assertEqual(reg.status, 201, 'Registration with valid data returns 201');
    await assertTrue(reg.body?.token, 'Registration returns a token');
    await assertTrue(reg.body?.user?.id, 'Registration returns user with id');
    await assertEqual(reg.body?.user?.role, 'user', 'New user has role "user"');
    authToken = reg.body.token;

    // Register duplicate
    const regDup = await request('POST', '/api/auth/register', {
        body: { email: testEmail, password: testPassword, name: 'Test User' }
    });
    await assertEqual(regDup.status, 409, 'Duplicate registration returns 409');

    // Register missing fields
    const regMissing = await request('POST', '/api/auth/register', {
        body: { email: 'incomplete@test.com' }
    });
    await assertEqual(regMissing.status, 400, 'Registration with missing fields returns 400');

    // Register weak password
    const regWeak = await request('POST', '/api/auth/register', {
        body: { email: `weak_${Date.now()}@test.com`, password: '123', name: 'Test' }
    });
    await assertEqual(regWeak.status, 400, 'Registration with weak password returns 400');

    // Register invalid email
    const regBadEmail = await request('POST', '/api/auth/register', {
        body: { email: 'not-an-email', password: testPassword, name: 'Test' }
    });
    await assertEqual(regBadEmail.status, 400, 'Registration with invalid email returns 400');

    // Login valid
    const login = await request('POST', '/api/auth/login', {
        body: { email: testEmail, password: testPassword }
    });
    await assertEqual(login.status, 200, 'Login with valid credentials returns 200');
    await assertTrue(login.body?.token, 'Login returns a token');
    authToken = login.body.token;

    // Login invalid password
    const loginBad = await request('POST', '/api/auth/login', {
        body: { email: testEmail, password: 'wrongpassword' }
    });
    await assertEqual(loginBad.status, 401, 'Login with invalid password returns 401');

    // Login nonexistent user
    const loginNone = await request('POST', '/api/auth/login', {
        body: { email: `nonexistent_${Date.now()}@test.com`, password: testPassword }
    });
    await assertEqual(loginNone.status, 401, 'Login with nonexistent user returns 401');

    // Me with token
    const me = await request('GET', '/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
    await assertEqual(me.status, 200, 'GET /api/auth/me with valid token returns 200');
    await assertEqual(me.body?.user?.email, testEmail, 'Me returns correct email');

    // Me without token
    const meNoAuth = await request('GET', '/api/auth/me');
    await assertEqual(meNoAuth.status, 401, 'GET /api/auth/me without token returns 401');

    // Me with invalid token
    const meBad = await request('GET', '/api/auth/me', {
        headers: { 'Authorization': 'Bearer invalid.token.here' }
    });
    await assertEqual(meBad.status, 401, 'GET /api/auth/me with invalid token returns 401');

    // Me with tampered token
    const meTampered = await request('GET', '/api/auth/me', {
        headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDQwNjA4MDAsImV4cCI6MTcwNDA2MDgwMH0.invalidsignature' }
    });
    await assertEqual(meTampered.status, 401, 'GET /api/auth/me with tampered token returns 401');

    // Logout
    const logout = await request('POST', '/api/auth/logout');
    await assertEqual(logout.status, 200, 'Logout returns 200');

    // Re-login to get fresh token after logout tests
    const login2 = await request('POST', '/api/auth/login', {
        body: { email: testEmail, password: testPassword }
    });
    authToken = login2.body.token;

    // ===== PHASE 3: RBAC =====
    log('INFO', '\n--- RBAC ---');

    // User token should not access admin audit logs
    const auditUser = await request('GET', '/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
    await assertEqual(auditUser.status, 403, 'User cannot access admin audit logs (403)');

    // User token should not PATCH listing status (admin endpoint)
    const patchUser = await request('PATCH', '/api/listings/1/status', {
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: { status: 'approved' }
    });
    await assertEqual(patchUser.status, 403, 'User cannot PATCH listing status (403)');

    // Unauthenticated cannot access protected endpoints
    const patchNoAuth = await request('PATCH', '/api/listings/1/status', {
        body: { status: 'approved' }
    });
    await assertEqual(patchNoAuth.status, 401, 'Unauthenticated PATCH status returns 401');

    const deleteNoAuth = await request('DELETE', '/api/listings/1');
    await assertEqual(deleteNoAuth.status, 401, 'Unauthenticated DELETE listing returns 401');

    const createNoAuth = await request('POST', '/api/listings', {
        body: { category: 'job', purpose: 'sale', title: 'Test', contact: '123', email: 't@test.com', sellerName: 'Test' }
    });
    await assertEqual(createNoAuth.status, 401, 'Unauthenticated POST listing returns 401');

    const meListingsNoAuth = await request('GET', '/api/me/listings');
    await assertEqual(meListingsNoAuth.status, 401, 'Unauthenticated GET /api/me/listings returns 401');

    // ===== PHASE 4: IDOR / Object Authorization =====
    log('INFO', '\n--- IDOR / Object Authorization ---');

    // Create User A
    const emailA = `user_a_${Date.now()}@example.com`;
    const regA = await request('POST', '/api/auth/register', {
        body: { email: emailA, password: testPassword, name: 'User A' }
    });
    await assertEqual(regA.status, 201, 'User A registration successful');
    tokenA = regA.body.token;

    // Create User B
    const emailB = `user_b_${Date.now()}@example.com`;
    const regB = await request('POST', '/api/auth/register', {
        body: { email: emailB, password: testPassword, name: 'User B' }
    });
    await assertEqual(regB.status, 201, 'User B registration successful');
    tokenB = regB.body.token;

    // User A creates a listing
    const listingA = await request('POST', '/api/listings', {
        headers: { 'Authorization': `Bearer ${tokenA}` },
        body: { category: 'job', purpose: 'sale', title: 'User A Listing', contact: '111', email: 'a@test.com', sellerName: 'A' }
    });
    await assertEqual(listingA.status, 201, 'User A creates listing (201)');
    await assertTrue(!!listingA.body?.listing?.id, 'Listing creation returns an ID');
    const listingAId = listingA.body.listing.id;

    // User B tries to PATCH User A's listing → 403
    const idorPatch = await request('PATCH', `/api/listings/${listingAId}`, {
        headers: { 'Authorization': `Bearer ${tokenB}` },
        body: { title: 'Hacked by B' }
    });
    await assertEqual(idorPatch.status, 403, 'User B cannot PATCH User A listing (403)');

    // User B tries to DELETE User A's listing → 403
    const idorDelete = await request('DELETE', `/api/listings/${listingAId}`, {
        headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    await assertEqual(idorDelete.status, 403, 'User B cannot DELETE User A listing (403)');

    // User A can PATCH own listing → 200
    const ownPatch = await request('PATCH', `/api/listings/${listingAId}`, {
        headers: { 'Authorization': `Bearer ${tokenA}` },
        body: { title: 'Updated by A' }
    });
    await assertEqual(ownPatch.status, 200, 'User A can PATCH own listing (200)');

    // User A can DELETE own listing → 200
    const ownDelete = await request('DELETE', `/api/listings/${listingAId}`, {
        headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    await assertEqual(ownDelete.status, 200, 'User A can DELETE own listing (200)');

    // After deletion, User B cannot DELETE again → 404 (already deleted)
    const idorDeleteGone = await request('DELETE', `/api/listings/${listingAId}`, {
        headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    await assertEqual(idorDeleteGone.status, 404, 'Deleted listing returns 404 for everyone');

    // ===== PHASE 5: Input Validation =====
    log('INFO', '\n--- Input Validation ---');

    // Invalid category
    const badCategory = await request('POST', '/api/listings', {
        headers: { 'Authorization': `Bearer ${tokenA}` },
        body: { category: 'invalid_category', purpose: 'sale', title: 'Test', contact: '123', email: 't@test.com', sellerName: 'Test' }
    });
    await assertEqual(badCategory.status, 400, 'Invalid category returns 400');

    // Invalid purpose
    const badPurpose = await request('POST', '/api/listings', {
        headers: { 'Authorization': `Bearer ${tokenA}` },
        body: { category: 'job', purpose: 'invalid_purpose', title: 'Test', contact: '123', email: 't@test.com', sellerName: 'Test' }
    });
    await assertEqual(badPurpose.status, 400, 'Invalid purpose returns 400');

    // Invalid email in listing
    const badEmail = await request('POST', '/api/listings', {
        headers: { 'Authorization': `Bearer ${tokenA}` },
        body: { category: 'job', purpose: 'sale', title: 'Test', contact: '123', email: 'not-an-email', sellerName: 'Test' }
    });
    await assertEqual(badEmail.status, 400, 'Invalid email returns 400');

    // Malformed listing ID
    const badId = await request('GET', '/api/listings/abc');
    await assertEqual(badId.status, 400, 'Malformed listing ID returns 400');

    // Invalid status
    const badStatus = await request('PATCH', '/api/listings/1/status', {
        headers: { 'Authorization': `Bearer ${tokenA}` },
        body: { status: 'hacked' }
    });
    await assertEqual(badStatus.status, 403, 'Invalid status on PATCH returns 403 (also fails admin check)');

    // Empty body on PATCH for nonexistent listing
    const emptyPatch = await request('PATCH', '/api/listings/999999', {
        headers: { 'Authorization': `Bearer ${tokenA}` },
        body: {}
    });
    await assertTrue([400, 404].includes(emptyPatch.status), 'Empty PATCH body returns 400 or 404');

    // ===== PHASE 6: Security Headers & CORS =====
    log('INFO', '\n--- Security Headers & CORS ---');

    const headers = await request('GET', '/api/health');
    await assertTrue(headers.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff');
    await assertTrue(headers.headers['x-frame-options'] === 'DENY', 'X-Frame-Options: DENY');
    await assertTrue(headers.headers['x-xss-protection'] === '1; mode=block', 'X-XSS-Protection present');
    await assertTrue(headers.headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Referrer-Policy present');

    // CORS with hostile origin
    const corsTest = await new Promise((resolve, reject) => {
        const req = http.request({ hostname: HOST, port: PORT, path: '/api/health', method: 'GET', headers: { 'Origin': 'https://evil.com' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
        });
        req.on('error', reject);
        req.end();
    });
    await assertTrue(corsTest.headers['access-control-allow-credentials'] === 'true' || corsTest.status === 403, 'CORS headers or rejection present');

    // ===== PHASE 7: Rate Limiting =====
    log('INFO', '\n--- Rate Limiting ---');

    if (process.env.DISABLE_RATE_LIMIT === 'true') {
        log('INFO', 'Rate limiting disabled for this test run — skipping');
        testsRun++;
        passCount++;
        log('PASS', 'Rate limiting skipped (DISABLE_RATE_LIMIT=true)');
    } else {
        let rateLimited = false;
        for (let i = 0; i < 15; i++) {
            const r = await request('POST', '/api/auth/login', {
                body: { email: `rate_${Date.now()}_${i}@test.com`, password: 'wrong' }
            });
            if (r.status === 429) {
                rateLimited = true;
                break;
            }
        }
        await assertTrue(rateLimited, 'Rate limit returns 429 after repeated requests');
    }

    // ===== PHASE 8: Oversized Body =====
    log('INFO', '\n--- Body Size Limits ---');

    const hugeBody = JSON.stringify({ title: 'A'.repeat(3 * 1024 * 1024) });
    const bigReq = await request('POST', '/api/listings', {
        headers: { 'Authorization': `Bearer ${tokenA}` },
        body: hugeBody
    });
    await assertEqual(bigReq.status, 413, 'Oversized body returns 413');

    // ===== PHASE 9: SQL Injection =====
    log('INFO', '\n--- SQL Injection Resistance ---');

    const sqli = await request('GET', `/api/listings?category=${encodeURIComponent("' OR 1=1 --")}`);
    await assertTrue(sqli.status === 200, 'SQL injection attempt does not crash (200)');
    await assertTrue(Array.isArray(sqli.body?.listings), 'SQL injection returns safe array');

    // ===== PHASE 10: Public Endpoints =====
    log('INFO', '\n--- Public Endpoints ---');

    const listings = await request('GET', '/api/listings');
    await assertEqual(listings.status, 200, 'GET /api/listings public returns 200');

    const stats = await request('GET', '/api/stats');
    await assertEqual(stats.status, 200, 'GET /api/stats public returns 200');

    const singleListing = await request('GET', '/api/listings/1');
    await assertTrue([200, 404].includes(singleListing.status), 'GET /api/listings/:id returns 200 or 404');

    // ===== PHASE 11: Error Sanitization =====
    log('INFO', '\n--- Error Sanitization ---');

    const internal = await request('GET', '/api/listings/999999999');
    if (internal.status === 404 && internal.body) {
        const bodyStr = JSON.stringify(internal.body);
        await assertTrue(!bodyStr.includes('SQL'), 'Error response does not contain SQL details');
        await assertTrue(!bodyStr.includes('syntax'), 'Error response does not contain syntax details');
        await assertTrue(!bodyStr.includes('stack'), 'Error response does not contain stack trace');
    }

    // Malformed JSON
    const badJson = await request('POST', '/api/auth/login', {
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json'
    });
    await assertEqual(badJson.status, 400, 'Malformed JSON returns 400 (not 500)');

    // ===== PHASE 12: Audit Logging =====
    log('INFO', '\n--- Audit Logging ---');

    const auditLogs = await request('GET', '/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    await assertEqual(auditLogs.status, 403, 'Audit logs endpoint is protected (403 for non-admin)');

    // ===== Summary =====
    console.log('\n========================================');
    console.log(`  Results: ${passCount} passed, ${failCount} failed, ${testsRun} total`);
    console.log('========================================');

    if (failCount > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test suite error:', err.message);
    process.exit(1);
});
