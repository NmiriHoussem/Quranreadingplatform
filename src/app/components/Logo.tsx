interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-8 h-8" }: LogoProps) {
  return (
    <img 
      src="/qurancirclelogo.png" 
      alt="Quran Circle Logo" 
      className={className}
    />
  );
}