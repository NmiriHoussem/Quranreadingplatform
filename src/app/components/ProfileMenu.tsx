import { Link } from 'react-router-dom';
import { User, Settings, HelpCircle, LogOut, LogIn, CheckCircle2, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { getTranslations, getStoredLanguage } from '../utils/translations';

interface ProfileMenuProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
}

export default function ProfileMenu({ isAuthenticated, onSignOut }: ProfileMenuProps) {
  const language = getStoredLanguage();
  const t = getTranslations(language);
  const [userName, setUserName] = useState<string | null>(null);
  
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const authUser = localStorage.getItem('auth_user');
        if (authUser) {
          const user = JSON.parse(authUser);
          setUserName(user.name || null);
        }
      } catch (error) {
        console.error('Error reading user from localStorage:', error);
      }
    } else {
      setUserName(null);
    }
  }, [isAuthenticated]);
  
  // Get first letter of name for avatar
  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : 'U';
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative rounded-full border-2 h-11 w-11 md:h-10 md:w-10 ${
            isAuthenticated 
              ? 'border-emerald-500 dark:border-emerald-400 hover:border-emerald-600 dark:hover:border-emerald-300 bg-emerald-100 dark:bg-emerald-900' 
              : 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500'
          }`}
        >
          {isAuthenticated ? (
            <>
              {/* Avatar with first letter */}
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                {avatarLetter}
              </span>
              {/* Green checkmark badge */}
              <span className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </span>
            </>
          ) : (
            <User className="w-6 h-6 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 md:w-56">
        <DropdownMenuLabel className="text-base md:text-sm py-3 md:py-2">
          {isAuthenticated ? (
            <div>
              <div className="flex items-center gap-2">
                <span>{userName || 'My Account'}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-normal mt-0.5">
                Connected
              </p>
            </div>
          ) : (
            'Guest Mode'
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {!isAuthenticated && (
          <Link to="/auth">
            <DropdownMenuItem className="py-3 md:py-2 text-base md:text-sm">
              <LogIn className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2" />
              Sign In / Sign Up
            </DropdownMenuItem>
          </Link>
        )}
        
        <Link to="/settings">
          <DropdownMenuItem className="py-3 md:py-2 text-base md:text-sm">
            <Settings className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2" />
            {t.settings}
          </DropdownMenuItem>
        </Link>
        
        <Link to="/help">
          <DropdownMenuItem className="py-3 md:py-2 text-base md:text-sm">
            <HelpCircle className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2" />
            Help & About
          </DropdownMenuItem>
        </Link>
        
        <Link to="/">
          <DropdownMenuItem className="py-3 md:py-2 text-base md:text-sm">
            <Globe className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2" />
            {t.officialWebsite}
          </DropdownMenuItem>
        </Link>
        
        {isAuthenticated && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-red-600 dark:text-red-400 py-3 md:py-2 text-base md:text-sm">
              <LogOut className="w-5 h-5 md:w-4 md:h-4 mr-3 md:mr-2" />
              Sign Out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}