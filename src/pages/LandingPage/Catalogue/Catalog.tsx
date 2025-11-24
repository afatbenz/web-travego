import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { InquirySection } from '@/components/common/InquirySection';
import { CatalogCard } from '@/components/cards/CatalogCard';
import { FilterSection } from '@/components/common/FilterSection';
import { Pagination } from '@/components/common/Pagination';

export const Catalog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const categories = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'rental', label: 'Rental Mobil' },
    { value: 'travel', label: 'Travel' },
    { value: 'paket', label: 'Paket Wisata' },
    { value: 'airport', label: 'Airport Transfer' }
  ];

  const locations = [
    { value: 'all', label: 'Semua Lokasi' },
    { value: 'jakarta', label: 'Jakarta' },
    { value: 'bali', label: 'Bali' },
    { value: 'yogyakarta', label: 'Yogyakarta' },
    { value: 'bandung', label: 'Bandung' },
    { value: 'surabaya', label: 'Surabaya' }
  ];

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price-low', label: 'Harga Terendah' },
    { value: 'price-high', label: 'Harga Tertinggi' },
    { value: 'rating', label: 'Rating Tertinggi' }
  ];

  const catalogItems = [
    {
      id: 1,
      title: 'Paket Wisata Bali 3D2N',
      description: 'Paket wisata lengkap ke Bali dengan hotel bintang 4, transportasi AC, dan tour guide profesional.',
      price: 'Rp 1.500.000',
      originalPrice: 'Rp 1.800.000',
      image: 'https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.8,
      reviewCount: 245,
      category: 'paket',
      location: 'Bali',
      duration: '3 Hari 2 Malam',
      features: ['Hotel Bintang 4', 'Transportasi AC', 'Tour Guide', 'Makan 6x'],
      discount: 17,
      isPopular: true,
      isNew: false
    },
    {
      id: 2,
      title: 'Rental Mobil Jakarta',
      description: 'Rental mobil dengan berbagai pilihan kelas dari ekonomi hingga premium dengan driver berpengalaman.',
      price: 'Rp 300.000',
      originalPrice: 'Rp 350.000',
      image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.7,
      reviewCount: 189,
      category: 'rental',
      location: 'Jakarta',
      duration: 'Per Hari',
      features: ['Driver Profesional', 'BBM Termasuk', 'Asuransi', 'GPS'],
      discount: 14,
      isPopular: true,
      isNew: false
    },
    {
      id: 3,
      title: 'Travel Jogja - Jakarta',
      description: 'Layanan travel antar kota dengan armada nyaman dan jadwal fleksibel.',
      price: 'Rp 150.000',
      originalPrice: 'Rp 175.000',
      image: 'https://images.pexels.com/photos/1139541/pexels-photo-1139541.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.9,
      reviewCount: 312,
      category: 'travel',
      location: 'Yogyakarta',
      duration: '8 Jam',
      features: ['AC', 'WiFi', 'Snack', 'Asuransi'],
      discount: 14,
      isPopular: false,
      isNew: true
    },
    {
      id: 4,
      title: 'Paket Wisata Raja Ampat',
      description: 'Petualangan diving dan snorkeling di surga bawah laut Raja Ampat dengan akomodasi terbaik.',
      price: 'Rp 3.500.000',
      originalPrice: 'Rp 4.200.000',
      image: 'https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.9,
      reviewCount: 156,
      category: 'paket',
      location: 'Papua',
      duration: '5 Hari 4 Malam',
      features: ['Liveaboard', 'Diving Gear', 'Meals', 'Guide'],
      discount: 17,
      isPopular: false,
      isNew: false
    }
  ];

  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || item.location.toLowerCase() === selectedLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Sorting logic
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price.replace(/[^\d]/g, '')) - parseFloat(b.price.replace(/[^\d]/g, ''));
      case 'price-high':
        return parseFloat(b.price.replace(/[^\d]/g, '')) - parseFloat(a.price.replace(/[^\d]/g, ''));
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLocation, sortBy]);

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
            <h1 className="text-4xl font-bold mb-4">Katalog Layanan</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Temukan berbagai pilihan layanan perjalanan terbaik dengan harga kompetitif 
              dan kualitas terjamin
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6">
          <FilterSection
            searchTerm={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            categories={categories}
            locations={locations}
            sortOptions={sortOptions}
          />
          
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Menampilkan {paginatedItems.length} dari {sortedItems.length} layanan
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">

        {/* Catalog Items */}
        <div className={viewMode === 'grid' 
          ? "grid md:grid-cols-2 lg:grid-cols-4 gap-6" 
          : "space-y-6"
        }>
          {paginatedItems.map((item) => (
            <CatalogCard key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>

        {sortedItems.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Tidak ada layanan ditemukan
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Coba ubah filter pencarian Anda untuk menemukan layanan yang sesuai
            </p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-8"
        />
      </div>

      {/* Inquiry Section */}
      <InquirySection />
    </div>
  );
};
