const { sanitizeText } = require('../utils/security');

/**
 * Invoca una API externa de IA (Google Gemini o OpenAI) esperando respuesta JSON estructurada.
 * Si no hay API key configurada o la red falla, retorna null para activar el motor clínico local.
 */
async function callExternalAIJson({ systemPrompt, userPrompt, temperature = 0.35 }) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`;

    const resp = await fetch(endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return { parsed: JSON.parse(rawText), provider: `Google Gemini (${model})`, external: true };
      }
    }
  }

  if (openaiKey) {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (rawText) {
        return { parsed: JSON.parse(rawText), provider: `OpenAI (${model})`, external: true };
      }
    }
  }

  return null;
}

/**
 * 1. RECORDATORIOS INTELIGENTES
 * Redacta mensajes personalizados (WhatsApp o Correo) basados en la próxima dosis y perfil de la mascota.
 */
async function generateSmartReminder({
  petName = 'tu mascota',
  species = 'Canino',
  breed = 'Mestizo',
  ownerName = 'Familia',
  vaccineName = 'Refuerzo Vacunal',
  dueDate = 'Próximamente',
  daysRemaining = null,
  allergies = '',
  channel = 'WhatsApp',
}) {
  const clinicName = process.env.CLINIC_NAME || 'Clínica Veterinaria Huellas';
  const clinicPhone = process.env.CLINIC_PHONE || '+51 987 654 321';

  const systemPrompt =
    'Eres un asistente veterinario experto en comunicación preventiva para Clínica Veterinaria Huellas (Lima, Perú). ' +
    'Devuelve SIEMPRE JSON válido con las llaves: asunto (string), mensaje (string), recomendacion_preventiva (string). ' +
    'Redacta un mensaje empático, claro y profesional adaptado al canal (WhatsApp con formato limpio o Correo formal).';

  const userPrompt = JSON.stringify({
    tarea: 'Redactar recordatorio inteligente de próxima dosis',
    canal: channel,
    mascota: petName,
    especie: species,
    raza: breed,
    propietario: ownerName,
    vacuna_o_control: vaccineName,
    fecha_proxima_dosis: dueDate,
    dias_restantes: daysRemaining,
    alergias_conocidas: allergies || 'Ninguna',
    clinica: clinicName,
    telefono_clinica: clinicPhone,
  });

  try {
    const aiResp = await callExternalAIJson({ systemPrompt, userPrompt, temperature: 0.45 });
    if (aiResp?.parsed?.mensaje) {
      return {
        asunto: sanitizeText(aiResp.parsed.asunto || `Recordatorio ${vaccineName} - ${petName}`, 140),
        mensaje: sanitizeText(aiResp.parsed.mensaje, 1800),
        recomendacion_preventiva: sanitizeText(aiResp.parsed.recomendacion_preventiva || '', 300),
        canal: channel,
        generadoPorIA: true,
        provider: aiResp.provider,
        external: true,
      };
    }
  } catch (err) {
    console.warn('[IA Recordatorio] Fallback local activado:', err.message);
  }

  const urgencyNote =
    typeof daysRemaining === 'number' && daysRemaining <= 3
      ? '⚠️ *Aviso prioritario:* su refuerzo vence muy pronto para mantener su inmunidad activa.'
      : '📅 Programar su cita con anticipación evita interrupciones en su esquema preventivo.';

  const allergyNote =
    allergies && !/ninguna|sin alergia/i.test(allergies)
      ? `\n🩺 Nota clínica: nuestro equipo tendrá presente su antecedente (*${allergies}*).`
      : '';

  const primerNombre = String(ownerName || 'Familia').split(' ')[0];

  if (channel === 'Correo') {
    return {
      asunto: `Recordatorio Preventivo: ${vaccineName} para ${petName} (${dueDate})`,
      mensaje:
        `Estimado(a) ${ownerName},\n\n` +
        `Le saludamos cordialmente desde ${clinicName}. De acuerdo con el carnet digital de ${petName} (${species} - ${breed}), ` +
        `su próxima aplicación de ${vaccineName} está programada para el ${dueDate}.\n\n` +
        `${urgencyNote.replace(/\*/g, '')}${allergyNote.replace(/\*/g, '')}\n\n` +
        `Puede confirmar su cita respondiendo a este correo o comunicándose al ${clinicPhone}.\n\n` +
        `Atentamente,\nEquipo Médico · ${clinicName}`,
      recomendacion_preventiva: 'Mantener el intervalo vacunal evita pérdida de inmunidad y reduce costos clínicos futuros.',
      canal: 'Correo',
      generadoPorIA: true,
      provider: 'Huellas Clinical AI Engine (Local)',
      external: false,
    };
  }

  return {
    asunto: `Refuerzo ${vaccineName} · ${petName}`,
    mensaje:
      `🐾 *RECORDATORIO INTELIGENTE - HUELLAS PETID* 🐾\n\n` +
      `Hola ${primerNombre}, te escribimos de *${clinicName}* pensando en el bienestar de *${petName}* (${breed}).\n\n` +
      `💉 *Próxima dosis:* ${vaccineName}\n` +
      `📆 *Fecha estimada:* ${dueDate}\n` +
      `${urgencyNote}${allergyNote}\n\n` +
      `📲 Responde este mensaje o llámanos al *${clinicPhone}* para reservar el horario que mejor se adapte a ti.`,
    recomendacion_preventiva: 'Confirmar cita con 48h de anticipación y llevar su placa QR.',
    canal: 'WhatsApp',
    generadoPorIA: true,
    provider: 'Huellas Clinical AI Engine (Local)',
    external: false,
  };
}

/**
 * 2. RESUMEN DEL HISTORIAL CLÍNICO
 * Sintetiza alergias, consultas y tratamientos previos, generando un borrador editable para el veterinario.
 */
async function generateClinicalSummary({
  pet,
  consultations = [],
  vaccines = [],
  weights = [],
  currentReason = '',
}) {
  const petName = pet?.nombre || 'Paciente';
  const allergies = pet?.alergias || 'Sin alergias reportadas';

  const systemPrompt =
    'Eres un médico veterinario asistente senior en Clínica Veterinaria Huellas. ' +
    'Sintetiza el historial clínico del paciente y genera un borrador de diagnóstico e indicaciones médicas ' +
    'que el veterinario revisará y editará antes de guardar. ' +
    'Devuelve SIEMPRE JSON válido con llaves: resumen_ejecutivo (string), alertas_alergias (string), ' +
    'tratamientos_previos (array of strings), borrador_diagnostico (string), indicaciones_sugeridas (string), ' +
    'analisis_peso (string).';

  const userPrompt = JSON.stringify({
    paciente: {
      nombre: petName,
      especie: pet?.especie,
      raza: pet?.raza,
      sexo: pet?.sexo,
      edad: pet?.edad,
      peso_actual_kg: pet?.peso_actual || pet?.peso,
      alergias: allergies,
    },
    motivo_consulta_actual: currentReason || 'Evaluación general / control clínico',
    consultas_previas: consultations.slice(0, 8),
    vacunas: vaccines.slice(0, 8),
    historial_pesos: weights.slice(0, 6),
  });

  try {
    const aiResp = await callExternalAIJson({ systemPrompt, userPrompt, temperature: 0.25 });
    if (aiResp?.parsed?.borrador_diagnostico) {
      return {
        ...aiResp.parsed,
        generadoPorIA: true,
        provider: aiResp.provider,
        external: true,
      };
    }
  } catch (err) {
    console.warn('[IA Resumen Clínico] Fallback local activado:', err.message);
  }

  // Motor clínico determinístico basado en registros reales de MySQL
  const hasAllergies = allergies && !/ninguna|sin alergia|por evaluar/i.test(allergies);
  const lastConsults = consultations.slice(0, 3);
  const prevTreatments = lastConsults
    .map((c) => c.tratamiento_receta || c.diagnostico)
    .filter(Boolean);

  let analisisPeso = 'Sin registros históricos suficientes para tendencia de peso.';
  if (weights.length >= 2) {
    const latest = Number(weights[0].peso_kg);
    const prev = Number(weights[weights.length - 1].peso_kg);
    if (prev > 0) {
      const pct = (((latest - prev) / prev) * 100).toFixed(1);
      analisisPeso = `Peso actual ${latest} kg vs ${prev} kg previo (${Number(pct) >= 0 ? '+' : ''}${pct}%).`;
    }
  } else if (pet?.peso_actual) {
    analisisPeso = `Último peso registrado: ${pet.peso_actual} kg.`;
  }

  const vacunasPorVencer = vaccines.filter((v) => v.estado_dosis === 'por-vencer' || v.estado_dosis === 'vencida');
  const reasonText = currentReason ? `Motivo actual: "${currentReason}". ` : '';

  const borradorDiagnostico =
    `${reasonText}Paciente ${petName} (${pet?.especie || 'Canino'}, ${pet?.raza || 'Mestizo'}) ` +
    `con ${consultations.length} consulta(s) previa(s) registradas. ` +
    (hasAllergies ? `PRECAUCIÓN POR ALERGIA: ${allergies}. ` : 'Sin contraindicaciones alérgicas documentadas. ') +
    (lastConsults[0]
      ? `Último antecedente: ${lastConsults[0].motivo_consulta} — ${lastConsults[0].diagnostico}. `
      : 'Primer ingreso clínico registrado. ') +
    '[Borrador sujeto a revisión y confirmación del médico veterinario tratante]';

  const indicacionesSugeridas = [
    '1. Confirmar constantes fisiológicas (temperatura, FC, FR, mucosas) y peso actual en balanza.',
    hasAllergies
      ? `2. Evitar fármacos relacionados con antecedente alérgico (${allergies}).`
      : '2. Evaluar tolerancia gastrointestinal antes de prescribir antiinflamatorios o antibióticos.',
    vacunasPorVencer.length > 0
      ? `3. Actualizar esquema preventivo pendiente: ${vacunasPorVencer.map((v) => v.vacuna).join(', ')}.`
      : '3. Esquema vacunal vigente; programar próximo control preventivo.',
  ].join('\n');

  return {
    resumen_ejecutivo:
      `${petName} registra ${consultations.length} atención(es) clínica(s) y ${vaccines.length} dosis en carnet. ` +
      (hasAllergies ? `Alerta activa: ${allergies}. ` : '') +
      analisisPeso,
    alertas_alergias: hasAllergies ? `⚠️ ${allergies}` : 'Sin alergias severas reportadas.',
    tratamientos_previos: prevTreatments.length > 0 ? prevTreatments : ['Sin tratamientos previos registrados.'],
    borrador_diagnostico: borradorDiagnostico,
    indicaciones_sugeridas: indicacionesSugeridas,
    analisis_peso: analisisPeso,
    generadoPorIA: true,
    provider: 'Huellas Clinical AI Engine (Local)',
    external: false,
  };
}

/**
 * 3. ALERTAS PREDICTIVAS
 * Analiza vacunas por vencer, falta de controles recientes y cambios de peso para gerencia.
 */
async function generatePredictiveAlerts({
  pets = [],
  vaccines = [],
  consultations = [],
  weights = [],
}) {
  const now = Date.now();
  const DAY_MS = 86400000;

  // A. Vacunas por vencer (<= 15 días) o vencidas
  const alertasVacunas = [];
  for (const v of vaccines) {
    const dueMs = v.fecha_proximo_refuerzo ? new Date(v.fecha_proximo_refuerzo).getTime() : null;
    if (!dueMs || Number.isNaN(dueMs)) continue;
    const diffDays = Math.ceil((dueMs - now) / DAY_MS);
    if (diffDays <= 15) {
      alertasVacunas.push({
        id_mascota: v.id_mascota,
        mascota: v.mascota_nombre || v.pet,
        propietario: v.propietario_nombre || v.owner,
        telefono: v.telefono || '',
        vacuna: v.vacuna || v.vaccine,
        dias_restantes: diffDays,
        severidad: diffDays < 0 ? 'alta' : diffDays <= 5 ? 'media' : 'preventiva',
        detalle: diffDays < 0 ? `Vencida hace ${Math.abs(diffDays)} día(s)` : `Vence en ${diffDays} día(s)`,
      });
    }
  }

  // B. Falta de controles recientes (> 180 días sin consulta o sin consultas registradas)
  const lastConsultByPet = new Map();
  for (const c of consultations) {
    const t = c.fecha_hora ? new Date(c.fecha_hora).getTime() : 0;
    const prev = lastConsultByPet.get(c.id_mascota) || 0;
    if (t > prev) lastConsultByPet.set(c.id_mascota, t);
  }

  const alertasSinControl = [];
  for (const p of pets) {
    const lastMs = lastConsultByPet.get(p.id_mascota);
    const daysSince = lastMs ? Math.floor((now - lastMs) / DAY_MS) : null;
    if (daysSince === null || daysSince >= 180) {
      alertasSinControl.push({
        id_mascota: p.id_mascota,
        mascota: p.nombre,
        codigo_qr: p.codigo_qr,
        propietario: p.propietario_nombre || p.propietario,
        telefono: p.propietario_telefono || p.telefono || '',
        dias_sin_control: daysSince,
        severidad: daysSince === null || daysSince > 270 ? 'media' : 'preventiva',
        detalle:
          daysSince === null
            ? 'Sin consultas clínicas registradas desde su inscripción QR'
            : `${daysSince} días sin control médico`,
      });
    }
  }

  // C. Cambios significativos de peso (>= 10% entre registros)
  const weightsByPet = new Map();
  for (const w of weights) {
    if (!weightsByPet.has(w.id_mascota)) weightsByPet.set(w.id_mascota, []);
    weightsByPet.get(w.id_mascota).push(w);
  }

  const alertasPeso = [];
  for (const p of pets) {
    const list = (weightsByPet.get(p.id_mascota) || []).sort(
      (a, b) => new Date(a.registrado_en) - new Date(b.registrado_en)
    );
    if (list.length >= 2) {
      const first = Number(list[0].peso_kg);
      const latest = Number(list[list.length - 1].peso_kg);
      if (first > 0) {
        const pctChange = ((latest - first) / first) * 100;
        if (Math.abs(pctChange) >= 10) {
          alertasPeso.push({
            id_mascota: p.id_mascota,
            mascota: p.nombre,
            propietario: p.propietario_nombre || p.propietario,
            peso_anterior: first,
            peso_actual: latest,
            variacion_pct: Number(pctChange.toFixed(1)),
            severidad: Math.abs(pctChange) >= 15 ? 'alta' : 'media',
            detalle: `${pctChange < 0 ? 'Pérdida' : 'Aumento'} de ${Math.abs(pctChange).toFixed(1)}% (${first} kg → ${latest} kg)`,
          });
        }
      }
    }
  }

  const baseIndicators = {
    total_pacientes_analizados: pets.length,
    vacunas_por_vencer_count: alertasVacunas.length,
    pacientes_sin_control_count: alertasSinControl.length,
    cambios_peso_count: alertasPeso.length,
  };

  let resumenGerencial =
    `Se detectaron ${alertasVacunas.length} vacuna(s) por vencer/vencida(s), ` +
    `${alertasSinControl.length} paciente(s) sin control médico reciente y ` +
    `${alertasPeso.length} variación(es) significativa(s) de peso.`;
  let recomendacionesGerencia = [
    alertasVacunas.length > 0
      ? 'Ejecutar campaña de recordatorios automáticos por WhatsApp para recuperar citas vacunales.'
      : 'Cobertura vacunal estable en el periodo actual.',
    alertasPeso.length > 0
      ? 'Priorizar evaluación nutricional/endocrina en pacientes con variación de peso >= 10%.'
      : 'Sin alertas ponderales críticas.',
    alertasSinControl.length > 0
      ? 'Enviar invitación de chequeo preventivo semestral a pacientes sin visitas recientes.'
      : 'Fidelización de controles periódicos en rango óptimo.',
  ];
  let provider = 'Huellas Predictive AI Engine (Local)';
  let external = false;

  if (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
    try {
      const aiResp = await callExternalAIJson({
        systemPrompt:
          'Eres director médico y analista predictivo de Clínica Veterinaria Huellas. ' +
          'Con los conteos y muestras reales, genera JSON válido con: resumen_gerencial (string) y ' +
          'recomendaciones_gerencia (array de 3 strings accionables).',
        userPrompt: JSON.stringify({
          indicadores: baseIndicators,
          muestra_vacunas: alertasVacunas.slice(0, 5),
          muestra_sin_control: alertasSinControl.slice(0, 5),
          muestra_peso: alertasPeso.slice(0, 5),
        }),
        temperature: 0.3,
      });
      if (aiResp?.parsed?.resumen_gerencial) {
        resumenGerencial = sanitizeText(aiResp.parsed.resumen_gerencial, 500);
        if (Array.isArray(aiResp.parsed.recomendaciones_gerencia)) {
          recomendacionesGerencia = aiResp.parsed.recomendaciones_gerencia.slice(0, 4).map((r) => sanitizeText(r, 220));
        }
        provider = aiResp.provider;
        external = true;
      }
    } catch (err) {
      console.warn('[IA Predictiva] Fallback local activado:', err.message);
    }
  }

  const nivelRiesgo =
    alertasVacunas.some((a) => a.severidad === 'alta') || alertasPeso.some((a) => a.severidad === 'alta')
      ? 'Alto'
      : alertasVacunas.length + alertasSinControl.length + alertasPeso.length > 0
      ? 'Moderado'
      : 'Bajo';

  return {
    indicadores_preventivos: baseIndicators,
    alertas_vacunas: alertasVacunas,
    alertas_sin_control: alertasSinControl,
    alertas_peso: alertasPeso,
    resumen_gerencial: resumenGerencial,
    recomendaciones_gerencia: recomendacionesGerencia,
    nivel_riesgo: nivelRiesgo,
    generadoPorIA: true,
    provider,
    external,
  };
}

/**
 * 4. ASISTENTE DE EMERGENCIA
 * Guía a quien escanee el QR con pasos sencillos y botón de llamada directa a la clínica,
 * protegiendo la privacidad del dueño (Ley N° 29733) y respetando el Modo Mascota Perdida.
 */
async function generateEmergencyGuidance({
  pet,
  isLost = false,
  question = '',
}) {
  const clinicPhone = process.env.CLINIC_PHONE || '+51 987 654 321';
  const clinicAddress = process.env.CLINIC_ADDRESS || 'Av. Primavera 1234, Santiago de Surco, Lima';
  const petName = pet?.nombre || 'la mascota';
  const allergies = pet?.alergias || 'Sin alergias reportadas';
  const hasAllergy = allergies && !/ninguna|sin alergia/i.test(allergies);

  // Regla estricta de privacidad: nunca entregar DNI ni dirección exacta ni teléfono privado en modo normal
  const safeContext = {
    mascota: petName,
    especie: pet?.especie || 'Canino',
    raza: pet?.raza || 'Mestizo',
    alergias: allergies,
    modo_mascota_perdida: Boolean(isLost),
    clinica_telefono: clinicPhone,
    clinica_direccion: clinicAddress,
    consulta_rescatista: sanitizeText(question, 400),
  };

  if (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
    try {
      const aiResp = await callExternalAIJson({
        systemPrompt:
          'Eres el Asistente de Emergencia de Huellas PetID para quien acaba de escanear una placa QR. ' +
          'IMPORTANTE DE PRIVACIDAD (Ley N° 29733): NUNCA inventes ni reveles dirección de domicilio ni DNI del dueño. ' +
          'Si modo_mascota_perdida es false, indica respetar la privacidad del dueño y derivar toda emergencia a la clínica. ' +
          'Si modo_mascota_perdida es true, prioriza resguardo seguro, envío de GPS y llamada a la clínica/rescate. ' +
          'Devuelve SIEMPRE JSON válido con: pasos_inmediatos (array de 3-4 pasos breves y claros), ' +
          'respuesta_asistente (string claro y empático), advertencias_medicas (string).',
        userPrompt: JSON.stringify(safeContext),
        temperature: 0.3,
      });

      if (aiResp?.parsed?.respuesta_asistente) {
        return {
          pasos_inmediatos: Array.isArray(aiResp.parsed.pasos_inmediatos)
            ? aiResp.parsed.pasos_inmediatos.slice(0, 5)
            : [],
          respuesta_asistente: sanitizeText(aiResp.parsed.respuesta_asistente, 1200),
          advertencias_medicas: sanitizeText(aiResp.parsed.advertencias_medicas || allergies, 400),
          boton_llamada_clinica: {
            etiqueta: `Llamar a Clínica Huellas 24/7 (${clinicPhone})`,
            tel: `tel:${clinicPhone.replace(/[^0-9+]/g, '')}`,
            numero: clinicPhone,
            direccion: clinicAddress,
          },
          privacidad_aplicada: isLost
            ? 'Modo Mascota Perdida activo: dirección particular y DNI ocultos; canal de rescate habilitado.'
            : 'Modo Control Seguro: teléfono privado, DNI y domicilio del propietario estrictamente protegidos (Ley N° 29733).',
          modo_mascota_perdida: Boolean(isLost),
          generadoPorIA: true,
          provider: aiResp.provider,
          external: true,
        };
      }
    } catch (err) {
      console.warn('[IA Emergencia] Fallback local activado:', err.message);
    }
  }

  const pasos = isLost
    ? [
        `1. Mantén la calma y resguarda a ${petName} en un lugar seguro con agua fresca (sin darle alimentos ni medicamentos).`,
        `2. Pulsa "Compartir mi Ubicación de Rescate (GPS)" para alertar automáticamente a su familia y a la clínica.`,
        `3. Si ${petName} está herido o desorientado, llama de inmediato a la Clínica Huellas 24/7 o llévalo a ${clinicAddress}.`,
        '4. Usa el botón de llamada directa o el chat de rescate para coordinar la entrega segura.',
      ]
    : [
        `1. Verifica que ${petName} se encuentre acompañado(a); su placa indica Modo Habitual / Control Seguro.`,
        `2. Consulta sus alergias médicas (${allergies}) antes de ofrecer premios o asistencia.`,
        `3. Ante cualquier emergencia médica o accidente, llama directamente a la Clínica Veterinaria Huellas (${clinicPhone}).`,
        '4. Por Ley N° 29733, los datos personales y dirección del dueño permanecen protegidos.',
      ];

  let respuesta = '';
  const q = sanitizeText(question, 400).toLowerCase();
  if (!q) {
    respuesta = isLost
      ? `🚨 *Protocolo de Rescate Activo para ${petName}*: Sigue estos pasos simples para ponerlo a salvo. Si notas heridas o decaimiento, llama directo a la clínica.`
      : `🛡️ *Asistente de Emergencia Huellas*: ${petName} está en Modo Control. Su información privada está protegida; si presencias una urgencia veterinaria, usa el botón de llamada directa a nuestra guardia 24/7.`;
  } else if (/(herid|sangr|accidente|golpe|atropell|respira|convulsi|envenen|vomit)/i.test(q)) {
    respuesta =
      `🚑 *Atención Prioritaria para ${petName}*: No administres medicamentos de humanos. Mantenlo inmóvil y abrigado, ` +
      `ten presente su condición (${allergies}) y llama AHORA a la guardia 24/7 de la clínica al *${clinicPhone}* para recibir triaje en ruta hacia *${clinicAddress}*.`;
  } else if (/(alergia|comida|agua|medicina|darle|comer)/i.test(q)) {
    respuesta =
      `⚠️ *Cuidado Alimentario y Alergias de ${petName}*: ${allergies}. ` +
      'Ofrécele únicamente agua limpia en pequeñas cantidades y evita darle comida casera o fármacos sin indicación veterinaria.';
  } else if (/(due[nñ]o|tel[eé]fono|casa|direcci[oó]n|viv|llamar)/i.test(q)) {
    respuesta = isLost
      ? `📞 El Modo Mascota Perdida está ACTIVO para *${petName}*. Puedes usar el botón de llamada directa al rescate o enviar tu ubicación GPS; por seguridad familiar (Ley N° 29733), su domicilio exacto no se muestra públicamente.`
      : `🔒 Por protección de datos personales (Ley N° 29733), mientras *${petName}* no esté en Modo Mascota Perdida, el teléfono privado y domicilio del dueño están ocultos. Comunícate directamente con la *Clínica Huellas* al *${clinicPhone}* y nuestro equipo contactará al propietario.`;
  } else {
    respuesta =
      `🐾 Gracias por asistir a *${petName}*. ${isLost ? 'Envía tu ubicación GPS o llama directo para coordinar el reencuentro.' : 'Si necesita atención médica urgente, comunícate de inmediato con nuestra clínica 24/7.'}`;
  }

  return {
    pasos_inmediatos: pasos,
    respuesta_asistente: respuesta,
    advertencias_medicas: hasAllergy
      ? `⚠️ ALERTA CLÍNICA: ${allergies}`
      : 'Sin alergias severas reportadas. No automedicar con fármacos de uso humano.',
    boton_llamada_clinica: {
      etiqueta: `Llamar a Clínica Huellas 24/7 (${clinicPhone})`,
      tel: `tel:${clinicPhone.replace(/[^0-9+]/g, '')}`,
      numero: clinicPhone,
      direccion: clinicAddress,
    },
    privacidad_aplicada: isLost
      ? 'Modo Mascota Perdida activo: dirección particular y DNI ocultos; canal de rescate habilitado.'
      : 'Modo Control Seguro: teléfono privado, DNI y domicilio del propietario estrictamente protegidos (Ley N° 29733).',
    modo_mascota_perdida: Boolean(isLost),
    generadoPorIA: true,
    provider: 'Huellas Emergency AI Engine (Local)',
    external: false,
  };
}

module.exports = {
  generateSmartReminder,
  generateClinicalSummary,
  generatePredictiveAlerts,
  generateEmergencyGuidance,
};
