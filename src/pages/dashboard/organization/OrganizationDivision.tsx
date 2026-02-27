import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Division = {
  id: number;
  name: string;
  description: string;
};

export const OrganizationDivision: React.FC = () => {
  const divisions: Division[] = [
    { id: 1, name: 'Operations', description: 'Pengelolaan operasional harian' },
    { id: 2, name: 'Marketing', description: 'Promosi dan kampanye pemasaran' },
    { id: 3, name: 'Finance', description: 'Pengelolaan keuangan dan laporan' },
    { id: 4, name: 'IT', description: 'Pengembangan sistem dan dukungan teknis' },
    { id: 5, name: 'Customer Service', description: 'Layanan pelanggan dan dukungan' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Division</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Daftar divisi organisasi.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Divisi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Deskripsi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

