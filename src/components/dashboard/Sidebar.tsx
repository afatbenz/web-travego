import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  DollarSign,
  FileText,
  MapPin,
  LogOut,
  ShoppingBag,
  Clock,
  CheckCircle,
  Package,
  Car,
  Image,
  Type,
  Share2,
  CreditCard,
  Settings,
  User,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [orgName, setOrgName] = useState('');
  React.useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    let nameFromJwt = '';
    try {
      const payloadStr = token.split('.')[1];
      if (payloadStr) {
        const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const json = JSON.parse(atob(padded));
        nameFromJwt = String(
          json.organization_name ?? json.org_name ?? json.organizationName ?? json.orgName ?? ''
        );
      }
    } catch {}
    const name = nameFromJwt || (localStorage.getItem('organization_name') ?? '');
    setOrgName(name);
  }, []);

  const token = localStorage.getItem('token') ?? '';
  let isAdmin = false;
  try {
    const payloadStr = token.split('.')[1];
    if (payloadStr) {
      const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const json = JSON.parse(atob(padded));
      isAdmin = Boolean(json.is_admin ?? json.isAdmin ?? false);
    }
  } catch {}
  const basePrefix = isAdmin ? '/dashboard' : '/dashboard/partner';

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      href: basePrefix,
      active: location.pathname === basePrefix
    },
    {
      title: 'Orders',
      icon: ShoppingBag,
      children: [
        { title: 'Semua Order', icon: ShoppingBag, href: `${basePrefix}/orders/all-table` },
        { title: 'Order Berlangsung', icon: Clock, href: `${basePrefix}/orders/ongoing-table` },
        { title: 'Order Sukses', icon: CheckCircle, href: `${basePrefix}/orders/success` }
      ]
    },
    {
      title: 'Services',
      icon: Package,
      children: [
        { title: 'Paket Wisata', icon: Package, href: `${basePrefix}/services/packages` },
        { title: 'Armada', icon: Car, href: `${basePrefix}/services/fleet` }
      ]
    },
    {
      title: 'Finance',
      icon: DollarSign,
      children: [
        { title: 'Expenses', icon: DollarSign, href: `${basePrefix}/expenses` },
        { title: 'Report', icon: FileText, href: `${basePrefix}/reports` }
      ]
    },
    {
      title: 'Content Management',
      icon: FileText,
      children: [
        { title: 'Image and Layout', icon: Image, href: `${basePrefix}/content/image-layout` },
        { title: 'Content', icon: Type, href: `${basePrefix}/content/content` },
        { title: 'Social Media', icon: Share2, href: `${basePrefix}/content/social-media` },
        { title: 'Bank Account', icon: CreditCard, href: `${basePrefix}/content/bank-account` }
      ]
    },
    {
      title: 'Organization',
      icon: FileText,
      children: [
        { title: 'Setting', icon: Settings, href: `${basePrefix}/organization/settings` },
        { title: 'Users', icon: User, href: `${basePrefix}/organization/users` },
        { title: 'Open API', icon: Code, href: `${basePrefix}/organization/open-api` }
      ]
    }
  ];

  const bottomMenuItems = [
    { title: 'Logout', icon: LogOut, href: '/auth/login' }
  ];

  const isActive = (href: string) => location.pathname === href;

  const orgTitle = orgName || 'Organization';
  const orgTitleDisplay = orgTitle.length > 15 ? orgTitle.slice(0, 12) + '...' : orgTitle;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-10",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{orgTitleDisplay}</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  by <span className="text-cyan-500">Trave</span><span className="text-orange-500">GO</span>
                </span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {collapsed ? (
              <ChevronRight className="h-6 w-6" />
            ) : (
              <ChevronLeft className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Menu Items - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 pb-20 sidebar-scroll">
        {menuItems.map((item, index) => (
          <div key={index}>
            {item.href ? (
              // Single menu item
              <Link
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-2 rounded-lg transition-all duration-200",
                  collapsed ? "py-3" : "py-1.5",
                  isActive(item.href)
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <item.icon className={cn(collapsed ? 'h-9 w-9' : 'h-5 w-5')} />
                {!collapsed && <span className="font-medium">{item.title}</span>}
              </Link>
            ) : (
              // Menu with children
              <div className="space-y-0.5">
                <div className={cn(
                  "flex items-center space-x-3 px-2 rounded-lg cursor-pointer",
                  collapsed ? "py-3" : "py-1.5",
                  "text-gray-700 dark:text-gray-300"
                )}>
                  <item.icon className={cn(collapsed ? 'h-9 w-9' : 'h-5 w-5')} />
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </div>
                {!collapsed && item.children && (
                  <div className="ml-8 space-y-0.5">
                    {item.children.map((child, childIndex) => (
                      <Link
                        key={childIndex}
                        to={child.href}
                        className={cn(
                          "flex items-center space-x-3 px-2 py-1.5 rounded-lg transition-all duration-200 text-sm",
                          isActive(child.href)
                            ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        <span>{child.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Logout Button - Absolute positioned at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {bottomMenuItems.map((item, index) => (
          <Link
            key={index}
            to={item.href}
            className={cn(
              "flex items-center space-x-3 px-2 py-1.5 rounded-lg transition-all duration-200",
              "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            )}
          >
            <item.icon className={cn(collapsed ? 'h-9 w-9' : 'h-5 w-5')} />
            {!collapsed && <span className="font-medium">{item.title}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
};
