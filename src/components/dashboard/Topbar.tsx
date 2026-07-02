import React, { useEffect, useState } from 'react';
import { Bell, Building2, CreditCard, LogOut, Search, Settings, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import defaultAvatar from '@/assets/general/avatar.svg';
import { useNotifications } from '@/contexts/NotificationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffectiveOrganization } from '@/hooks/useEffectiveOrganization';
import { clearAuthStorage } from '@/lib/utils';

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID');
};

export const Topbar: React.FC = () => {
  const [user, setUser] = useState<{ name?: string; email?: string; avatar?: string } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const { hasEffectiveOrganization, isAdmin } = useEffectiveOrganization();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const basePrefix = '/dashboard';

  useEffect(() => {
    const uStr = localStorage.getItem('user');
    if (uStr) {
      try {
        setUser(JSON.parse(uStr));
      } catch {
        return;
      }
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payloadStr = token.split('.')[1];
          const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
          const json = JSON.parse(atob(padded));
          const name = json.name ?? json.username ?? json.fullname ?? '';
          const email = json.email ?? '';
          const data = { name, email };
          localStorage.setItem('user', JSON.stringify(data));
          setUser(data);
        } catch {
          return;
        }
      }
    }
  }, []);

  type NotificationItem = {
    notification_id: string;
    reference_url: string;
    is_read: boolean;
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }
    navigate(notification.reference_url);
  };

  return (
    <>
      {/* Background blur */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out ${notificationsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setNotificationsOpen(false)}
      />
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 relative z-50">
        <div className="flex items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-0"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {/* Notifications */}
            <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                <DropdownMenuLabel className="flex justify-between items-center">
                  Notifications
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-blue-600 hover:text-blue-700 h-auto p-0"
                      onClick={async () => {
                        await markAllAsRead();
                      }}
                    >
                      Tandai semua dibaca
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Tidak ada notifikasi
                  </div>
                ) : (
                  <>
                    {notifications.slice(0, 5).map(notification => (
                      <DropdownMenuItem
                        key={notification.notification_id}
                        className="flex flex-col items-start p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="w-full flex justify-between items-start">
                          <span className={`font-medium ${!notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notification.title}
                          </span>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 ml-2 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <span className="text-xs text-gray-400 mt-2">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="w-full justify-center text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
                      onClick={() => navigate(`${basePrefix}/notifications`)}
                    >
                      Lihat Semua Notifikasi
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar || defaultAvatar} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'email@domain.com'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => navigate(`${basePrefix}/profile`)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => navigate(`${basePrefix}/accounts/subscription`)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Langganan
                  </DropdownMenuItem>
                ) : null}
                {hasEffectiveOrganization || isAdmin ? (
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => navigate(`${basePrefix}/organization/detail`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  
                ) : (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => navigate(`${basePrefix}/organization/register`)}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Buat Organisasi
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => navigate(`${basePrefix}/organization/join`)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Gabung Organisasi
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
<DropdownMenuItem
                  className="text-red-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    clearAuthStorage();
                    navigate('/auth/login');
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
};
