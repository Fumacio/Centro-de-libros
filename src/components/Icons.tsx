/** Íconos de línea del panel lateral (24×24, heredan el color del texto). */
const paths = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  explore: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm3.5-12.5-2 5-5 2 2-5z",
  grid: "M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z",
  book: "M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0zM12 5.5V19",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v4.5l3 2",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.5 7.5 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.4 7.4 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
  shuffle: "M4 7h3.5c2 0 3.2 1 4.5 3l1 1.5c1.3 2 2.5 3 4.5 3H20m0 0-2.5-2.5M20 14.5 17.5 17M4 17h3.5c1.2 0 2.1-.4 2.9-1.1M20 7h-2.5c-1.2 0-2.1.4-2.9 1.1M20 7l-2.5-2.5M20 7l-2.5 2.5",
  login: "M10 17l5-5-5-5m5 5H3m12-9h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4",
  chevron: "m6 9 6 6 6-6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
};

export type IconName = keyof typeof paths;

export const isIconName = (name: string): name is IconName => name in paths;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}
