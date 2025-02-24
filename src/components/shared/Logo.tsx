import Image from 'next/image';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="relative w-48 h-24">
        <Image
          src="/images/logo.jpg"
          alt="Brain Dump App Logo"
          fill
          style={{ objectFit: 'contain' }}
          priority
          className="rounded-lg"
        />
      </div>
      <div className="absolute right-0 top-0 p-2">
        <span className="text-sm text-gray-500">v0.1.3</span>
      </div>
    </div>
  );
}
