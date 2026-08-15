// ===== LinkMeU Backend Server =====
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== Configuration =====
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';
const COOKIE_SECURE = NODE_ENV === 'production';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173,https://linkmeu.com,https://www.linkmeu.com').split(',');

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
}
if (!JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET not set. Using fallback — set a strong secret in production!');
}

const COOKIE_NAME = 'linkmeu_session';

// ===== Validation Constants =====
const VALID_CATEGORIES = ['job', 'business', 'property', 'wedding', 'products', 'event', 'food', 'service'];
const VALID_PURPOSES = ['sale', 'rent', 'buy', 'hire', 'partner', 'franchise', 'investment'];
const VALID_STATUSES = ['pending', 'approved', 'rejected'];
const VALID_URGENCIES = ['normal', 'urgent', 'featured'];
const VALID_ROLES = ['user', 'moderator', 'admin', 'super_admin'];

// ===== Validate critical secrets =====
if (NODE_ENV === 'production' && !JWT_SECRET) {
    console.error('❌ JWT_SECRET is required in production');
    process.exit(1);
}

// ===== Database =====
const poolConfig = { connectionString: DATABASE_URL };
if (!DATABASE_URL.includes('localhost') && process.env.DISABLE_SSL !== 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
}
const pool = new Pool(poolConfig);

// ===== Rate Limiting =====
const requestCounts = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_PUBLIC = 100;
const RATE_LIMIT_AUTH = 10;
const RATE_LIMIT_ADMIN = 30;
const RATE_LIMIT_CREATE = 10;

function rateLimit(limit) {
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
        return (req, res, next) => next();
    }
    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        if (!requestCounts.has(key)) {
            requestCounts.set(key, { count: 1, resetTime: now + RATE_WINDOW_MS });
            return next();
        }
        const record = requestCounts.get(key);
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + RATE_WINDOW_MS;
            return next();
        }
        if (record.count >= limit) {
            return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
        }
        record.count++;
        next();
    };
}

setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
        if (now > record.resetTime + RATE_WINDOW_MS) requestCounts.delete(key);
    }
}, 5 * 60 * 1000);

// ===== Security Headers =====
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    if (NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
    next();
});

// ===== CORS =====
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        if (NODE_ENV === 'development') return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// ===== Body Parsing =====
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Static files
app.use('/uploads', express.static('uploads'));

// ===== Auth Helpers =====
function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET || 'fallback-secret-change-me', { expiresIn: '7d' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET || 'fallback-secret-change-me');
    } catch (e) {
        return null;
    }
}

// Extract user from cookie or Authorization header
function extractUser(req) {
    let token = req.cookies[COOKIE_NAME];
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.replace('Bearer ', '');
    }
    if (!token) return null;
    return verifyToken(token);
}

// ===== Middleware =====
function requireAuth(req, res, next) {
    const user = extractUser(req);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
    req.user = user;
    next();
}

function requireRole(roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (!allowed.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
        }
        next();
    };
}

function requireAdminAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    if (ADMIN_API_KEY && apiKey && apiKey.replace('Bearer ', '') === ADMIN_API_KEY) {
        req.isAdminKey = true;
        req.user = { id: 0, email: 'api-key', role: 'super_admin' }; // synthetic user for audit logging
        return next();
    }
    const user = extractUser(req);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden: admin access required' });
    }
    req.user = user;
    next();
}

// ===== Multer =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('Only image files are allowed!'));
    }
});

// ===== Audit Logger =====
async function logAudit(actorId, action, entityType, entityId, metadata, req) {
    try {
        await pool.query(
            `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [actorId, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null, req.ip, req.headers['user-agent']]
        );
    } catch (e) {
        console.error('Audit log failed:', e.message);
    }
}

// ===== Request ID for tracing =====
function generateRequestId() {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

app.use((req, res, next) => {
    req.requestId = generateRequestId();
    next();
});

// ===== Safe Error Response =====
function safeErrorResponse(res, statusCode, message, internalError) {
    if (NODE_ENV === 'development') console.error(internalError);
    res.status(statusCode).json({ success: false, message });
}

// ===== Initialize Database (migrations) =====
async function initializeDatabase() {
    try {
        await pool.query(`SELECT 1`);
        console.log('✅ Database connection verified');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}

// ===== Auth Routes =====

// Register
app.post('/api/auth/register', rateLimit(RATE_LIMIT_AUTH), async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, created_at`,
            [email, passwordHash, name, phone || null, 'user']
        );

        const user = result.rows[0];
        const token = signToken({ id: user.id, email: user.email, role: user.role });

        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });
    } catch (error) {
        safeErrorResponse(res, 500, 'Registration failed', error);
    }
});

