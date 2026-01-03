import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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

  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankOpen, setBankOpen] = useState(false);

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

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({ 
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
    setDialogOpen(true);
  };

  const handleOpenEdit = (account: BankAccount) => {
    setEditingAccount(account);
    let pm = 1;
    if (account.payment_method === 2 || account.payment_method === 'QRIS') {
      pm = 2;
    }
    
    setFormData({
      bank_code: account.bank_code || account.bank_name || '',
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bank Account</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage bank account details.</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Akun Bank
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun Bank</CardTitle>
          <CardDescription>
            Kelola daftar rekening bank untuk penerimaan pembayaran.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada akun bank. Silakan tambahkan akun baru.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metode</TableHead>
                  <TableHead>Nama Bank</TableHead>
                  <TableHead>Nomor Rekening</TableHead>
                  <TableHead>Pemilik Rekening</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.bank_account_id || account.id}>
                    <TableCell>{(account.payment_method === 2 || account.payment_method === 'QRIS') ? 'QRIS' : 'Transfer Bank'}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {account.bank_icon && (
                          <img 
                            src={account.bank_icon} 
                            alt={account.bank_name} 
                            className="h-8 w-8 object-contain"
                          />
                        )}
                        <span>{account.bank_name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{account.account_number || '-'}</TableCell>
                    <TableCell>{account.account_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Switch
                          checked={account.active}
                          onCheckedChange={() => handleToggleStatus(account)}
                        />
                        <Button variant="outline" size="icon" onClick={() => handleOpenEdit(account)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(account)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px]"
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.swal2-container')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Akun Bank' : 'Tambah Akun Bank'}</DialogTitle>
            <DialogDescription>
              Isi detail rekening bank di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-2">
              {/* Payment Method Selection - Hidden as per request to focus on Bank Account */}
              {/* 
              <div className="grid gap-2">
                <label className="text-sm font-medium">Metode Pembayaran</label>
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
                <>
                  <div className="grid gap-2">
                    <label htmlFor="bank_name" className="text-sm font-medium">
                      Nama Bank
                    </label>
                    <Popover open={bankOpen} onOpenChange={setBankOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={bankOpen}
                          className="w-full justify-between"
                        >
                          {formData.bank_name
                            ? banks.find((bank) => bank.name === formData.bank_name)?.name || formData.bank_name
                            : "Pilih Bank..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Cari bank..." />
                          <CommandList>
                            <CommandEmpty>Bank tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {banks.map((bank) => (
                                <CommandItem
                                  key={bank.code}
                                  value={bank.name}
                                  onSelect={(currentValue) => {
                                    // Find bank by checking if name matches (case-insensitive because CommandItem normalizes value)
                                    // We store the actual name in formData
                                    const selectedBank = banks.find(b => b.name.toLowerCase() === currentValue.toLowerCase());
                                    const nameToSet = selectedBank ? selectedBank.name : currentValue;
                                    const codeToSet = selectedBank ? selectedBank.code : '';
                                    
                                    setFormData({...formData, bank_name: nameToSet, bank_code: codeToSet});
                                    setBankOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.bank_name === bank.name ? "opacity-100" : "opacity-0"
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
                  <div className="grid gap-2">
                    <label htmlFor="account_number" className="text-sm font-medium">
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
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="account_name" className="text-sm font-medium">
                      Atas Nama
                    </label>
                    <Input
                      id="account_name"
                      value={formData.account_name}
                      onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                      placeholder="Contoh: PT Travego Indonesia"
                    />
                  </div>
                </>
              )}

              {formData.payment_method === 2 && (
                <>
                  <div className="grid gap-2">
                    <label htmlFor="merchant_name" className="text-sm font-medium">Merchant Name</label>
                    <Input id="merchant_name" value={formData.merchant_name} onChange={(e) => setFormData({...formData, merchant_name: e.target.value})} placeholder="Merchant Name" />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="merchant_mcc" className="text-sm font-medium">Merchant MCC</label>
                    <Input id="merchant_mcc" value={formData.merchant_mcc} onChange={(e) => setFormData({...formData, merchant_mcc: e.target.value})} placeholder="Merchant MCC" />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="merchant_address" className="text-sm font-medium">Merchant Address</label>
                    <Input id="merchant_address" value={formData.merchant_address} onChange={(e) => setFormData({...formData, merchant_address: e.target.value})} placeholder="Merchant Address" />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="merchant_city" className="text-sm font-medium">Merchant City</label>
                    <Input id="merchant_city" value={formData.merchant_city} onChange={(e) => setFormData({...formData, merchant_city: e.target.value})} placeholder="Merchant City" />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="merchant_postal_code" className="text-sm font-medium">Merchant Postal Code</label>
                    <Input id="merchant_postal_code" value={formData.merchant_postal_code} onChange={(e) => setFormData({...formData, merchant_postal_code: e.target.value})} placeholder="Merchant Postal Code" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Account Type</label>
                    <RadioGroup 
                      value={String(formData.account_type)} 
                      onValueChange={(val) => setFormData({...formData, account_type: parseInt(val)})}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="at-personal" className="bg-transparent data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                        <label htmlFor="at-personal">Personal</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2" id="at-company" className="bg-transparent data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                        <label htmlFor="at-company">Company</label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">QRIS Image</label>
                    {formData.qris_image ? (
                      <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                        <img 
                          src={formData.qris_image} 
                          alt="QRIS" 
                          className="max-w-full max-h-full object-contain" 
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={removeQrisImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600">
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
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
          <div id="swal-dialog-target" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankAccountContent;
