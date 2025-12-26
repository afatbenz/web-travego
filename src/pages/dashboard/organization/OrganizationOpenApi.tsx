import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

export const OrganizationOpenApi: React.FC = () => {
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<{ api_token: string }>("/organization/api-config", { Authorization: token });
      setLoading(false);
      if (res.status === 'success' && res.data && typeof res.data.api_token === 'string') {
        setApiToken(res.data.api_token);
      }
    };
    fetchConfig();
  }, []);

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
    </div>
  );
};
