interface Props {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md';
}

const sizes = {
  sm: 'h-12 w-12',
  md: 'h-24 w-24',
};

export function MenuItemPhoto({ src, alt, size = 'md' }: Props) {
  const className = `${sizes[size]} shrink-0 rounded-xl bg-gray-100 object-cover`;

  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-xl bg-amber-50 text-lg font-semibold text-amber-800`}
      aria-hidden
    >
      {alt.trim().charAt(0).toUpperCase() || '•'}
    </div>
  );
}
