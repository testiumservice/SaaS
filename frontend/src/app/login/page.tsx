'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { api } from '@/libs/api';
import { setSesion } from '@/libs/auth-storage';

const loginSchema = z.object({
  celular: z.string().regex(/^[0-9]{10}$/, 'El celular debe tener 10 dígitos'),
  pin: z.string().regex(/^[0-9]{4}$/, 'El PIN debe tener 4 dígitos'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (datos: LoginForm) => {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      const { data } = await api.post('/auth/login', datos);
      setSesion(data.access_token, data.cliente);
      router.push('/agendar');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrorGeneral('Celular o PIN incorrectos');
      } else if (axios.isAxiosError(err) && err.response?.status === 429) {
        setErrorGeneral('Demasiados intentos. Intenta de nuevo en unos minutos.');
      } else {
        setErrorGeneral('No se pudo iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Celular</label>
          <input {...register('celular')} type="tel" className="w-full rounded border px-3 py-2" />
          {errors.celular && <p className="mt-1 text-sm text-red-600">{errors.celular.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">PIN</label>
          <input
            {...register('pin')}
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="w-full rounded border px-3 py-2"
          />
          {errors.pin && <p className="mt-1 text-sm text-red-600">{errors.pin.message}</p>}
        </div>

        {errorGeneral && <p className="text-sm text-red-600">{errorGeneral}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="text-center text-sm">
          ¿No tienes cuenta?{' '}
          <a href="/registro" className="underline">
            Regístrate
          </a>
        </p>
      </form>
    </main>
  );
}