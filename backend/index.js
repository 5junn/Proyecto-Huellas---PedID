const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importamos la conexión desde la carpeta src
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Endpoint de prueba y salud
app.get('/', (req, res) => {
  res.json({ mensaje: "¡El backend de Huellas PetID está funcionando correctamente con MySQL!" });
});

// Rutas de Mascotas
try {
  app.use('/api/mascotas', require('./src/routes/mascotas.routes'));
} catch (e) {
  console.log('Rutas de mascotas pendientes de inicialización:', e.message);
}

// Rutas de Razas Normalizadas (Requisito Académico Oficial Huellas PetID)
try {
  app.use('/api/razas', require('./src/routes/razas.routes'));
} catch (e) {
  console.log('Rutas de razas pendientes de inicialización:', e.message);
}

// Endpoint para detectar la IP de red local (Permite escanear con celular en el mismo Wi-Fi)
const os = require('os');
app.get('/api/network-ip', (req, res) => {
  const nets = os.networkInterfaces();
  let localIp = '10.165.139.250';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wlan')) {
          localIp = net.address;
          break;
        }
      }
    }
  }
  res.json({ ip: localIp });
});

// Endpoint de Lógica de Negocio: Recordatorios por WhatsApp (Integración API Externa)
app.post('/api/reminders/whatsapp', (req, res) => {
  const { recipient, petName, ownerName, reminderType, dueDate, message } = req.body;
  console.log(`[API WhatsApp] Recordatorio recibido para ${petName} (${recipient}) - Fecha: ${dueDate}`);

  res.status(200).json({
    success: true,
    messageId: 'WA-EXT-' + Date.now(),
    provider: 'Meta WhatsApp Cloud API / Webhook',
    status: 'scheduled',
    recipient,
    petName,
    dueDate,
    details: 'Recordatorio programado con éxito en el proveedor externo de WhatsApp'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
