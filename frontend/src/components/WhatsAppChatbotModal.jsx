// src/components/WhatsAppChatbotModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

/**
 * Motor Conversacional HuellasBot (Inteligencia Natural / Respuestas con Sentido)
 * Responde contextualmente a consultas de citas, vacunas, mascota perdida, horarios, precios y síntomas.
 */
function generateBotReply(text, context) {
  const t = text.toLowerCase().trim();
  const { petName, ownerName, ownerPhone, petAllergies, vaccineName, dueDate, petCode, mode } = context;

  // MODO RESCATE / MASCOTA PERDIDA
  if (mode === 'rescue') {
    // 1. Saludos en rescate
    if (/^(hola|buenas|buen d[ií]a|buenas tardes|buenas noches|hey|que tal|holis)/i.test(t)) {
      return `¡Hola! 👋 Gracias por ponerte en contacto. Soy el *Asistente de Rescate Huellas* para *${petName}* (Placa: ${petCode}).\n\n¿Tienes a ${petName} contigo o conoces su ubicación? Escribe la dirección o punto de referencia para alertar de inmediato a su dueño *${ownerName}*.`;
    }

    // 2. Encontró / Tiene a la mascota / Ubicación
    if (/(tengo|encontr[eé]|est[aá] conmigo|lo vi|la vi|rescat|calle|parque|av|avenida|cuadra|surco|miraflores|san borja|lima|direcci[oó]n|punto|esquina)/i.test(t)) {
      return `🚨 *¡Reporte de Rescate Registrado Exitosamente!* 🙏\n\nMuchas gracias por resguardar a *${petName}*. Hemos registrado tu mensaje: "${text}".\n\n📲 El propietario *${ownerName}* ha sido notificado para acudir a la zona. Por favor mantén a ${petName} con agua en un lugar seguro mientras se comunican contigo.`;
    }

    // 3. Teléfono / Llamar al dueño
    if (/(llamar|tel[eé]fono|fono|celular|n[uú]mero|contacto|due[nñ]o|propietario|hablar)/i.test(t)) {
      return `📞 *Contacto Directo con el Dueño de ${petName}:*\n\n👤 *Propietario:* ${ownerName}\n📱 *Teléfono de Emergencia:* ${ownerPhone || '+51 987 654 321'}\n🏥 *Central Telefónica Clínica Huellas (24h):* +51 987 654 321\n\nPuedes llamarlo directamente para coordinar la entrega.`;
    }

    // 4. Salud / Alergias / Alimentación urgente
    if (/(alergia|enferm|medicina|medicamento|comer|comida|agua|pastilla|cuidado|salud|herid|pata|ojo)/i.test(t)) {
      return `⚠️ *Ficha Médica de Urgencia para ${petName}:*\n\n• *Alergias / Cuidados Especiales:* ${petAllergies || 'Sin alergias severas reportadas. ¡No administrar fármacos de humanos!'}\n• *Recomendación:* Ofrécele agua fresca y mantenlo en reposo.\n• *Atención Médica Inmediata:* Si la mascota requiere auxilio médico, nuestra clínica atiende emergencias 24/7 en *Av. Primavera 1234, Surco*.`;
    }

    // 5. Ubicación de la clínica para llevarlo
    if (/(d[oó]nde|ubicaci[oó]n|sede|cl[ií]nica|llevarlo|dejarlo|surco)/i.test(t)) {
      return `🏥 *Llevar a ${petName} a la Clínica Veterinaria:*\n\nPuedes traerlo directamente a nuestra sede:\n📍 *Dirección:* Av. Primavera 1234, Santiago de Surco, Lima.\n⏰ *Horario:* Abierto las 24 Horas los 365 días del año.\n📞 *Teléfono:* +51 987 654 321\n\nAquí lo revisaremos sin costo de triaje y resguardaremos hasta que llegue su familia.`;
    }

    // 6. Agradecimiento
    if (/(gracias|muchas gracias|ok|listo|perfecto|chau|adi[oó]s)/i.test(t)) {
      return `¡De todo corazón, muchas gracias a ti por rescatar a *${petName}* y ayudarlo a reunirse con su familia! ❤️🐾 Si necesitas asistencia adicional, este canal está activo las 24 horas.`;
    }

    // Fallback Rescate
    return `He recibido tu mensaje de rescate sobre *${petName}*: "${text}".\n\n🚨 *Acciones inmediatas:*\n1️⃣ Escribe la dirección o distrito donde está la mascota.\n2️⃣ Marca al celular del dueño: *${ownerPhone || '+51 987 654 321'}*.\n3️⃣ Comunícate con la Clínica Huellas 24/7: *+51 987 654 321*.`;
  }

  // MODO HABITUAL / RECORDATORIOS / RUTINA
  // 1. Saludos
  if (/^(hola|buenas|buen d[ií]a|buenas tardes|buenas noches|hey|que tal|saludos|holis)/i.test(t)) {
    return `¡Hola ${ownerName}! 🐾 Soy *HuellasBot*, el asistente virtual oficial de la *Clínica Veterinaria Huellas*.\n\nEstoy aquí para acompañarte en el cuidado médico y la protección inteligente de *${petName}* (Placa: ${petCode}).\n\nPuedes preguntarme sobre:\n• 💉 *Vacunas y recordatorios automáticos*\n• 📅 *Agendar una cita con los veterinarios*\n• 📍 *Ubicación y horarios de atención*\n• 🚨 *Protocolo de rescate si tu mascota se extravía*\n• 🏷️ *Costos y servicios clínicos*`;
  }

  // 2. Agendar Cita / Horarios
  if (/(cita|agendar|separar|turno|hora|reserva|programar cita|sacar cita|consulta)/i.test(t)) {
    return `📅 *Agendamiento de Citas Médicas - Clínica Huellas*\n\n¡Con mucho gusto! Podemos agendar la atención médica para *${petName}*.\n\n🩺 *Veterinarios de turno:*\n• Dra. Ana Torres (Medicina General & Cirugía)\n• Dr. Luis Vega (Vacunación & Medicina Felina)\n\n⏰ *Turnos disponibles sugeridos:*\n1️⃣ Hoy a las 4:30 PM\n2️⃣ Mañana a las 10:00 AM\n3️⃣ Mañana a las 3:30 PM\n\nResponde *1*, *2* o *3* para reservar tu turno, o escribe el horario que prefieras.`;
  }

  // 3. Confirmación de turno por número
  if (/^(1|2|3|opci[oó]n 1|opci[oó]n 2|opci[oó]n 3)$/i.test(t)) {
    return `✅ *¡Cita confirmada con éxito!*\n\n🐾 Paciente: *${petName}*\n👤 Propietario: *${ownerName}*\n🏥 Sede: Av. Primavera 1234, Surco\n🎟️ Código de Cita: *HUELLAS-${Math.floor(1000 + Math.random() * 9000)}*\n\nTe enviaremos una alerta de recordatorio 2 horas antes por este chat. ¡Los esperamos en la clínica!`;
  }

  // 4. Vacunas y Recordatorios
  if (/(vacuna|recordatorio|refuerzo|vence|antirr[aá]bica|s[eé]xtuple|triple|desparasit|dosis|alergia)/i.test(t)) {
    return `💉 *Esquema Vacunal & Recordatorios de ${petName}:*\n\n• *Tratamiento actual:* ${vaccineName}\n• *Fecha programada / Refuerzo:* ${dueDate}\n• *Placa QR de control:* ${petCode}\n\n🔔 Nuestro sistema te notificará automáticamente *3 días antes* y el *mismo día* de la cita para que ${petName} mantenga su carnet al día. ¿Deseas confirmar la fecha o consultar otra vacuna?`;
  }

  // 5. Mascota Perdida / Encontrada / Rescate
  if (/(perdid|extraviad|encontr|rescate|calle|placa|desaparecid|se escap[oó]|ayuda)/i.test(t)) {
    return `🚨 *Protocolo de Rescate y Seguridad Huellas:*\n\nSi *${petName}* se encuentra extraviado o alguien lo encontró:\n\n1️⃣ La placa QR del collar permite llamar inmediatamente al número de emergencia del dueño.\n2️⃣ *Ley de Protección de Datos (N° 29733):* Tu dirección particular y DNI se mantienen protegidos; solo se muestra el teléfono para la llamada de auxilio.\n3️⃣ Quien lo encuentre puede enviar sus coordenadas GPS en un toque.\n4️⃣ También pueden llevarlo a nuestra clínica en *Av. Primavera 1234, Surco* para revisión gratuita de microchip.`;
  }

  // 6. Ubicación, Horarios y Contacto
  if (/(d[oó]nde|ubicaci[oó]n|direcci[oó]n|donde est[aá]n|horario|atenci[oó]n|tel[eé]fono|contacto|surco|lima)/i.test(t)) {
    return `📍 *Clínica Veterinaria Huellas - Sede Surco*\n\n• *Dirección:* Av. Primavera 1234, Santiago de Surco, Lima - Perú.\n• *Horario Regular:* Lunes a Domingo de 8:00 AM a 8:00 PM.\n• *Urgencias y Emergencias:* Atención Médica 24 Horas / 365 días.\n• *Teléfono Central:* +51 987 654 321\n• *Email:* contacto@huellas.com\n\n¿Deseas indicaciones en mapa o coordinar una atención urgente?`;
  }

  // 7. Costos, Precios y Placa QR
  if (/(precio|costo|cu[aá]nto|tarifa|promoci[oó]n|collar|gratis|chip|microchip)/i.test(t)) {
    return `🏷️ *Tarifario de Servicios Oficiales Huellas:*\n\n• *Placa QR con Collar Inteligente:* ¡100% GRATIS con el registro en la web!\n• *Consulta Médica Veterinaria:* S/ 45.00\n• *Vacunación (Antirrábica / Séxtuple):* Desde S/ 60.00\n• *Desparasitación Interna y Externa:* S/ 30.00\n• *Microchip de Identificación Homologado:* S/ 80.00\n• *Baño Medicado y Grooming:* Desde S/ 40.00`;
  }

  // 8. Síntomas de Enfermedad / Alergias / Triage
  if (/(enferm|vomit|v[oó]mito|diarrea|fiebre|sangre|no come|deca[ií]do|decaida|inapetente|alergia|dolor|llora)/i.test(t)) {
    return `⚠️ *Triaje y Orientación Veterinaria para ${petName}:*\n\nLos síntomas que mencionas requieren atención profesional:\n• Si presenta vómitos reiterados, dificultad para respirar o fiebre, te recomendamos no automedicarlo.\n• Nuestro equipo médico de guardia está disponible las 24 horas en Av. Primavera 1234, Surco.\n\n📞 Para urgencias críticas comunícate de inmediato al: *+51 987 654 321*.`;
  }

  // 9. Despedida y Agradecimiento
  if (/(gracias|muchas gracias|ok|listo|perfecto|chau|adi[oó]s|hasta luego)/i.test(t)) {
    return `¡Con mucho gusto, ${ownerName}! 🐾 En la *Clínica Veterinaria Huellas* amamos cuidar de *${petName}*.\n\nEscríbeme siempre que lo necesites. ¡Que tengan un excelente día! 🐶🐱❤️`;
  }

  // Fallback Inteligente y Contextual
  return `He recibido tu mensaje sobre *${petName}*: "${text}".\n\n🐾 Para asistirte de inmediato, puedes elegir o escribir:\n\n1️⃣ "¿Cuándo le toca la vacuna?"\n2️⃣ "Agendar cita médica para ${petName}"\n3️⃣ "¿Dónde queda la clínica y cuáles son los horarios?"\n4️⃣ "¿Cómo funciona la placa QR si se pierde?"`;
}

