import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="!w-auto !h-auto p-2 border-2 border-gray-100 dark:border-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-500 dark:text-white" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700" />
      )}
    </Button>
  );
};