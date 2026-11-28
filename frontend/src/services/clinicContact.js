import { useEffect, useState } from 'react';
import { apiFetch } from './apiClient';
import { generateWhatsAppLink } from './whatsappService';

export function useClinicContact() {
  const [result, setResult] = useState({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    apiFetch('/contacto-clinica', { authenticated: false, signal: controller.signal })
      .then((contact) => setResult({ contact, loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ error: error.message, loading: false });
      });
    return () => controller.abort();
  }, []);
  return result;
}

export function phoneLink(phone) {
  const value = String(phone || '').replace(/[^\d+]/g, '');
  return /^\+?\d{6,15}$/.test(value) ? `tel:${value}` : null;
}

export function clinicWhatsApp(phone, message) {
  const value = String(phone || '').replace(/\D/g, '');
  return /^\d{9,15}$/.test(value) ? generateWhatsAppLink(value, message) : null;
}
