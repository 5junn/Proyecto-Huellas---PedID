const db = require('./db');

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS verificaciones_registro (
    correo VARCHAR(120) NOT NULL PRIMARY KEY,
    nonce CHAR(32) DEFAULT NULL,
    codigo_hash CHAR(64) DEFAULT NULL,
    intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
    vence_en DATETIME DEFAULT NULL,
    reenviar_en DATETIME DEFAULT NULL,
    INDEX (vence_en)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(120) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    contrasena_cifrada VARCHAR(255) NOT NULL,
    rol ENUM('Administrador', 'Veterinario', 'Recepcionista', 'Propietario') NOT NULL DEFAULT 'Propietario',
    dni VARCHAR(20) DEFAULT NULL,
    telefono VARCHAR(30) DEFAULT NULL,
    direccion VARCHAR(255) DEFAULT NULL,
    especialidad VARCHAR(100) DEFAULT NULL,
    turno VARCHAR(60) DEFAULT NULL,
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS propietarios (
    id_propietario INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT DEFAULT NULL,
    nombres VARCHAR(120) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(30) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    direccion VARCHAR(255) NOT NULL,
    contacto_emergencia VARCHAR(120) DEFAULT NULL,
    tel_emergencia VARCHAR(30) DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS razas (
    id_raza INT AUTO_INCREMENT PRIMARY KEY,
    nombre_raza VARCHAR(100) NOT NULL UNIQUE,
    especie ENUM('Canino', 'Felino', 'Conejo', 'Ave', 'Otro') NOT NULL DEFAULT 'Canino',
    descripcion VARCHAR(255) DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS mascotas (
    id_mascota INT AUTO_INCREMENT PRIMARY KEY,
    id_propietario INT NOT NULL,
    id_raza INT DEFAULT NULL,
    codigo_qr VARCHAR(50) NOT NULL UNIQUE,
    microchip VARCHAR(50) DEFAULT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL,
    especie ENUM('Canino', 'Felino', 'Conejo', 'Ave', 'Otro') NOT NULL DEFAULT 'Canino',
    raza VARCHAR(80) DEFAULT NULL,
    sexo ENUM('Macho', 'Hembra') NOT NULL DEFAULT 'Macho',
    edad VARCHAR(50) DEFAULT NULL,
    fecha_nacimiento DATE DEFAULT NULL,
    peso_actual DECIMAL(5,2) DEFAULT NULL,
    color VARCHAR(80) DEFAULT NULL,
    foto_url LONGTEXT DEFAULT NULL,
    alergias TEXT DEFAULT NULL,
    observaciones_medicas TEXT DEFAULT NULL,
    modo_extraviado TINYINT(1) NOT NULL DEFAULT 0,
    recompensa VARCHAR(80) DEFAULT 'S/ 500',
    estado ENUM('Activo', 'En Observación', 'Fallecido') NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_propietario) REFERENCES propietarios(id_propietario) ON DELETE CASCADE,
    FOREIGN KEY (id_raza) REFERENCES razas(id_raza) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS consultas_historial (
    id_consulta INT AUTO_INCREMENT PRIMARY KEY,
    id_mascota INT NOT NULL,
    id_veterinario INT DEFAULT NULL,
    veterinario_nombre VARCHAR(120) DEFAULT NULL,
    motivo_consulta VARCHAR(255) NOT NULL,
    temperatura DECIMAL(4,2) DEFAULT NULL,
    peso DECIMAL(5,2) DEFAULT NULL,
    diagnostico TEXT NOT NULL,
    tratamiento_receta TEXT DEFAULT NULL,
    borrador_ia TEXT DEFAULT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('waiting', 'progress', 'done') NOT NULL DEFAULT 'done',
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
    FOREIGN KEY (id_veterinario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS carnet_vacunacion (
    id_vacunacion INT AUTO_INCREMENT PRIMARY KEY,
    id_mascota INT NOT NULL,
    id_veterinario INT DEFAULT NULL,
    veterinario_nombre VARCHAR(120) DEFAULT NULL,
    vacuna VARCHAR(120) NOT NULL,
    lote_fabricante VARCHAR(60) NOT NULL,
    fecha_aplicacion DATE NOT NULL,
    fecha_proximo_refuerzo DATE NOT NULL,
    estado_dosis ENUM('al-dia', 'por-vencer', 'vencida') NOT NULL DEFAULT 'al-dia',
    observaciones VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
    FOREIGN KEY (id_veterinario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS recordatorios (
    id_recordatorio INT AUTO_INCREMENT PRIMARY KEY,
    id_mascota INT NOT NULL,
    id_propietario INT NOT NULL,
    id_vacunacion INT DEFAULT NULL,
    canal ENUM('WhatsApp', 'SMS', 'Correo') NOT NULL DEFAULT 'WhatsApp',
    asunto VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    telefono_destino VARCHAR(30) NOT NULL,
    correo_destino VARCHAR(120) DEFAULT NULL,
    fecha_programada DATETIME NOT NULL,
    estado ENUM('Programado', 'Enviado', 'Fallido') NOT NULL DEFAULT 'Programado',
    provider_message_id VARCHAR(120) DEFAULT NULL,
    provider_name VARCHAR(80) DEFAULT NULL,
    generado_por_ia TINYINT(1) NOT NULL DEFAULT 0,
    intentos INT NOT NULL DEFAULT 0,
    ultimo_error VARCHAR(255) DEFAULT NULL,
    enviado_en DATETIME DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
    FOREIGN KEY (id_propietario) REFERENCES propietarios(id_propietario) ON DELETE CASCADE,
    FOREIGN KEY (id_vacunacion) REFERENCES carnet_vacunacion(id_vacunacion) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS registro_pesos (
    id_peso INT AUTO_INCREMENT PRIMARY KEY,
    id_mascota INT NOT NULL,
    peso_kg DECIMAL(5,2) NOT NULL,
    origen ENUM('registro', 'consulta', 'control') NOT NULL DEFAULT 'consulta',
    registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS alertas_rescate_gps (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    id_mascota INT NOT NULL,
    codigo_qr VARCHAR(50) NOT NULL,
    latitud DECIMAL(10,6) NOT NULL,
    longitud DECIMAL(10,6) NOT NULL,
    precision_metros INT DEFAULT 15,
    maps_url VARCHAR(255) NOT NULL,
    mensaje_rescatista TEXT DEFAULT NULL,
    estado ENUM('activa', 'resuelta') NOT NULL DEFAULT 'activa',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS historial_mensajes (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_propietario INT DEFAULT NULL,
    id_mascota INT DEFAULT NULL,
    id_recordatorio INT DEFAULT NULL,
    tipo_evento VARCHAR(60) NOT NULL,
    canal ENUM('WhatsApp', 'SMS', 'Correo') NOT NULL DEFAULT 'WhatsApp',
    destinatario VARCHAR(120) NOT NULL,
    contenido TEXT NOT NULL,
    estado ENUM('Enviado', 'Programado', 'Fallido') NOT NULL DEFAULT 'Enviado',
    provider_name VARCHAR(80) DEFAULT NULL,
    provider_message_id VARCHAR(120) DEFAULT NULL,
    generado_por_ia TINYINT(1) NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_propietario) REFERENCES propietarios(id_propietario) ON DELETE SET NULL,
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota) ON DELETE SET NULL,
    FOREIGN KEY (id_recordatorio) REFERENCES recordatorios(id_recordatorio) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

const SAFE_ALTERS = [
  'ALTER TABLE usuarios ADD COLUMN dni VARCHAR(20) DEFAULT NULL',
  'ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(30) DEFAULT NULL',
  'ALTER TABLE usuarios ADD COLUMN direccion VARCHAR(255) DEFAULT NULL',
  'ALTER TABLE usuarios ADD COLUMN especialidad VARCHAR(100) DEFAULT NULL',
  'ALTER TABLE usuarios ADD COLUMN turno VARCHAR(60) DEFAULT NULL',
  "ALTER TABLE usuarios ADD COLUMN estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo'",
  'ALTER TABLE propietarios ADD COLUMN id_usuario INT DEFAULT NULL',
  'ALTER TABLE mascotas ADD COLUMN id_raza INT DEFAULT NULL',
  'ALTER TABLE mascotas ADD COLUMN edad VARCHAR(50) DEFAULT NULL',
  'ALTER TABLE consultas_historial ADD COLUMN veterinario_nombre VARCHAR(120) DEFAULT NULL',
  'ALTER TABLE consultas_historial ADD COLUMN borrador_ia TEXT DEFAULT NULL',
  'ALTER TABLE carnet_vacunacion ADD COLUMN id_veterinario INT DEFAULT NULL',
  'ALTER TABLE carnet_vacunacion ADD COLUMN observaciones VARCHAR(255) DEFAULT NULL',
  'ALTER TABLE carnet_vacunacion ADD COLUMN veterinario_nombre VARCHAR(120) DEFAULT NULL',
  'ALTER TABLE recordatorios ADD COLUMN id_vacunacion INT DEFAULT NULL',
  'ALTER TABLE recordatorios ADD COLUMN correo_destino VARCHAR(120) DEFAULT NULL',
  'ALTER TABLE recordatorios ADD COLUMN provider_message_id VARCHAR(120) DEFAULT NULL',
  'ALTER TABLE recordatorios ADD COLUMN provider_name VARCHAR(80) DEFAULT NULL',
  'ALTER TABLE recordatorios ADD COLUMN generado_por_ia TINYINT(1) NOT NULL DEFAULT 0',
  'ALTER TABLE recordatorios ADD COLUMN intentos INT NOT NULL DEFAULT 0',
  'ALTER TABLE recordatorios ADD COLUMN enviado_en DATETIME DEFAULT NULL',
  'ALTER TABLE recordatorios ADD COLUMN ultimo_error VARCHAR(255) DEFAULT NULL',
];

async function readColumns(conn, table) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME AS nombre, COLUMN_TYPE AS tipo, COLUMN_KEY AS clave, EXTRA AS extra
     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows;
}

async function migrateVaccineId(conn) {
  const columns = await readColumns(conn, 'carnet_vacunacion');
  if (!columns.length || columns.some((column) => column.nombre === 'id_vacunacion')) return;

  const primary = columns.filter((column) => column.clave === 'PRI');
  if (primary.length !== 1 || primary[0].extra !== 'auto_increment') {
    throw new Error('El carnet anterior necesita una clave primaria numérica autoincremental para migrar a id_vacunacion.');
  }
  // El renombre conserva las filas, los identificadores y los índices del carnet.
  const oldName = conn.escapeId(primary[0].nombre);
  await conn.query(`ALTER TABLE carnet_vacunacion RENAME COLUMN ${oldName} TO id_vacunacion`);
}

async function migrateColumns(conn) {
  const tableColumns = new Map();
  for (const sql of SAFE_ALTERS) {
    const [, table, column] = sql.match(/^ALTER TABLE (\w+) ADD COLUMN (\w+)/);
    if (!tableColumns.has(table)) {
      tableColumns.set(table, await readColumns(conn, table));
    }
    if (!tableColumns.get(table).some((entry) => entry.nombre === column)) {
      await conn.query(sql);
    }
  }
  const role = (await readColumns(conn, 'usuarios')).find((column) => column.nombre === 'rol');
  if (role?.tipo.startsWith('enum(') && !role.tipo.includes("'Propietario'")) {
    const [unknownRoles] = await conn.query(
      "SELECT 1 FROM usuarios WHERE rol NOT IN ('Administrador', 'Veterinario', 'Recepcionista') LIMIT 1"
    );
    if (unknownRoles.length) throw new Error('La tabla usuarios contiene roles antiguos que requieren revisión.');
    await conn.query(
      "ALTER TABLE usuarios MODIFY COLUMN rol ENUM('Administrador', 'Veterinario', 'Recepcionista', 'Propietario') NOT NULL DEFAULT 'Propietario'"
    );
  }
  const photo = (await readColumns(conn, 'mascotas')).find((column) => column.nombre === 'foto_url');
  if (photo && photo.tipo !== 'longtext') {
    await conn.query('ALTER TABLE mascotas MODIFY COLUMN foto_url LONGTEXT DEFAULT NULL');
  }
}

async function initDatabase() {
  if (!await db.checkConnection()) return false;

  const conn = await db.promise().getConnection();
  let locked = false;
  try {
    const [[result]] = await conn.query("SELECT GET_LOCK(SHA2(CONCAT(DATABASE(), ':huellas-schema'), 256), 30) AS locked");
    locked = result.locked === 1;
    if (!locked) throw new Error('No se obtuvo el bloqueo para migrar MySQL.');

    await migrateVaccineId(conn);
    for (const sql of SCHEMA_STATEMENTS) await conn.query(sql);
    await migrateColumns(conn);
    console.log('[DB Init] Esquema MySQL verificado y actualizado.');
    return true;
  } finally {
    try {
      if (locked) await conn.query("SELECT RELEASE_LOCK(SHA2(CONCAT(DATABASE(), ':huellas-schema'), 256))");
    } finally {
      conn.release();
    }
  }
}

module.exports = { initDatabase };
