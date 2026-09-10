import Link from 'next/link';
import { getStaffUser } from '@/lib/auth/staff';

export async function GerenciaHomeLink() {
  const staff = await getStaffUser();
  if (staff?.systemUser.role !== 'gerencia') return null;

  return (
    <Link
      href="/gerencia"
      className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
    >
      Área Gerência
    </Link>
  );
}
