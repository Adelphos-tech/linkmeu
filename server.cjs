// ===== LinkMeU Backend Server =====
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== Configuration =====
const DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173,https://linkmeu.com,https://www.linkmeu.com').split(',');

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
}

if (!ADMIN_API_KEY && NODE_ENV === 'production') {
    console.warn('⚠️  ADMIN_API_KEY not set. Admin endpoints will be inaccessible.');
}

// ===== Database Configuration =====
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// ===== Rate Limiting (in-memory) =====
const requestCounts = new Map();
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_PUBLIC = 100;    // requests per window for public endpoints
const RATE_LIMIT_ADMIN = 30;      // requests per window for admin endpoints
const RATE_LIMIT_CREATE = 10;     // requests per window for POST /api/listings

function rateLimit(limit) {
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
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.'
            });
        }

        record.count++;
        next();
    };
}

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
        if (now > record.resetTime + RATE_WINDOW_MS) {
            requestCounts.delete(key);
        }
    }
}, 5 * 60 * 1000); // every 5 minutes

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
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        if (NODE_ENV === 'development') return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// ===== Body Parsing (reduced limits) =====
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// ===== Authentication Middleware =====
function requireAdminAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    const expectedKey = ADMIN_API_KEY;

    if (!expectedKey) {
        return res.status(503).json({
            success: false,
            message: 'Admin access not configured'
        });
    }

    if (!apiKey || apiKey.replace('Bearer ', '') !== expectedKey) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    next();
}

// ===== Configure multer for file uploads =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// ===== Initialize Database Tables =====
async function initializeDatabase() {
    try {
        // Create listings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS listings (
                id SERIAL PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                purpose VARCHAR(50) NOT NULL,
                from_date DATE,
                to_date DATE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                currency VARCHAR(10) DEFAULT 'SGD',
                budget VARCHAR(100),
                revenue VARCHAR(200),
                location VARCHAR(255),
                country VARCHAR(100) DEFAULT 'Singapore',
                contact VARCHAR(50) NOT NULL,
                email VARCHAR(255) NOT NULL,
                seller_name VARCHAR(255) NOT NULL,
                seller_type VARCHAR(50) DEFAULT 'owner',
                photos TEXT[], -- Array of photo URLs
                status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
                urgency VARCHAR(20) DEFAULT 'normal', -- normal, urgent, featured
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create index for faster queries
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);`);

        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
}

// ===== Error Response Helper =====
function safeErrorResponse(res, statusCode, message, internalError) {
    if (NODE_ENV === 'development') {
        console.error(internalError);
    }
    res.status(statusCode).json({
        success: false,
        message: message
    });
}

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

// Version endpoint
app.get('/api/version', rateLimit(RATE_LIMIT_PUBLIC), (req, res) => {
    let commit = 'unknown';
    try {
        const { execSync } = require('child_process');
        commit = execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim();
    } catch (e) {
        commit = process.env.GIT_COMMIT || 'unknown';
    }
    res.json({
        service: 'linkmeu-api',
        version: '1.1.0',
        commit,
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Create a new listing
app.post('/api/listings', rateLimit(RATE_LIMIT_CREATE), upload.array('photos', 10), async (req, res) => {
    try {
        const {
            category,
            purpose,
            fromDate,
            toDate,
            title,
            description,
            currency,
            budget,
            revenue,
            location,
            country,
            contact,
            email,
            sellerName,
            sellerType
        } = req.body;

        // Basic validation
        if (!category || !purpose || !title || !contact || !email || !sellerName) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: category, purpose, title, contact, email, sellerName'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Handle uploaded photos
        let photoUrls = [];
        if (req.files && req.files.length > 0) {
            photoUrls = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Handle base64 photos sent from frontend (deprecated but still supported)
        if (req.body.photoData) {
            try {
                const photoDataArray = JSON.parse(req.body.photoData);
                for (let i = 0; i < photoDataArray.length; i++) {
                    const base64Data = photoDataArray[i].replace(/^data:image\/\w+;base64,/, '');
                    const buffer = Buffer.from(base64Data, 'base64');
                    if (buffer.length > 5 * 1024 * 1024) {
                        return res.status(400).json({
                            success: false,
                            message: 'Individual photo exceeds 5MB limit'
                        });
                    }
                    const filename = `${Date.now()}-${i}.png`;
                    const filePath = `./uploads/${filename}`;
                    if (!fs.existsSync('./uploads')) {
                        fs.mkdirSync('./uploads', { recursive: true });
                    }
                    fs.writeFileSync(filePath, buffer);
                    photoUrls.push(`/uploads/${filename}`);
                }
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid photo data format'
                });
            }
        }

        const result = await pool.query(
            `INSERT INTO listings (
                category, purpose, from_date, to_date, title, description,
                currency, budget, revenue, location, country,
                contact, email, seller_name, seller_type, photos
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
                category,
                purpose,
                fromDate || null,
                toDate || null,
                title,
                description,
                currency || 'SGD',
                budget,
                revenue,
                location,
                country || 'Singapore',
                contact,
                email,
                sellerName,
                sellerType || 'owner',
                photoUrls
            ]
        );

        const listing = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Listing created successfully',
            listing
        });

    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to create listing', error);
    }
});

