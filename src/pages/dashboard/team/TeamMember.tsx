import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const TeamMember: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const teamMembers = [
    {
      id: 1,
      name: 'Ahmad Rizki',
      division: 'Operations',
      role: 'Manager',
      phone: '081234567890',
      email: 'ahmad.rizki@TraveGO.com',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 2,
      name: 'Siti Nurhaliza',
      division: 'Marketing',
      role: 'Specialist',
      phone: '081234567891',
      email: 'siti.nurhaliza@TraveGO.com',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 3,
      name: 'Budi Santoso',
      division: 'Finance',
      role: 'Analyst',
      phone: '081234567892',
      email: 'budi.santoso@TraveGO.com',
      status: 'inactive',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 4,
      name: 'Dewi Kartika',
      division: 'Operations',
      role: 'Coordinator',
      phone: '081234567893',
      email: 'dewi.kartika@TraveGO.com',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 5,
      name: 'Rizki Pratama',
      division: 'IT',
      role: 'Developer',
      phone: '081234567894',
      email: 'rizki.pratama@TraveGO.com',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 6,
      name: 'Maya Sari',
      division: 'Customer Service',
      role: 'Representative',
      phone: '081234567895',
      email: 'maya.sari@TraveGO.com',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Aktif</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">Tidak Aktif</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Manager':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Manager</Badge>;
      case 'Specialist':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">Specialist</Badge>;
      case 'Analyst':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">Analyst</Badge>;
      case 'Coordinator':
        return <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300">Coordinator</Badge>;
      case 'Developer':
        return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">Developer</Badge>;
      case 'Representative':
        return <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300">Representative</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesDivision = divisionFilter === 'all' || member.division === divisionFilter;
    
    return matchesSearch && matchesStatus && matchesDivision;
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Member</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Kelola anggota tim perusahaan
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Team Member
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari team member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Divisi</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="Customer Service">Customer Service</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full">
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Team Member ({filteredMembers.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Nama</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Divisi</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">No. Telepon</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentMembers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 object-cover rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 dark:text-white">{member.division}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getRoleBadge(member.role)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-900 dark:text-white">{member.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredMembers.length)} dari {filteredMembers.length} team member
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ←
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{teamMembers.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Team Member</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {teamMembers.filter(m => m.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Aktif</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {teamMembers.filter(m => m.status === 'inactive').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tidak Aktif</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {new Set(teamMembers.map(m => m.division)).size}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Divisi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