// Login
app.post('/api/auth/login', rateLimit(RATE_LIMIT_AUTH), async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const result = await pool.query('SELECT id, email, name, password_hash, role FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        let valid = await bcrypt.compare(password, user.password_hash);

        // Handle legacy plaintext passwords (migration path)
        if (!valid && !user.password_hash.startsWith('$2')) {
            if (password === user.password_hash) {
                valid = true;
                // Re-hash with bcrypt for future logins
                const newHash = await bcrypt.hash(password, 12);
                await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
                user.password_hash = newHash;
            }
        }

        if (!valid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = signToken({ id: user.id, email: user.email, role: user.role });

        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });
    } catch (error) {
        safeErrorResponse(res, 500, 'Login failed', error);
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true, message: 'Logged out successfully' });
});

// Me
app.get('/api/auth/me', rateLimit(RATE_LIMIT_PUBLIC), async (req, res) => {
    const user = extractUser(req);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    try {
        const result = await pool.query('SELECT id, email, name, phone, avatar_url, role, verified_at, created_at FROM users WHERE id = $1', [user.id]);
        if (result.rows.length === 0) {
            res.clearCookie(COOKIE_NAME);
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to fetch user', error);
    }
});

// ===== API Routes =====

// Health check
app.get('/api/health', rateLimit(RATE_LIMIT_PUBLIC), async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        safeErrorResponse(res, 500, 'Service unavailable', error);
    }
});

// Version
app.get('/api/version', rateLimit(RATE_LIMIT_PUBLIC), (req, res) => {
    let commit = 'unknown';
    try {
        const { execSync } = require('child_process');
        commit = execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim();
    } catch (e) {
        commit = process.env.GIT_COMMIT || 'unknown';
    }
    res.json({ service: 'linkmeu-api', version: '1.2.0', commit, environment: NODE_ENV, timestamp: new Date().toISOString() });
});

// Create listing (requires auth)
app.post('/api/listings', rateLimit(RATE_LIMIT_CREATE), requireAuth, upload.array('photos', 10), async (req, res) => {
    try {
        const {
            category, purpose, fromDate, toDate, title, description,
            currency, budget, budgetMin, budgetMax, revenue, location, country, contact, email, sellerName, sellerType
        } = req.body;

        // Prefer explicit budgetMin/budgetMax; fall back to legacy budget for compatibility
        let budgetMinVal = budgetMin !== undefined ? budgetMin : null;
        let budgetMaxVal = budgetMax !== undefined ? budgetMax : null;
        let budgetVal = budget !== undefined ? budget : null;

        // If legacy budget is provided but min/max are not, derive range from it
        if (budgetVal !== null && budgetMinVal === null && budgetMaxVal === null) {
            const parsed = parseFloat(budgetVal);
            if (!isNaN(parsed)) {
                budgetMinVal = parsed;
                budgetMaxVal = parsed;
            }
        }
        // If only min is provided, use it as the legacy budget
        if (budgetVal === null && budgetMinVal !== null) {
            budgetVal = budgetMinVal;
        }

        if (!category || !purpose || !title || !contact || !email || !sellerName) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        if (!VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
        }
        if (!VALID_PURPOSES.includes(purpose)) {
            return res.status(400).json({ success: false, message: `Invalid purpose. Must be one of: ${VALID_PURPOSES.join(', ')}` });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        let photoUrls = [];
        if (req.files && req.files.length > 0) {
            photoUrls = req.files.map(file => `/uploads/${file.filename}`);
        }
        if (req.body.photoData) {
            try {
                const photoDataArray = JSON.parse(req.body.photoData);
                for (let i = 0; i < photoDataArray.length; i++) {
                    const base64Data = photoDataArray[i].replace(/^data:image\/\w+;base64,/, '');
                    const buffer = Buffer.from(base64Data, 'base64');
                    if (buffer.length > 5 * 1024 * 1024) {
                        return res.status(400).json({ success: false, message: 'Individual photo exceeds 5MB limit' });
                    }
                    const filename = `${Date.now()}-${i}.png`;
                    const filePath = `./uploads/${filename}`;
                    if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads', { recursive: true });
                    fs.writeFileSync(filePath, buffer);
                    photoUrls.push(`/uploads/${filename}`);
                }
            } catch (parseError) {
                return res.status(400).json({ success: false, message: 'Invalid photo data format' });
            }
        }

        const result = await pool.query(
            `INSERT INTO listings (
                category, purpose, from_date, to_date, title, description,
                currency, budget, budget_min, budget_max, revenue, location, country,
                contact, email, seller_name, seller_type, photos, owner_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *`,
            [
                category, purpose, fromDate || null, toDate || null, title, description,
                currency || 'SGD', budgetVal, budgetMinVal, budgetMaxVal, revenue, location, country || 'Singapore',
                contact, email, sellerName, sellerType || 'owner', photoUrls, req.user.id
            ]
        );

        const listing = result.rows[0];
        await logAudit(req.user.id, 'LISTING_CREATED', 'listing', listing.id, { title }, req);

        res.status(201).json({ success: true, message: 'Listing created successfully', listing });
    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to create listing', error);
    }
});

// Get all listings
app.get('/api/listings', rateLimit(RATE_LIMIT_PUBLIC), async (req, res) => {
    try {
        const { category, purpose, status, limit = 50, offset = 0 } = req.query;
        const parsedLimit = Math.min(parseInt(limit) || 50, 100);
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);

        let query = 'SELECT l.*, u.name as owner_name, u.email as owner_email FROM listings l LEFT JOIN users u ON l.owner_id = u.id WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (category) { query += ` AND l.category = $${paramIndex++}`; params.push(category); }
        if (purpose) { query += ` AND l.purpose = $${paramIndex++}`; params.push(purpose); }
        if (status) { query += ` AND l.status = $${paramIndex++}`; params.push(status); }

        query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parsedLimit, parsedOffset);

        const result = await pool.query(query, params);

        let countQuery = 'SELECT COUNT(*) FROM listings WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;
        if (category) { countQuery += ` AND category = $${countParamIndex++}`; countParams.push(category); }
        if (purpose) { countQuery += ` AND purpose = $${countParamIndex++}`; countParams.push(purpose); }
        if (status) { countQuery += ` AND status = $${countParamIndex++}`; countParams.push(status); }
        const countResult = await pool.query(countQuery, countParams);

        res.json({ success: true, listings: result.rows, total: parseInt(countResult.rows[0].count), limit: parsedLimit, offset: parsedOffset });
    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to fetch listings', error);
    }
});

