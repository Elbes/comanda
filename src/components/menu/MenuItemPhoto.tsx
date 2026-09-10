interface Props {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-12 w-12',
  md: 'h-24 w-24',
  lg: 'h-28 w-28',
};

export function MenuItemPhoto({ src, alt, size = 'md' }: Props) {
  const className = `${sizes[size]} shrink-0 rounded-2xl bg-stone-100 object-cover shadow-sm shadow-stone-900/5`;

  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 text-xl font-bold text-amber-800 shadow-sm shadow-stone-900/5`}
      aria-hidden
    >
      {alt.trim().charAt(0).toUpperCase() || '•'}
    </div>
  );
}
