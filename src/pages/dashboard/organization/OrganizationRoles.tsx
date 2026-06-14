import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Plus, Save, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type RoleRow = {
  role_id: string;
  role_name: string;
  division_id: string;
  division_name: string;
  description: string;
};

type DivisionOption = {
  division_id: string;
  division_name: string;
};

const toRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

export const OrganizationRoles: React.FC = () => {
  const token = localStorage.getItem('token') ?? '';
  const addButtonClass =
    "hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300 hover:-translate-y-0.2 hover:from-blue-700 hover:to-blue-600";

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<DivisionOption[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [updateSaving, setUpdateSaving] = useState(false);

  const [createForm, setCreateForm] = useState({ division_id: '', role_name: '', description: '' });
  const [editForm, setEditForm] = useState<RoleRow | null>(null);

  const loadDivisions = useCallback(async () => {
    const res = await api.get<unknown>('/services/team/divisions', token ? { Authorization: token } : undefined);
    if (res.status !== 'success') {
      setDivisionOptions([]);
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
      return { division_id, division_name: division_name || '-' };
    });
    setDivisionOptions(mapped);
  }, [token]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown>('/services/team/roles', token ? { Authorization: token } : undefined);
      if (res.status !== 'success') {
        setRoles([]);
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
        (Array.isArray(dataObj.roles) ? dataObj.roles : undefined) ??
        (Array.isArray(root.roles) ? root.roles : undefined) ??
        [];

      const mapped = (items as unknown[]).map((raw, idx) => {
        const obj = toRecord(raw);
        const role_id = toStringSafe(obj.role_id ?? obj.roleId ?? obj.id).trim() || `temp-${idx}`;
        const role_name = toStringSafe(obj.role_name ?? obj.roleName ?? obj.name).trim() || '-';

        const divisionId = toStringSafe(obj.division_id ?? obj.divisionId ?? obj.division).trim();
        const divisionName =
          toStringSafe(obj.division_name ?? obj.divisionName).trim() ||
          (obj.division && typeof obj.division === 'object' ? toStringSafe(toRecord(obj.division).division_name ?? toRecord(obj.division).name).trim() : '');

        const description = toStringSafe(obj.description ?? obj.desc).trim() || '-';
        return {
          role_id,
          role_name,
          division_id: divisionId || '',
          division_name: divisionName || '-',
          description,
        };
      });

      setRoles(mapped);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDivisions();
    loadRoles();
  }, [loadDivisions, loadRoles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roles.length]);

  const divisionNameById = useMemo(() => {
    const map = new Map<string, string>();
    divisionOptions.forEach((d) => map.set(d.division_id, d.division_name));
    return map;
  }, [divisionOptions]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const handleCreate = async () => {
    const division_id = createForm.division_id.trim();
    const role_name = createForm.role_name.trim();
    const description = createForm.description.trim();

    if (!division_id) {
      await Swal.fire({ icon: 'warning', title: 'Divisi wajib dipilih' });
      return;
    }
    if (!role_name) {
      await Swal.fire({ icon: 'warning', title: 'Nama role wajib diisi' });
      return;
    }

    setCreateSaving(true);
    try {
      const res = await api.post<unknown>(
        '/services/team/roles/create',
        { division_id, role_name, description },
        token ? { Authorization: token } : undefined
      );
      if (res.status === 'success') {
        setCreateOpen(false);
        setCreateForm({ division_id: '', role_name: '', description: '' });
        await loadRoles();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Role berhasil ditambahkan' });
      }
    } finally {
      setCreateSaving(false);
    }
  };

  const handleOpenDetail = (role: RoleRow) => {
    setEditForm({ ...role, division_name: divisionNameById.get(role.division_id) ?? role.division_name });
    setDetailOpen(true);
  };

  const handleUpdate = async () => {
    if (!editForm) return;
    const division_id = editForm.division_id.trim();
    const role_name = editForm.role_name.trim();
    const description = editForm.description.trim();

    if (!division_id) {
      await Swal.fire({ icon: 'warning', title: 'Divisi wajib dipilih' });
      return;
    }
    if (!role_name) {
      await Swal.fire({ icon: 'warning', title: 'Nama role wajib diisi' });
      return;
    }

    setUpdateSaving(true);
    try {
      const res = await api.post<unknown>(
        '/services/team/roles/update',
        { role_id: editForm.role_id, division_id, role_name, description },
        token ? { Authorization: token } : undefined
      );
      if (res.status === 'success') {
        setDetailOpen(false);
        setEditForm(null);
        await loadRoles();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Role berhasil diperbarui' });
      }
    } finally {
      setUpdateSaving(false);
    }
  };

  const handleDelete = async (role: RoleRow) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Role?',
      text: `Role "${role.role_name}" akan dihapus.`,
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;

    const res = await api.post<unknown>(
      '/services/team/roles/delete',
      { role_id: role.role_id },
      token ? { Authorization: token } : undefined
    );
    if (res.status === 'success') {
      setRoles((prev) => prev.filter((x) => x.role_id !== role.role_id));
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Role berhasil dihapus' });
    }
  };

  const columns = useMemo<Array<DataTableColumn<RoleRow>>>(() => {
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
        label: 'Nama Role',
        key: 'role_name',
        sortable: true,
        width: 220,
        render: (role) => <span className="font-medium text-foreground">{role.role_name || '-'}</span>,
      },
      {
        label: 'Divisi',
        key: 'division_name',
        sortable: true,
        width: 220,
        render: (role) => <span className="text-sm text-foreground">{role.division_name || divisionNameById.get(role.division_id) || '-'}</span>,
      },
      {
        label: 'Deskripsi',
        key: 'description',
        sortable: true,
        render: (role) => <span className="text-sm text-foreground">{role.description || '-'}</span>,
      },
    ];
  }, [divisionNameById, startIndex]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Roles</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">Kelola peran dan izin akses organisasi</p>
        </div>
        <Button className={addButtonClass} onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Role
        </Button>
      </div>

      <DataTable
        data={roles}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-[900px]"
        emptyTitle="Belum ada data role"
        emptyDescription="Tambahkan role baru untuk mulai mengelola struktur organisasi."
        actions={{
          actions: [
            {
              key: 'detail',
              label: 'Detail',
              icon: Eye,
              onSelect: (role) => handleOpenDetail(role),
            },
            {
              key: 'delete',
              label: 'Hapus',
              icon: Trash2,
              variant: 'destructive',
              onSelect: (role) => void handleDelete(role),
            },
          ],
        }}
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          totalItems: roles.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ initialSort: { key: 'role_name', direction: 'asc' } }}
        rowKey={(role, index) => role.role_id || `${role.role_name}-${index}`}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Role Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Divisi</Label>
              <Select value={createForm.division_id} onValueChange={(v) => setCreateForm((p) => ({ ...p, division_id: v }))}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {divisionOptions.map((d) => (
                    <SelectItem key={d.division_id} value={d.division_id}>
                      {d.division_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_name">Nama Role</Label>
              <Input
                id="role_name"
                value={createForm.role_name}
                onChange={(e) => setCreateForm((p) => ({ ...p, role_name: e.target.value }))}
                placeholder="Masukkan nama role"
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_description">Deskripsi (Opsional)</Label>
              <Textarea
                id="role_description"
                rows={4}
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Masukkan deskripsi role"
                className="rounded-2xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate} disabled={createSaving}>
              {createSaving ? (
                'Menyimpan...'
              ) : (
                <span className="inline-flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Role
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
            <DialogTitle>Detail Role</DialogTitle>
          </DialogHeader>
          {!editForm ? null : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Pilih Divisi</Label>
                  <Select
                    value={editForm.division_id}
                    onValueChange={(v) => setEditForm((p) => (p ? { ...p, division_id: v } : p))}
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="Pilih divisi" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {divisionOptions.map((d) => (
                        <SelectItem key={d.division_id} value={d.division_id}>
                          {d.division_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_role_name">Nama Role</Label>
                  <Input
                    id="edit_role_name"
                    value={editForm.role_name}
                    onChange={(e) => setEditForm((p) => (p ? { ...p, role_name: e.target.value } : p))}
                    placeholder="Masukkan nama role"
                    className="rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_role_description">Deskripsi</Label>
                  <Textarea
                    id="edit_role_description"
                    rows={4}
                    value={editForm.description === '-' ? '' : editForm.description}
                    onChange={(e) => setEditForm((p) => (p ? { ...p, description: e.target.value } : p))}
                    placeholder="Masukkan deskripsi role"
                    className="rounded-2xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white" onClick={handleUpdate} disabled={updateSaving}>
                  {updateSaving ? (
                    'Menyimpan...'
                  ) : (
                    <span className="inline-flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Update Role
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-40 h-14 w-14 rounded-full bg-blue-600 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)] hover:bg-blue-700 md:hidden"
        size="icon"
        title="Tambah Role"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};
