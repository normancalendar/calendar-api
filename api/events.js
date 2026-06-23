const { Pool } = require('pg');

async function getBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(JSON.parse(body || '{}')));
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
  res.status(200).end();
  return;
}


  try {
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM events ORDER BY start_at');
      return res.json(result.rows);
    }

    if (req.method === 'POST') {
      const e = await getBody(req);
      await pool.query(`
        INSERT INTO events (title, details, lead, contact, note, start_at, end_at, color, is_important)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [
        e.title, e.details, e.lead, e.contact,
        e.note, e.start_at, e.end_at,
        e.color, e.is_important
      ]);
      return res.json({ ok: true });
    }

    if (req.method === 'PUT') {
      const e = await getBody(req);
      await pool.query(`
        UPDATE events SET
          title=$1, details=$2, lead=$3, contact=$4,
          note=$5, start_at=$6, end_at=$7,
          color=$8, is_important=$9,
          updated_at=NOW()
        WHERE id=$10
      `, [
        e.title, e.details, e.lead, e.contact,
        e.note, e.start_at, e.end_at,
        e.color, e.is_important,
        e.id
      ]);
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const e = await getBody(req);
      await pool.query('DELETE FROM events WHERE id=$1', [id]);
      return res.json({ ok: true });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
