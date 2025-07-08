// Funções auxiliares para cálculos de tempo no frontend

export interface TimeCalculation {
  extraMinutes: number
  missingMinutes: number
  details: {
    entry: { type: "extra" | "missing" | "ontime" | "none"; minutes: number }
    lunchStart: { type: "extra" | "missing" | "ontime" | "none"; minutes: number }
    lunchEnd: { type: "extra" | "missing" | "ontime" | "none"; minutes: number }
    exit: { type: "extra" | "missing" | "ontime" | "none"; minutes: number }
  }
}

export function calculateTimeDifferences(
  record: {
    entry_time?: string | null
    lunch_start?: string | null
    lunch_end?: string | null
    exit_time?: string | null
  },
  schedule: {
    entry_time?: string | null
    lunch_start?: string | null
    lunch_end?: string | null
    exit_time?: string | null
  },
): TimeCalculation {
  const result: TimeCalculation = {
    extraMinutes: 0,
    missingMinutes: 0,
    details: {
      entry: { type: "none", minutes: 0 },
      lunchStart: { type: "none", minutes: 0 },
      lunchEnd: { type: "none", minutes: 0 },
      exit: { type: "none", minutes: 0 },
    },
  }

  // Função para converter tempo em minutos
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  // Calcular ENTRADA
  if (record.entry_time && schedule.entry_time) {
    const recordMinutes = timeToMinutes(record.entry_time)
    const scheduleMinutes = timeToMinutes(schedule.entry_time)
    const diff = recordMinutes - scheduleMinutes

    if (diff < 0) {
      // Chegou antes = hora extra
      result.extraMinutes += Math.abs(diff)
      result.details.entry = { type: "extra", minutes: Math.abs(diff) }
    } else if (diff > 0) {
      // Chegou depois = falta
      result.missingMinutes += diff
      result.details.entry = { type: "missing", minutes: diff }
    } else {
      result.details.entry = { type: "ontime", minutes: 0 }
    }
  } else if (!record.entry_time && schedule.entry_time) {
    // Não registrou entrada = falta total
    result.missingMinutes += 480 // 8 horas
    result.details.entry = { type: "missing", minutes: 480 }
  }

  // Calcular INÍCIO DO ALMOÇO
  if (record.lunch_start && schedule.lunch_start) {
    const recordMinutes = timeToMinutes(record.lunch_start)
    const scheduleMinutes = timeToMinutes(schedule.lunch_start)
    const diff = recordMinutes - scheduleMinutes

    if (diff < 0) {
      // Saiu para almoço antes = hora extra (trabalhou mais)
      result.extraMinutes += Math.abs(diff)
      result.details.lunchStart = { type: "extra", minutes: Math.abs(diff) }
    } else if (diff > 0) {
      // Saiu para almoço depois = falta (trabalhou menos)
      result.missingMinutes += diff
      result.details.lunchStart = { type: "missing", minutes: diff }
    } else {
      result.details.lunchStart = { type: "ontime", minutes: 0 }
    }
  }

  // Calcular FIM DO ALMOÇO
  if (record.lunch_end && schedule.lunch_end) {
    const recordMinutes = timeToMinutes(record.lunch_end)
    const scheduleMinutes = timeToMinutes(schedule.lunch_end)
    const diff = recordMinutes - scheduleMinutes

    if (diff < 0) {
      // Voltou do almoço antes = hora extra
      result.extraMinutes += Math.abs(diff)
      result.details.lunchEnd = { type: "extra", minutes: Math.abs(diff) }
    } else if (diff > 0) {
      // Voltou do almoço depois = falta
      result.missingMinutes += diff
      result.details.lunchEnd = { type: "missing", minutes: diff }
    } else {
      result.details.lunchEnd = { type: "ontime", minutes: 0 }
    }
  }

  // Calcular SAÍDA
  if (record.exit_time && schedule.exit_time) {
    const recordMinutes = timeToMinutes(record.exit_time)
    const scheduleMinutes = timeToMinutes(schedule.exit_time)
    const diff = recordMinutes - scheduleMinutes

    if (diff > 0) {
      // Saiu depois = hora extra
      result.extraMinutes += diff
      result.details.exit = { type: "extra", minutes: diff }
    } else if (diff < 0) {
      // Saiu antes = falta
      result.missingMinutes += Math.abs(diff)
      result.details.exit = { type: "missing", minutes: Math.abs(diff) }
    } else {
      result.details.exit = { type: "ontime", minutes: 0 }
    }
  } else if (!record.exit_time && schedule.exit_time) {
    // Não registrou saída = falta total
    result.missingMinutes += 480 // 8 horas
    result.details.exit = { type: "missing", minutes: 480 }
  }

  return result
}

export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h${mins.toString().padStart(2, "0")}m`
}

export function intervalToMinutes(interval: string): number {
  if (!interval || interval === "00:00:00") return 0

  // Parse PostgreSQL interval format
  const match = interval.match(/(\d+):(\d+):(\d+)/)
  if (match) {
    const [, hours, minutes] = match
    return Number.parseInt(hours) * 60 + Number.parseInt(minutes)
  }

  // Parse "X minutes" format
  const minutesMatch = interval.match(/(\d+) minutes?/)
  if (minutesMatch) {
    return Number.parseInt(minutesMatch[1])
  }

  return 0
}
