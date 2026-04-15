import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Plus, Save, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/common/Pagination';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Division = {
  division_id: string;
  division_name: string;
  description: string;
};

const toRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

export const OrganizationDivision: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [updateSaving, setUpdateSaving] = useState(false);

  const [createForm, setCreateForm] = useState({ division_name: '', description: '' });
  const [editForm, setEditForm] = useState<Division | null>(null);

  const token = localStorage.getItem('token') ?? '';

  const loadDivisions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown>('/services/team/divisions', token ? { Authorization: token } : undefined);
      if (res.status !== 'success') {
        setDivisions([]);
        return;
      }

      const payload = res.data as unknown;
      const root = toRecord(payload);
      const rootData = root.data;
      const dataObj = toRecord(rootData);
      const items =
        (Array.isArray(payload) ? payload : undefined) ??
        (Array.isArray(rootData) ? rootData : undefined) ??
        (Array.isArray(dataObj.items) ? dataObj.items : undefined) ??
        (Array.isArray(dataObj.divisions) ? dataObj.divisions : undefined) ??
        (Array.isArray(root.divisions) ? root.divisions : undefined) ??
        [];

      const mapped = (items as unknown[]).map((raw, idx) => {
        const obj = toRecord(raw);
        const division_id = toStringSafe(obj.division_id ?? obj.divisionId ?? obj.id).trim() || `temp-${idx}`;
        const division_name = toStringSafe(obj.division_name ?? obj.divisionName ?? obj.name).trim();
        const description = toStringSafe(obj.description ?? obj.desc).trim();
        return {
          division_id,
          division_name: division_name || '-',
          description: description || '-',
        };
      });

      setDivisions(mapped);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDivisions();
  }, [loadDivisions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [divisions.length]);

  const totalPages = Math.max(1, Math.ceil(divisions.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIndex = (pageSafe - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDivisions = divisions.slice(startIndex, endIndex);

  const handleCreate = async () => {
    const division_name = createForm.division_name.trim();
    const description = createForm.description.trim();
    if (!division_name) {
      await Swal.fire({ icon: 'warning', title: 'Nama divisi wajib diisi' });
      return;
    }

    setCreateSaving(true);
    try {
      const res = await api.post<unknown>(
        '/services/team/divisions/create',
        { division_name, description },
        token ? { Authorization: token } : undefined
      );
      if (res.status === 'success') {
        setCreateOpen(false);
        setCreateForm({ division_name: '', description: '' });
        await loadDivisions();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Divisi berhasil ditambahkan' });
      }
    } finally {
      setCreateSaving(false);
    }
  };

  const handleOpenDetail = (division: Division) => {
    setEditForm({ ...division });
    setDetailOpen(true);
  };

  const handleUpdate = async () => {
    if (!editForm) return;
    const division_name = editForm.division_name.trim();
    const description = editForm.description.trim();
    if (!division_name) {
      await Swal.fire({ icon: 'warning', title: 'Nama divisi wajib diisi' });
      return;
    }

    setUpdateSaving(true);
    try {
      const res = await api.post<unknown>(
        '/services/team/divisions/update',
        { division_id: editForm.division_id, division_name, description },
        token ? { Authorization: token } : undefined
      );
      if (res.status === 'success') {
        setDetailOpen(false);
        setEditForm(null);
        await loadDivisions();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Divisi berhasil diperbarui' });
      }
    } finally {
      setUpdateSaving(false);
    }
  };

  const handleDelete = async (division: Division) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Divisi?',
      text: `Divisi "${division.division_name}" akan dihapus.`,
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;

    const res = await api.post<unknown>(
      '/services/team/divisions/delete',
      { division_id: division.division_id },
      token ? { Authorization: token } : undefined
    );
    if (res.status === 'success') {
      setDivisions((prev) => prev.filter((x) => x.division_id !== division.division_id));
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Divisi berhasil dihapus' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Division</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Daftar divisi organisasi.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Divisi
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Divisi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Divisi</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`s-${i}`}>
                    <TableCell>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-44 animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : divisions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500 py-10">
                    Belum ada data divisi.
                  </TableCell>
                </TableRow>
              ) : (
                currentDivisions.map((d) => (
                  <TableRow key={d.division_id}>
                    <TableCell className="font-medium">{d.division_name || '-'}</TableCell>
                    <TableCell>{d.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleDelete(d)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleOpenDetail(d)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && divisions.length > 0 ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, divisions.length)} dari {divisions.length} divisi
              </div>
              <Pagination currentPage={pageSafe} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Divisi Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="division_name">Nama Divisi</Label>
              <Input
                id="division_name"
                value={createForm.division_name}
                onChange={(e) => setCreateForm((p) => ({ ...p, division_name: e.target.value }))}
                placeholder="Masukkan nama divisi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                rows={4}
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Masukkan deskripsi divisi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate} disabled={createSaving}>
              {createSaving ? (
                'Menyimpan...'
              ) : (
                <span className="inline-flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Divisi
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setEditForm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Divisi</DialogTitle>
          </DialogHeader>
          {!editForm ? null : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_division_name">Nama Divisi</Label>
                  <Input
                    id="edit_division_name"
                    value={editForm.division_name}
                    onChange={(e) => setEditForm((p) => (p ? { ...p, division_name: e.target.value } : p))}
                    placeholder="Masukkan nama divisi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_description">Deskripsi</Label>
                  <Textarea
                    id="edit_description"
                    rows={4}
                    value={editForm.description === '-' ? '' : editForm.description}
                    onChange={(e) => setEditForm((p) => (p ? { ...p, description: e.target.value } : p))}
                    placeholder="Masukkan deskripsi divisi"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleUpdate} disabled={updateSaving}>
                  {updateSaving ? (
                    'Menyimpan...'
                  ) : (
                    <span className="inline-flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Update Divisi
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
