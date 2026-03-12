const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/invoices
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, invoice_number, customer_name, customer_address, date_of_issue,
              amount, item_name, ring_size, total_weight, metal,
              description_html, status, created_at, updated_at
       FROM invoices ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/meta/next-number  — must be before /:id
router.get('/meta/next-number', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT invoice_number FROM invoices WHERE invoice_number ~ '^[0-9]+$' ORDER BY invoice_number::int DESC LIMIT 1`
    );
    const last = rows[0] ? parseInt(rows[0].invoice_number) : 0;
    res.json({ next: String(last + 1).padStart(4, '0') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices
router.post('/', async (req, res) => {
  try {
    const { invoice_number, customer_name, customer_address, date_of_issue,
            amount, description_html, item_name, ring_size, total_weight, metal,
            item_image, status: bodyStatus } = req.body;

    const status = bodyStatus || 'draft';

    const { rows } = await pool.query(
      `INSERT INTO invoices
         (invoice_number, customer_name, customer_address, date_of_issue,
          amount, description_html, item_name, ring_size, total_weight, metal, item_image, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [invoice_number, customer_name, customer_address, date_of_issue,
       amount, description_html, item_name, ring_size, total_weight, metal, item_image || '', status]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/invoices/:id
router.put('/:id', async (req, res) => {
  try {
    const { invoice_number, customer_name, customer_address, date_of_issue,
            amount, description_html, item_name, ring_size, total_weight, metal,
            item_image, status: bodyStatus } = req.body;

    const status = bodyStatus || 'draft';

    const { rows } = await pool.query(
      `UPDATE invoices SET
         invoice_number=$1, customer_name=$2, customer_address=$3, date_of_issue=$4,
         amount=$5, description_html=$6, item_name=$7, ring_size=$8,
         total_weight=$9, metal=$10, item_image=$11, status=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [invoice_number, customer_name, customer_address, date_of_issue,
       amount, description_html, item_name, ring_size, total_weight, metal,
       item_image || '', status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
