import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import Swal from 'sweetalert2';

export const OrganizationOpenApi: React.FC = () => {
  const [apiToken, setApiToken] = useState('');
  const [domainUrl, setDomainUrl] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [updatingDomain, setUpdatingDomain] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<{ api_token: string; domain_url: string }>("/organization/api-config", { Authorization: token });
      setLoading(false);
      if (res.status === 'success' && res.data) {
        if (typeof res.data.api_token === 'string') {
          setApiToken(res.data.api_token);
        }
        if (typeof res.data.domain_url === 'string') {
          setDomainUrl(res.data.domain_url);
        }
      }
    };
    fetchConfig();
  }, []);

  const handleUpdateDomain = async () => {
    setUpdatingDomain(true);
    const token = localStorage.getItem('token') ?? '';
    const res = await api.post("/organization/update/domain-url", { domain_url: domainUrl }, { Authorization: token });
    setUpdatingDomain(false);
    
    if (res.status === 'success') {
      setIsEditingDomain(false);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Domain URL berhasil diperbarui',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Open API</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola akses API organisasi</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="mb-4">
                <div className="text-sm text-gray-500">Current Key</div>
                <div className="font-mono text-sm break-all mt-1">
                  {loading ? 'Loading...' : showToken ? apiToken || '' : '****************'}
                </div>
              </div>
              <div>
                <Button variant="outline" size="sm" onClick={() => setShowToken((s) => !s)}>
                  {showToken ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Simpan API key anda secara aman. API key digunakan untuk mengakses endpoint Open API.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Whitelist Domain URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="mb-4">
                <div className="text-sm text-gray-500">Domain URL</div>
                {isEditingDomain ? (
                  <div className="mt-2 flex gap-2">
                    <Input 
                      value={domainUrl} 
                      onChange={(e) => setDomainUrl(e.target.value)} 
                      placeholder="https://example.com" 
                      className="max-w-md"
                    />
                  </div>
                ) : (
                  <div className="font-mono text-sm break-all mt-1">
                    {loading ? 'Loading...' : domainUrl || '-'}
                  </div>
                )}
              </div>
              <div>
                {isEditingDomain ? (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleUpdateDomain}
                      disabled={updatingDomain}
                    >
                      {updatingDomain ? 'Updating...' : 'Update'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditingDomain(false)}
                      disabled={updatingDomain}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingDomain(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Masukkan domain URL yang diizinkan untuk mengakses API ini (CORS whitelist).
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
