import React from 'react';
import { Mail, Phone, Linkedin, Award, Users, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const Team: React.FC = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'Ahmad Rizki',
      position: 'Chief Executive Officer',
      department: 'Management',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Dengan pengalaman 15 tahun di industri travel, Ahmad memimpin TraveGO dengan visi memberikan layanan terbaik kepada setiap customer.',
      expertise: ['Strategic Planning', 'Business Development', 'Customer Relations'],
      email: 'ahmad.rizki@TraveGO.com',
      phone: '+62 21 1234 5678',
      experience: '15+ Years',
      projects: '500+ Projects'
    },
    {
      id: 2,
      name: 'Sari Dewi',
      position: 'Operations Manager',
      department: 'Operations',
      image: 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Sari bertanggung jawab atas operasional harian dan memastikan setiap layanan berjalan dengan standar kualitas tertinggi.',
      expertise: ['Operations Management', 'Quality Control', 'Team Leadership'],
      email: 'sari.dewi@TraveGO.com',
      phone: '+62 21 1234 5679',
      experience: '10+ Years',
      projects: '800+ Operations'
    },
    {
      id: 3,
      name: 'Budi Santoso',
      position: 'Fleet Manager',
      department: 'Fleet',
      image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Mengelola seluruh armada kendaraan dan memastikan kondisi optimal serta keamanan setiap perjalanan pelanggan.',
      expertise: ['Fleet Management', 'Vehicle Maintenance', 'Safety Protocols'],
      email: 'budi.santoso@TraveGO.com',
      phone: '+62 21 1234 5680',
      experience: '12+ Years',
      projects: '200+ Fleet Units'
    },
    {
      id: 4,
      name: 'Maya Sari',
      position: 'Customer Service Lead',
      department: 'Customer Service',
      image: 'https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Maya memimpin tim customer service dan memastikan setiap pertanyaan dan keluhan pelanggan ditangani dengan profesional.',
      expertise: ['Customer Relations', 'Problem Solving', 'Communication'],
      email: 'maya.sari@TraveGO.com',
      phone: '+62 21 1234 5681',
      experience: '8+ Years',
      projects: '5000+ Customers Served'
    },
    {
      id: 5,
      name: 'Dicky Pratama',
      position: 'Tour Guide Coordinator',
      department: 'Tourism',
      image: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Koordinator tim tour guide yang memastikan setiap wisatawan mendapatkan pengalaman tak terlupakan di setiap destinasi.',
      expertise: ['Tourism Management', 'Cultural Knowledge', 'Language Skills'],
      email: 'dicky.pratama@TraveGO.com',
      phone: '+62 21 1234 5682',
      experience: '9+ Years',
      projects: '1000+ Tours'
    },
    {
      id: 6,
      name: 'Lisa Anggraini',
      position: 'Marketing Manager',
      department: 'Marketing',
      image: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Lisa mengelola strategi pemasaran dan branding TraveGO untuk menjangkau lebih banyak pelanggan dengan pesan yang tepat.',
      expertise: ['Digital Marketing', 'Brand Strategy', 'Content Creation'],
      email: 'lisa.anggraini@TraveGO.com',
      phone: '+62 21 1234 5683',
      experience: '7+ Years',
      projects: '50+ Campaigns'
    }
  ];

  const departments = [
    { name: 'Management', count: 1, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
    { name: 'Operations', count: 1, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
    { name: 'Fleet', count: 1, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' },
    { name: 'Customer Service', count: 1, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
    { name: 'Tourism', count: 1, color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300' },
    { name: 'Marketing', count: 1, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section with Parallax Background */}
      <section className="relative h-80 w-full text-white overflow-hidden">
        {/* Background Image dengan Parallax Effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: 'url(https://cdn.paradisotour.co.id/wp-content/uploads/2024/01/Kelebihan-Mobil-Hiace.jpg)'
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Tim Profesional Kami</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Dibalik layanan terbaik TraveGO adalah tim profesional yang berpengalaman 
              dan berkomitmen memberikan pengalaman perjalanan tak terlupakan
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-gray-950">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">50+</h3>
              <p className="text-gray-600 dark:text-gray-300">Total Tim</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">10+</h3>
              <p className="text-gray-600 dark:text-gray-300">Tahun Pengalaman</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <MapPin className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">100+</h3>
              <p className="text-gray-600 dark:text-gray-300">Destinasi Dikuasai</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">10K+</h3>
              <p className="text-gray-600 dark:text-gray-300">Pelanggan Puas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Filter */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex flex-wrap justify-center gap-4">
            {departments.map((dept, index) => (
              <Badge key={index} className={`px-4 py-2 text-sm font-medium ${dept.color}`}>
                {dept.name} ({dept.count})
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Team Members Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <Card key={member.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white dark:bg-gray-800">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 right-4 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white hover:text-gray-900">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white hover:text-gray-900">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white hover:text-gray-900">
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {member.position}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {member.department}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                    {member.bio}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                        Keahlian:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {member.expertise.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Experience</p>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {member.experience}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Projects</p>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {member.projects}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <Mail className="h-4 w-4 mr-2" />
                        {member.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Phone className="h-4 w-4 mr-2" />
                        {member.phone}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};