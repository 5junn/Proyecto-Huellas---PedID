-- Base de Datos Oficial: Huellas PetID
-- Clínica Veterinaria Huellas
-- Importar con: mysql -u root -p < database.sql

CREATE DATABASE IF NOT EXISTS `huellas_petid` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `huellas_petid`;

-- 1. Tabla de Usuarios (Personal Clínico, Administradores y Propietarios)
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
  `nombres` VARCHAR(120) NOT NULL,
  `correo` VARCHAR(120) NOT NULL UNIQUE,
  `contrasena_cifrada` VARCHAR(255) NOT NULL,
  `rol` ENUM('Administrador', 'Veterinario', 'Recepcionista', 'Propietario') NOT NULL DEFAULT 'Propietario',
  `dni` VARCHAR(20) DEFAULT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `direccion` VARCHAR(255) DEFAULT NULL,
  `especialidad` VARCHAR(100) DEFAULT NULL,
  `turno` VARCHAR(60) DEFAULT NULL,
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabla de Propietarios de Mascotas
CREATE TABLE IF NOT EXISTS `propietarios` (
  `id_propietario` INT AUTO_INCREMENT PRIMARY KEY,
  `id_usuario` INT DEFAULT NULL,
  `nombres` VARCHAR(120) NOT NULL,
  `dni` VARCHAR(20) NOT NULL UNIQUE,
  `telefono` VARCHAR(30) NOT NULL,
  `correo` VARCHAR(120) NOT NULL UNIQUE,
  `direccion` VARCHAR(255) NOT NULL,
  `contacto_emergencia` VARCHAR(120) DEFAULT NULL,
  `tel_emergencia` VARCHAR(30) DEFAULT NULL,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Tabla Normalizada de Razas (Requisito Académico Oficial Huellas PetID)
CREATE TABLE IF NOT EXISTS `razas` (
  `id_raza` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_raza` VARCHAR(100) NOT NULL UNIQUE,
  `especie` ENUM('Canino', 'Felino', 'Conejo', 'Ave', 'Otro') NOT NULL DEFAULT 'Canino',
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Tabla de Mascotas (Vinculada a Propietarios y a la Tabla Normalizada de Razas)
CREATE TABLE IF NOT EXISTS `mascotas` (
  `id_mascota` INT AUTO_INCREMENT PRIMARY KEY,
  `id_propietario` INT NOT NULL,
  `id_raza` INT DEFAULT NULL,
  `codigo_qr` VARCHAR(50) NOT NULL UNIQUE,
  `microchip` VARCHAR(50) DEFAULT NULL UNIQUE,
  `nombre` VARCHAR(80) NOT NULL,
  `especie` ENUM('Canino', 'Felino', 'Conejo', 'Ave', 'Otro') NOT NULL DEFAULT 'Canino',
  `raza` VARCHAR(80) DEFAULT NULL,
  `sexo` ENUM('Macho', 'Hembra') NOT NULL DEFAULT 'Macho',
  `edad` VARCHAR(50) DEFAULT NULL,
  `fecha_nacimiento` DATE DEFAULT NULL,
  `peso_actual` DECIMAL(5,2) DEFAULT NULL,
  `color` VARCHAR(80) DEFAULT NULL,
  `foto_url` LONGTEXT DEFAULT NULL,
  `alergias` TEXT DEFAULT NULL,
  `observaciones_medicas` TEXT DEFAULT NULL,
  `modo_extraviado` TINYINT(1) NOT NULL DEFAULT 0,
  `recompensa` VARCHAR(80) DEFAULT NULL,
  `estado` ENUM('Activo', 'En Observación', 'Fallecido') NOT NULL DEFAULT 'Activo',
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_propietario`) REFERENCES `propietarios`(`id_propietario`) ON DELETE CASCADE,
  FOREIGN KEY (`id_raza`) REFERENCES `razas`(`id_raza`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Tabla de Consultas Médicas e Historias Clínicas
CREATE TABLE IF NOT EXISTS `consultas_historial` (
  `id_consulta` INT AUTO_INCREMENT PRIMARY KEY,
  `id_mascota` INT NOT NULL,
  `id_veterinario` INT DEFAULT NULL,
  `veterinario_nombre` VARCHAR(120) DEFAULT NULL,
  `motivo_consulta` VARCHAR(255) NOT NULL,
  `temperatura` DECIMAL(4,2) DEFAULT NULL,
  `peso` DECIMAL(5,2) DEFAULT NULL,
  `diagnostico` TEXT NOT NULL,
  `tratamiento_receta` TEXT DEFAULT NULL,
  `borrador_ia` TEXT DEFAULT NULL,
  `fecha_hora` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `estado` ENUM('waiting', 'progress', 'done') NOT NULL DEFAULT 'done',
  FOREIGN KEY (`id_mascota`) REFERENCES `mascotas`(`id_mascota`) ON DELETE CASCADE,
  FOREIGN KEY (`id_veterinario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Inventario de vacunas con trazabilidad por lote
CREATE TABLE IF NOT EXISTS `lotes_vacunas` (
  `id_lote` INT AUTO_INCREMENT PRIMARY KEY,
  `vacuna` VARCHAR(120) NOT NULL,
  `lote_fabricante` VARCHAR(60) NOT NULL,
  `fecha_vencimiento` DATE NOT NULL,
  `dosis_iniciales` INT UNSIGNED NOT NULL,
  `dosis_disponibles` INT UNSIGNED NOT NULL,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_lote_vacuna` (`vacuna`, `lote_fabricante`)
) ENGINE=InnoDB;

-- 6. Tabla de Carnet de Vacunación
CREATE TABLE IF NOT EXISTS `carnet_vacunacion` (
  `id_vacunacion` INT AUTO_INCREMENT PRIMARY KEY,
  `id_mascota` INT NOT NULL,
  `id_veterinario` INT DEFAULT NULL,
  `veterinario_nombre` VARCHAR(120) DEFAULT NULL,
  `vacuna` VARCHAR(120) NOT NULL,
  `lote_fabricante` VARCHAR(60) NOT NULL,
  `id_lote` INT DEFAULT NULL,
  `fecha_aplicacion` DATE NOT NULL,
  `fecha_proximo_refuerzo` DATE NOT NULL,
  `estado_dosis` ENUM('al-dia', 'por-vencer', 'vencida') NOT NULL DEFAULT 'al-dia',
  `observaciones` VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (`id_mascota`) REFERENCES `mascotas`(`id_mascota`) ON DELETE CASCADE,
  FOREIGN KEY (`id_veterinario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL,
  FOREIGN KEY (`id_lote`) REFERENCES `lotes_vacunas`(`id_lote`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. Tabla de Recordatorios y Notificaciones (WhatsApp, SMS, Correo)
CREATE TABLE IF NOT EXISTS `recordatorios` (
  `id_recordatorio` INT AUTO_INCREMENT PRIMARY KEY,
  `id_mascota` INT NOT NULL,
  `id_propietario` INT NOT NULL,
  `id_vacunacion` INT DEFAULT NULL,
  `canal` ENUM('WhatsApp', 'SMS', 'Correo') NOT NULL DEFAULT 'WhatsApp',
  `asunto` VARCHAR(150) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `telefono_destino` VARCHAR(30) NOT NULL,
  `correo_destino` VARCHAR(120) DEFAULT NULL,
  `fecha_programada` DATETIME NOT NULL,
  `estado` ENUM('Programado', 'Enviado', 'Fallido') NOT NULL DEFAULT 'Programado',
  `provider_message_id` VARCHAR(120) DEFAULT NULL,
  `provider_name` VARCHAR(80) DEFAULT NULL,
  `generado_por_ia` TINYINT(1) NOT NULL DEFAULT 0,
  `intentos` INT NOT NULL DEFAULT 0,
  `ultimo_error` VARCHAR(255) DEFAULT NULL,
  `enviado_en` DATETIME DEFAULT NULL,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_mascota`) REFERENCES `mascotas`(`id_mascota`) ON DELETE CASCADE,
  FOREIGN KEY (`id_propietario`) REFERENCES `propietarios`(`id_propietario`) ON DELETE CASCADE,
  FOREIGN KEY (`id_vacunacion`) REFERENCES `carnet_vacunacion`(`id_vacunacion`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 8. Historial de Peso para Alertas Predictivas
CREATE TABLE IF NOT EXISTS `registro_pesos` (
  `id_peso` INT AUTO_INCREMENT PRIMARY KEY,
  `id_mascota` INT NOT NULL,
  `peso_kg` DECIMAL(5,2) NOT NULL,
  `origen` ENUM('registro', 'consulta', 'control') NOT NULL DEFAULT 'consulta',
  `registrado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_mascota`) REFERENCES `mascotas`(`id_mascota`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Alertas de Rescate GPS por Escaneo QR
CREATE TABLE IF NOT EXISTS `alertas_rescate_gps` (
  `id_alerta` INT AUTO_INCREMENT PRIMARY KEY,
  `id_mascota` INT NOT NULL,
  `codigo_qr` VARCHAR(50) NOT NULL,
  `latitud` DECIMAL(10,6) NOT NULL,
  `longitud` DECIMAL(10,6) NOT NULL,
  `precision_metros` INT DEFAULT 15,
  `maps_url` VARCHAR(255) NOT NULL,
  `mensaje_rescatista` TEXT DEFAULT NULL,
  `estado` ENUM('activa', 'resuelta') NOT NULL DEFAULT 'activa',
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_mascota`) REFERENCES `mascotas`(`id_mascota`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Auditoría de Mensajes Automáticos Enviados a Números del Proyecto
CREATE TABLE IF NOT EXISTS `historial_mensajes` (
  `id_mensaje` INT AUTO_INCREMENT PRIMARY KEY,
  `id_propietario` INT DEFAULT NULL,
  `id_mascota` INT DEFAULT NULL,
  `id_recordatorio` INT DEFAULT NULL,
  `tipo_evento` VARCHAR(60) NOT NULL,
  `canal` ENUM('WhatsApp', 'SMS', 'Correo') NOT NULL DEFAULT 'WhatsApp',
  `destinatario` VARCHAR(120) NOT NULL,
  `contenido` TEXT NOT NULL,
  `estado` ENUM('Enviado', 'Programado', 'Fallido') NOT NULL DEFAULT 'Enviado',
  `provider_name` VARCHAR(80) DEFAULT NULL,
  `provider_message_id` VARCHAR(120) DEFAULT NULL,
  `generado_por_ia` TINYINT(1) NOT NULL DEFAULT 0,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_propietario`) REFERENCES `propietarios`(`id_propietario`) ON DELETE SET NULL,
  FOREIGN KEY (`id_mascota`) REFERENCES `mascotas`(`id_mascota`) ON DELETE SET NULL,
  FOREIGN KEY (`id_recordatorio`) REFERENCES `recordatorios`(`id_recordatorio`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Población de la Tabla Normalizada de Razas
INSERT INTO `razas` (`id_raza`, `nombre_raza`, `especie`, `descripcion`) VALUES
(1, 'Beagle', 'Canino', 'Raza mediana, sabueso de gran olfato y temperamento sociable'),
(2, 'Golden Retriever', 'Canino', 'Raza grande de pelo largo, dócil y excelente perro familiar'),
(3, 'Labrador Retriever', 'Canino', 'Raza grande enérgica, leal y fácil de entrenar'),
(4, 'Bulldog Francés', 'Canino', 'Raza braquicéfala pequeña, afectuosa y tranquila'),
(5, 'Bulldog Inglés', 'Canino', 'Raza robusta y tranquila, de hocico chato'),
(6, 'Pastor Alemán', 'Canino', 'Raza de trabajo inteligente y muy protectora'),
(7, 'Poodle (Caniche)', 'Canino', 'Raza de gran inteligencia con pelaje rizado hipoalergénico'),
(8, 'Pug (Carlino)', 'Canino', 'Raza pequeña braquicéfala y muy juguetona'),
(9, 'Chihuahua', 'Canino', 'La raza canina más pequeña del mundo, vivaz y leal'),
(10, 'Husky Siberiano', 'Canino', 'Raza nórdica con pelaje denso y ojos llamativos'),
(11, 'Schnauzer Miniatura', 'Canino', 'Raza compacta con barba característica y gran agilidad'),
(12, 'Mestizo / Criollo Canino', 'Canino', 'Canino sin raza definida o cruce mestizo saludable'),
(13, 'Siamés', 'Felino', 'Felino esbelto, vocal y de pelaje con patrón colourpoint'),
(14, 'Persa', 'Felino', 'Felino de cara ancha y abundante pelaje sedoso'),
(15, 'Bengala', 'Felino', 'Felino con patrón atigrado exótico similar al leopardo'),
(16, 'Maine Coon', 'Felino', 'Una de las razas de gato doméstico más grandes y dóciles'),
(17, 'Mestizo / Común Europeo', 'Felino', 'Gato doméstico común, resistente y adaptable'),
(18, 'Enano Holandés', 'Conejo', 'Conejo de tamaño pequeño con orejas cortas'),
(19, 'Belier / Mini Lop', 'Conejo', 'Conejo dócil con orejas caídas características'),
(20, 'Periquito Australiano', 'Ave', 'Ave psitaciforme pequeña y muy sociable'),
(21, 'Ninfa / Carolina', 'Ave', 'Ave con cresta eréctil y temperamento cariñoso'),
(22, 'Cobayo / Cuy Peruano', 'Otro', 'Roedor doméstico herbívoro y muy dócil')
ON DUPLICATE KEY UPDATE `nombre_raza` = VALUES(`nombre_raza`);
