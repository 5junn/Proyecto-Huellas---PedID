import Icon from './Icon';

const dateFormat = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'UTC' });

export default function VaccineInventory({ batches, today, onCreate, status }) {
  return (
    <article className="mgmt-card">
      <header className="card-head">
        <h2>Inventario de vacunas</h2>
        <button type="button" className="btn-staff-primary" onClick={onCreate}>
          <Icon name="plus" size={16} /> Registrar lote
        </button>
      </header>
      <div className="mgmt-table-wrap">
        <table className="mgmt-table">
          <thead>
            <tr><th>Vacuna</th><th>Lote</th><th>Vencimiento</th><th>Dosis recibidas</th><th>Dosis disponibles</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {batches.length === 0 && status === 'ready' && (
              <tr><td colSpan={6} className="staff-empty-state">Registra las dosis que tienes en inventario para poder aplicarlas.</td></tr>
            )}
            {batches.map((batch) => {
              const expired = batch.fecha_vencimiento < today;
              const available = !expired && batch.dosis_disponibles > 0;
              return (
                <tr key={batch.id_lote}>
                  <td>{batch.vacuna}</td><td><code>{batch.lote_fabricante}</code></td>
                  <td>{dateFormat.format(new Date(batch.fecha_vencimiento))}</td>
                  <td>{batch.dosis_iniciales}</td><td>{batch.dosis_disponibles}</td>
                  <td><span className={`mgmt-badge ${available ? 'ok' : 'warn'}`}>
                    {expired ? 'Vencido' : available ? 'Disponible' : 'Agotado'}
                  </span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