export default function WhatsAppChatbotModal({
  isOpen,
  onClose,
  petName = 'tu mascota',
  ownerName = 'Propietario',
  ownerPhone = '+51 987 654 321',
  petAllergies = '',
  mode = 'routine', // 'routine' | 'rescue'
  vaccineName = 'Vacuna Antirrábica y Sextuple',
  dueDate = 'En 30 días',
  petCode = 'HP-4092'
}) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [reminderConfirmed, setReminderConfirmed] = useState(false);
  const chatEndRef = useRef(null);

  // Auto scroll al final de los mensajes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setIsTyping(false);
      setReminderConfirmed(false);
      return;
    }

    setIsTyping(true);

    if (mode === 'rescue') {
      // Saludo y apertura específica para rescate de mascota perdida
      const timer1 = setTimeout(() => {
        setMessages([
          {
            id: 1,
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `🚨 *¡Canal de Emergencia y Rescate Activo!* 🐾\n\nHola, gracias por escanear la placa de *${petName}* (Código: *${petCode}*). Soy el Asistente de Rescate de la *Clínica Veterinaria Huellas*.`
          }
        ]);
      }, 400);

      const timer2 = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: 2,
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `¿Has encontrado a *${petName}*? Por favor cuéntame si está contigo o escribe tu dirección/punto de encuentro para coordinar de inmediato con su dueño *${ownerName}* (Tel: ${ownerPhone}).`
          }
        ]);
        setIsTyping(false);
      }, 1100);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      // Saludo estándar para modo habitual / carnet y recordatorios
      const timer1 = setTimeout(() => {
        setMessages([
          {
            id: 1,
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `¡Hola ${ownerName}! 🐾 Soy *HuellasBot*, el asistente virtual oficial de la *Clínica Veterinaria Huellas*.\n\nHe vinculado la ficha médica de *${petName}* (Placa QR: *${petCode}*).`
          }
        ]);
      }, 500);

      const timer2 = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: 2,
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `🔔 *Recordatorio Preventivo Programado:*\n💉 *Tratamiento:* ${vaccineName}\n📅 *Fecha Límite:* ${dueDate}\n\n¿Deseas confirmar la activación de esta alerta preventiva para recibirla por WhatsApp?`
          }
        ]);
        setIsTyping(false);
      }, 1500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen, petName, ownerName, ownerPhone, petAllergies, mode, vaccineName, dueDate, petCode]);

  const handleConfirmReminder = () => {
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        time: userTime,
        text: `Sí, por favor confirmar y programar el recordatorio para ${petName}.`
      }
    ]);

    setIsTyping(true);
    setReminderConfirmed(true);

    setTimeout(() => {
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          time: botTime,
          text: `✅ *¡Recordatorio Activado con Éxito!*\n\n📅 Fecha guardada: *${dueDate}*\n🩺 Tratamiento: *${vaccineName}*\n🐾 Paciente: *${petName}*\n\nTe notificaremos automáticamente por este canal *3 días antes* y el *día previo*. ¡Cuidamos a los que más quieres! 🐶🐱`
        }
      ]);
      setIsTyping(false);
    }, 900);
  };

  const processUserMessage = (text) => {
    if (!text.trim()) return;
    const userText = text.trim();
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        time: userTime,
        text: userText
      }
    ]);

    setIsTyping(true);

    // Generar respuesta con sentido y contexto real
    setTimeout(() => {
      const reply = generateBotReply(userText, {
        petName,
        ownerName,
        ownerPhone,
        petAllergies,
        mode,
        vaccineName,
        dueDate,
        petCode
      });
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          time: botTime,
          text: reply
        }
      ]);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const text = userInput;
    setUserInput('');
    processUserMessage(text);
  };

  if (!isOpen) return null;

  const quickChips = mode === 'rescue'
    ? [
        'Tengo a la mascota conmigo',
        'Llamar al dueño',
        '¿Tiene alguna alergia médica?',
        'Dirección para llevarlo'
      ]
    : [
        '¿Cuándo toca la vacuna?',
        'Agendar cita médica',
        'Ubicación y horarios',
        'Costos de consulta'
      ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '630px',
          maxHeight: '92vh',
          backgroundColor: '#0B141A',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER DE WHATSAPP */}
        <div
          style={{
            backgroundColor: '#1F2C34',
            padding: '0.8rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <Icon name="paw" size={24} />
              </div>
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#25D366',
                  border: '2px solid #1F2C34'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <strong style={{ color: '#E9EDEF', fontSize: '0.95rem' }}>
                  {mode === 'rescue' ? 'HuellasBot Rescate 🚨' : 'HuellasBot 🐾'}
                </strong>
                <span
                  style={{
                    backgroundColor: mode === 'rescue' ? '#EF4444' : '#00A884',
                    color: 'white',
                    fontSize: '0.65rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}
                >
                  {mode === 'rescue' ? 'EMERGENCIA' : 'OFICIAL'}
                </span>
              </div>
              <span style={{ color: '#8696A0', fontSize: '0.75rem' }}>
                {mode === 'rescue'
                  ? 'Protocolo de Rescate y Contacto Inmediato'
                  : 'Chatbot Interactivo · Respuestas en tiempo real'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#AEBAC1',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* BANNER INFORMATIVO */}
        <div
          style={{
            backgroundColor: '#182229',
            padding: '0.45rem 0.8rem',
            textAlign: 'center',
            fontSize: '0.72rem',
            color: '#8696A0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          🔒 Asistente Clínico Huellas PetID · Comunicación Segura y Automatizada
        </div>

        {/* ÁREA DE MENSAJES */}
        <div
          style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        >
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isBot ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                  backgroundColor: isBot ? '#202C33' : '#005C4B',
                  color: '#E9EDEF',
                  padding: '0.65rem 0.85rem',
                  borderRadius: isBot ? '0 12px 12px 12px' : '12px 0 12px 12px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  fontSize: '0.86rem',
                  lineHeight: 1.45,
                  position: 'relative',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-line'
                }}
              >
                {msg.text}
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '0.65rem',
                    color: '#8696A0',
                    marginTop: '0.3rem'
                  }}
                >
                  {msg.time} {isBot ? '' : '✓✓'}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div
              style={{
                alignSelf: 'flex-start',
                backgroundColor: '#202C33',
                color: '#8696A0',
                padding: '0.5rem 0.8rem',
                borderRadius: '0 12px 12px 12px',
                fontSize: '0.78rem',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>HuellasBot está respondiendo...</span>
            </div>
          )}

          {/* BOTÓN RÁPIDO PARA CONFIRMAR RECORDATORIO INICIAL (SOLO EN MODO RUTINA) */}
          {mode !== 'rescue' && !reminderConfirmed && messages.length >= 2 && !isTyping && (
            <div style={{ alignSelf: 'center', margin: '0.3rem 0', width: '100%' }}>
              <button
                type="button"
                onClick={handleConfirmReminder}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#00A884',
                  color: '#111B21',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(0, 168, 132, 0.4)'
                }}
              >
                <Icon name="check" size={17} />
                <span>Confirmar Programación de Recordatorio</span>
              </button>
            </div>
          )}

          {/* BOTÓN RÁPIDO DE LLAMADA AL DUEÑO (EN MODO RESCATE) */}
          {mode === 'rescue' && !isTyping && (
            <div style={{ alignSelf: 'center', margin: '0.2rem 0', width: '100%' }}>
              <a
                href={`tel:${(ownerPhone || '987654321').replace(/\s+/g, '')}`}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35)',
                  boxSizing: 'border-box'
                }}
              >
                <Icon name="phone" size={16} />
                <span>Llamar de Inmediato al Dueño ({ownerPhone})</span>
              </a>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* CHIPS RÁPIDOS SUGERIDOS */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            padding: '0.4rem 0.8rem',
            backgroundColor: '#182229',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            scrollbarWidth: 'none'
          }}
        >
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => processUserMessage(chip)}
              style={{
                whiteSpace: 'nowrap',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#CBD5E1',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '999px',
                padding: '0.25rem 0.7rem',
                fontSize: '0.72rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* INPUT DE MENSAJE INTERACTIVO */}
        <form
          onSubmit={handleSendMessage}
          style={{
            backgroundColor: '#1F2C34',
            padding: '0.6rem 0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <input
            type="text"
            placeholder={`Escribe a HuellasBot sobre ${petName}...`}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: '#2A3942',
              border: 'none',
              borderRadius: '8px',
              padding: '0.65rem 0.9rem',
              color: '#E9EDEF',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            style={{
              backgroundColor: '#00A884',
              color: '#111B21',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Icon name="send" size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
