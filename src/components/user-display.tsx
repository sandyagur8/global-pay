'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useENSProfile } from '@/hooks/useENS';

interface UserDisplayProps {
  address: string;
  showAvatar?: boolean;
  showFullAddress?: boolean;
  className?: string;
}

export function UserDisplay({ 
  address, 
  showAvatar = false, 
  showFullAddress = false,
  className = '' 
}: UserDisplayProps) {
  const { displayName, avatar } = useENSProfile(address);

  const formatAddress = (addr: string) => {
    if (showFullAddress) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getDisplayText = () => {
    if (displayName && displayName !== address) {
      return displayName;
    }
    return formatAddress(address);
  };

  if (showAvatar) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatar || undefined} alt={displayName || address} />
          <AvatarFallback>
            {(displayName || address).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">{getDisplayText()}</span>
      </div>
    );
  }

  return (
    <span className={`font-medium ${className}`}>
      {getDisplayText()}
    </span>
  );
}
