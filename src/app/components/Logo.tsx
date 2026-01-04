import { useState, useEffect } from 'react';
import { getCachedLogo } from '../utils/logoStorage';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 32 }: LogoProps) {
  const [logoSrc, setLogoSrc] = useState<string>(getCachedLogo());

  useEffect(() => {
    // Update logo if it changes
    setLogoSrc(getCachedLogo());
    
    // Listen for logo updates
    const handleLogoUpdate = () => {
      setLogoSrc(getCachedLogo());
    };
    
    window.addEventListener('logoUpdated', handleLogoUpdate);
    
    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate);
    };
  }, []);

  return (
    <img
      src={logoSrc}
      alt="Quran Circle Logo"
      className={className}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}