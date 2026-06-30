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
      className="!w-auto !h-auto p-2 border-none text-gray-700 bg-transparent hover:bg-transparent"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5 text-white md:text-blue-900 hover:text-white/80 md:hover:text-blue-700/70 transition-all
        " /> 
      )}
    </Button>
  );
};
