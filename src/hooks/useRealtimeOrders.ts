'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderItem, PedidoStatus } from '@/lib/types/database';

interface OrderWithDetails extends Order {
  order_items: (OrderItem & { menu_item?: { name: string } })[];
  comanda_person?: { name: string };
}

export function useMyOrders(enabled: boolean) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrders() {
    const res = await fetch('/api/cliente/pedidos', { cache: 'no-store' });
    const body = await res.json().catch(() => ({ orders: [] }));
    setOrders((body.orders as OrderWithDetails[]) ?? []);
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

  async function fetchOrders() {
    const res = await fetch('/api/staff/pedidos', { cache: 'no-store' });
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

  useEffect(() => {
    const supabase = createClient();
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

    const interval = setInterval(fetchOrders, 4000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissAlert = () => setNewOrderAlert(false);

  function applyOrderStatus(orderId: string, status: string) {
    setOrders((prev) => {
      if (['pronto', 'entregue', 'cancelado'].includes(status)) {
        return prev.filter((order) => order.id !== orderId);
      }
      return prev.map((order) =>
        order.id === orderId ? { ...order, status: status as PedidoStatus } : order
      );
    });
  }

  return { orders, loading, newOrderAlert, dismissAlert, authError, refresh: fetchOrders, applyOrderStatus };
}
