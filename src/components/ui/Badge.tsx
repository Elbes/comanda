interface BadgeProps {
  children: React.ReactNode;
  color?: string;
}

export function Badge({ children, color = 'bg-gray-100 text-gray-700' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}
