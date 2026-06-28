import React, { useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogContent, DialogClose } from '@/components/ui/dialog';
import { api, uploadCommon } from '@/lib/api';
import Swal from 'sweetalert2';
import { Plus, Pencil, Trash2, Loader2, Check, ChevronsUpDown, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';

interface BankAccount {
  bank_account_id: string;
  id?: string | number; // Keep for backward compatibility if needed, or remove if unused
  bank_code: string;
  bank_name?: string;
  account_number: string;
  account_name: string;
  payment_method?: number | string;
  merchant_name?: string;
  merchant_mcc?: string;
  merchant_address?: string;
  merchant_city?: string;
  merchant_postal_code?: string;
  account_type?: number;
  qris_image?: string;
  active?: boolean;
  bank_icon?: string;
}

interface Bank {
  name: string;
  code: string;
}

export const BankAccountContent: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState<Partial<BankAccount>>({
    bank_code: '',
    account_number: '',
    account_name: '',
    payment_method: 1,
    merchant_name: '',
    merchant_mcc: '',
    merchant_address: '',
    merchant_city: '',
    merchant_postal_code: '',
    account_type: 1,
    qris_image: ''
  });
  const [saving, setSaving] = useState(false);
  const [qrisUploading, setQrisUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankOpen, setBankOpen] = useState(false);

  const addButtonClass =
    "hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300 hover:-translate-y-0.2 hover:from-blue-700 hover:to-blue-600";

  const fetchAccounts = async () => {
    setLoading(true);
    const token = localStorage.getItem('token') ?? '';
    // Assuming endpoint structure based on common practices
    const res = await api.get<BankAccount[]>("/organization/bank-accounts", { Authorization: token });
    setLoading(false);
    if (res.status === 'success' && Array.isArray(res.data)) {
      setAccounts(res.data);
    }
  };

  const fetchBanks = async () => {
    const token = localStorage.getItem('token') ?? '';
    const res = await api.get<Bank[]>("/general/bank-list", { Authorization: token });
    if (res.status === 'success' && Array.isArray(res.data)) {
      setBanks(res.data);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchBanks();
  }, []);

  useEffect(() => {
    if (!dialogOpen) {
      setBankOpen(false);
      return;
    }

    if (formData.payment_method !== 1 || !formData.bank_code || banks.length === 0) {
      return;
    }

    const selectedBank = banks.find((bank) => bank.code === formData.bank_code);
    if (!selectedBank) {
      return;
    }

    if (formData.bank_name !== selectedBank.name) {
      setFormData((prev) => ({
        ...prev,
        bank_code: selectedBank.code,
        bank_name: selectedBank.name,
      }));
    }
  }, [banks, dialogOpen, formData.bank_code, formData.bank_name, formData.payment_method]);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({ 
      bank_code: '', 
      bank_name: '',
      account_number: '', 
      account_name: '',
      payment_method: 1,
      merchant_name: '',
      merchant_mcc: '',
      merchant_address: '',
      merchant_city: '',
      merchant_postal_code: '',
      account_type: 1,
      qris_image: ''
    });
    setBankOpen(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (account: BankAccount) => {
    setEditingAccount(account);
    let pm = 1;
    if (account.payment_method === 2 || account.payment_method === 'QRIS') {
      pm = 2;
    }

    const selectedBank = banks.find((bank) => bank.code === account.bank_code);
    
    setFormData({
      bank_code: selectedBank?.code || account.bank_code || '',
      bank_name: selectedBank?.name || account.bank_name || '',
      account_number: account.account_number,
      account_name: account.account_name,
      payment_method: pm,
      merchant_name: account.merchant_name || '',
      merchant_mcc: account.merchant_mcc || '',
      merchant_address: account.merchant_address || '',
      merchant_city: account.merchant_city || '',
      merchant_postal_code: account.merchant_postal_code || '',
      account_type: account.account_type || 1,
      qris_image: account.qris_image || ''
    });
    setBankOpen(false);
    setDialogOpen(true);
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setQrisUploading(true);
    try {
      const res = await uploadCommon('bank', [files[0]]);
      if (res.status === 'success' && res.data?.files?.length) {
        setFormData(prev => ({ ...prev, qris_image: res.data!.files![0] }));
      } else {
        Swal.fire('Error', 'Gagal mengupload gambar QRIS', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Gagal mengupload gambar QRIS', 'error');
    } finally {
      setQrisUploading(false);
    }
  };

  const removeQrisImage = () => {
    setFormData(prev => ({ ...prev, qris_image: '' }));
  };

  const handleToggleStatus = async (account: BankAccount) => {
    const accountId = account.bank_account_id || account.id;
    if (!accountId) return; // Prevent updating if no ID is found

    const newStatus = !account.active;
    
    // Optimistic update with functional state update to ensure latest state
    setAccounts(prevAccounts => prevAccounts.map(a => {
      const currentId = a.bank_account_id || a.id;
      return currentId === accountId ? { ...a, active: newStatus } : a;
    }));
    
    const token = localStorage.getItem('token') ?? '';
    try {
      const res = await api.post(`/organization/bank-account/update`, { 
        bank_account_id: accountId,
        active: newStatus 
      }, { Authorization: token });

      if (res.status !== 'success') {
        // Revert on failure
        setAccounts(prevAccounts => prevAccounts.map(a => {
          const currentId = a.bank_account_id || a.id;
          return currentId === accountId ? { ...a, active: !newStatus } : a;
        }));
        Swal.fire('Error', 'Gagal mengubah status', 'error');
      }
    } catch (error) {
      // Revert on error
      setAccounts(prevAccounts => prevAccounts.map(a => {
        const currentId = a.bank_account_id || a.id;
        return currentId === accountId ? { ...a, active: !newStatus } : a;
      }));
      Swal.fire('Error', 'Terjadi kesalahan saat mengubah status', 'error');
    }
  };

  const handleDelete = async (account: BankAccount) => {
    const result = await Swal.fire({
      title: 'Apakah anda yakin?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!'
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem('token') ?? '';
      const res = await api.post(`/organization/bank-account/delete`, { bank_account_id: account.bank_account_id }, { Authorization: token });
      if (res.status === 'success') {
        Swal.fire('Terhapus!', 'Akun bank telah dihapus.', 'success');
        // Optimistically remove from state or re-fetch
        setAccounts(prev => prev.filter(a => a.bank_account_id !== account.bank_account_id));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.payment_method === 1) {
      let currentBankCode = formData.bank_code;
      
      // Fallback: try to find code from name if missing
      if (!currentBankCode && formData.bank_name) {
        const foundBank = banks.find(b => b.name === formData.bank_name);
        if (foundBank) {
          currentBankCode = foundBank.code;
        }
      }

      const missing = [];
      if (!currentBankCode) missing.push('Pilihan Bank');
      if (!formData.account_number) missing.push('Nomor Rekening');
      if (!formData.account_name) missing.push('Pemilik Rekening');

      if (missing.length > 0) {
        Swal.fire({
          title: 'Error',
          text: `Mohon lengkapi data berikut: ${missing.join(', ')}`,
          icon: 'error',
          target: '#swal-dialog-target'
        });
        return;
      }
      
      // Update formData with found code if it was missing
      if (currentBankCode !== formData.bank_code) {
         formData.bank_code = currentBankCode;
      }
    }

    if (formData.payment_method === 2) {
      const missing = [];
      if (!formData.merchant_name) missing.push('Merchant Name');
      if (!formData.merchant_mcc) missing.push('Merchant MCC');
      if (!formData.merchant_address) missing.push('Merchant Address');
      if (!formData.merchant_city) missing.push('Merchant City');
      if (!formData.merchant_postal_code) missing.push('Merchant Postal Code');
      if (!formData.qris_image) missing.push('Gambar QRIS');

      if (missing.length > 0) {
        Swal.fire({
          title: 'Error',
          text: `Mohon lengkapi data merchant berikut: ${missing.join(', ')}`,
          icon: 'error',
          target: '#swal-dialog-target'
        });
        return;
      }
    }

    setSaving(true);
    const token = localStorage.getItem('token') ?? '';
    let res;

    let payload = { ...formData };

    if (formData.payment_method === 1) {
      const allowed = ['bank_code', 'account_number', 'account_name', 'payment_method'];
      payload = Object.keys(formData)
        .filter(key => allowed.includes(key))
        .reduce((obj, key) => {
          // @ts-ignore
          obj[key] = formData[key as keyof typeof formData];
          return obj;
        }, {} as any);
    }
    
    if (editingAccount) {
      const accountId = editingAccount.bank_account_id || editingAccount.id;
      res = await api.post(`/organization/bank-account/update`, { 
        bank_account_id: accountId,
        ...payload 
      }, { Authorization: token });
    } else {
      res = await api.post("/organization/bank-account/create", payload, { Authorization: token });
    }

    setSaving(false);

    if (res.status === 'success') {
      setDialogOpen(false);
      Swal.fire('Berhasil', `Akun bank berhasil ${editingAccount ? 'diperbarui' : 'ditambahkan'}`, 'success');
      fetchAccounts();
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalItems = accounts.length;
  const selectedFormBank = banks.find((bank) => bank.code === formData.bank_code);

  const columns: Array<DataTableColumn<BankAccount>> = [
    {
      label: 'No',
      key: '__no__',
      width: 72,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>
    },
    {
      label: 'Metode',
      key: 'payment_method',
      sortable: true,
      width: 150,
      render: (item) => (
        <span className="inline-flex whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {(item.payment_method === 2 || item.payment_method === 'QRIS') ? 'QRIS' : 'Transfer Bank'}
        </span>
      )
    },
    {
      label: 'Nama Bank',
      key: 'bank_name',
      sortable: true,
      width: 250,
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.bank_icon && (
            <img 
              src={item.bank_icon} 
              alt={item.bank_name} 
              className="h-8 w-8 object-contain"
            />
          )}
          <span>{item.bank_name || '-'}</span>
        </div>
      )
    },
    {
      label: 'Nomor Rekening',
      key: 'account_number',
      sortable: true,
      width: 200,
      render: (item) => <span className="text-sm text-foreground whitespace-nowrap">{item.account_number || '-'}</span>
    },
    {
      label: 'Pemilik Rekening',
      key: 'account_name',
      sortable: true,
      width: 250,
      render: (item) => <span className="text-sm text-foreground whitespace-nowrap">{item.account_name || '-'}</span>
    },
    {
      label: 'Status',
      key: 'status',
      sortable: true,
      width: 120,
      render: (item) => (
        <Switch checked={item.active} onCheckedChange={() => void handleToggleStatus(item)} />
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Bank Account</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Kelola akun rekening anda sebagai informasi pembayaran.</p>
        </div>
        <Button className={addButtonClass} onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Akun Bank
        </Button>
      </div>

      <DataTable
        data={accounts}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-[900px]"
        emptyTitle="Tidak ada akun bank"
        emptyDescription="Silakan tambahkan akun baru."
        actions={{
          actions: [
            {
              key: 'edit',
              label: 'Edit',
              icon: Pencil,
              onSelect: (row) => handleOpenEdit(row)
            },
            {
              key: 'delete',
              label: 'Hapus',
              icon: Trash2,
              variant: 'destructive',
              onSelect: (row) => void handleDelete(row)
            }
          ]
        }}
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          totalItems,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        rowKey={(row) => row.bank_account_id || row.id || ''}
      />

      <Button
        onClick={handleOpenAdd}
        className="md:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
        size="icon"
        title="Tambah Akun Bank"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <DialogPrimitive.Root
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setBankOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full p-0 border-none bg-white overflow-hidden max-h-[80vh] md:max-h-[650px] flex flex-col" onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.swal2-container')) {
            e.preventDefault();
          }
        }}>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0" autoComplete="off">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    {editingAccount ? <Pencil className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900">{editingAccount ? 'Edit Akun Bank' : 'Tambah Akun Bank'}</h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Isi detail rekening bank di bawah ini.
                    </p>
                  </div>
                </div>
                <DialogClose className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                  <X className="w-3 h-3 sm:w-5 sm:h-5" />
                </DialogClose>
              </div>

              <div className="h-px bg-slate-100" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6">
              {/* Payment Method Selection - Hidden as per request to focus on Bank Account */}
              {/* 
              <div className="grid gap-2 mb-6">
                <label className="text-sm font-medium text-gray-700 dark:text-white/70">Metode Pembayaran</label>
                <RadioGroup 
                  value={String(formData.payment_method)} 
                  onValueChange={(val) => setFormData({...formData, payment_method: parseInt(val)})}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="pm-transfer" className="bg-transparent data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                    <label htmlFor="pm-transfer">Transfer Bank</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="pm-qris" className="bg-transparent data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                    <label htmlFor="pm-qris">Qris</label>
                  </div>
                </RadioGroup>
              </div>
              */}

              {formData.payment_method === 1 && (
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="bank_name" className="text-sm font-medium text-gray-700 dark:text-white/70">
                      Nama Bank
                    </label>
                    <Popover open={bankOpen} onOpenChange={setBankOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={bankOpen}
                          className="w-full justify-between h-11 rounded-2xl border-gray-300 bg-white hover:bg-gray-50"
                        >
                          <span className={selectedFormBank || formData.bank_name ? '' : 'text-muted-foreground'}>
                            {selectedFormBank?.name || formData.bank_name
                              ? selectedFormBank?.name || formData.bank_name
                              : "Pilih Bank..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl" align="start">
                        <Command shouldFilter={false} className="rounded-xl">
                          <CommandInput placeholder="Cari bank..." />
                          <CommandList>
                            <CommandEmpty>Bank tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {banks.map((bank) => (
                                <CommandItem
                                  key={bank.code}
                                  value={bank.name}
                                  className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-900"
                                  onSelect={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      bank_name: bank.name,
                                      bank_code: bank.code,
                                    }));
                                    setBankOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.bank_code === bank.code ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {bank.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="account_number" className="text-sm font-medium text-gray-700 dark:text-white/70">
                      Nomor Rekening
                    </label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFormData({...formData, account_number: value});
                      }}
                      placeholder="Contoh: 1234567890"
                      className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="account_name" className="text-sm font-medium text-gray-700 dark:text-white/70">
                      Atas Nama
                    </label>
                    <Input
                      id="account_name"
                      value={formData.account_name}
                      onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                      placeholder="Contoh: PT Travego Indonesia"
                      className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30"
                    />
                  </div>
                </div>
              )}

              {formData.payment_method === 2 && (
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="merchant_name" className="text-sm font-medium text-gray-700 dark:text-white/70">Merchant Name</label>
                    <Input id="merchant_name" value={formData.merchant_name} onChange={(e) => setFormData({...formData, merchant_name: e.target.value})} placeholder="Merchant Name" className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="merchant_mcc" className="text-sm font-medium text-gray-700 dark:text-white/70">Merchant MCC</label>
                    <Input id="merchant_mcc" value={formData.merchant_mcc} onChange={(e) => setFormData({...formData, merchant_mcc: e.target.value})} placeholder="Merchant MCC" className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="merchant_address" className="text-sm font-medium text-gray-700 dark:text-white/70">Merchant Address</label>
                    <Input id="merchant_address" value={formData.merchant_address} onChange={(e) => setFormData({...formData, merchant_address: e.target.value})} placeholder="Merchant Address" className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="merchant_city" className="text-sm font-medium text-gray-700 dark:text-white/70">Merchant City</label>
                    <Input id="merchant_city" value={formData.merchant_city} onChange={(e) => setFormData({...formData, merchant_city: e.target.value})} placeholder="Merchant City" className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="merchant_postal_code" className="text-sm font-medium text-gray-700 dark:text-white/70">Merchant Postal Code</label>
                    <Input id="merchant_postal_code" value={formData.merchant_postal_code} onChange={(e) => setFormData({...formData, merchant_postal_code: e.target.value})} placeholder="Merchant Postal Code" className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-white/70">Account Type</label>
                    <RadioGroup 
                      value={String(formData.account_type)} 
                      onValueChange={(val) => setFormData({...formData, account_type: parseInt(val)})}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      <label className={`flex items-start gap-3 rounded-[22px] border p-4 cursor-pointer transition-all ${formData.account_type === 1 ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-white'}`}>
                        <RadioGroupItem value="1" id="at-personal" className="mt-0.5 border-blue-300" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900">Personal</div>
                          <div className="mt-1 text-xs text-gray-600">Akun personal.</div>
                        </div>
                      </label>
                      <label className={`flex items-start gap-3 rounded-[22px] border p-4 cursor-pointer transition-all ${formData.account_type === 2 ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-white'}`}>
                        <RadioGroupItem value="2" id="at-company" className="mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900">Company</div>
                          <div className="mt-1 text-xs text-gray-600">Akun perusahaan.</div>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-white/70">QRIS Image</label>
                    {formData.qris_image ? (
                      <div className="relative w-full h-48 border rounded-[22px] overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                        <img 
                          src={formData.qris_image} 
                          alt="QRIS" 
                          className="max-w-full max-h-full object-contain" 
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full"
                          onClick={removeQrisImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-[22px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {qrisUploading ? (
                              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                            ) : (
                              <>
                                <Upload className="h-8 w-8 mb-3 text-gray-500" />
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                              </>
                            )}
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleQrisUpload} disabled={qrisUploading} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-t border-gray-100">
              <div className="flex items-center gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-11 rounded-2xl">
                  Batal
                </Button>
                <Button type="submit" disabled={saving} className="h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </div>
          </form>
          <div id="swal-dialog-target" />
        </DialogContent>
      </DialogPrimitive.Root>
    </div>
  );
};

export default BankAccountContent;
