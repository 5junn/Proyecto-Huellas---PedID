import Icon from './Icon';
import { clinicWhatsApp, phoneLink, useClinicContact } from '../services/clinicContact';

export default function ClinicContactDialog({ isOpen, ...props }) {
  return isOpen ? <ContactDetails {...props} /> : null;
}

function ContactDetails({ onClose, petName, petCode, vaccineName, dueDate, rescuePhone }) {
  const { contact, loading, error } = useClinicContact();
  const reference = petCode ? `Consulta por la placa ${petCode} de ${petName}.` : 'Solicito orientación veterinaria.';
  const whatsApp = clinicWhatsApp(contact?.whatsapp, `Hola. ${reference}`);
  const clinicPhone = phoneLink(contact?.telefono);
  const ownerPhone = phoneLink(rescuePhone);

  return (
    <div className="staff-modal-overlay" onClick={onClose}>
      <section className="staff-modal-box" role="dialog" aria-modal="true" aria-labelledby="clinic-contact-title"
        onClick={(event) => event.stopPropagation()}>
        <header className="staff-modal-header">
          <h3 id="clinic-contact-title">Contacto y orientación</h3>
          <button type="button" aria-label="Cerrar" onClick={onClose}><Icon name="close" size={20} /></button>
        </header>
        <div className="staff-modal-body">
          {petName && petCode && <p>{petName} · {petCode}</p>}
          {vaccineName && <p>{vaccineName}{dueDate && ` · ${dueDate}`}</p>}
          {ownerPhone && <a className="btn btn-outline" href={ownerPhone}>Llamar al propietario</a>}
          {loading && <p role="status">Cargando contacto de la clínica…</p>}
          {error && <p role="alert">{error}</p>}
          {contact?.direccion && <p>{contact.direccion}</p>}
          {clinicPhone && <a className="btn btn-outline" href={clinicPhone}>Llamar a la clínica · {contact.telefono}</a>}
          {whatsApp && <a className="btn btn-outline" href={whatsApp} target="_blank" rel="noreferrer">Abrir WhatsApp de la clínica</a>}
          {contact && !clinicPhone && !whatsApp && <p>La clínica todavía no ha configurado un número de atención.</p>}
        </div>
      </section>
    </div>
  );
}