// Get single listing
app.get('/api/listings/:id', rateLimit(RATE_LIMIT_PUBLIC), async (req, res) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(id)) return res.status(400).json({ success: false, message: 'Invalid listing ID' });

        const result = await pool.query(
            `SELECT l.*, u.name as owner_name, u.email as owner_email
             FROM listings l LEFT JOIN users u ON l.owner_id = u.id WHERE l.id = $1`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Listing not found' });

        res.json({ success: true, listing: result.rows[0] });
    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to fetch listing', error);
    }
});

// Update listing status (admin only)
app.patch('/api/listings/:id/status', rateLimit(RATE_LIMIT_ADMIN), requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!/^\d+$/.test(id)) return res.status(400).json({ success: false, message: 'Invalid listing ID' });
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
        }

        const result = await pool.query(
            'UPDATE listings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Listing not found' });

        const actorId = req.user ? req.user.id : null;
        await logAudit(actorId, `LISTING_${status.toUpperCase()}`, 'listing', parseInt(id), { status }, req);

        res.json({ success: true, message: `Listing ${status}`, listing: result.rows[0] });
    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to update listing', error);
    }
});

// Delete listing (owner or admin)
app.delete('/api/listings/:id', rateLimit(RATE_LIMIT_ADMIN), requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(id)) return res.status(400).json({ success: false, message: 'Invalid listing ID' });

        const listingResult = await pool.query('SELECT owner_id FROM listings WHERE id = $1', [id]);
        if (listingResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Listing not found' });

        const listing = listingResult.rows[0];
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
        const isOwner = listing.owner_id === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: 'Forbidden: you can only delete your own listings' });
        }

        // Delete photos
        const photoResult = await pool.query('SELECT photos FROM listings WHERE id = $1', [id]);
        if (photoResult.rows.length > 0 && photoResult.rows[0].photos) {
            for (const photo of photoResult.rows[0].photos) {
                const filePath = `.${photo}`;
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        }

        await pool.query('DELETE FROM listings WHERE id = $1', [id]);
        await logAudit(req.user.id, 'LISTING_DELETED', 'listing', parseInt(id), null, req);

        res.json({ success: true, message: 'Listing deleted successfully' });
    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to delete listing', error);
    }
});

