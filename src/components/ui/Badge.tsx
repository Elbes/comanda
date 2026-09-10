interface BadgeProps {
  children: React.ReactNode;
  color?: string;
}

export function Badge({ children, color = 'bg-stone-100 text-stone-700' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${color}`}
    >
      {children}
    </span>
  );
}