// Get all listings (with filters)
app.get('/api/listings', rateLimit(RATE_LIMIT_PUBLIC), async (req, res) => {
    try {
        const { category, purpose, status, limit = 50, offset = 0 } = req.query;

        // Validate limit
        const parsedLimit = Math.min(parseInt(limit) || 50, 100); // max 100
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);  // min 0

        let query = 'SELECT * FROM listings WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (category) {
            query += ` AND category = $${paramIndex++}`;
            params.push(category);
        }

        if (purpose) {
            query += ` AND purpose = $${paramIndex++}`;
            params.push(purpose);
        }

        if (status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(status);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parsedLimit, parsedOffset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM listings WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        if (category) {
            countQuery += ` AND category = $${countParamIndex++}`;
            countParams.push(category);
        }
        if (purpose) {
            countQuery += ` AND purpose = $${countParamIndex++}`;
            countParams.push(purpose);
        }
        if (status) {
            countQuery += ` AND status = $${countParamIndex++}`;
            countParams.push(status);
        }

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            listings: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parsedLimit,
            offset: parsedOffset
        });

    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to fetch listings', error);
    }
});

// Get single listing by ID
app.get('/api/listings/:id', rateLimit(RATE_LIMIT_PUBLIC), async (req, res) => {
    try {
        const { id } = req.params;
        // Validate id is a number
        if (!/^\d+$/.test(id)) {
            return res.status(400).json({ success: false, message: 'Invalid listing ID' });
        }

        const result = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }

        res.json({
            success: true,
            listing: result.rows[0]
        });

    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to fetch listing', error);
    }
});

// Update listing status (ADMIN ONLY - protected)
app.patch('/api/listings/:id/status', rateLimit(RATE_LIMIT_ADMIN), requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({ success: false, message: 'Invalid listing ID' });
        }

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: pending, approved, or rejected'
            });
        }

        const result = await pool.query(
            'UPDATE listings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }

        res.json({
            success: true,
            message: `Listing ${status}`,
            listing: result.rows[0]
        });

    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to update listing', error);
    }
});

// Delete listing (ADMIN ONLY - protected)
app.delete('/api/listings/:id', rateLimit(RATE_LIMIT_ADMIN), requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({ success: false, message: 'Invalid listing ID' });
        }

        // Get listing to delete photos
        const listing = await pool.query('SELECT photos FROM listings WHERE id = $1', [id]);

        if (listing.rows.length > 0 && listing.rows[0].photos) {
            // Delete associated photos
            for (const photo of listing.rows[0].photos) {
                const filePath = `.${photo}`;
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        const result = await pool.query('DELETE FROM listings WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }

        res.json({
            success: true,
            message: 'Listing deleted successfully'
        });

    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to delete listing', error);
    }
});

// Get listings statistics
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

        res.json({
            success: true,
            stats: stats.rows[0]
        });

    } catch (error) {
        safeErrorResponse(res, 500, 'Failed to fetch statistics', error);
    }
});

// ===== Serve Static Frontend =====
const STATIC_PATH = process.env.STATIC_PATH || '/var/www/linkmeu';
if (fs.existsSync(STATIC_PATH)) {
    app.use(express.static(STATIC_PATH));
    // SPA fallback: serve index.html for non-API routes
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(STATIC_PATH, 'index.html'));
        }
    });
}

// ===== Payload Size Error Handler =====
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413 || err.message?.includes('too large')) {
        return res.status(413).json({ success: false, message: 'Payload too large' });
    }
    next(err);
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ success: false, message: 'CORS error' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ===== Start Server =====
async function startServer() {
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to Neon PostgreSQL database');

        // Initialize tables
        await initializeDatabase();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n🚀 LinkMeU Server running at http://localhost:${PORT}`);
            console.log(`📋 API Endpoints:`);
            console.log(`   GET    /api/health          - Health check`);
            console.log(`   GET    /api/listings        - Get all listings`);
            console.log(`   GET    /api/listings/:id    - Get single listing`);
            console.log(`   POST   /api/listings        - Create new listing`);
            console.log(`   PATCH  /api/listings/:id/status - Update listing status (ADMIN)`);
            console.log(`   DELETE /api/listings/:id    - Delete listing (ADMIN)`);
            console.log(`   GET    /api/stats           - Get statistics\n`);
            console.log(`🔒 Admin endpoints require x-api-key header\n`);
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
