'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/libs/api';
import { useRequireAuth } from '@/libs/use-require-auth';
import { ModalConfirmacion } from '@/components/ModalConfirmacion';
import { Cita } from '@/libs/types';

export default function MiCitaPage() {
  const router = useRouter();
  const { cliente, listo } = useRequireAuth();

  const [cita, setCita] = useState<Cita | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const [mostrarConfirmarCancelar, setMostrarConfirmarCancelar] = useState(false);
  const [mostrarOpcionesPostCancelar, setMostrarOpcionesPostCancelar] = useState(false);

  useEffect(() => {
    if (!listo || !cliente) return;
    api
      .get<Cita | null>('/citas/activa', { params: { clienteId: cliente.id } })
      .then((res) => setCita(res.data ?? null))
      .catch(() => setErrorGeneral('No se pudo cargar tu cita'))
      .finally(() => setCargando(false));
  }, [listo, cliente]);

  const cancelarCita = async () => {
    if (!cita) return;
    try {
      await api.patch(`/citas/${cita.id}/cancelar`);
      setMostrarConfirmarCancelar(false);
      setMostrarOpcionesPostCancelar(true);
    } catch {
      setErrorGeneral('No se pudo cancelar la cita. Intenta de nuevo.');
      setMostrarConfirmarCancelar(false);
    }
  };

  if (!listo || cargando) return null;

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Mi cita</h1>

      {errorGeneral && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{errorGeneral}</p>
      )}

      {!cita && (
        <div className="flex flex-col gap-3">
          <p className="text-gray-600">No tienes una cita activa en este momento.</p>
          <button
            onClick={() => router.push('/agendar')}
            className="rounded bg-black px-4 py-2 text-white"
          >
            Agendar una cita
          </button>
        </div>
      )}

      {cita && (
        <div className="flex flex-col gap-4">
          <div className="rounded border px-4 py-3 text-sm">
            <p><strong>Fecha:</strong> {cita.fecha}</p>
            <p>
              <strong>Hora:</strong>{' '}
              {new Date(cita.hora_inicio).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' - '}
              {new Date(cita.hora_fin).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p><strong>Costo total:</strong> ${Number(cita.costo_total).toLocaleString('es-CO')}</p>
            <p><strong>Estado:</strong> {cita.estado}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/agendar?reprogramarCitaId=${cita.id}`)}
              className="flex-1 rounded border px-4 py-2"
            >
              Reprogramar
            </button>
            <button
              onClick={() => setMostrarConfirmarCancelar(true)}
              className="flex-1 rounded border border-red-600 px-4 py-2 text-red-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mostrarConfirmarCancelar && (
        <ModalConfirmacion
          titulo="¿Estás seguro?"
          mensaje="Esta acción cancelará tu cita actual."
          textoConfirmar="Cancelar cita"
          textoCancelar="Volver"
          onConfirmar={cancelarCita}
          onCancelar={() => setMostrarConfirmarCancelar(false)}
        />
      )}

      {mostrarOpcionesPostCancelar && (
        <ModalConfirmacion
          titulo="Cita cancelada"
          mensaje="¿Quieres reprogramar o salir?"
          textoConfirmar="Reprogramar"
          textoCancelar="Salir"
          onConfirmar={() => router.push('/agendar')}
          onCancelar={() => router.push('/')}
        />
      )}
    </main>
  );
}