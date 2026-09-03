import { GerenciaLayout, getGerenciaData } from '@/components/gerencia/GerenciaLayout';
import { UsuariosManager } from '@/components/gerencia/UsuariosManager';

export const dynamic = 'force-dynamic';

export default async function GerenciaUsuariosPage() {
  const { users } = await getGerenciaData();

  return (
    <GerenciaLayout activePath="/gerencia/usuarios">
      <UsuariosManager users={users} />
    </GerenciaLayout>
  );
}
