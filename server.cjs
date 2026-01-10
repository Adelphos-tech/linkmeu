// ===== LinkMeU Backend Server =====
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== Database Configuration =====
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_qAKgfIdhz83u@ep-patient-tree-a1b20lax-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
    ssl: {
        rejectUnauthorized: false
    }
});

// ===== Middleware =====
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

// Configure multer for file uploads
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

app.use('/uploads', express.static('uploads'));

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
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
        `);

        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
}

// ===== API Routes =====

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
    }
});

// Create a new listing
app.post('/api/listings', upload.array('photos', 10), async (req, res) => {
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

        // Handle uploaded photos
        let photoUrls = [];
        if (req.files && req.files.length > 0) {
            photoUrls = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Handle base64 photos sent from frontend
        if (req.body.photoData) {
            const photoDataArray = JSON.parse(req.body.photoData);
            for (let i = 0; i < photoDataArray.length; i++) {
                const base64Data = photoDataArray[i].replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `${Date.now()}-${i}.png`;
                const filePath = `./uploads/${filename}`;

                if (!fs.existsSync('./uploads')) {
                    fs.mkdirSync('./uploads', { recursive: true });
                }
                fs.writeFileSync(filePath, buffer);
                photoUrls.push(`/uploads/${filename}`);
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

        // Generate WhatsApp message
        const whatsappMessage = encodeURIComponent(
            `🆕 New LinkMeU Listing!\n\n` +
            `📋 Category: ${category}\n` +
            `🎯 Purpose: ${purpose}\n` +
            `📝 Title: ${title}\n` +
            `💰 Budget: ${currency} ${budget}\n` +
            `📍 Location: ${location}, ${country}\n` +
            `📞 Contact: ${contact}\n` +
            `📧 Email: ${email}\n\n` +
            `View listing ID: #${listing.id}`
        );

        res.status(201).json({
            success: true,
            message: 'Listing created successfully',
            listing,
            whatsappLink: `https://wa.me/6590191311?text=${whatsappMessage}`
        });

    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create listing',
            error: error.message
        });
    }
});

// Get all listings (with filters)
app.get('/api/listings', async (req, res) => {
    try {
        const { category, purpose, status, limit = 50, offset = 0 } = req.query;

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
        params.push(parseInt(limit), parseInt(offset));

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
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch listings',
            error: error.message
        });
    }
});

// Get single listing by ID
app.get('/api/listings/:id', async (req, res) => {
    try {
        const { id } = req.params;
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
        console.error('Error fetching listing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch listing',
            error: error.message
        });
    }
});

// Update listing status (for admin)
app.patch('/api/listings/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

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
        console.error('Error updating listing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update listing',
            error: error.message
        });
    }
});

// Delete listing
app.delete('/api/listings/:id', async (req, res) => {
    try {
        const { id } = req.params;

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
        console.error('Error deleting listing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete listing',
            error: error.message
        });
    }
});

// Get listings statistics
app.get('/api/stats', async (req, res) => {
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
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
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
            console.log(`   PATCH  /api/listings/:id/status - Update listing status`);
            console.log(`   DELETE /api/listings/:id    - Delete listing`);
            console.log(`   GET    /api/stats           - Get statistics\n`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
