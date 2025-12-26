import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Layout, Image, ShoppingBag, Tag, Wrench, Users, Phone, CheckCircle, Share2, CreditCard } from 'lucide-react';

const ContentMenu = () => {
  const navigate = useNavigate();

  const menuItems = [
    { 
      title: 'General Config', 
      path: '/dashboard/partner/content/general',
      icon: <Settings className="h-8 w-8 mb-2 text-blue-600" />,
      description: 'Configure general settings for your content'
    },
    { 
      title: 'Landing Page', 
      path: '/dashboard/partner/content/landing-page',
      icon: <Layout className="h-8 w-8 mb-2 text-green-600" />,
      description: 'Manage content for your landing page'
    },
    { 
      title: 'Image Slider', 
      path: '/dashboard/partner/content/image-slider',
      icon: <Image className="h-8 w-8 mb-2 text-purple-600" />,
      description: 'Manage image sliders and banners'
    },
    { 
      title: 'Catalogue & Product', 
      path: '/dashboard/partner/content/catalogue',
      icon: <ShoppingBag className="h-8 w-8 mb-2 text-orange-600" />,
      description: 'Manage your product catalogue'
    },
    { 
      title: 'Promo and Hot Offers', 
      path: '/dashboard/partner/content/hot-offers',
      icon: <Tag className="h-8 w-8 mb-2 text-red-600" />,
      description: 'Manage promotions and hot offers'
    },
    { 
      title: 'Services', 
      path: '/dashboard/partner/content/services',
      icon: <Wrench className="h-8 w-8 mb-2 text-indigo-600" />,
      description: 'Manage service descriptions'
    },
    { 
      title: 'Team', 
      path: '/dashboard/partner/content/team',
      icon: <Users className="h-8 w-8 mb-2 text-teal-600" />,
      description: 'Manage team member profiles'
    },
    { 
      title: 'Contact', 
      path: '/dashboard/partner/content/contact',
      icon: <Phone className="h-8 w-8 mb-2 text-yellow-600" />,
      description: 'Manage contact information'
    },
    { 
      title: 'Why Choose Us', 
      path: '/dashboard/partner/content/why-choose-us',
      icon: <CheckCircle className="h-8 w-8 mb-2 text-cyan-600" />,
      description: 'Manage why choose us section'
    },
    { 
      title: 'Social Media', 
      path: '/dashboard/partner/content/social-media',
      icon: <Share2 className="h-8 w-8 mb-2 text-pink-600" />,
      description: 'Manage social media links'
    },
    { 
      title: 'Bank Account', 
      path: '/dashboard/partner/content/bank-account',
      icon: <CreditCard className="h-8 w-8 mb-2 text-slate-600" />,
      description: 'Manage bank account details'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
        <p className="text-gray-600 dark:text-gray-300">Select a section to manage content.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, index) => (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500"
            onClick={() => navigate(item.path)}
          >
            <CardHeader className="pb-2">
              <div className="flex flex-col items-center text-center">
                {item.icon}
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-gray-500">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContentMenu;
