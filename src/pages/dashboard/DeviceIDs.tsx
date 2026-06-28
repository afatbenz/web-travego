import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Pencil,
  Loader2,
  X,
  Smartphone,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogClose,
  DialogContentScrollable,
  DialogScrollableBody,
  DialogStickyFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

type DeviceItem = {
  device_id: string;
  device_name: string;
  device_token: string;
  organization_name: string;
  account_number: string;
  created_at: string;
  updated_at: string;
};

type DialogFormValues = {
  account_number: string;
  device_id: string;
  device_name: string;
  device_token: string;
};

function toText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function parseDevices(payload: unknown): DeviceItem[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const raw = item as Record<string, unknown>;

      return {
        device_id: toText(raw.device_id),
        device_name: toText(raw.device_name),
        device_token: toText(raw.device_token),
        organization_name: toText(raw.organization_name),
        account_number: toText(raw.account_number),
        created_at: toText(raw.created_at),
        updated_at: toText(raw.updated_at),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item && item.account_number));
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
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

export const DeviceIDs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formAction, setFormAction] = useState<'enable' | 'edit'>('enable');
  const [formValues, setFormValues] = useState<DialogFormValues>({
    account_number: '',
    device_id: '',
    device_name: '',
    device_token: '',
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const res = await api.get<unknown>('/system/assistant/device', headers);
      if (res.status === 'success') {
        setDevices(parseDevices(res.data));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item: DeviceItem, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      const result = await Swal.fire({
        title: 'Nonaktifkan Device',
        text: `Yakin ingin menonaktifkan device untuk ${item.account_number}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Nonaktifkan',
        cancelButtonText: 'Batal',
      });

      if (!result.isConfirmed) return;

      setIsSubmitting(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await api.put<unknown>('/system/assistant/device/disable', { account: item.account_number }, headers);
        if (res.status !== 'success') {
          toast({ title: 'Error', description: res.message || 'Gagal menonaktifkan device', variant: 'destructive' });
          return;
        }
        toast({ title: 'Berhasil', description: 'Device berhasil dinonaktifkan' });
        await fetchDevices();
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setFormAction('enable');
      setFormValues({
        account_number: item.account_number,
        device_id: '',
        device_name: '',
        device_token: '',
      });
      setIsFormOpen(true);
    }
  };

  const openEditDialog = (item: DeviceItem) => {
    setFormAction('edit');
    setFormValues({
      account_number: item.account_number,
      device_id: item.device_id,
      device_name: item.device_name,
      device_token: item.device_token,
    });
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setFormValues({
      account_number: '',
      device_id: '',
      device_name: '',
      device_token: '',
    });
  };

  const handleFormChange = (field: keyof DialogFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formValues.device_id.trim() || !formValues.device_name.trim() || !formValues.device_token.trim()) {
      toast({ title: 'Error', description: 'Semua field harus diisi', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const payload = {
        account: formValues.account_number,
        device_id: formValues.device_id,
        device_name: formValues.device_name,
        device_token: formValues.device_token,
      };
      const res = await api.put<unknown>('/system/assistant/device/enable', payload, headers);
      if (res.status !== 'success') {
        toast({ title: 'Error', description: res.message || 'Gagal menyimpan device', variant: 'destructive' });
        return;
      }
      toast({ title: 'Berhasil', description: 'Device berhasil disimpan' });
      await fetchDevices();
      closeDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEnabled = (item: DeviceItem) => item.device_id && item.device_id.trim() !== '';

  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(devices.length / Math.max(1, itemsPerPage))), [itemsPerPage, devices.length]);
  const pagedDevices = useMemo(() => devices.slice(startIndex, startIndex + Math.max(1, itemsPerPage)), [startIndex, itemsPerPage, devices]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Device ID</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kelola perangkat WhatsApp Business Assistant</p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-muted/40">
            <TableRow>
              {[
                { label: 'No', className: 'w-[72px] text-center' },
                { label: 'Whatsapp Number', className: 'min-w-[180px]' },
                { label: 'Nama Perusahaan', className: 'min-w-[200px]' },
                { label: 'Nama Device', className: 'min-w-[180px]' },
                { label: 'Tanggal Ditambahkan', className: 'min-w-[180px]' },
                { label: 'Action', className: 'w-[240px] text-center' },
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
                <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data...
                  </div>
                </TableCell>
              </TableRow>
            ) : pagedDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  Belum ada data device
                </TableCell>
              </TableRow>
            ) : (
              pagedDevices.map((row, rowIndex) => {
                const no = startIndex + rowIndex + 1;
                const enabled = isEnabled(row);
                const displayDate = row.updated_at || row.created_at;

                return (
                  <TableRow key={row.account_number} className="hover:bg-muted/30">
                    <TableCell className="px-4 py-3 text-center text-sm text-muted-foreground">{no}</TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium text-foreground">{row.account_number}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-foreground">{row.organization_name}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-foreground">{row.device_name || '-'}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-foreground">
                      {formatDate(displayDate)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        {/* Modern toggle on/off */}
                        <button
                          type="button"
                          onClick={() => handleToggle(row, enabled)}
                          disabled={isSubmitting}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            enabled
                              ? 'bg-green-500 focus-visible:ring-green-500'
                              : 'bg-gray-300 dark:bg-gray-600 focus-visible:ring-gray-400'
                          }`}
                          role="switch"
                          aria-checked={enabled}
                          aria-label={enabled ? 'Nonaktifkan device' : 'Aktifkan device'}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                              enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-medium ${enabled ? 'text-green-600' : 'text-red-600'}`}>
                          {enabled ? 'Enable' : 'Disable'}
                        </span>

                        {/* Edit icon — only visible when enabled */}
                        {enabled && (
                          <button
                            type="button"
                            onClick={() => openEditDialog(row)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted"
                            aria-label="Edit device"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
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
      {!loading && devices.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, devices.length)} dari {devices.length}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows</span>
              <select
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                value={String(itemsPerPage)}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Rows per page"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="Halaman sebelumnya"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <div className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{currentPage}</span> / {totalPages}
              </div>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Halaman berikutnya"
              >
                <span className="hidden sm:inline">Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Form for Enable / Edit */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContentScrollable className="max-w-[500px] w-[calc(100vw-2rem)] border border-border bg-background p-0 shadow-2xl sm:rounded-[24px]">
          <div className="px-6 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-semibold text-foreground">
                    {formAction === 'edit' ? 'Edit Device' : 'Enable Device'}
                  </div>
                  <div className="mt-1 text-xs md:text-sm text-muted-foreground">
                    {formAction === 'edit' ? 'Ubah data device WhatsApp Business' : 'Masukkan data device WhatsApp Business'}
                  </div>
                </div>
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  onClick={closeDialog}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Tutup modal"
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
            <div className="mt-6 h-px bg-border" />
          </div>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleFormSubmit}>
            <DialogScrollableBody className="px-6 py-6 space-y-5">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Device ID</span>
                <Input
                  value={formValues.device_id}
                  onChange={handleFormChange('device_id')}
                  className="h-12 rounded-xl"
                  placeholder="Masukkan Device ID"
                  disabled={isSubmitting}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Device Name</span>
                <Input
                  value={formValues.device_name}
                  onChange={handleFormChange('device_name')}
                  className="h-12 rounded-xl"
                  placeholder="Masukkan Nama Device"
                  disabled={isSubmitting}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Token</span>
                <Input
                  value={formValues.device_token}
                  onChange={handleFormChange('device_token')}
                  className="h-12 rounded-xl"
                  placeholder="Masukkan Device Token"
                  disabled={isSubmitting}
                />
              </label>
            </DialogScrollableBody>

            <DialogStickyFooter className="flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  className="h-11 rounded-xl"
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 text-center no-shadow"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {formAction === 'edit' ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Aktifkan
                  </>
                )}
              </Button>
            </DialogStickyFooter>
          </form>
        </DialogContentScrollable>
      </Dialog>
    </div>
  );
};
