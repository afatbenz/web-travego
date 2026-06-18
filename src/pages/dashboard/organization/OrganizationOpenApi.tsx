import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeaderWithBadge } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
  Braces,
  Code,
  Copy,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  Pencil,
  ShieldCheck,
} from 'lucide-react';

type ApiConfigData = {
  api_token: string;
  domain_url: string;
  organization_name?: string;
  organization_code?: string;
  organization_id?: string;
};

type CodeTab = 'curl' | 'javascript' | 'php';

const BASE_API_URL = 'https://api.travego.id/v1';

const codeExamples: Record<CodeTab, string> = {
  curl: `curl -X GET \\
  'https://api.travego.id/v1/armada' \\
  -H 'api-key: cp_live_*********' \\
  -H 'Accept: application/json'`,
  javascript: `const response = await fetch(
  'https://api.travego.id/v1/armada',
  {
    headers: {
      'api-key': 'cp_live_*********',
      'Accept': 'application/json'
    }
  }
);`,
  php: `$ch = curl_init();
curl_setopt($ch, CURLOPT_URL,
  'https://api.travego.id/v1/armada');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'api-key: cp_live_*********',
  "Accept: application/json"
]);`,
};

const getStoredOrganizationName = () => {
  try {
    const token = localStorage.getItem('token') ?? '';
    const payload = token.split('.')[1];
    if (!payload) return localStorage.getItem('organization_name') ?? 'organisasi Anda';

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded)) as Record<string, unknown>;
    return String(
      decoded.organization_name ??
        decoded.org_name ??
        decoded.organizationName ??
        decoded.orgName ??
        localStorage.getItem('organization_name') ??
        'organisasi Anda'
    );
  } catch {
    return localStorage.getItem('organization_name') ?? 'organisasi Anda';
  }
};

const maskApiToken = (token: string) => {
  if (!token) return '';
  const suffix = token.slice(-8);
  const middleLength = Math.max(12, token.length - 8);
  return `cp_live_${'*'.repeat(middleLength)}${suffix}`;
};

const copyText = async (text: string, successMessage: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast({ title: successMessage });
    return;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast({ title: successMessage });
  }
};

