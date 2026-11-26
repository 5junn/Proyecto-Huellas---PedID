const db = require('../db');
const { processScheduledAndDueReminders } = require('./messagingService');

let timerHandle = null;

async function runReminderCycle() {
  const ok = await db.checkConnection();
  if (!ok) return null;
  try {
    const summary = await processScheduledAndDueReminders({
      diasAnticipacion: 7,
      soloVencidos: true,
    });
    if (summary.enviados > 0 || summary.generadosPorVacunas > 0) {
      console.log(
        `[Scheduler Huellas] Ciclo automático: ${summary.generadosPorVacunas} generados, ${summary.enviados} enviados, ${summary.fallidos} fallidos.`
      );
    }
    return summary;
  } catch (err) {
    console.warn('[Scheduler Huellas] Error en ciclo automático:', err.message);
    return null;
  }
}

function startScheduler() {
  if (timerHandle) return timerHandle;
  const intervalMs = Math.max(30000, Number(process.env.AUTO_REMINDER_INTERVAL_MS) || 300000);
  timerHandle = setInterval(() => {
    runReminderCycle();
  }, intervalMs);
  if (typeof timerHandle.unref === 'function') {
    timerHandle.unref();
  }
  console.log(`[Scheduler Huellas] Motor automático de recordatorios activo cada ${Math.round(intervalMs / 1000)}s.`);
  return timerHandle;
}

function stopScheduler() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

module.exports = { startScheduler, stopScheduler, runReminderCycle };
