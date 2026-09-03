import { NextResponse } from 'next/server';
import { getMyOrders } from '@/lib/actions/pedidos';

export async function GET() {
  const result = await getMyOrders();
  return NextResponse.json(result);
}
