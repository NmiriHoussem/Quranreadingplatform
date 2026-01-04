import logoImage from "figma:asset/f0974d5cf68fa4ddb25435b034b5b8923c40306d.png";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-8 h-8" }: LogoProps) {
  return (
    <img 
      src={logoImage} 
      alt="Quran Circle Logo" 
      className={className}
    />
  );
}
