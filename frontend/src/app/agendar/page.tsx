'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { api } from '@/libs/api';
import { useRequireAuth } from '@/libs/use-require-auth';
import { Empleado, Servicio, SlotDisponible } from '@/libs/types';

type Paso = 'empleado' | 'servicios' | 'horario' | 'confirmacion';

const NEGOCIO_ID = process.env.NEXT_PUBLIC_NEGOCIO_ID as string;

export default function AgendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reprogramarCitaId = searchParams.get('reprogramarCitaId');

  const { cliente, listo } = useRequireAuth();

  const [paso, setPaso] = useState<Paso>('empleado');

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioIdsSeleccionados, setServicioIdsSeleccionados] = useState<string[]>([]);

  const [fecha, setFecha] = useState('');
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponible | null>(null);

  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const serviciosSeleccionados = useMemo(
    () => servicios.filter((s) => servicioIdsSeleccionados.includes(s.id)),
    [servicios, servicioIdsSeleccionados],
  );

  const duracionTotalMin = useMemo(
    () => serviciosSeleccionados.reduce((acc, s) => acc + s.duracion_min, 0),
    [serviciosSeleccionados],
  );

  const costoTotalEstimado = useMemo(
    () => serviciosSeleccionados.reduce((acc, s) => acc + Number(s.precio), 0),
    [serviciosSeleccionados],
  );

  // Paso 1: cargar empleados
  useEffect(() => {
    if (!listo) return;
    api
      .get<Empleado[]>('/empleados', { params: { negocioId: NEGOCIO_ID } })
      .then((res) => setEmpleados(res.data))
      .catch(() => setErrorGeneral('No se pudieron cargar los empleados'));
  }, [listo]);

  const elegirEmpleado = (empleado: Empleado) => {
    setEmpleadoSeleccionado(empleado);
    setErrorGeneral(null);
    setCargando(true);
    api
      .get<Servicio[]>('/servicios', {
        params: { negocioId: NEGOCIO_ID, empleadoId: empleado.id },
      })
      .then((res) => {
        setServicios(res.data);
        setPaso('servicios');
      })
      .catch(() => setErrorGeneral('No se pudieron cargar los servicios de este empleado'))
      .finally(() => setCargando(false));
  };

  const alternarServicio = (id: string) => {
    setServicioIdsSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const irAHorario = () => {
    if (servicioIdsSeleccionados.length === 0) {
      setErrorGeneral('Selecciona al menos un servicio');
      return;
    }
    setErrorGeneral(null);
    setPaso('horario');
  };

  const buscarHorarios = () => {
    if (!fecha || !empleadoSeleccionado) return;
    setErrorGeneral(null);
    setCargando(true);
    api
      .get<{ slots: SlotDisponible[] }>('/disponibilidad/slots', {
        params: {
          empleadoId: empleadoSeleccionado.id,
          fecha,
          duracionMin: duracionTotalMin,
        },
      })
      .then((res) => setSlots(res.data.slots))
      .catch(() => setErrorGeneral('No se pudieron cargar los horarios disponibles'))
      .finally(() => setCargando(false));
  };

  const confirmarCita = async () => {
    if (!empleadoSeleccionado || !slotSeleccionado) return;

    setConfirmando(true);
    setErrorGeneral(null);

    const body = {
      negocioId: NEGOCIO_ID,
      empleadoId: empleadoSeleccionado.id,
      servicioIds: servicioIdsSeleccionados,
      fecha,
      horaInicio: slotSeleccionado.horaInicio,
    };

    try {
      if (reprogramarCitaId) {
        await api.post(`/citas/${reprogramarCitaId}/reprogramar`, body);
      } else {
        await api.post('/citas', body);
      }
      router.push('/mi-cita');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const mensaje = err.response.data?.message ?? 'Ese horario ya no está disponible';
        setErrorGeneral(mensaje);
        setPaso('horario');
        setSlotSeleccionado(null);
      } else {
        setErrorGeneral('No se pudo confirmar la cita. Intenta de nuevo.');
      }
    } finally {
      setConfirmando(false);
    }
  };

  if (!listo) return null;

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">
        {reprogramarCitaId ? 'Reprogramar cita' : 'Agendar cita'}
      </h1>

      {errorGeneral && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{errorGeneral}</p>
      )}

      {paso === 'empleado' && (
        <div className="flex flex-col gap-3">
          <h2 className="font-medium">1. Elige tu barbero</h2>
          {empleados.map((empleado) => (
            <button
              key={empleado.id}
              onClick={() => elegirEmpleado(empleado)}
              disabled={cargando}
              className="rounded border px-4 py-3 text-left hover:bg-gray-50"
            >
              {empleado.nombre}
            </button>
          ))}
        </div>
      )}

      {paso === 'servicios' && (
        <div className="flex flex-col gap-3">
          <h2 className="font-medium">2. Elige los servicios</h2>
          {servicios.map((servicio) => (
            <label
              key={servicio.id}
              className="flex items-center justify-between rounded border px-4 py-3"
            >
              <span>
                <input
                  type="checkbox"
                  checked={servicioIdsSeleccionados.includes(servicio.id)}
                  onChange={() => alternarServicio(servicio.id)}
                  className="mr-2"
                />
                {servicio.nombre} — {servicio.duracion_min} min
              </span>
              <span>${Number(servicio.precio).toLocaleString('es-CO')}</span>
            </label>
          ))}

          {servicioIdsSeleccionados.length > 0 && (
            <p className="text-sm text-gray-600">
              Total: {duracionTotalMin} min — $
              {costoTotalEstimado.toLocaleString('es-CO')}
            </p>
          )}

          <button
            onClick={irAHorario}
            className="mt-2 rounded bg-black px-4 py-2 text-white"
          >
            Continuar
          </button>
        </div>
      )}

      {paso === 'horario' && (
        <div className="flex flex-col gap-3">
          <h2 className="font-medium">3. Elige el horario</h2>

          <input
            type="date"
            value={fecha}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => {
              setFecha(e.target.value);
              setSlots([]);
              setSlotSeleccionado(null);
            }}
            className="rounded border px-3 py-2"
          />

          <button
            onClick={buscarHorarios}
            disabled={!fecha || cargando}
            className="rounded border px-4 py-2 disabled:opacity-50"
          >
            {cargando ? 'Buscando...' : 'Ver horarios disponibles'}
          </button>

          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.horaInicio}
                onClick={() => setSlotSeleccionado(slot)}
                className={`rounded border px-3 py-2 text-sm ${
                  slotSeleccionado?.horaInicio === slot.horaInicio
                    ? 'border-black bg-black text-white'
                    : ''
                }`}
              >
                {new Date(slot.horaInicio).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </button>
            ))}
          </div>

          {slots.length === 0 && fecha && !cargando && (
            <p className="text-sm text-gray-500">
              No hay horarios disponibles ese día. Prueba con otra fecha.
            </p>
          )}

          <button
            onClick={() => setPaso('confirmacion')}
            disabled={!slotSeleccionado}
            className="mt-2 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      )}

      {paso === 'confirmacion' && empleadoSeleccionado && slotSeleccionado && (
        <div className="flex flex-col gap-3">
          <h2 className="font-medium">4. Confirma tu cita</h2>

          <div className="rounded border px-4 py-3 text-sm">
            <p><strong>Barbero:</strong> {empleadoSeleccionado.nombre}</p>
            <p><strong>Servicios:</strong> {serviciosSeleccionados.map((s) => s.nombre).join(', ')}</p>
            <p><strong>Fecha:</strong> {fecha}</p>
            <p>
              <strong>Hora:</strong>{' '}
              {new Date(slotSeleccionado.horaInicio).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p><strong>Duración total:</strong> {duracionTotalMin} min</p>
            <p><strong>Costo total:</strong> ${costoTotalEstimado.toLocaleString('es-CO')}</p>
          </div>

          <button
            onClick={confirmarCita}
            disabled={confirmando}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {confirmando ? 'Confirmando...' : 'Confirmar cita'}
          </button>
        </div>
      )}
    </main>
  );
}