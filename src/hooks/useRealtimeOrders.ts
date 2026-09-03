'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getMyOrders } from '@/lib/actions/pedidos';

interface OrderWithDetails extends Order {
  order_items: (OrderItem & { menu_item?: { name: string } })[];
  comanda_person?: { name: string };
}

export function useMyOrders(enabled: boolean) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrders() {
    const result = await getMyOrders();
    setOrders((result.orders as OrderWithDetails[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [enabled]);

  return { orders, loading, refresh: fetchOrders };
}

export function useRealtimeCounterOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchOrders() {
      const res = await fetch('/api/staff/pedidos');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setAuthError(body.error ?? 'Erro ao carregar pedidos.');
        setOrders([]);
        setLoading(false);
        return;
      }

      const body = await res.json();
      setOrders(body.orders ?? []);
      setAuthError(null);
      setLoading(false);
    }

    fetchOrders();

    const channel = supabase
      .channel('counter-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.new && (payload.new as Order).status === 'pendente') {
            setNewOrderAlert(true);
            try {
              const audio = new Audio('/sounds/notification.mp3');
              audio.play().catch(() => {});
            } catch {
              // Audio não disponível
            }
          }
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    const interval = setInterval(fetchOrders, 15000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissAlert = () => setNewOrderAlert(false);

  return { orders, loading, newOrderAlert, dismissAlert, authError };
}
