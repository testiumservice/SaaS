'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCliente, getToken } from './auth-storage';
import { Cliente } from './types';

export function useRequireAuth() {
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const token = getToken();
    const clienteGuardado = getCliente();
    if (!token || !clienteGuardado) {
      router.replace('/login');
      return;
    }
    setCliente(clienteGuardado);
    setListo(true);
  }, [router]);

  return { cliente, listo };
}