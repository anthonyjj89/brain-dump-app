import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showVersion?: boolean;
}

export default function Logo({ 
  className = '', 
  size = 'medium',
  showVersion = true 
}: LogoProps) {
  // Size mapping - can be adjusted as needed
  const sizeMap = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-32 h-32'
  };

  return (
    <div className={`relative flex justify-center items-center ${className}`}>
      <div className={`relative ${sizeMap[size]}`}>
        <Image
          src="/images/logo.png"
          alt="Brain Dump App Logo"
          fill
          style={{ objectFit: 'contain' }}
          priority
          className="rounded-lg"
        />
      </div>
      {showVersion && (
        <div className="absolute right-0 top-0 p-1">
          <span className="text-xs text-muted-foreground">v0.1.3</span>
        </div>
      )}
    </div>
  );
}