export const OrganizationOpenApi: React.FC = () => {
  const [apiToken, setApiToken] = useState('');
  const [domainUrl, setDomainUrl] = useState('');
  const [domainDraft, setDomainDraft] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [updatingDomain, setUpdatingDomain] = useState(false);
  const [activeTab, setActiveTab] = useState<CodeTab>('curl');

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const res = await api.get<ApiConfigData>('/organization/api-config');
      setLoading(false);

      if (res.status === 'success' && res.data) {
        if (typeof res.data.api_token === 'string') {
          setApiToken(res.data.api_token);
        }
        if (typeof res.data.domain_url === 'string') {
          setDomainUrl(res.data.domain_url);
        }
        if (typeof res.data.organization_name === 'string' && res.data.organization_name.trim()) {
          setOrganizationName(res.data.organization_name);
        } else {
          setOrganizationName(getStoredOrganizationName());
        }
      } else {
        setOrganizationName(getStoredOrganizationName());
      }
    };

    void fetchConfig();
  }, []);

  const organizationDisplayName = organizationName || 'organisasi Anda';

  const handleCopyApiToken = () => {
    if (!apiToken) return;
    void copyText(apiToken, 'API Key berhasil disalin');
  };

  const handleCopyBaseUrl = () => {
    void copyText(BASE_API_URL, 'Base URL berhasil disalin');
  };

  const handleCopyCode = () => {
    void copyText(codeExamples[activeTab], 'Kode contoh berhasil disalin');
  };

  const handleSaveDomain = async () => {
    const nextDomain = domainDraft.trim();
    if (!nextDomain) return;

    setUpdatingDomain(true);
    const res = await api.post('/organization/update/domain-url', { domain_url: nextDomain });
    setUpdatingDomain(false);

    if (res.status === 'success') {
      setDomainUrl(nextDomain);
      setIsEditingDomain(false);
      toast({ title: 'Domain URL berhasil diperbarui' });
    } else {
      toast({ title: res.message ?? 'Gagal memperbarui domain URL', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Open API</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Kelola akses API organisasi untuk integrasi dengan website atau sistem Anda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeaderWithBadge
              badgeIcon={KeyRound}
              title="API Key untuk Integrasi Website"
              subtitle={`Gunakan API key ini untuk mengakses endpoint Open API ${organizationDisplayName} dan integrasikan ke website atau aplikasi Anda.`}
            />
            <CardContent className="space-y-6 pt-6">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Apa itu API Key?</h4>
                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      API Key adalah kunci unik yang digunakan untuk mengautentikasi setiap permintaan API ke sistem{' '}
                      {organizationDisplayName}. Simpan key Anda dengan aman dan jangan pernah membagikannya di publik.
                    </p>
                  </div>
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-600 shadow-sm dark:border-blue-800 dark:bg-gray-900 dark:text-blue-300">
                      <Braces className="h-7 w-7" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                      <KeyRound className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <label htmlFor="api-token" className="text-sm font-medium text-gray-900 dark:text-white">
                    API Key Anda
                  </label>
                  {loading ? (
                    <Skeleton className="h-8 w-40 rounded-md" />
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Read-only</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="api-token"
                    value={loading ? '' : showToken ? apiToken : maskApiToken(apiToken)}
                    readOnly
                    className="font-mono text-xs sm:text-sm"
                  />
                  <div className="flex gap-2 sm:shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={loading || !apiToken}
                      onClick={() => setShowToken((value) => !value)}
                    >
                      {showToken ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {showToken ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={loading || !apiToken}
                      className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                      onClick={handleCopyApiToken}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400 sm:flex-row sm:gap-4">
                  {loading ? (
                    <>
                      <Skeleton className="h-3 w-44" />
                      <Skeleton className="h-3 w-48" />
                    </>
                  ) : (
                    <>
                      <span>Dibuat pada: 12 Mei 2024, 10:15 WIB</span>
                      <span>Terakhir digunakan: 20 Mei 2024, 14:22 WIB</span>
                    </>
                  )}
                </div>
              </div>

              <CardFooter className="p-0 text-sm text-gray-600 dark:text-gray-300">
                <Lock className="mr-2 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                Simpan API key Anda secara aman. Key ini digunakan untuk mengakses endpoint Open API.
              </CardFooter>
            </CardContent>
          </Card>

          <Card>
            <CardHeaderWithBadge
              badgeIcon={Globe}
              title="Whitelist Domain URL (CORS)"
              subtitle="Atur domain yang diizinkan mengakses API ini melalui browser (CORS whitelist)."
            />
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <label htmlFor="domain-url" className="text-sm font-medium text-gray-900 dark:text-white">
                    Domain yang Diizinkan
                  </label>
                  {!loading && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingDomain(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="domain-url"
                    value={loading ? '' : domainUrl}
                    readOnly
                    className="font-mono text-xs sm:text-sm"
                  />
                  {loading ? (
                    <Skeleton className="h-8 w-20 rounded-md" />
                  ) : (
                    <Badge className="h-8 self-start border-green-200 bg-green-50 px-3 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
                      Aktif
                    </Badge>
                  )}
                </div>
              </div>

              <div className="ml-auto rounded-2xl border border-gray-200 bg-blue-50 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h4 className="font-semibold text-gray-900 dark:text-white">Tentang CORS Whitelist</h4>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  Domain yang terdaftar di sini diizinkan mengakses API dari browser. Tambahkan domain website Anda
                  untuk menghindari error CORS.
                </p>
              </div>

              <CardFooter className="p-0 text-sm text-gray-600 dark:text-gray-300">
                <ShieldCheck className="mr-2 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                Pastikan domain Anda menggunakan HTTPS untuk keamanan data.
              </CardFooter>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Informasi Integrasi</h3>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                    Gunakan API Key Anda untuk mengakses Open API {organizationDisplayName}.
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="space-y-6 p-5">
              <div className="space-y-3">
                <label htmlFor="base-url" className="text-sm font-medium text-gray-900 dark:text-white">
                  Base URL
                </label>
                <div className="flex items-center gap-2">
                  <Input id="base-url" value={BASE_API_URL} readOnly className="font-mono text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={handleCopyBaseUrl} aria-label="Salin Base URL">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Contoh Penggunaan</label>
                <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as CodeTab)}>
                  <TabsList className="w-full justify-start rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                    <TabsTrigger value="curl" className="rounded-lg">cURL</TabsTrigger>
                    <TabsTrigger value="javascript" className="rounded-lg">JavaScript</TabsTrigger>
                    <TabsTrigger value="php" className="rounded-lg">PHP</TabsTrigger>
                  </TabsList>
                  <div className="relative mt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 z-10 h-8 w-8 rounded-lg bg-white/10 text-white hover:bg-white/20"
                      onClick={handleCopyCode}
                      aria-label="Salin kode contoh"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <TabsContent value="curl" className="mt-0">
                      <pre className="overflow-x-auto rounded-2xl bg-gray-950 p-4 text-xs leading-6 text-gray-100">
                        <code>{codeExamples.curl}</code>
                      </pre>
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-0">
                      <pre className="overflow-x-auto rounded-2xl bg-gray-950 p-4 text-xs leading-6 text-gray-100">
                        <code>{codeExamples.javascript}</code>
                      </pre>
                    </TabsContent>
                    <TabsContent value="php" className="mt-0">
                      <pre className="overflow-x-auto rounded-2xl bg-gray-950 p-4 text-xs leading-6 text-gray-100">
                        <code>{codeExamples.php}</code>
                      </pre>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              <div className="border-t border-gray-100 pt-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
                Lihat dokumentasi lengkap di halaman{' '}
                <a href="#" onClick={(event: React.MouseEvent<HTMLAnchorElement>) => event.preventDefault()} className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  developer
                </a>{' '}
                kami.
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={isEditingDomain} onOpenChange={setIsEditingDomain}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Domain URL</DialogTitle>
            <DialogDescription>
              Masukkan domain website yang diizinkan mengakses Open API melalui browser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label htmlFor="domain-draft" className="text-sm font-medium text-gray-900 dark:text-white">
              Domain URL
            </label>
            <Input
              id="domain-draft"
              value={domainDraft}
              onChange={(event) => setDomainDraft(event.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={updatingDomain}>
                Batal
              </Button>
            </DialogClose>
            <Button type="button" disabled={updatingDomain || !domainDraft.trim()} onClick={handleSaveDomain}>
              {updatingDomain ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
