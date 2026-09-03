'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderItem } from '@/lib/types/database';

interface OrderWithDetails extends Order {
  order_items: (OrderItem & { menu_item?: { name: string } })[];
  comanda_person?: { name: string };
}

export function useRealtimeOrders(
  comandaId: string | null,
  sessionToken?: string,
  filter?: 'active' | 'all'
) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!comandaId) {
      setLoading(false);
      return;
    }

    const supabase = createClient(sessionToken);

    async function fetchOrders() {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*, menu_item:menu_items(name)),
          comanda_person:comanda_people(name)
        `)
        .eq('comanda_id', comandaId)
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.in('status', ['pendente', 'em_preparo', 'pronto']);
      }

      const { data } = await query;
      setOrders((data as OrderWithDetails[]) ?? []);
      setLoading(false);
    }

    fetchOrders();

    const channel = supabase
      .channel(`orders-${comandaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `comanda_id=eq.${comandaId}` },
        () => fetchOrders()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [comandaId, sessionToken, filter]);

  return { orders, loading };
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
