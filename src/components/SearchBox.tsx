import { Search, MapPin, Car } from 'lucide-react';
import { useState } from 'react';

export default function SearchBox() {
  const [location, setLocation] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto -mt-16 relative z-10">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Location"
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="relative">
          <Car className="absolute left-3 top-3 text-gray-400" />
          <select
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
          >
            <option value="">Vehicle Type</option>
            <option value="car">Car</option>
            <option value="bus">Bus</option>
            <option value="van">Van</option>
          </select>
        </div>
        <button className="bg-secondary hover:bg-secondary-dark text-white py-2 px-6 rounded-md flex items-center justify-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Search Vehicles</span>
        </button>
      </div>
    </div>
  );
}