// Update own listing
app.patch('/api/listings/:id', rateLimit(RATE_LIMIT_CREATE), requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(id)) return res.status(400).json({ success: false, message: 'Invalid listing ID' });

        const listingResult = await pool.query('SELECT owner_id FROM listings WHERE id = $1', [id]);
        if (listingResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Listing not found' });

        const listing = listingResult.rows[0];
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
        const isOwner = listing.owner_id === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: 'Forbidden: you can only edit your own listings' });
        }

        const allowedFields = ['title', 'description', 'currency', 'budget', 'budget_min', 'budget_max', 'revenue', 'location', 'country', 'contact', 'email', 'seller_name', 'seller_type'];
        const updates = [];
        const values = [];
        let paramIndex = 1;

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = $${paramIndex++}`);
                values.push(req.body[field]);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE listings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        await logAudit(req.user.id, 'LISTING_UPDATED', 'listing', parseInt(id), { fields: updates.map(u => u.split(' ')[0]) }, req);
        res.json({ success: true, message: 'Listing updated successfully', listing: result.rows[0] });
    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to update listing', error);
    }
});

// Get user dashboard listings
app.get('/api/me/listings', rateLimit(RATE_LIMIT_PUBLIC), requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM listings WHERE owner_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, listings: result.rows });
    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to fetch user listings', error);
    }
});

// Get audit logs (admin only)
app.get('/api/admin/audit-logs', rateLimit(RATE_LIMIT_ADMIN), requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const parsedLimit = Math.min(parseInt(limit) || 50, 100);
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);

        const result = await pool.query(
            `SELECT a.*, u.name as actor_name, u.email as actor_email
             FROM audit_logs a LEFT JOIN users u ON a.actor_id = u.id
             ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
            [parsedLimit, parsedOffset]
        );
        res.json({ success: true, logs: result.rows });
    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to fetch audit logs', error);
    }
});

// Stats
app.get('/api/stats', rateLimit(RATE_LIMIT_PUBLIC), async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'approved') as approved,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
                COUNT(*) FILTER (WHERE category = 'property') as property,
                COUNT(*) FILTER (WHERE category = 'business') as business,
                COUNT(*) FILTER (WHERE category = 'food') as food,
                COUNT(*) FILTER (WHERE category = 'products') as products
            FROM listings
        `);
        res.json({ success: true, stats: stats.rows[0] });
    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to fetch statistics', error);
    }
});

// ===== Static Frontend =====
const STATIC_PATH = process.env.STATIC_PATH || '/var/www/linkmeu';
if (fs.existsSync(STATIC_PATH)) {
    app.use(express.static(STATIC_PATH));
    app.get('*', (req, res, next) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(STATIC_PATH, 'index.html'));
        } else {
            next();
        }
    });
}

// ===== Error Handlers =====
app.use((err, req, res, next) => {
    // JSON parse errors from body-parser
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON' });
    }
    if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413 || err.message?.includes('too large')) {
        return res.status(413).json({ success: false, message: 'Payload too large' });
    }
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ success: false, message: 'CORS error' });
    }
    next(err);
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ===== Start Server =====
async function startServer() {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`\n🚀 LinkMeU Server v1.2.0 running at http://localhost:${PORT}`);
            console.log(`📋 Auth Endpoints:`);
            console.log(`   POST   /api/auth/register     - Register new user`);
            console.log(`   POST   /api/auth/login        - Login`);
            console.log(`   POST   /api/auth/logout       - Logout`);
            console.log(`   GET    /api/auth/me           - Get current user`);
            console.log(`📋 API Endpoints:`);
            console.log(`   GET    /api/health            - Health check`);
            console.log(`   GET    /api/version           - Version info`);
            console.log(`   GET    /api/listings          - Get listings`);
            console.log(`   POST   /api/listings          - Create listing (auth required)`);
            console.log(`   GET    /api/listings/:id      - Get single listing`);
            console.log(`   PATCH  /api/listings/:id      - Update own listing (auth)`);
            console.log(`   PATCH  /api/listings/:id/status - Update status (admin)`);
            console.log(`   DELETE /api/listings/:id      - Delete listing (owner/admin)`);
            console.log(`   GET    /api/me/listings       - User dashboard listings`);
            console.log(`   GET    /api/admin/audit-logs  - Admin audit logs`);
            console.log(`   GET    /api/stats              - Statistics\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

startServer();
