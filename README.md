# Huellas PetID 
Sistema de Identificación y Seguimiento Médico Digital para Mascotas}

## Descripción del Proyecto
**Huellas PetID** es una solución tecnológica diseñada para clínicas veterinarias que permite digitalizar historiales clínicos, asociar placas de identificación con códigos QR únicos y brindar a los dueños ("Pet Parents") un acceso rápido a los datos vitales de sus mascotas ante emergencias, sin necesidad de instalar aplicaciones.

---

## Estructura Tecnológica
El proyecto está desarrollado bajo una arquitectura web moderna:
- **Frontend:** React (desarrollado con Vite y VS Code) -> Desplegado en **Vercel**.
- **Backend:** Node.js + Express -> Alojado en **Railway**
- **Base de Datos:** MySQL (Diseñado en MySQL Workbench y alojado en **Railway**)
- **Control de Versiones:** Git y GitHub.

---

## Integrantes del Grupo 04 (UTP)
- Castilla Marcos José Junior (Scrum Master / Desarrollador)
- Fernandez Campaña Aldo Patrick (Product Owner / Desarrollador)

---

## Conexión de la aplicación

- Configura MySQL en el backend con las variables de `backend/.env.example`. También se aceptan `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD` y `MYSQLDATABASE` de Railway. Mantén un `AUTH_SECRET` aleatorio y estable en Railway.
- Inicia el backend desde `backend` con `npm ci` y `npm start`. El servicio prepara las tablas en la base configurada. `GET /` informa si MySQL responde.
- Usa `frontend` como directorio raíz de Vercel. Define `VITE_API_URL` con la URL HTTPS del servicio de Railway y vuelve a desplegar el frontend después de modificarla. En desarrollo, Vite usa `http://localhost:4000` si falta esa variable.

### Cuentas de clínica

El registro público crea usuarios propietarios. Para crear el primer administrador, ejecuta `node scripts/provision-admin.js` desde `backend` con acceso autorizado a la base de datos y las variables `STAFF_ADMIN_NAME`, `STAFF_ADMIN_EMAIL` y `STAFF_ADMIN_PASSWORD`. La contraseña requiere al menos 12 caracteres. Para cambiar la contraseña de un administrador existente, usa el mismo script con `--reset-password`. Configura la contraseña por un canal seguro.

Las contraseñas de demostración y las sesiones anteriores quedan invalidadas. Las cuentas guardadas únicamente en el navegador deben registrarse en la aplicación. Si un perfil fue creado antes en recepción y existe sin una cuenta vinculada, la clínica debe verificar la identidad del propietario antes de vincularlo. Los registros de mascotas y los carnets ya almacenados se conservan.

### IA y mensajería

El borrador clínico y las alertas preventivas se consultan desde el panel clínico. El backend también prepara recordatorios de vacunación y ofrece un asistente de emergencia desde la ficha QR. Gemini u OpenAI requieren la clave correspondiente en Railway. Sin proveedor disponible, las funciones usan reglas y plantillas locales. El chat de orientación usa respuestas predefinidas.

Los recordatorios se guardan en MySQL. Para enviarlos por WhatsApp, SMS o correo, configura el proveedor del canal en el backend.
