import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Car, User, MapPin, Package, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const ScheduleArmada: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sample schedule data
  const scheduleData = {
    '2025-10-15': [
      {
        id: 1,
        armadaName: 'Toyota Hiace Premio',
        orderDetail: 'ORD-001 - Bangkok Tour',
        crewName: 'Ahmad Rizki',
        destination: 'Bangkok, Thailand',
        time: '06:00',
        status: 'scheduled'
      },
      {
        id: 2,
        armadaName: 'Innova Reborn',
        orderDetail: 'ORD-002 - City Tour Jakarta',
        crewName: 'Siti Nurhaliza',
        destination: 'Jakarta Selatan',
        time: '08:00',
        status: 'in-progress'
      },
      {
        id: 3,
        armadaName: 'Fortuner 4x4',
        orderDetail: 'ORD-003 - Bandung Tour',
        crewName: 'Budi Santoso',
        destination: 'Bandung, Jawa Barat',
        time: '07:00',
        status: 'scheduled'
      }
    ],
    '2025-10-16': [
      {
        id: 4,
        armadaName: 'Elf Long',
        orderDetail: 'ORD-004 - Yogyakarta Tour',
        crewName: 'Dewi Kartika',
        destination: 'Yogyakarta',
        time: '05:30',
        status: 'scheduled'
      },
      {
        id: 5,
        armadaName: 'Avanza Veloz',
        orderDetail: 'ORD-005 - Local Tour',
        crewName: 'Rizki Pratama',
        destination: 'Jakarta Pusat',
        time: '09:00',
        status: 'scheduled'
      },
      {
        id: 6,
        armadaName: 'Grand Max',
        orderDetail: 'ORD-006 - Surabaya Tour',
        crewName: 'Maya Sari',
        destination: 'Surabaya, Jawa Timur',
        time: '10:30',
        status: 'scheduled'
      }
    ],
    '2025-10-18': [
      {
        id: 7,
        armadaName: 'Toyota Hiace Premio',
        orderDetail: 'ORD-007 - Bali Tour',
        crewName: 'Ahmad Rizki',
        destination: 'Bali, Indonesia',
        time: '04:00',
        status: 'scheduled'
      },
      {
        id: 8,
        armadaName: 'Innova Reborn',
        orderDetail: 'ORD-008 - Lombok Tour',
        crewName: 'Siti Nurhaliza',
        destination: 'Lombok, NTB',
        time: '06:30',
        status: 'scheduled'
      },
      {
        id: 9,
        armadaName: 'Fortuner 4x4',
        orderDetail: 'ORD-009 - Bromo Tour',
        crewName: 'Budi Santoso',
        destination: 'Gunung Bromo, Jawa Timur',
        time: '05:00',
        status: 'scheduled'
      },
      {
        id: 10,
        armadaName: 'Elf Long',
        orderDetail: 'ORD-010 - Malang Tour',
        crewName: 'Dewi Kartika',
        destination: 'Malang, Jawa Timur',
        time: '08:00',
        status: 'scheduled'
      }
    ],
    '2025-10-20': [
      {
        id: 11,
        armadaName: 'Avanza Veloz',
        orderDetail: 'ORD-011 - Semarang Tour',
        crewName: 'Rizki Pratama',
        destination: 'Semarang, Jawa Tengah',
        time: '07:00',
        status: 'scheduled'
      },
      {
        id: 12,
        armadaName: 'Grand Max',
        orderDetail: 'ORD-012 - Solo Tour',
        crewName: 'Maya Sari',
        destination: 'Solo, Jawa Tengah',
        time: '09:30',
        status: 'scheduled'
      }
    ],
    '2025-10-22': [
      {
        id: 13,
        armadaName: 'Toyota Hiace Premio',
        orderDetail: 'ORD-013 - Medan Tour',
        crewName: 'Ahmad Rizki',
        destination: 'Medan, Sumatera Utara',
        time: '05:30',
        status: 'scheduled'
      },
      {
        id: 14,
        armadaName: 'Innova Reborn',
        orderDetail: 'ORD-014 - Palembang Tour',
        crewName: 'Siti Nurhaliza',
        destination: 'Palembang, Sumatera Selatan',
        time: '08:00',
        status: 'scheduled'
      },
      {
        id: 15,
        armadaName: 'Fortuner 4x4',
        orderDetail: 'ORD-015 - Padang Tour',
        crewName: 'Budi Santoso',
        destination: 'Padang, Sumatera Barat',
        time: '06:00',
        status: 'scheduled'
      }
    ],
    '2025-10-25': [
      {
        id: 16,
        armadaName: 'Elf Long',
        orderDetail: 'ORD-016 - Makassar Tour',
        crewName: 'Dewi Kartika',
        destination: 'Makassar, Sulawesi Selatan',
        time: '04:30',
        status: 'scheduled'
      },
      {
        id: 17,
        armadaName: 'Avanza Veloz',
        orderDetail: 'ORD-017 - Manado Tour',
        crewName: 'Rizki Pratama',
        destination: 'Manado, Sulawesi Utara',
        time: '07:30',
        status: 'scheduled'
      },
      {
        id: 18,
        armadaName: 'Grand Max',
        orderDetail: 'ORD-018 - Pontianak Tour',
        crewName: 'Maya Sari',
        destination: 'Pontianak, Kalimantan Barat',
        time: '09:00',
        status: 'scheduled'
      },
      {
        id: 19,
        armadaName: 'Toyota Hiace Premio',
        orderDetail: 'ORD-019 - Banjarmasin Tour',
        crewName: 'Ahmad Rizki',
        destination: 'Banjarmasin, Kalimantan Selatan',
        time: '10:30',
        status: 'scheduled'
      }
    ],
    '2025-11-05': [
      {
        id: 20,
        armadaName: 'Toyota Hiace Premio',
        orderDetail: 'ORD-020 - Singapore Tour',
        crewName: 'Ahmad Rizki',
        destination: 'Singapore',
        time: '05:00',
        status: 'scheduled'
      },
      {
        id: 21,
        armadaName: 'Innova Reborn',
        orderDetail: 'ORD-021 - Kuala Lumpur Tour',
        crewName: 'Siti Nurhaliza',
        destination: 'Kuala Lumpur, Malaysia',
        time: '07:30',
        status: 'scheduled'
      },
      {
        id: 22,
        armadaName: 'Fortuner 4x4',
        orderDetail: 'ORD-022 - Penang Tour',
        crewName: 'Budi Santoso',
        destination: 'Penang, Malaysia',
        time: '06:00',
        status: 'scheduled'
      }
    ],
    '2025-11-08': [
      {
        id: 23,
        armadaName: 'Elf Long',
        orderDetail: 'ORD-023 - Phuket Tour',
        crewName: 'Dewi Kartika',
        destination: 'Phuket, Thailand',
        time: '04:30',
        status: 'scheduled'
      },
      {
        id: 24,
        armadaName: 'Avanza Veloz',
        orderDetail: 'ORD-024 - Chiang Mai Tour',
        crewName: 'Rizki Pratama',
        destination: 'Chiang Mai, Thailand',
        time: '08:00',
        status: 'scheduled'
      }
    ],
    '2025-11-12': [
      {
        id: 25,
        armadaName: 'Grand Max',
        orderDetail: 'ORD-025 - Ho Chi Minh Tour',
        crewName: 'Maya Sari',
        destination: 'Ho Chi Minh, Vietnam',
        time: '05:30',
        status: 'scheduled'
      },
      {
        id: 26,
        armadaName: 'Toyota Hiace Premio',
        orderDetail: 'ORD-026 - Hanoi Tour',
        crewName: 'Ahmad Rizki',
        destination: 'Hanoi, Vietnam',
        time: '07:00',
        status: 'scheduled'
      },
      {
        id: 27,
        armadaName: 'Innova Reborn',
        orderDetail: 'ORD-027 - Da Nang Tour',
        crewName: 'Siti Nurhaliza',
        destination: 'Da Nang, Vietnam',
        time: '09:30',
        status: 'scheduled'
      }
    ],
    '2025-11-15': [
      {
        id: 28,
        armadaName: 'Fortuner 4x4',
        orderDetail: 'ORD-028 - Manila Tour',
        crewName: 'Budi Santoso',
        destination: 'Manila, Philippines',
        time: '06:00',
        status: 'scheduled'
      },
      {
        id: 29,
        armadaName: 'Elf Long',
        orderDetail: 'ORD-029 - Cebu Tour',
        crewName: 'Dewi Kartika',
        destination: 'Cebu, Philippines',
        time: '08:30',
        status: 'scheduled'
      },
      {
        id: 30,
        armadaName: 'Avanza Veloz',
        orderDetail: 'ORD-030 - Boracay Tour',
        crewName: 'Rizki Pratama',
        destination: 'Boracay, Philippines',
        time: '10:00',
        status: 'scheduled'
      }
    ],
    '2025-11-18': [
      {
        id: 31,
        armadaName: 'Grand Max',
        orderDetail: 'ORD-031 - Siem Reap Tour',
        crewName: 'Maya Sari',
        destination: 'Siem Reap, Cambodia',
        time: '05:00',
        status: 'scheduled'
      },
      {
        id: 32,
        armadaName: 'Toyota Hiace Premio',
        orderDetail: 'ORD-032 - Phnom Penh Tour',
        crewName: 'Ahmad Rizki',
        destination: 'Phnom Penh, Cambodia',
        time: '07:30',
        status: 'scheduled'
      }
    ],
    '2025-11-22': [
      {
        id: 33,
        armadaName: 'Innova Reborn',
        orderDetail: 'ORD-033 - Yangon Tour',
        crewName: 'Siti Nurhaliza',
        destination: 'Yangon, Myanmar',
        time: '06:30',
        status: 'scheduled'
      },
      {
        id: 34,
        armadaName: 'Fortuner 4x4',
        orderDetail: 'ORD-034 - Bagan Tour',
        crewName: 'Budi Santoso',
        destination: 'Bagan, Myanmar',
        time: '08:00',
        status: 'scheduled'
      },
      {
        id: 35,
        armadaName: 'Elf Long',
        orderDetail: 'ORD-035 - Mandalay Tour',
        crewName: 'Dewi Kartika',
        destination: 'Mandalay, Myanmar',
        time: '09:30',
        status: 'scheduled'
      }
    ],
    '2025-11-25': [
      {
        id: 36,
        armadaName: 'Avanza Veloz',
        orderDetail: 'ORD-036 - Vientiane Tour',
        crewName: 'Rizki Pratama',
        destination: 'Vientiane, Laos',
        time: '05:30',
        status: 'scheduled'
      },
      {
        id: 37,
        armadaName: 'Grand Max',
        orderDetail: 'ORD-037 - Luang Prabang Tour',
        crewName: 'Maya Sari',
        destination: 'Luang Prabang, Laos',
        time: '07:00',
        status: 'scheduled'
      },
      {
        id: 38,
        armadaName: 'Toyota Hiace Premio',
        orderDetail: 'ORD-038 - Pakse Tour',
        crewName: 'Ahmad Rizki',
        destination: 'Pakse, Laos',
        time: '08:30',
        status: 'scheduled'
      },
      {
        id: 39,
        armadaName: 'Innova Reborn',
        orderDetail: 'ORD-039 - Champasak Tour',
        crewName: 'Siti Nurhaliza',
        destination: 'Champasak, Laos',
        time: '10:00',
        status: 'scheduled'
      }
    ]
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Terjadwal</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">Berlangsung</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Selesai</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasSchedule = (date: Date) => {
    const dateStr = formatDate(date);
    return scheduleData[dateStr as keyof typeof scheduleData]?.length > 0;
  };

  const getScheduleCount = (date: Date) => {
    const dateStr = formatDate(date);
    return scheduleData[dateStr as keyof typeof scheduleData]?.length || 0;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return scheduleData[dateStr as keyof typeof scheduleData] || [];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const days = getDaysInMonth(currentDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Schedule Armada</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Jadwal armada dan crew untuk setiap hari
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate('/dashboard/team/schedule-armada/add')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Tambah Jadwal
        </Button>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="min-h-[100px] border border-gray-200 dark:border-gray-700">
                {day ? (
                  <div
                    className={`h-full p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        {day.getDate()}
                      </span>
                      {hasSchedule(day) && (
                        <Badge variant="secondary" className="text-xs">
                          {getScheduleCount(day)}
                        </Badge>
                      )}
                    </div>
                    {hasSchedule(day) && (
                      <div className="space-y-1">
                        {getSchedulesForDate(day).slice(0, 2).map(schedule => (
                          <div key={schedule.id} className="text-xs p-1 bg-gray-100 dark:bg-gray-700 rounded">
                            <div className="font-medium truncate">{schedule.armadaName}</div>
                            <div className="text-gray-500 truncate">{schedule.time}</div>
                          </div>
                        ))}
                        {getScheduleCount(day) > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{getScheduleCount(day) - 2} lainnya
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Jadwal Armada - {selectedDate && selectedDate.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDate && (
            <div className="space-y-4">
              {getSchedulesForDate(selectedDate).length > 0 ? (
                getSchedulesForDate(selectedDate).map(schedule => (
                  <Card key={schedule.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Nama Armada:</span>
                            <span className="text-sm text-gray-900 dark:text-white">{schedule.armadaName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Order Detail:</span>
                            <span className="text-sm text-gray-900 dark:text-white">{schedule.orderDetail}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Nama Crew:</span>
                            <span className="text-sm text-gray-900 dark:text-white">{schedule.crewName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Tujuan:</span>
                            <span className="text-sm text-gray-900 dark:text-white">{schedule.destination}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Waktu:</span>
                          <span className="text-sm text-gray-900 dark:text-white">{schedule.time}</span>
                        </div>
                        {getStatusBadge(schedule.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Tidak ada jadwal armada untuk hari ini</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
