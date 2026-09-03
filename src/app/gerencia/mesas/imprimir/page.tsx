import { createAdminClient } from '@/lib/supabase/admin';
import { getTableAccessUrl, generateQRCodeDataUrl } from '@/lib/actions/qrcode';
import { PrintButton } from '@/components/gerencia/PrintButton';

export const dynamic = 'force-dynamic';

export default async function ImprimirQRPage() {
  const admin = createAdminClient();
  const { data: config } = await admin.from('establishment_config').select('name').limit(1).single();
  const { data: tables } = await admin.from('tables').select('*').order('number');

  const qrCodes = await Promise.all(
    (tables ?? []).map(async (table) => {
      const url = await getTableAccessUrl(table.token);
      const qrDataUrl = await generateQRCodeDataUrl(url);
      return { table, url, qrDataUrl };
    })
  );

  return (
    <html lang="pt-BR">
      <head>
        <title>QR Codes — {config?.name ?? 'Comanda QR'}</title>
        <style>{`
          @page { size: A4; margin: 10mm; }
          body { font-family: system-ui, sans-serif; margin: 0; padding: 10mm; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
          .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 6mm;
            text-align: center;
            page-break-inside: avoid;
          }
          .card img { width: 35mm; height: 35mm; }
          .card h2 { margin: 2mm 0 0; font-size: 16pt; }
          .card p { margin: 1mm 0 0; font-size: 8pt; color: #666; word-break: break-all; }
          .header { text-align: center; margin-bottom: 8mm; }
          @media screen {
            .no-print { display: block; margin-bottom: 16px; text-align: center; }
          }
          @media print { .no-print { display: none; } }
        `}</style>
      </head>
      <body>
        <div className="no-print" style={{ marginBottom: '16px', textAlign: 'center' }}>
          <PrintButton />
        </div>

        <div className="header">
          <h1>{config?.name ?? 'Comanda QR'}</h1>
          <p>Escaneie o QR Code para fazer seu pedido</p>
        </div>

        <div className="grid">
          {qrCodes.map(({ table, url, qrDataUrl }) => (
            <div key={table.id} className="card">
              <img src={qrDataUrl} alt={`Mesa ${table.number}`} />
              <h2>Mesa {table.number}</h2>
              <p>{url}</p>
            </div>
          ))}
        </div>

      </body>
    </html>
  );
}
