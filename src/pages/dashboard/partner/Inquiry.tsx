import React, { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  Mail,
  MailOpen,
  MessageSquareText,
  Phone,
  RotateCcw,
  Search,
  Tag,
  User,
  X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/dialog';

type InquiryMessage = {
  messageId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  messageType: string;
  message: string;
  status: 0 | 1;
  raw: Record<string, unknown>;
};

const MESSAGE_TYPE_LABEL: Record<string, string> = {
  MSG001: 'Rental Mobil',
  MSG002: 'Travel Antar',
  MSG003: 'Paket Wisata',
  MSG004: 'Airport Transfer',
  MSG005: 'Lainnya',
};

function toStatus(value: unknown): 0 | 1 {
  const v = typeof value === 'string' ? value.trim() : value;
  if (v === 1 || v === '1' || v === true) return 1;
  return 0;
}

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    const list = o.items ?? o.data ?? o.list ?? o.rows ?? o.result;
    if (Array.isArray(list)) return list;
  }
  return [];
}

export const PartnerInquiry: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<InquiryMessage | null>(null);
  const [markingRead, setMarkingRead] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await api.get<unknown>('/services/customers/messages/list', headers);
        if (res.status !== 'success') return;

        const items = extractItems(res.data);
        const mapped = items
          .map((it) => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
          .filter((it): it is Record<string, unknown> => Boolean(it))
          .map((it) => {
            const messageIdRaw = it.message_id ?? it.messageId ?? it.id ?? it.uuid;
            const messageId = typeof messageIdRaw === 'string' || typeof messageIdRaw === 'number' ? String(messageIdRaw) : '';
            const customerName = String(it.customer_name ?? it.name ?? it.customerName ?? '');
            const customerEmail = String(it.customer_email ?? it.email ?? it.customerEmail ?? '');
            const customerPhone = String(it.customer_phone ?? it.phone ?? it.customerPhone ?? '');
            const messageType = String(it.message_type ?? it.messageType ?? '');
            const message = String(it.message ?? it.content ?? it.body ?? '');
            const status = toStatus(it.status ?? it.is_read ?? it.read ?? it.isRead);
            return { messageId, customerName, customerEmail, customerPhone, messageType, message, status, raw: it };
          })
          .filter((m) => m.messageId || m.customerEmail || m.customerName || m.message);

        setMessages(mapped);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length < 3) return messages;
    return messages.filter((m) => {
      const joined = [
        m.customerName,
        m.customerEmail,
        m.customerPhone,
        m.messageType,
        m.message,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return joined.includes(term);
    });
  }, [messages, searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const topicLabel = (code: string) => {
    const clean = String(code ?? '').trim();
    return MESSAGE_TYPE_LABEL[clean] ?? (clean || '-');
  };

  const handleReset = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const buildExportRows = () => {
    const headers = ['No.', 'Nama Customer', 'Email', 'Telepon', 'Topik', 'Status', 'Message'];
    const rowsOut = rows.map((m, i) => [
      i + 1,
      m.customerName ?? '',
      m.customerEmail ?? '',
      m.customerPhone ?? '',
      topicLabel(m.messageType),
      m.status === 1 ? 'Sudah dibaca' : 'Belum dibaca',
      m.message ?? '',
    ]);
    return { headers, rows: rowsOut };
  };

  const handleDownloadExcel = () => {
    if (!rows.length) {
      void Swal.fire('Info', 'Tidak ada pesan untuk diunduh.', 'info');
      return;
    }

    const { headers, rows: bodyRows } = buildExportRows();

    const escapeCell = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const tableHeader = headers.map((header) => `<th>${escapeCell(header)}</th>`).join('');
    const tableBody = bodyRows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeCell(cell)}</td>`).join('')}</tr>`)
      .join('');

    const workbook = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
            th { background: #f3f4f6; font-weight: 700; }
          </style>
        </head>
        <body>
          <table>
            <thead><tr>${tableHeader}</tr></thead>
            <tbody>${tableBody}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', workbook], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inquiry-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleCopyToGoogleSheet = async () => {
    if (!rows.length) {
      await Swal.fire('Info', 'Tidak ada pesan untuk disalin.', 'info');
      return;
    }

    const { headers, rows: bodyRows } = buildExportRows();
    const tsv = [headers.join('\t'), ...bodyRows.map((row) => row.map((cell) => String(cell ?? '')).join('\t'))].join('\n');

    try {
      const fallbackCopy = () => {
        const textarea = document.createElement('textarea');
        textarea.value = tsv;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '1px';
        textarea.style.height = '1px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
      };

      let copied = false;
      try {
        await navigator.clipboard.writeText(tsv);
        copied = true;
      } catch {
        copied = fallbackCopy();
      }

      if (!copied) throw new Error('COPY_FAILED');

      window.open('https://sheet.new', '_blank', 'noopener,noreferrer');
      await Swal.fire('Berhasil', 'Data sudah disalin. Tab Google Sheet dibuka, silakan tempelkan (Ctrl+V).', 'success');
    } catch {
      await Swal.fire(
        'Gagal',
        'Tidak dapat menyalin data ke clipboard. Pastikan website berjalan di HTTPS atau localhost, dan izinkan akses clipboard di browser.',
        'error'
      );
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!messageId) return;
    if (markingRead[messageId]) return;

    setMarkingRead((prev) => ({ ...prev, [messageId]: true }));
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const res = await api.post<unknown>('/services/customers/messages/read', { message_id: messageId }, headers);
      if (res.status !== 'success') return;

      setMessages((prev) => prev.map((m) => (m.messageId === messageId ? { ...m, status: 1 } : m)));
      setSelected((prev) => (prev?.messageId === messageId ? { ...prev, status: 1 } : prev));
    } finally {
      setMarkingRead((prev) => ({ ...prev, [messageId]: false }));
    }
  };

  const handleOpenMessage = async (row: InquiryMessage) => {
    setSelected(row);
    setDialogOpen(true);
    if (row.status === 0 && row.messageId) {
      await markAsRead(row.messageId);
    }
  };

  const columns = useMemo<Array<DataTableColumn<InquiryMessage>>>(() => {
    return [
      {
        label: 'No',
        key: '__no__',
        width: 72,
        align: 'center',
        sortable: false,
        render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>,
      },
      {
        label: 'Nama Customer',
        key: 'customerName',
        sortable: true,
        width: 240,
        render: (row) => <span className="font-medium text-foreground">{row.customerName || '-'}</span>,
      },
      {
        label: 'Email',
        key: 'customerEmail',
        sortable: true,
        width: 260,
        render: (row) => <span className="text-sm text-foreground">{row.customerEmail || '-'}</span>,
      },
      {
        label: 'Telepon',
        key: 'customerPhone',
        sortable: true,
        width: 180,
        render: (row) => <span className="text-sm text-foreground">{row.customerPhone || '-'}</span>,
      },
      {
        label: 'Topik',
        key: 'messageType',
        sortable: true,
        width: 200,
        render: (row) => <span className="text-sm text-foreground">{topicLabel(row.messageType)}</span>,
      },
      {
        label: 'Status',
        key: 'status',
        sortable: true,
        width: 160,
        render: (row) => {
          const isRead = row.status === 1;
          return (
            <Badge variant={isRead ? 'secondary' : 'default'} className="gap-1.5">
              {isRead ? <MailOpen className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
              {isRead ? 'Sudah dibaca' : 'Belum dibaca'}
            </Badge>
          );
        },
      },
      {
        label: 'Action',
        key: '__action__',
        sortable: false,
        width: 120,
        align: 'right',
        render: (row) => {
          const isMarking = Boolean(markingRead[row.messageId]);
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleOpenMessage(row)}
              disabled={isMarking}
              className="gap-2"
            >
              {isMarking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Lihat
            </Button>
          );
        },
      },
    ];
  }, [markingRead, startIndex]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pesan Masuk</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Daftar inquiry customer</p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari pesan... (min. 3 huruf)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-2xl pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-2xl"
                onClick={handleReset}
                aria-label="Reset"
                title="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-2xl bg-blue-500 hover:bg-blue-700 no-border" aria-label="Download">
                    <Download className="h-4 w-4 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-2xl">
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onSelect={(event) => {
                      event.preventDefault();
                      handleDownloadExcel();
                    }}
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>Download file excel (.xlsx)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onSelect={(event) => {
                      event.preventDefault();
                      void handleCopyToGoogleSheet();
                    }}
                  >
                    <Copy className="h-4 w-4 text-blue-600" />
                    <span>Copy ke Google Sheet</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-[1120px]"
        emptyTitle="Tidak ada pesan masuk"
        emptyDescription={
          searchTerm.trim().length >= 3
            ? 'Pesan dengan kata kunci tersebut tidak ditemukan.'
            : 'Data inquiry belum tersedia.'
        }
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
        sorting={{ initialSort: { key: 'status', direction: 'asc' } }}
        rowKey={(row, index) => row.messageId || `${row.customerEmail || row.customerName || 'row'}-${index}`}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl sm:rounded-2xl p-6 md:p-8">
          <DialogClose
            className="absolute right-6 top-6 rounded-full border border-gray-200 p-1.5 hover:bg-gray-50"
            aria-label="Tutup"
          >
            <X className="h-4 w-4 text-gray-600" />
          </DialogClose>

          <div className="flex items-start gap-4">
            <div className="bg-purple-100 rounded-xl p-3">
              <MessageSquareText className="text-purple-600 w-8 h-8" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold">Detail Inquiry</div>
              <div className="text-sm text-gray-500">Informasi lengkap pesan dari customer</div>
            </div>
          </div>

          <hr className="my-6" />

          {selected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">Nama Customer</div>
                    <div className="text-sm font-medium text-foreground truncate">{selected.customerName || '-'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Tag className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">Topik</div>
                    <div className="text-sm font-medium text-foreground truncate">{topicLabel(selected.messageType)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="text-sm font-medium text-foreground break-all">{selected.customerEmail || '-'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">Telepon</div>
                    <div className="text-sm font-medium text-foreground truncate">{selected.customerPhone || '-'}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2">Message</div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{selected.message || '-'}</div>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
