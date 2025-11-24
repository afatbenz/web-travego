import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, MapPin, Car, Info, Shield, Star } from 'lucide-react';

export default function CatalogDetail() {
  const { id } = useParams();
  const [selectedDate, setSelectedDate] = useState('');

  // This would normally come from an API/database
  const vehicle = {
    id: parseInt(id || '1'),
    name: "Mercedes-Benz Sprinter",
    type: "Van",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2070",
    price: 150,
    location: "New York City",
    capacity: 12,
    description: "Experience luxury and comfort with our Mercedes-Benz Sprinter. Perfect for group travel, corporate events, or special occasions. This vehicle comes with premium leather seats, climate control, and entertainment system.",
    features: [
      "Leather Seats",
      "Climate Control",
      "Entertainment System",
      "WiFi",
      "USB Charging",
      "Luggage Space"
    ],
    rating: 4.8,
    reviews: 156
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Images */}
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden">
            <img
              src={vehicle.image}
              alt={vehicle.name}
              className="w-full h-[400px] object-cover"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <img src={vehicle.image} alt="" className="rounded-lg h-24 w-full object-cover" />
            <img src={vehicle.image} alt="" className="rounded-lg h-24 w-full object-cover" />
            <img src={vehicle.image} alt="" className="rounded-lg h-24 w-full object-cover" />
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{vehicle.name}</h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <span>{vehicle.rating}</span>
              </div>
              <span>({vehicle.reviews} reviews)</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center">
              <Car className="h-5 w-5 mr-2 text-primary" />
              <span>{vehicle.type}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              <span>{vehicle.capacity} Passengers</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              <span>{vehicle.location}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-3xl font-bold text-primary mb-2">${vehicle.price}</div>
            <div className="text-gray-600">per day</div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-600">{vehicle.description}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Features</h2>
            <div className="grid grid-cols-2 gap-4">
              {vehicle.features.map((feature, index) => (
                <div key={index} className="flex items-center text-gray-600">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                id="date"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <button className="w-full bg-secondary hover:bg-secondary-dark text-white py-3 px-6 rounded-md font-semibold transition-colors">
              Book Now
            </button>
          </div>

          <div className="flex items-center space-x-2 text-gray-600">
            <Info className="h-5 w-5" />
            <span className="text-sm">Free cancellation up to 24 hours before pickup</span>
          </div>
        </div>
      </div>
    </div>
  );
}