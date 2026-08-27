'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { api } from '@/libs/api';
import { TurnstileWidget } from '@/components/TurnstileWidget';

const registroSchema = z.object({
  celular: z.string().regex(/^[0-9]{10}$/, 'El celular debe tener 10 dígitos'),
  pin: z.string().regex(/^[0-9]{4}$/, 'El PIN debe tener 4 dígitos'),
  primerNombre: z.string().min(1, 'Requerido'),
  segundoNombre: z.string().optional(),
  primerApellido: z.string().min(1, 'Requerido'),
  segundoApellido: z.string().optional(),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
});

type RegistroForm = z.infer<typeof registroSchema>;

export default function RegistroPage() {
  const router = useRouter();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroForm>({ resolver: zodResolver(registroSchema) });

  const onSubmit = async (datos: RegistroForm) => {
    setErrorGeneral(null);

    if (!turnstileToken) {
      setErrorGeneral('Completa la verificación anti-bot antes de continuar');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/auth/register', {
        ...datos,
        correo: datos.correo || undefined,
        turnstileToken,
      });
      router.push('/login?registrado=1');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setErrorGeneral('Ese número de celular ya está registrado');
        } else if (err.response?.status === 400) {
          setErrorGeneral(err.response.data?.message ?? 'Verificación anti-bot inválida');
        } else {
          setErrorGeneral('No se pudo completar el registro. Intenta de nuevo.');
        }
      } else {
        setErrorGeneral('No se pudo completar el registro. Intenta de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Celular</label>
          <input
            {...register('celular')}
            type="tel"
            placeholder="3001234567"
            className="w-full rounded border px-3 py-2"
          />
          {errors.celular && <p className="mt-1 text-sm text-red-600">{errors.celular.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">PIN (4 dígitos)</label>
          <input
            {...register('pin')}
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="w-full rounded border px-3 py-2"
          />
          {errors.pin && <p className="mt-1 text-sm text-red-600">{errors.pin.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Primer nombre</label>
            <input {...register('primerNombre')} className="w-full rounded border px-3 py-2" />
            {errors.primerNombre && (
              <p className="mt-1 text-sm text-red-600">{errors.primerNombre.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Segundo nombre</label>
            <input {...register('segundoNombre')} className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Primer apellido</label>
            <input {...register('primerApellido')} className="w-full rounded border px-3 py-2" />
            {errors.primerApellido && (
              <p className="mt-1 text-sm text-red-600">{errors.primerApellido.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Segundo apellido</label>
            <input {...register('segundoApellido')} className="w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Correo (opcional)</label>
          <input {...register('correo')} type="email" className="w-full rounded border px-3 py-2" />
          {errors.correo && <p className="mt-1 text-sm text-red-600">{errors.correo.message}</p>}
        </div>

        <TurnstileWidget onToken={setTurnstileToken} />

        {errorGeneral && <p className="text-sm text-red-600">{errorGeneral}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </main>
  );
}