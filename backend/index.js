const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importamos la conexión desde la carpeta src
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: "¡El backend de Huellas PetID está funcionando correctamente con MySQL!" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});