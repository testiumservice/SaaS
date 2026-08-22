const OFFSET_MS = 5 * 60 * 60 * 1000; // Colombia = UTC-5, sin horario de verano

/** Convierte un instante UTC a la fecha calendario de Colombia ("YYYY-MM-DD"). */
export function fechaColombia(instanteUtc: string | Date): string {
  const fecha = typeof instanteUtc === 'string' ? new Date(instanteUtc) : instanteUtc;
  return new Date(fecha.getTime() - OFFSET_MS).toISOString().slice(0, 10);
}
