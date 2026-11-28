import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function LostPetReports({ pets, status }) {
  return (
    <article className="card">
      <header className="card-head">
        <div>
          <h2>Mascotas extraviadas</h2>
          <p>{status === 'ready' && `${pets.length} ${pets.length === 1 ? 'reporte activo' : 'reportes activos'}`}</p>
        </div>
      </header>
      {status === 'ready' && pets.length === 0 && <p className="staff-empty-state">No hay reportes de extravío activos.</p>}
      {pets.length > 0 && (
        <ul className="list">
          {pets.map((pet) => (
            <li className="row" key={pet.id_mascota}>
              <span className="avatar"><Icon name="alert" size={16} /></span>
              <div className="row-text">
                <strong>{pet.nombre} · {pet.codigoQR || 'Sin placa registrada'}</strong>
                <span>{[pet.raza || pet.especie, pet.propietario].filter(Boolean).join(' · ')}</span>
              </div>
              {pet.codigoQR && <Link className="btn btn-outline sm" to={`/pet/${encodeURIComponent(pet.codigoQR)}`}>Ver ficha QR</Link>}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
