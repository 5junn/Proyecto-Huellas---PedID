-- Base de Datos Oficial: Huellas PetID
-- Clínica Veterinaria Huellas
-- Importar con: mysql -u root -p < database.sql

CREATE DATABASE IF NOT EXISTS `huellas_petid` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `huellas_petid`;

-- 1. Tabla de Usuarios (Personal Clínico y Administradores)
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

-- 3. Tabla de Mascotas
CREATE TABLE IF NOT EXISTS `mascotas` (
  `id_mascota` INT AUTO_INCREMENT PRIMARY KEY,
  `id_propietario` INT NOT NULL,
  `codigo_qr` VARCHAR(50) NOT NULL UNIQUE,
  `microchip` VARCHAR(50) DEFAULT NULL UNIQUE,
  `nombre` VARCHAR(80) NOT NULL,
  `especie` ENUM('Canino', 'Felino', 'Conejo', 'Otro') NOT NULL DEFAULT 'Canino',
  `raza` VARCHAR(80) NOT NULL,
  `sexo` ENUM('Macho', 'Hembra') NOT NULL,
  `fecha_nacimiento` DATE DEFAULT NULL,
  `peso_actual` DECIMAL(5,2) DEFAULT NULL,
  `color` VARCHAR(80) DEFAULT NULL,
  `foto_url` TEXT DEFAULT NULL,
  `alergias` TEXT DEFAULT NULL,
  `observaciones_medicas` TEXT DEFAULT NULL,
  `modo_extraviado` TINYINT(1) NOT NULL DEFAULT 0,
  `recompensa` VARCHAR(80) DEFAULT 'S/ 500',
  `estado` ENUM('Activo', 'En Observación', 'Fallecido') NOT NULL DEFAULT 'Activo',
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_propietario`) REFERENCES `propietarios`(`id_propietario`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Tabla de Consultas Médicas e Historias Clínicas
CREATE TABLE IF NOT EXISTS `consultas_historial` (
  `id_consulta` INT AUTO_INCREMENT PRIMARY KEY,
  `id_mascota` INT NOT NULL,
  `id_veterinario` INT DEFAULT NULL,
  `motivo_consulta` VARCHAR(255) NOT NULL,
  `temperatura` DECIMAL(4,2) DEFAULT NULL,
  `peso` DECIMAL(5,2) DEFAULT NULL,
  `diagnostico` TEXT NOT NULL,
  `tratamiento_receta` TEXT DEFAULT NULL,
  `fecha_hora` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `estado` ENUM('waiting', 'progress', 'done') NOT NULL DEFAULT 'done',
  FOREIGN KEY (`id_mascota`) REFERENCES `mascotas`(`id_mascota`) ON DELETE CASCADE,
  FOREIGN KEY (`id_veterinario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Tabla de Carnet de Vacunación
CREATE TABLE IF NOT EXISTS `carnet_vacunacion` (
  `id_vacunacion` INT AUTO_INCREMENT PRIMARY KEY,
  `id_mascota` INT NOT NULL,
  `id_veterinario` INT DEFAULT NULL,
  `vacuna` VARCHAR(120) NOT NULL,
  `lote_fabricante` VARCHAR(60) NOT NULL,
  `fecha_aplicacion` DATE NOT NULL,
  `fecha_proximo_refuerzo` DATE NOT NULL,
  `estado_dosis` ENUM('al-dia', 'por-vencer', 'vencida') NOT NULL DEFAULT 'al-dia',
  `observaciones` VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (`id_mascota`) REFERENCES `mascotas`(`id_mascota`) ON DELETE CASCADE,
  FOREIGN KEY (`id_veterinario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Tabla de Recordatorios y Notificaciones por WhatsApp
CREATE TABLE IF NOT EXISTS `recordatorios` (
  `id_recordatorio` INT AUTO_INCREMENT PRIMARY KEY,
  `id_mascota` INT NOT NULL,
  `id_propietario` INT NOT NULL,
  `canal` ENUM('WhatsApp', 'SMS', 'Correo') NOT NULL DEFAULT 'WhatsApp',
  `asunto` VARCHAR(150) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `telefono_destino` VARCHAR(30) NOT NULL,
  `fecha_programada` DATETIME NOT NULL,
  `estado` ENUM('Programado', 'Enviado', 'Fallido') NOT NULL DEFAULT 'Programado',
  `enviado_en` DATETIME DEFAULT NULL,
  FOREIGN KEY (`id_mascota`) REFERENCES `mascotas`(`id_mascota`) ON DELETE CASCADE,
  FOREIGN KEY (`id_propietario`) REFERENCES `propietarios`(`id_propietario`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =======================================================
-- DATOS INICIALES DE DEMOSTRACIÓN (PASSWORD: password123)
-- Hash bcrypt para 'password123': $2a$12$e0l0v3k... (o cifrado por backend)
-- =======================================================

INSERT INTO `usuarios` (`nombres`, `correo`, `contrasena_cifrada`, `rol`, `especialidad`, `turno`, `estado`) VALUES
('Administrador General', 'admin@huellas.com', '$2b$12$K1d0/P07v403ZlA5tN8cYb3FjS6uAe1GhP5oXiT0vEzMnQe8P3eTC', 'Administrador', 'Dirección Médica & Sistemas', 'Permanente', 'activo'),
('Dra. Ana Torres Paredes', 'veterinario@huellas.com', '$2b$12$K1d0/P07v403ZlA5tN8cYb3FjS6uAe1GhP5oXiT0vEzMnQe8P3eTC', 'Veterinario', 'Medicina General & Cirugía', 'Mañana (8:00 - 14:00)', 'activo'),
('Dr. Luis Vega Morales', 'luis.vega@huellas.com', '$2b$12$K1d0/P07v403ZlA5tN8cYb3FjS6uAe1GhP5oXiT0vEzMnQe8P3eTC', 'Veterinario', 'Medicina Felina & Vacunas', 'Tarde (14:00 - 20:00)', 'activo'),
('Carlos Mendoza Rios', 'recepcion@huellas.com', '$2b$12$K1d0/P07v403ZlA5tN8cYb3FjS6uAe1GhP5oXiT0vEzMnQe8P3eTC', 'Recepcionista', 'Admisión & Triaje QR', 'Completo (8:00 - 17:00)', 'activo')
ON DUPLICATE KEY UPDATE `nombres` = VALUES(`nombres`);

INSERT INTO `propietarios` (`nombres`, `dni`, `telefono`, `correo`, `direccion`) VALUES
('Jorge Salas Méndez', '44521098', '987654321', 'jorge.salas@gmail.com', 'Av. Larco 450, Miraflores, Lima'),
('Lucía Paredes Torres', '72345678', '976543210', 'propietario@gmail.com', 'Calle Las Acacias 120, Surco, Lima'),
('Carla Mendoza Vidal', '40981245', '965432109', 'carla.mendoza@yahoo.com', 'Av. Primavera 890, Surco, Lima'),
('Andrés Quispe Castro', '48123901', '954321098', 'andres.quispe@hotmail.com', 'Jr. Monterrico 234, La Molina, Lima'),
('Valeria Núñez Rivas', '71902451', '943210987', 'valeria.nunez@gmail.com', 'Av. El Sol 1102, Chorrillos, Lima')
ON DUPLICATE KEY UPDATE `nombres` = VALUES(`nombres`);

INSERT INTO `mascotas` (`id_propietario`, `codigo_qr`, `microchip`, `nombre`, `especie`, `raza`, `sexo`, `peso_actual`, `color`, `alergias`, `foto_url`, `modo_extraviado`, `recompensa`) VALUES
(1, 'HP-4092', '981098124', 'Toby', 'Canino', 'Beagle', 'Macho', 12.40, 'Tricolor', 'Alergia severa a pulgas. No derivados de penicilina.', 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=400&q=80', 1, 'S/ 500'),
(2, 'HP-8813', '981098451', 'Luna', 'Felino', 'Siamés', 'Hembra', 3.80, 'Crema y chocolate', 'Ninguna conocida.', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80', 0, 'S/ 300'),
(3, 'HP-1294', '981098772', 'Max', 'Canino', 'Golden Retriever', 'Macho', 29.20, 'Dorado', 'Sensibilidad estomacal a granos.', 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=400&q=80', 0, 'S/ 500')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `carnet_vacunacion` (`id_mascota`, `id_veterinario`, `vacuna`, `lote_fabricante`, `fecha_aplicacion`, `fecha_proximo_refuerzo`, `estado_dosis`) VALUES
(1, 2, 'Sextuple Canina Vanguard', 'LT-4412', '2026-08-20', '2026-11-20', 'por-vencer'),
(1, 2, 'Antirrábica Rabisin', 'LT-8821', '2026-10-14', '2027-10-14', 'al-dia'),
(2, 3, 'Triple Felina Felocell', 'LT-9031', '2026-09-10', '2027-09-10', 'al-dia');

INSERT INTO `consultas_historial` (`id_mascota`, `id_veterinario`, `motivo_consulta`, `temperatura`, `peso`, `diagnostico`, `tratamiento_receta`, `estado`) VALUES
(3, 2, 'Control Anual & Desparasitación', 38.5, 29.2, 'Paciente en excelente condición física.', 'NexGard Spectra 30kg 1 tableta masticable.', 'done'),
(1, 2, 'Dermatitis y Otitis Externa', 38.8, 12.4, 'Inflamación de conducto auditivo derecho.', 'Otovier gotas óticas 4 gotas cada 12 horas por 7 días.', 'progress');

INSERT INTO `recordatorios` (`id_mascota`, `id_propietario`, `canal`, `asunto`, `mensaje`, `telefono_destino`, `fecha_programada`, `estado`) VALUES
(1, 1, 'WhatsApp', 'Refuerzo de Vacuna Séxtuple', 'Hola Jorge, le saluda la Clínica Veterinaria Huellas. Le recordamos que la vacuna Séxtuple de Toby vence pronto. Agende su cita respondiendo a este mensaje.', '987654321', NOW() + INTERVAL 1 DAY, 'Programado'),
(2, 2, 'WhatsApp', 'Control Vacunal Felino', 'Hola Lucía, le recordamos que Luna tiene su refuerzo anual programado en Clínica Huellas. ¡Cuidamos a los que más quieres!', '976543210', NOW() + INTERVAL 3 DAY, 'Programado');
