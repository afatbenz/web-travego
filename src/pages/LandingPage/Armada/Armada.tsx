import { useState, useEffect } from 'react';
import { InquirySection } from '@/components/common/InquirySection';
import { ArmadaCard } from '@/components/cards/ArmadaCard';
import { FilterSection } from '@/components/common/FilterSection';
import { Pagination } from '@/components/common/Pagination';

const Armada = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const armadaData = [
    {
      id: 1,
      name: 'Innova Reborn',
      type: 'MPV',
      capacity: '7-8 Penumpang',
      price: 'Rp 500.000/hari',
      originalPrice: 'Rp 600.000/hari',
      image: 'https://otomax.store/cdn/shop/articles/Inova-reborn-otomax_7fd04eb7-de3d-4a8c-9238-5516acc5cb6c.jpg?v=1739441814',
      rating: 4.8,
      reviews: 156,
      features: ['AC', 'Audio System', 'Safety Features', 'Comfortable Seats'],
      location: 'Jakarta',
      transmission: 'Manual',
      fuel: 'Bensin',
      year: '2023',
      badge: 'Popular',
      discount: '-17%'
    },
    {
      id: 2,
      name: 'Hiace Premio',
      type: 'Minibus',
      capacity: '12-15 Penumpang',
      price: 'Rp 800.000/hari',
      originalPrice: 'Rp 950.000/hari',
      image: 'https://www.balialphardrental.com/wp-content/uploads/2024/11/Hiace-premio.jpg',
      rating: 4.9,
      reviews: 89,
      features: ['AC', 'Audio System', 'Comfortable Seats', 'Large Space'],
      location: 'Jakarta',
      transmission: 'Manual',
      fuel: 'Bensin',
      year: '2024',
      badge: 'New',
      discount: '-16%'
    },
    {
      id: 3,
      name: 'Hiace Commuter',
      type: 'Minibus',
      capacity: '12-15 Penumpang',
      price: 'Rp 750.000/hari',
      originalPrice: 'Rp 900.000/hari',
      image: 'https://www.balialphardrental.com/wp-content/uploads/2024/11/Hiace-premio.jpg',
      rating: 4.7,
      reviews: 124,
      features: ['AC', 'Audio System', 'Comfortable Seats', 'Large Space'],
      location: 'Jakarta',
      transmission: 'Manual',
      fuel: 'Bensin',
      year: '2023',
      badge: 'Popular',
      discount: '-17%'
    },
    {
      id: 4,
      name: 'Toyota Alphard',
      type: 'Luxury MPV',
      capacity: '7 Penumpang',
      price: 'Rp 1.200.000/hari',
      originalPrice: 'Rp 1.400.000/hari',
      image: 'https://sewamobilpalingmurah.com/wp-content/uploads/2024/07/Biaya-Pajak-Mobil-Toyota-Alphard-Berdasarkan-Tahun-dan-Tipe.jpg',
      rating: 4.9,
      reviews: 67,
      features: ['Premium AC', 'Audio System', 'Leather Seats', 'Luxury Interior'],
      location: 'Jakarta',
      transmission: 'Automatic',
      fuel: 'Bensin',
      year: '2024',
      badge: 'Luxury',
      discount: '-14%'
    },
    {
      id: 5,
      name: 'Isuzu Elf',
      type: 'Truck',
      capacity: '2-3 Penumpang',
      price: 'Rp 400.000/hari',
      originalPrice: 'Rp 500.000/hari',
      image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.6,
      reviews: 98,
      features: ['AC', 'Large Cargo', 'Durable', 'Economical'],
      location: 'Jakarta',
      transmission: 'Manual',
      fuel: 'Diesel',
      year: '2023',
      badge: 'Economical',
      discount: '-20%'
    },
    {
      id: 6,
      name: 'Coaster Minibus',
      type: 'Minibus',
      capacity: '20-25 Penumpang',
      price: 'Rp 1.000.000/hari',
      originalPrice: 'Rp 1.200.000/hari',
      image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.8,
      reviews: 45,
      features: ['AC', 'Audio System', 'Large Capacity', 'Comfortable Seats'],
      location: 'Jakarta',
      transmission: 'Manual',
      fuel: 'Diesel',
      year: '2023',
      badge: 'Large Capacity',
      discount: '-17%'
    }
  ];

  const categories = [
    { value: 'all', label: 'Semua Tipe' },
    { value: 'mpv', label: 'MPV' },
    { value: 'minibus', label: 'Minibus' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'truck', label: 'Truck' }
  ];

  const locations = [
    { value: 'all', label: 'Semua Lokasi' },
    { value: 'jakarta', label: 'Jakarta' },
    { value: 'bandung', label: 'Bandung' },
    { value: 'surabaya', label: 'Surabaya' },
    { value: 'yogyakarta', label: 'Yogyakarta' }
  ];

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price-low', label: 'Harga Terendah' },
    { value: 'price-high', label: 'Harga Tertinggi' },
    { value: 'rating', label: 'Rating Tertinggi' }
  ];

  const filteredArmada = armadaData.filter(armada => {
    const matchesSearch = armada.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         armada.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || armada.type.toLowerCase().includes(selectedCategory);
    const matchesLocation = selectedLocation === 'all' || armada.location.toLowerCase().includes(selectedLocation);
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Sorting logic
  const sortedArmada = [...filteredArmada].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedArmada.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedArmada = sortedArmada.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedLocation, sortBy]);

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
            <h1 className="text-4xl font-bold mb-4">Armada Kami</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Pilih armada terbaik untuk perjalanan Anda dengan kenyamanan dan keamanan terjamin
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6">
          <FilterSection
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
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
              Menampilkan {paginatedArmada.length} dari {sortedArmada.length} armada
            </p>
          </div>
        </div>
      </div>

      {/* Armada Grid */}
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-6" 
          : "space-y-6"
        }>
          {paginatedArmada.map((armada) => (
            <ArmadaCard key={armada.id} armada={armada} viewMode={viewMode} />
          ))}
        </div>

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

export default Armada;
