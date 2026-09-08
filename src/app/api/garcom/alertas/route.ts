import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffRole } from '@/lib/auth/staff';

export async function GET() {
  const { error } = await requireStaffRole(['garcom', 'gerencia']);
  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: tables } = await admin
    .from('tables')
    .select('id, number, status')
    .eq('status', 'aguardando_pagamento')
    .order('number');

  return NextResponse.json({ tables: tables ?? [] });
}
