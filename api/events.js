const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://normanwaycalendar.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
}

  try {
    // ✅ GET EVENTS
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM events ORDER BY start_at');
      return res.status(200).json(result.rows);
    }

    // ✅ Parse request body (Vercel-safe)
    let data = {};
    try {
      data = req.body || {};
    } catch (e) {
      data = {};
    }

    // ✅ CREATE EVENT
    if (req.method === 'POST') {
      await pool.query(`
        INSERT INTO events (title, details, lead, contact, note, start_at, end_at, color, is_important)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [
        data.title,
        data.details,
        data.lead,
        data.contact,
        data.note,
        data.start_at,
        data.end_at,
        data.color,
        data.is_important
      ]);

      return res.status(200).json({ ok: true });
    }

    // ✅ UPDATE EVENT
    if (req.method === 'PUT') {
      await pool.query(`
        UPDATE events SET
          title=$1,
          details=$2,
          lead=$3,
          contact=$4,
          note=$5,
          start_at=$6,
          end_at=$7,
          color=$8,
          is_important=$9,
          updated_at=NOW()
        WHERE id=$10
      `, [
        data.title,
        data.details,
        data.lead,
        data.contact,
        data.note,
        data.start_at,
        data.end_at,
        data.color,
        data.is_important,
        data.id
      ]);

      return res.status(200).json({ ok: true });
    }

    // ✅ DELETE EVENT
    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM events WHERE id=$1', [data.id]);
      return res.status(200).json({ ok: true });
    }

    // ❌ Unsupported method
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('API ERROR:', err);

    return res.status(500).json({
      error: err.message || 'Internal server error'
    });
  }
};
