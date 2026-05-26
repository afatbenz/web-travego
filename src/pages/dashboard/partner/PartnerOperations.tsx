import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Handshake, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type PartnerOperationRow = {
  partnerId: string;
  partnerName: string;
  partnerAddress: string;
  partnerCityLabel: string;
  partnerPhone: string;
  picName: string;
  raw: Record<string, unknown>;
};

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    const list = o.items ?? o.data ?? o.list ?? o.rows ?? o.result;
    if (Array.isArray(list)) return list;
  }
  return [];
}

export const PartnerOperations: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PartnerOperationRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await api.get<unknown>('/services/partnership/operations', headers);
        if (res.status !== 'success') return;

        const items = extractItems(res.data);
        const mapped = items
          .map((it) => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
          .filter((it): it is Record<string, unknown> => Boolean(it))
          .map((it) => {
            const partnerIdRaw = it.partner_id ?? it.partnerId ?? it.id ?? it.uuid;
            const partnerId = typeof partnerIdRaw === 'string' || typeof partnerIdRaw === 'number' ? String(partnerIdRaw) : '';
            const partnerName = String(it.partner_name ?? it.partnerName ?? it.name ?? '');
            const partnerAddress = String(it.partner_address ?? it.partnerAddress ?? it.address ?? '');
            const partnerCityLabel = String(it.partner_city_label ?? it.partnerCityLabel ?? it.city_label ?? it.cityLabel ?? '');
            const partnerPhone = String(it.partner_phone ?? it.partnerPhone ?? it.phone ?? '');
            const picName = String(it.pic_name ?? it.picName ?? it.pic ?? '');
            return { partnerId, partnerName, partnerAddress, partnerCityLabel, partnerPhone, picName, raw: it };
          })
          .filter((r) => r.partnerId || r.partnerName);

        setRows(mapped);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: Array<DataTableColumn<PartnerOperationRow>> = useMemo(
    () => [
      {
        label: 'No',
        key: '__no__',
        width: 72,
        sortable: false,
        render: (_row, rowIndex) => (
          <span className="text-sm text-muted-foreground">{(currentPage - 1) * itemsPerPage + rowIndex + 1}</span>
        ),
      },
      {
        label: 'Nama',
        key: 'partnerName',
        sortable: true,
        render: (row) => <span className="font-medium">{row.partnerName || '-'}</span>,
      },
      {
        label: 'Alamat',
        key: 'partnerAddress',
        render: (row) => {
          const addr = row.partnerAddress?.trim() ?? '';
          const city = row.partnerCityLabel?.trim() ?? '';
          const text = addr && city ? `${addr}, ${city}` : addr || city || '-';
          return <span>{text}</span>;
        },
      },
      {
        label: 'Phone',
        key: 'partnerPhone',
        render: (row) => <span>{row.partnerPhone || '-'}</span>,
      },
      {
        label: 'PIC',
        key: 'picName',
        render: (row) => <span>{row.picName || '-'}</span>,
      },
      {
        label: 'Action',
        key: '__action__',
        width: 120,
        align: 'right',
        sortable: false,
        render: (row) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`${basePrefix}/partner-operations/detail/${encodeURIComponent(row.partnerId)}`)}
            disabled={!row.partnerId}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Detail
          </Button>
        ),
      },
    ],
    [basePrefix, currentPage, itemsPerPage, navigate]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mitra Operasional</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola data partnership operations</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={rows}
            columns={columns}
            loading={loading}
            stickyHeader
            zebra
            emptyTitle="Tidak ada data mitra operasional"
            emptyDescription="Coba muat ulang atau periksa kembali."
            pagination={{
              page: currentPage,
              pageSize: itemsPerPage,
              onPageChange: setCurrentPage,
              onPageSizeChange: (n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              },
              pageSizeOptions: [10, 20, 50, 100],
            }}
            sorting={{ initialSort: { key: 'partnerName', direction: 'asc' } }}
            rowKey={(row) => row.partnerId || row.partnerName}
          />
        </CardContent>
      </Card>
    </div>
  );
};
