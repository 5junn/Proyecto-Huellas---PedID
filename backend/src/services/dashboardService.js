const db = require('../db');
const { DAY_MS, LIMA_OFFSET_SECONDS, clinicToday } = require('../utils/clinicDates');

const SCHEMA_ERRORS = new Set(['ER_BAD_FIELD_ERROR', 'ER_NO_SUCH_TABLE']);

async function loadDashboard(clinical) {
  const today = clinicToday();
  const end = Date.parse(today) + DAY_MS;
  const start = end - 56 * DAY_MS;
  const since = start / 1000 + LIMA_OFFSET_SECONDS;
  const until = end / 1000 + LIMA_OFFSET_SECONDS;
  const startDay = new Date(start).toISOString().slice(0, 10);

  return db.withTransaction(async (conn) => {
    const response = { totales: {}, especies: null, series: {}, hoy: today, avisos: [] };

    async function read(label, action) {
      try {
        await action();
      } catch (error) {
        if (!SCHEMA_ERRORS.has(error.code)) throw error;
        console.error('[Dashboard MySQL]', label, error.code, error.sqlMessage);
        response.avisos.push({ label, message: 'Faltan tablas o columnas en la base configurada. Reinicia el backend actualizado para aplicar la migración.' });
      }
    }

    await read('Mascotas y propietarios', async () => {
      const [[totals]] = await conn.query(
        `SELECT (SELECT COUNT(*) FROM mascotas) AS mascotas,
                (SELECT COUNT(*) FROM propietarios) AS propietarios`
      );
      Object.assign(response.totales, totals);
    });
    await read('Distribución por especie', async () => {
      const [rows] = await conn.query(
        `SELECT COALESCE(m.especie, r.especie) AS especie, COUNT(*) AS cantidad
         FROM mascotas m
         LEFT JOIN razas r ON r.id_raza = m.id_raza
         GROUP BY COALESCE(m.especie, r.especie)
         ORDER BY especie`
      );
      response.especies = rows;
    });
    await read('Altas de mascotas', async () => {
      const [rows] = await conn.query(
        `SELECT DATE_FORMAT(TIMESTAMPADD(SECOND, UNIX_TIMESTAMP(creado_en) - ?, '1970-01-01 00:00:00'), '%Y-%m-%d') AS dia,
                COUNT(*) AS cantidad
         FROM mascotas WHERE creado_en >= FROM_UNIXTIME(?) AND creado_en < FROM_UNIXTIME(?)
         GROUP BY dia`,
        [LIMA_OFFSET_SECONDS, since, until]
      );
      response.series.mascotas = rows;
    });

    if (clinical) {
      await read('Consultas registradas', async () => {
        const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM consultas_historial');
        response.totales.consultas = total;
      });
      await read('Consultas atendidas', async () => {
        const [rows] = await conn.query(
          `SELECT DATE_FORMAT(TIMESTAMPADD(SECOND, UNIX_TIMESTAMP(fecha_hora) - ?, '1970-01-01 00:00:00'), '%Y-%m-%d') AS dia,
                  COUNT(*) AS cantidad
           FROM consultas_historial
           WHERE estado = 'done' AND fecha_hora >= FROM_UNIXTIME(?) AND fecha_hora < FROM_UNIXTIME(?)
           GROUP BY dia`,
          [LIMA_OFFSET_SECONDS, since, until]
        );
        response.series.consultas = rows;
      });
      await read('Refuerzos de vacunación', async () => {
        const [[totals]] = await conn.query(
          `SELECT COUNT(CASE WHEN fecha_proximo_refuerzo BETWEEN ? AND DATE_ADD(?, INTERVAL 15 DAY) THEN 1 END) AS vacunasPorVencer,
                  COUNT(CASE WHEN fecha_proximo_refuerzo < ? THEN 1 END) AS vacunasVencidas
           FROM carnet_vacunacion`,
          [today, today, today]
        );
        Object.assign(response.totales, totals);
      });
      await read('Dosis aplicadas', async () => {
        const [rows] = await conn.query(
          `SELECT DATE_FORMAT(fecha_aplicacion, '%Y-%m-%d') AS dia, COUNT(*) AS cantidad
           FROM carnet_vacunacion WHERE fecha_aplicacion BETWEEN ? AND ? GROUP BY dia`,
          [startDay, today]
        );
        response.series.vacunas = rows;
      });
    }
    return response;
  });
}

module.exports = { loadDashboard };
