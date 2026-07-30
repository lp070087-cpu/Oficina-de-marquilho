'use client';

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

export default function NotificationBadge({ count, onClick, className = '' }: NotificationBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 leading-none cursor-pointer ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
