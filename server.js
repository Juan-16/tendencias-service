const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 5000
});

// OpenShift usa esto para saber si el pod ya está listo
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Registrar un click sobre una plantilla
app.post('/clicks', async (req, res) => {
  const { templateId } = req.body || {};
  if (!templateId) {
    return res.status(400).json({ error: 'templateId es requerido' });
  }
  try {
    await pool.execute(
      'INSERT INTO click_events (template_id) VALUES (?)',
      [String(templateId)]
    );
    res.status(201).json({ message: 'registrado' });
  } catch (err) {
    console.error('Error en /clicks:', err.message);
    res.status(500).json({ error: 'error interno' });
  }
});

// Ranking de las plantillas más clickeadas en los últimos 7 días
app.get('/tendencias', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT template_id, COUNT(*) AS clicks
       FROM click_events
       WHERE created_at >= NOW() - INTERVAL 7 DAY
       GROUP BY template_id
       ORDER BY clicks DESC
       LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en /tendencias:', err.message);
    res.status(500).json({ error: 'error interno' });
  }
});

app.listen(PORT, () => {
  console.log(`Servicio de tendencias escuchando en :${PORT}`);
});
