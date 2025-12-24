import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';

export const OrganizationOpenApi: React.FC = () => {
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
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="text-sm text-gray-500">Current Key</div>
                <div className="font-mono text-sm">****************</div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700"><KeyRound className="h-4 w-4 mr-2" />Generate New</Button>
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
