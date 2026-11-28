const db = require('../db');
const { DAY_MS, LIMA_OFFSET_SECONDS, clinicToday } = require('../utils/clinicDates');

async function loadDashboard(clinical) {
  const today = clinicToday();
  const end = Date.parse(today) + DAY_MS;
  const start = end - 56 * DAY_MS;
  const since = start / 1000 + LIMA_OFFSET_SECONDS;
  const until = end / 1000 + LIMA_OFFSET_SECONDS;
  const startDay = new Date(start).toISOString().slice(0, 10);

  return db.withTransaction(async (conn) => {
    const [[totales]] = await conn.query(
      `SELECT (SELECT COUNT(*) FROM mascotas) AS mascotas,
              (SELECT COUNT(*) FROM propietarios) AS propietarios
              ${clinical ? `, (SELECT COUNT(*) FROM consultas_historial) AS consultas,
              (SELECT COUNT(*) FROM carnet_vacunacion
               WHERE fecha_proximo_refuerzo BETWEEN ? AND DATE_ADD(?, INTERVAL 15 DAY)) AS vacunasPorVencer,
              (SELECT COUNT(*) FROM carnet_vacunacion WHERE fecha_proximo_refuerzo < ?) AS vacunasVencidas
              ` : ''}`,
      clinical ? [today, today, today] : []
    );
    const [especies] = await conn.query('SELECT especie, COUNT(*) AS cantidad FROM mascotas GROUP BY especie ORDER BY especie');
    const [mascotas] = await conn.query(
      `SELECT DATE_FORMAT(TIMESTAMPADD(SECOND, UNIX_TIMESTAMP(creado_en) - ?, '1970-01-01 00:00:00'), '%Y-%m-%d') AS dia,
              COUNT(*) AS cantidad
       FROM mascotas WHERE creado_en >= FROM_UNIXTIME(?) AND creado_en < FROM_UNIXTIME(?)
       GROUP BY dia`,
      [LIMA_OFFSET_SECONDS, since, until]
    );
    const series = { mascotas };
    if (clinical) {
      const [consultas] = await conn.query(
        `SELECT DATE_FORMAT(TIMESTAMPADD(SECOND, UNIX_TIMESTAMP(fecha_hora) - ?, '1970-01-01 00:00:00'), '%Y-%m-%d') AS dia,
                COUNT(*) AS cantidad
         FROM consultas_historial
         WHERE estado = 'done' AND fecha_hora >= FROM_UNIXTIME(?) AND fecha_hora < FROM_UNIXTIME(?)
         GROUP BY dia`,
        [LIMA_OFFSET_SECONDS, since, until]
      );
      const [vacunas] = await conn.query(
        `SELECT DATE_FORMAT(fecha_aplicacion, '%Y-%m-%d') AS dia, COUNT(*) AS cantidad
         FROM carnet_vacunacion WHERE fecha_aplicacion BETWEEN ? AND ? GROUP BY dia`,
        [startDay, today]
      );
      Object.assign(series, { consultas, vacunas });
    }
    return { totales, especies, series, hoy: today };
  });
}

module.exports = { loadDashboard };
