import React, { useEffect, useMemo, useState } from 'react';
import { Mail, MailOpen, Eye, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/common/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<InquiryMessage | null>(null);
  const [markingRead, setMarkingRead] = useState<Record<string, boolean>>({});

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

  const rows = useMemo(() => messages, [messages]);
  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIndex = (pageSafe - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = rows.slice(startIndex, endIndex);
  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  const topicLabel = (code: string) => {
    const clean = String(code ?? '').trim();
    return MESSAGE_TYPE_LABEL[clean] ?? (clean || '-');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pesan Masuk</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Daftar inquiry customer</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Pesan ({rows.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-900">
                  <TableHead>No</TableHead>
                  <TableHead>Nama Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Topik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white dark:bg-gray-800">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`s-${i}`} className="animate-pulse">
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-44" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                      </TableCell>
                      <TableCell>
                        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                      Tidak ada pesan masuk.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentRows.map((m, idx) => {
                    const isRead = m.status === 1;
                    const isMarking = Boolean(markingRead[m.messageId]);
                    return (
                      <TableRow key={m.messageId || `${m.customerEmail}-${startIndex + idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <span className="text-gray-900 dark:text-white">{startIndex + idx + 1}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900 dark:text-white">{m.customerName || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900 dark:text-white">{m.customerEmail || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900 dark:text-white">{m.customerPhone || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900 dark:text-white">{topicLabel(m.messageType)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isRead ? 'secondary' : 'default'} className="gap-1.5">
                            {isRead ? <MailOpen className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                            {isRead ? 'Sudah dibaca' : 'Belum dibaca'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleOpenMessage(m)}
                            disabled={isMarking}
                            className="gap-2"
                          >
                            {isMarking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                            Lihat
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && rows.length > 0 ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, rows.length)} dari {rows.length} pesan
              </div>
              <Pagination currentPage={pageSafe} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pesan</DialogTitle>
          </DialogHeader>

          {selected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Nama Customer</div>
                  <div className="text-sm font-medium">{selected.customerName || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Topik</div>
                  <div className="text-sm font-medium">{topicLabel(selected.messageType)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm font-medium break-all">{selected.customerEmail || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Telepon</div>
                  <div className="text-sm font-medium">{selected.customerPhone || '-'}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">Message</div>
                <div className="rounded-lg border bg-background">
                  <ScrollArea className="h-[260px] p-4">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{selected.message || '-'}</div>
                  </ScrollArea>
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
