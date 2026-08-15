// ===== LinkMeU Rate Limit Test =====
// Usage: JWT_SECRET=test-secret DATABASE_URL=... node tests/rate-limit.test.cjs

require('dotenv').config();
const http = require('http');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const [HOST, PORT_STR] = BASE_URL.replace('http://', '').split(':');
const PORT = parseInt(PORT_STR || '80');

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

async function runTest() {
    console.log('\n========================================');
    console.log('  LinkMeU Rate Limit Test');
    console.log(`  Target: ${BASE_URL}`);
    console.log('========================================\n');

    // Register a user first
    const testEmail = `ratelimit_${Date.now()}@example.com`;
    const reg = await request('POST', '/api/auth/register', {
        body: { email: testEmail, password: 'password123', name: 'Rate Limit Test' }
    });
    if (reg.status !== 201) {
        console.log('Failed to register test user:', reg.status, reg.body);
        process.exit(1);
    }

    // Hit login endpoint repeatedly (limit is 10/min)
    let got429 = false;
    const results = [];
    for (let i = 0; i < 15; i++) {
        const r = await request('POST', '/api/auth/login', {
            body: { email: `dummy_${Date.now()}_${i}@test.com`, password: 'wrong' }
        });
        results.push(r.status);
        if (r.status === 429) {
            got429 = true;
            break;
        }
    }

    console.log('Status codes:', results.join(', '));

    if (got429) {
        console.log('✓ Rate limiting works: received 429 after threshold');
        process.exit(0);
    } else {
        console.log('✗ Rate limiting FAILED: no 429 received');
        process.exit(1);
    }
}

runTest().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
