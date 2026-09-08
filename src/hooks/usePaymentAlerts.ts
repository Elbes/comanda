'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface PaymentAlertTable {
  id: string;
  number: number;
  status: string;
}

export function usePaymentAlerts() {
  const [tables, setTables] = useState<PaymentAlertTable[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);

  async function fetchAlerts() {
    const res = await fetch('/api/garcom/alertas', { cache: 'no-store' });
    if (!res.ok) {
      setTables([]);
      return;
    }
    const body = await res.json();
    const list = (body.tables ?? []) as PaymentAlertTable[];
    setTables(list);
    if (list.length > 0) {
      setAlertVisible(true);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    fetchAlerts();

    const channel = supabase
      .channel('garcom-payment-alerts')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tables' },
        (payload) => {
          const next = payload.new as { status?: string; number?: number } | null;
          if (next?.status === 'aguardando_pagamento') {
            setAlertVisible(true);
            try {
              const audio = new Audio('/sounds/notification.mp3');
              audio.play().catch(() => {});
            } catch {
              // Audio não disponível
            }
          }
          fetchAlerts();
        }
      )
      .subscribe();

    const interval = setInterval(fetchAlerts, 4000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    tables,
    alertVisible,
    dismissAlert: () => setAlertVisible(false),
    refresh: fetchAlerts,
  };
}
