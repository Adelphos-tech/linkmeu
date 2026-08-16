const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_VQ5HOeibEsR9@ep-cool-mud-a1val5vs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Creating clubs tables...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clubs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        logo TEXT,
        contact_person VARCHAR(255) DEFAULT '',
        contact VARCHAR(100) DEFAULT '',
        email VARCHAR(255) NOT NULL,
        address TEXT DEFAULT '',
        postal_code VARCHAR(20) DEFAULT '',
        website VARCHAR(500) DEFAULT '',
        opening_hours JSONB DEFAULT '{}',
        annual_fee DECIMAL(10, 2) DEFAULT 120.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ clubs table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS club_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        photo TEXT,
        contact VARCHAR(100) DEFAULT '',
        email VARCHAR(255) NOT NULL,
        comments TEXT DEFAULT '',
        registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
        membership_type VARCHAR(50) DEFAULT 'annual' CHECK (membership_type IN ('annual', 'lifetime', 'honorary')),
        payment_status VARCHAR(50) DEFAULT 'not_paid' CHECK (payment_status IN ('not_paid', 'partial', 'paid')),
        amount_paid DECIMAL(10, 2) DEFAULT 0.00,
        prorata_fee DECIMAL(10, 2) DEFAULT 0.00,
        member_category VARCHAR(50) DEFAULT 'individual' CHECK (member_category IN ('individual', 'company')),
        ic_passport VARCHAR(100) DEFAULT '',
        nationality VARCHAR(100) DEFAULT '',
        roc_number VARCHAR(100) DEFAULT '',
        country VARCHAR(100) DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ club_members table created');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_club_members_email ON club_members(email);`);
    console.log('✅ indexes created');

    // Check if clubs already exist
    const existing = await pool.query('SELECT COUNT(*) FROM clubs');
    if (parseInt(existing.rows[0].count) > 0) {
      console.log('Clubs already exist, skipping insert');
    } else {
      // Insert clubs
      await pool.query(`
        INSERT INTO clubs (id, name, description, logo, contact_person, contact, email, annual_fee, created_at, updated_at)
        VALUES
        ('93bb4ffd-6ba4-4a62-a327-81edb3861388', 'India Community Welfare Centre',
         'Indian Community Welfare Centre (ICWC), Singapore – Organisation Description. The Indian Community Welfare Centre (ICWC) is a dedicated social service organisation in Singapore committed to supporting the well-being, resilience, and progress of the Indian community. Established to address the diverse needs of individuals and families, ICWC provides a wide spectrum of welfare, empowerment, and community development initiatives that promote stability, opportunity, and social integration. ICWC works closely with government agencies, community partners, and volunteers to offer practical assistance such as counselling, crisis intervention, family support services, employment guidance, skills development, and social outreach programmes. The Centre plays a vital role in helping vulnerable groups—including low-income households, migrant workers, seniors, and individuals facing personal or financial challenges—access timely help and navigate difficult situations. Beyond welfare support, ICWC actively fosters community bonding, cultural preservation, and youth engagement through events, workshops, and educational programmes that strengthen social cohesion and celebrate the Indian heritage within Singapore''s multicultural society. With a strong commitment to compassion, professionalism, and community upliftment, the Indian Community Welfare Centre continues to be a trusted pillar of support, empowering individuals to rebuild their lives and contribute meaningfully to the nation.',
         NULL, 'Habib', '+6590191311', 'indianwelfaresg@gmail.com', 120,
         '2026-01-18T07:03:11.616045+00:00', '2026-01-18T07:05:05.654+00:00')
      `);

      await pool.query(`
        INSERT INTO clubs (id, name, description, logo, contact_person, contact, email, annual_fee, created_at, updated_at)
        VALUES
        ('d048b473-3bd8-4dd5-bb7b-29e8839cfdae', 'LISHA (LITTLE INDIA SHOPKEEPERS & HERITAGE ASSOCIATION)',
         'Little India''s unique heritage and character amongst locals and tourist. With the strong support from government bodies such as the Singapore Tourist Promotion Board (STB) and Hindu Endowments Board (HEB) and professional organizations such as the Serangoon Merchant''s Association, LISHA (Little India Shopkeepers & Heritage Association) was established in 2000 to promote the precinct''s heritage, culture, business and commercial activities. India is known for its festivals and celebrations and therefore it is only right that Little India represents this very distinct attribute of the Indian sub-continent. Therefore, LISHA plays a significant role in organising yearly festivities such as, Deepavali Light Up, Deepavali Festival Village, Pongal Festival, Tamil New Year Celebrations, Singapore Food Festival, Vesak Celebrations and Thaipusam. Amongst the ethnic districts in Singapore, Little India has the most diverse range of commercial, religious, heritage and cultural organisations. Being committed to improve the cultural and ethnic character of Little India as well as to make Little India a shopper''s paradise and preferred tourist destination in Singapore, LISHA addresses the concerns and needs of the various communities in Little India. It also organizes heritage exhibitions and interactive educational journeys during these festive seasons. As a socially conscious organization, LISHA has raised funds and contributed towards the President''s Challenge, SINDA''s Project Give and National Book Council of Singapore yearly. It has also contributed towards SARS Courage Fund, Vesak Bursary Awards (to SINDA), NTU - Rajaratnam School of International Studies Endowment Fund, Tsunami Relief Fund, Mercy Relief Humanitarian Help - raised fund for Srilankan citizens affected in civil war and Chennai Flood Relief Fund.',
         NULL, 'Mr Fakrudeen', '+ 65 6392 2246', 'secretariat@lisha.org.sg', 120,
         '2026-01-18T07:22:43.934518+00:00', '2026-01-18T07:29:36.626+00:00')
      `);
      console.log('✅ 2 clubs inserted');

      // Insert members
      await pool.query(`
        INSERT INTO club_members (id, club_id, name, contact, email, comments, registration_date, membership_type, payment_status, amount_paid, prorata_fee, created_at, updated_at, member_category, roc_number, country)
        VALUES
        ('26886005-f26c-4f4c-9fa8-a51e3dfaf1e7', 'd048b473-3bd8-4dd5-bb7b-29e8839cfdae',
         'Royal Kings Group Pte Ltd', '+6590672616', 'siraj@royalkinggroups.com',
         'Established in 2013, Royal Kings Group (RKG) is a brand representing a commitment to quality, integrity, and client satisfaction throughout the Asia-Pacific ...',
         '2026-01-19', 'annual', 'not_paid', 0, 120,
         '2026-01-19T14:15:29.8121+00:00', '2026-01-19T14:15:29.8121+00:00',
         'company', '', '')
      `);

      await pool.query(`
        INSERT INTO club_members (id, club_id, name, contact, email, comments, registration_date, membership_type, payment_status, amount_paid, prorata_fee, created_at, updated_at, member_category, roc_number, country)
        VALUES
        ('ba2b8edd-1dc3-4281-a3ce-9db529a25511', '93bb4ffd-6ba4-4a62-a327-81edb3861388',
         'LinkmeU', '90191311', 'linkmeucom@gmail.com', '',
         '2026-02-05', 'annual', 'not_paid', 0, 110,
         '2026-02-04T22:30:56.029351+00:00', '2026-02-04T22:31:18.218+00:00',
         'company', '', '')
      `);
      console.log('✅ 2 club members inserted');
    }

    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
