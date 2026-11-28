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

- Para trabajar en local, copia `backend/.env.example` a `backend/.env` y configura MySQL allí. Deja el archivo de ejemplo sin contraseñas ni claves. También se aceptan `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD` y `MYSQLDATABASE` de Railway. Mantén un `AUTH_SECRET` aleatorio y estable en Railway. Si el backend recibe tráfico por un proxy, ajusta `TRUST_PROXY_HOPS` al número de saltos de confianza para aplicar los límites por cliente.
- Inicia el backend desde `backend` con `npm ci` y `npm start`. El servicio prepara las tablas en la base configurada. `GET /` informa si MySQL responde.
- Usa `frontend` como directorio raíz de Vercel. Define `VITE_API_URL` con la URL HTTPS del servicio de Railway y vuelve a desplegar el frontend después de modificarla. En desarrollo, Vite usa `http://localhost:4000` si falta esa variable.

### Cuentas de clínica

El registro público crea usuarios propietarios. Para crear el primer administrador, ejecuta `node scripts/provision-admin.js` desde `backend` con acceso autorizado a la base de datos y las variables `STAFF_ADMIN_NAME`, `STAFF_ADMIN_EMAIL` y `STAFF_ADMIN_PASSWORD`. La contraseña requiere al menos 12 caracteres. Para cambiar la contraseña de un administrador existente, usa el mismo script con `--reset-password`. Configura la contraseña por un canal seguro.

Las contraseñas de demostración y las sesiones anteriores quedan invalidadas. Las cuentas guardadas únicamente en el navegador deben registrarse en la aplicación. Un perfil anterior sin cuenta puede vincularse desde el registro al verificar el correo y usar el mismo DNI. Para corregir datos de perfiles existentes, comunícate con la clínica. Los registros de mascotas y los carnets ya almacenados se conservan.

### IA y mensajería

El borrador clínico y las alertas preventivas se consultan desde el panel clínico. El backend también prepara recordatorios de vacunación y ofrece un asistente de emergencia desde la ficha QR. Gemini u OpenAI requieren la clave correspondiente en Railway. Sin proveedor disponible, las funciones usan reglas y plantillas locales. El chat de orientación usa respuestas predefinidas.

Los recordatorios se guardan en MySQL. Para enviarlos por WhatsApp, SMS o correo, configura el proveedor del canal en el backend.

### Base de datos existente y verificación de correo

Al arrancar, el backend aplica la migración sobre la base indicada por `DB_NAME`. Conserva las filas y actualiza las columnas de usuarios, propietarios y carnet de vacunación. El usuario MySQL debe poder ejecutar `CREATE` y `ALTER`. Guarda una copia de la base antes de actualizar un entorno con datos reales. Para el renombre de la clave del carnet se requiere MySQL 8 o una versión compatible con `RENAME COLUMN`.

El registro público envía un código de seis dígitos mediante Resend. El código vence a los diez minutos. Tras cinco intentos fallidos, solicita otro. La cuenta y la sesión se crean al confirmar el código. Configura `RESEND_API_KEY` y `EMAIL_FROM` en `backend/.env`. Resend requiere un dominio verificado para enviar a cualquier destinatario. Su remitente de pruebas `onboarding@resend.dev` solo permite probar hacia el correo de tu cuenta de Resend. Conserva un `AUTH_SECRET` estable para que los códigos sigan siendo verificables tras reiniciar el backend. La opción **¿Olvidaste tu contraseña?** utiliza el mismo remitente de Resend. El código de recuperación vence a los diez minutos y, al guardar la nueva contraseña, se invalidan las sesiones anteriores de esa cuenta.

### Configuración de Gemini y WhatsApp

Configura `GEMINI_API_KEY` con una clave propia de Google AI Studio y `GEMINI_MODEL=gemini-3.1-flash-lite` en `backend/.env`. El modelo debe estar habilitado para tu cuenta. El backend consulta Gemini cuando la clave está configurada y usa reglas y plantillas locales si el proveedor falla.

Para Meta WhatsApp Cloud API, configura `WHATSAPP_CLOUD_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`. En la consola de Meta agrega el destinatario de pruebas con el prefijo de país y verifica el número. Si estableces `WHATSAPP_TEST_TO` con ese mismo número, el backend limitará los envíos de WhatsApp a los registros que ya tengan ese destinatario. Registra la cuenta de prueba con ese teléfono.

Para mensajes automáticos fuera de la ventana de atención de 24 horas, configura una plantilla de Meta aprobada en `WHATSAPP_TEMPLATE_NAME` y su código exacto de idioma en `WHATSAPP_TEMPLATE_LANGUAGE`. La integración usa una variable posicional de texto en el cuerpo de la plantilla. El contenido y el uso deben ajustarse a la plantilla aprobada. Cuando la plantilla queda vacía, el envío usa texto dentro de la ventana activa de WhatsApp.
