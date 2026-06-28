import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Eye, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type MessageItem = {
  message_id: string;
  fullname: string;
  topic_id: number;
  topic_label: string;
  company_name: string;
  email: string;
  whatsapp: string;
  scale: string;
  messages: string;
  created_at: string;
  is_read: boolean;
};

function toText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function parseMessages(payload: unknown): MessageItem[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      return {
        message_id: toText(raw.message_id),
        fullname: toText(raw.fullname),
        topic_id: typeof raw.topic_id === 'number' ? raw.topic_id : Number(raw.topic_id ?? 0),
        topic_label: toText(raw.topic_label),
        company_name: toText(raw.company_name),
        email: toText(raw.email),
        whatsapp: toText(raw.whatsapp),
        scale: toText(raw.scale),
        messages: toText(raw.messages),
        created_at: toText(raw.created_at),
        is_read: raw.is_read === true,
      };
    })
    .filter((item): item is MessageItem => Boolean(item && item.message_id));
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

function formatWhatsApp(phone: string): string {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return phone;
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits;
}

function displayPhone(phone: string): string {
  if (!phone || phone === '-') return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 12) {
    return `62 ${digits.slice(2, 5)}-${digits.slice(5, 9)}-${digits.slice(9, 13)}`;
  } else if (digits.length >= 9) {
    return `62 ${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

export const SystemMessages: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [readingMessageId, setReadingMessageId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const res = await api.get<unknown>('/system/messages', headers);
      if (res.status === 'success') {
        setMessages(parseMessages(res.data));
      }
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (item: MessageItem) => {
    setSelectedMessage(item);
    setDetailOpen(true);

    // Mark as read if not already
    if (!item.is_read) {
      setReadingMessageId(item.message_id);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        await api.put<unknown>(`/system/messages/read/${item.message_id}`, undefined, headers);
        setMessages((prev) =>
          prev.map((m) => (m.message_id === item.message_id ? { ...m, is_read: true } : m))
        );
      } catch {
        // silent fail on read
      } finally {
        setReadingMessageId(null);
      }
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedMessage(null);
  };

  const openWhatsApp = (phone: string) => {
    const formatted = formatWhatsApp(phone);
    if (formatted) {
      window.open(`https://wa.me/${formatted}`, '_blank');
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(messages.length / Math.max(1, itemsPerPage))), [itemsPerPage, messages.length]);
  const pagedMessages = useMemo(() => messages.slice(startIndex, startIndex + Math.max(1, itemsPerPage)), [startIndex, itemsPerPage, messages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pesan Masuk</h1>
        <p className="mt-1 text-sm text-muted-foreground">Daftar pesan dari pengunjung website</p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-muted/40">
            <TableRow>
              {[
                { label: 'No', className: 'w-[64px] text-center' },
                { label: 'Pengirim', className: 'min-w-[160px]' },
                { label: 'Jenis Pesan', className: 'min-w-[140px]' },
                { label: 'Instansi', className: 'min-w-[160px]' },
                { label: 'Kontak', className: 'min-w-[180px]' },
                { label: 'Tanggal Pesan', className: 'min-w-[160px]' },
                { label: 'Aksi', className: 'w-[100px] text-center' },
              ].map((h) => (
                <TableHead
                  key={h.label}
                  className={'h-14 px-4 text-xs font-semibold uppercase tracking-wide text-white ' + h.className}
                >
                  {h.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data...
                  </div>
                </TableCell>
              </TableRow>
            ) : pagedMessages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  Belum ada pesan masuk
                </TableCell>
              </TableRow>
            ) : (
              pagedMessages.map((row, rowIndex) => {
                const no = startIndex + rowIndex + 1;
                return (
                  <TableRow key={row.message_id} className={`hover:bg-muted/30 ${!row.is_read ? 'font-semibold bg-blue-50/40 dark:bg-blue-950/20' : ''}`}>
                    <TableCell className="px-4 py-3 text-center text-sm text-muted-foreground">{no}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-foreground">{row.fullname || '-'}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-foreground">{row.topic_label || '-'}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-foreground">{row.company_name || '-'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div>
                        <div className="text-sm text-foreground">{displayPhone(row.whatsapp)}</div>
                        <div className="text-xs text-muted-foreground">{row.email || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-foreground">{formatDate(row.created_at)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => openDetail(row)}
                          title="Lihat Pesan"
                          aria-label="Lihat Pesan"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && messages.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, messages.length)} dari {messages.length}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Per halaman</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-lg"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <span className="mx-2 text-sm text-muted-foreground whitespace-nowrap">
                {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-lg"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Detail Pesan
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap dari pengirim pesan
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nama Pengirim</p>
                  <p className="text-sm font-medium text-foreground mt-1">{selectedMessage.fullname || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Jenis Pesan</p>
                  <p className="text-sm font-medium text-foreground mt-1">{selectedMessage.topic_label || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nama Instansi</p>
                  <p className="text-sm font-medium text-foreground mt-1">{selectedMessage.company_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">No. Whatsapp</p>
                  <p className="text-sm font-medium text-foreground mt-1">{displayPhone(selectedMessage.whatsapp)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="text-sm font-medium text-foreground mt-1">{selectedMessage.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Skala Bisnis</p>
                  <p className="text-sm font-medium text-foreground mt-1">{selectedMessage.scale || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pesan</p>
                <div className="mt-1 rounded-xl bg-muted/30 p-4 text-sm text-foreground whitespace-pre-wrap border border-border">
                  {selectedMessage.messages || '-'}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="rounded-xl">
                    Tutup
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  onClick={() => openWhatsApp(selectedMessage.whatsapp)}
                  disabled={!selectedMessage.whatsapp}
                >
                  <ExternalLink className="h-4 w-4" />
                  Balas di Whatsapp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
