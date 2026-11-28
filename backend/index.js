const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const os = require('os');

const db = require('./src/db');
const { initDatabase } = require('./src/dbInit');
const { startScheduler } = require('./src/services/schedulerService');
const { dispatchMessage } = require('./src/services/messagingService');
const { sanitizeText } = require('./src/utils/security');
const { RECEPTION_ROLES, requireSession, allowRoles } = require('./src/utils/session');

const app = express();
const PORT = process.env.PORT || 4000;

const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (Number.isInteger(proxyHops) && proxyHops > 0) app.set('trust proxy', proxyHops);

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 240,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
});
app.use(cors());
app.use(apiLimiter);
app.use(express.json({ limit: '8mb' }));

// Cabeceras básicas de seguridad HTTP
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Endpoint de prueba y salud
app.get('/', async (req, res) => {
  const dbOnline = await db.checkConnection();
  res.json({
    mensaje: '¡El backend de Huellas PetID está funcionando correctamente!',
    mysql_conectado: dbOnline,
    ia_externa_configurada: Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY),
    correo_registro_configurado: Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim()),
    whatsapp_configurado: Boolean(
      (process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) ||
      (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM)
    ),
    mensajeria_externa_configurada: Boolean(
      process.env.WHATSAPP_CLOUD_TOKEN || process.env.TWILIO_ACCOUNT_SID || process.env.RESEND_API_KEY
    ),
  });
});

// Rutas principales
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/mascotas', require('./src/routes/mascotas.routes'));
app.use('/api/razas', require('./src/routes/razas.routes'));
app.use('/api/clinica', require('./src/routes/clinica.routes'));
app.use('/api/mensajeria', require('./src/routes/mensajeria.routes'));
app.use('/api/ia', require('./src/routes/ia.routes'));

// Endpoint para detectar la IP de red local (Permite escanear con celular en el mismo Wi-Fi)
app.get('/api/network-ip', (req, res) => {
  const nets = os.networkInterfaces();
  let localIp = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wlan')) {
          localIp = net.address;
          break;
        }
        if (localIp === 'localhost') {
          localIp = net.address;
        }
      }
    }
  }
  res.json({ ip: localIp });
});

// Endpoint compatible de Recordatorios por WhatsApp conectado a la BD y servicio de mensajería
app.post('/api/reminders/whatsapp', requireSession, allowRoles(RECEPTION_ROLES), async (req, res) => {
  try {
    const body = req.body || {};
    const recipient = sanitizeText(body.recipient || body.ownerPhone || '', 40);
    const petName = sanitizeText(body.petName || 'tu mascota', 80);
    const ownerName = sanitizeText(body.ownerName || 'Propietario', 120);
    const dueDate = sanitizeText(body.dueDate || 'En 30 días', 80);
    const message = sanitizeText(
      body.message || `🐾 Recordatorio Huellas PetID para ${petName}: próxima atención ${dueDate}.`,
      2000
    );

    let idMascota = body.id_mascota ? Number(body.id_mascota) : null;
    let idPropietario = body.id_propietario ? Number(body.id_propietario) : null;

    if (!idMascota && body.petCode) {
      const [mRows] = await db.queryAsync(
        'SELECT id_mascota, id_propietario FROM mascotas WHERE UPPER(codigo_qr) = ? LIMIT 1',
        [String(body.petCode).toUpperCase()]
      ).catch(() => [[]]);
      if (mRows.length > 0) {
        idMascota = mRows[0].id_mascota;
        idPropietario = idPropietario || mRows[0].id_propietario;
      }
    }

    const result = await dispatchMessage({
      id_propietario: idPropietario,
      id_mascota: idMascota,
      tipo_evento: 'recordatorio_whatsapp',
      canal: 'WhatsApp',
      asunto: `Recordatorio ${petName} (${dueDate})`,
      mensaje: message,
      telefono: recipient,
      generado_por_ia: Boolean(body.generadoPorIA),
    });

    res.status(200).json({
      success: true,
      messageId: result.messageId,
      provider: result.provider,
      status: result.estado,
      recipient: result.destinatario,
      petName,
      ownerName,
      dueDate,
      id_recordatorio: result.id_recordatorio,
      details: 'Recordatorio registrado en la base de datos y procesado por el servicio de mensajería.',
    });
  } catch (err) {
    console.error('[API WhatsApp Reminder] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

if (require.main === module) {
  initDatabase()
    .then((ok) => {
      if (!ok) throw new Error('MySQL no está disponible. Revisa la configuración DB_* del archivo .env.');
      startScheduler();
      app.listen(PORT, () => {
        console.log(`Servidor Huellas PetID corriendo en el puerto ${PORT}`);
      });
    })
    .catch(async (err) => {
      console.error('[Startup DB]', err.message);
      await db.end();
      process.exitCode = 1;
    });
}

module.exports = app;
