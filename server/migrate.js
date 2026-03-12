const pool = require('./db');

const SQL = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50),
    customer_name VARCHAR(255) NOT NULL DEFAULT '',
    customer_address TEXT DEFAULT '',
    date_of_issue DATE,
    amount VARCHAR(50) DEFAULT '',
    description_html TEXT DEFAULT '',
    item_name VARCHAR(255) DEFAULT '',
    ring_size VARCHAR(50) DEFAULT '',
    total_weight VARCHAR(100) DEFAULT '',
    metal VARCHAR(255) DEFAULT '',
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS invoices_customer_name_idx ON invoices(customer_name);
  CREATE INDEX IF NOT EXISTS invoices_date_idx ON invoices(date_of_issue);
  CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(SQL);
    console.log('Database migration completed');
  } finally {
    client.release();
  }
}

module.exports = migrate;
