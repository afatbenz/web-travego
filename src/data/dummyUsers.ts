// Dummy users data
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  phone?: string;
  address?: string;
  joinDate: string;
  avatar?: string;
}

export const dummyUsers: User[] = [
  {
    id: 1,
    email: 'admin@TraveGO.com',
    password: 'admin123',
    name: 'Admin TraveGO',
    role: 'admin',
    phone: '+62 812-3456-7890',
    address: 'Jl. Sudirman No. 123, Jakarta Pusat',
    joinDate: '2023-01-01',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 2,
    email: 'user@TraveGO.com',
    password: 'user123',
    name: 'Ahmad Rizki',
    role: 'user',
    phone: '+62 812-3456-7890',
    address: 'Jl. Sudirman No. 123, RT 05/RW 02, Kelurahan Menteng, Kecamatan Menteng, Jakarta Pusat 10310',
    joinDate: '2023-06-15',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 3,
    email: 'john.doe@email.com',
    password: 'john123',
    name: 'John Doe',
    role: 'user',
    phone: '+62 812-9876-5432',
    address: 'Jl. Thamrin No. 456, Jakarta Selatan',
    joinDate: '2023-08-20',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 4,
    email: 'sarah.wilson@email.com',
    password: 'sarah123',
    name: 'Sarah Wilson',
    role: 'user',
    phone: '+62 812-1111-2222',
    address: 'Jl. Gatot Subroto No. 789, Jakarta Barat',
    joinDate: '2023-09-10',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  }
];

// Function to authenticate user
export const authenticateUser = (email: string, password: string): User | null => {
  const user = dummyUsers.find(u => u.email === email && u.password === password);
  return user || null;
};

// Function to get user by ID
export const getUserById = (id: number): User | null => {
  const user = dummyUsers.find(u => u.id === id);
  return user || null;
};
