// src/components/WhatsAppChatbotModal.jsx
import React, { useState, useEffect } from 'react';
import Icon from './Icon';

export default function WhatsAppChatbotModal({
  isOpen,
  onClose,
  petName = 'tu mascota',
  ownerName = 'Propietario',
  vaccineName = 'Vacuna Antirrábica y Sextuple',
  dueDate = 'En 30 días',
  petCode = 'HP-4092'
}) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [reminderConfirmed, setReminderConfirmed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setIsTyping(true);
      setReminderConfirmed(false);
      return;
    }

    // Secuencia inicial del Chatbot
    const timer1 = setTimeout(() => {
      setMessages([
        {
          id: 1,
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `¡Hola ${ownerName}! 🐾 Soy *HuellasBot*, el asistente virtual automatizado de la *Clínica Veterinaria Huellas*.\n\nHe recibido la solicitud para programar el recordatorio médico de *${petName}* (Placa: ${petCode}).`
        }
      ]);
      setIsTyping(true);
    }, 600);

    const timer2 = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: 2,
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `🔔 ¿Deseas que programe la alerta preventiva para su tratamiento:\n💉 *${vaccineName}*\n📅 *Fecha límite:* ${dueDate}?`
        }
      ]);
      setIsTyping(false);
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, petName, ownerName, vaccineName, dueDate, petCode]);

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
          text: `✅ *¡Recordatorio Programado con Éxito!*\n\n📅 Fecha guardada: *${dueDate}*\n🩺 Tratamiento: *${vaccineName}*\n🐾 Paciente: *${petName}*\n\nTe notificaremos automáticamente por este canal 3 días antes y el día previo a la cita. ¡Cuidamos la salud de ${petName}! 🐶🐱`
        }
      ]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userText = userInput.trim();
    setUserInput('');
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

    setTimeout(() => {
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          time: botTime,
          text: `Entendido. He registrado tu consulta sobre *${petName}*. Un médico veterinario de la Clínica Huellas revisará la ficha si requieres atención clínica personalizada.`
        }
      ]);
      setIsTyping(false);
    }, 1000);
  };

  if (!isOpen) return null;

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
          height: '620px',
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
                <strong style={{ color: '#E9EDEF', fontSize: '0.95rem' }}>HuellasBot 🐾</strong>
                <span
                  style={{
                    backgroundColor: '#00A884',
                    color: 'white',
                    fontSize: '0.65rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}
                >
                  OFICIAL
                </span>
              </div>
              <span style={{ color: '#8696A0', fontSize: '0.75rem' }}>
                Chatbot Automatizado de Recordatorios · En línea
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

        {/* BANNER INFORMATIVO (NO ES NÚMERO REAL) */}
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
          🔒 Asistente Inteligente de Huellas PetID · Sin intermediarios ni números telefónicos privados
        </div>

        {/* ÁREA DE MENSAJES (ESTILO WHATSAPP) */}
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
                  maxWidth: '82%',
                  backgroundColor: isBot ? '#202C33' : '#005C4B',
                  color: '#E9EDEF',
                  padding: '0.65rem 0.85rem',
                  borderRadius: isBot ? '0 12px 12px 12px' : '12px 0 12px 12px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  fontSize: '0.88rem',
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
              <span>HuellasBot está escribiendo</span>
              <span style={{ animation: 'pulse 1s infinite' }}>...</span>
            </div>
          )}

          {/* BOTÓN RÁPIDO PARA CONFIRMAR RECORDATORIO */}
          {!reminderConfirmed && messages.length >= 2 && !isTyping && (
            <div style={{ alignSelf: 'center', margin: '0.5rem 0', width: '100%' }}>
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
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(0, 168, 132, 0.4)'
                }}
              >
                <Icon name="check" size={18} />
                <span>Confirmar Programación de Recordatorio</span>
              </button>
            </div>
          )}
        </div>

        {/* INPUT DE MENSAJE (SIMULADO / INTERACTIVO) */}
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
            placeholder="Escribe un mensaje a HuellasBot..."
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
