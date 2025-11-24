import SearchBox from '../components/SearchBox';
import { Car, Users, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const popularVehicles = [
    {
      id: 1,
      name: "Mercedes-Benz Sprinter",
      type: "Van",
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2070",
      price: 150,
      location: "New York City",
      capacity: 12
    },
    {
      id: 2,
      name: "Toyota Hiace Executive",
      type: "Van",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2070",
      price: 130,
      location: "Los Angeles",
      capacity: 10
    },
    {
      id: 3,
      name: "Volvo Luxury Bus",
      type: "Bus",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2070",
      price: 500,
      location: "Chicago",
      capacity: 45
    },
    {
      id: 4,
      name: "BMW 7 Series",
      type: "Car",
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2070",
      price: 200,
      location: "Miami",
      capacity: 4
    },
    {
      id: 5,
      name: "Mercedes-Benz S-Class",
      type: "Car",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2070",
      price: 250,
      location: "San Francisco",
      capacity: 4
    },
    {
      id: 6,
      name: "Toyota Coaster",
      type: "Bus",
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2070",
      price: 300,
      location: "Boston",
      capacity: 30
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[600px]">
        <img
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=2070"
          alt="Luxury cars and buses"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-4">
            Your Journey, Our Priority
          </h1>
          <p className="text-xl md:text-2xl text-center mb-8">
            Rent the perfect vehicle for your next adventure
          </p>
        </div>
      </div>

      {/* Search Box */}
      <div className="container mx-auto px-4">
        <SearchBox />
      </div>

      {/* Popular Vehicles */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Vehicles</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {popularVehicles.map((vehicle) => (
              <Link 
                to={`/catalog/${vehicle.id}`} 
                key={vehicle.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden transform transition-transform hover:scale-105"
              >
                <div className="relative">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-secondary text-white px-3 py-1 rounded-full">
                    ${vehicle.price}/day
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{vehicle.name}</h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Car className="h-5 w-5 mr-2 text-primary" />
                    <span>{vehicle.type}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    <span>{vehicle.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    <span>{vehicle.capacity} Passengers</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Vehicles</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={`https://images.unsplash.com/photo-${i === 1 ? '1549317661-bd32c8ce0db2' : i === 2 ? '1544620347-c4fd4a3d5957' : '1544620347-c4fd4a3d5957'}?auto=format&fit=crop&q=80&w=2070`}
                  alt={`Featured vehicle ${i}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Luxury Vehicle {i}</h3>
                  <p className="text-gray-600 mb-4">Experience comfort and style with our premium vehicles.</p>
                  <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {['24/7 Support', 'Best Prices', 'Wide Selection', 'Easy Booking'].map((feature, i) => (
              <div key={i} className="text-center">
                <div className="bg-primary-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary text-2xl">✓</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature}</h3>
                <p className="text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Map */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Location</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937595!2d2.292292615509614!3d48.85837007928757!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sEiffel%20Tower!5e0!3m2!1sen!2sus!4v1647891702753!5m2!1sen!2sus"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}