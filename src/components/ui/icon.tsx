import type { SVGProps } from "react";

/**
 * Set interno de ícones (stroke 1.8, viewBox 24) — inclui os ícones do
 * catálogo de opcionais (Amenity.icon) e os de interface.
 */
const PATHS: Record<string, React.ReactNode> = {
  // ─── opcionais ───
  snowflake: (
    <>
      <path d="M12 2v20M4 6l16 12M4 18L20 6" />
      <path d="M12 2l-2 3h4l-2-3zM12 22l-2-3h4l-2 3z" strokeWidth="1.2" />
    </>
  ),
  droplet: <path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11z" />,
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </>
  ),
  wifi: (
    <>
      <path d="M2.5 9a15 15 0 0 1 19 0M5.5 12.5a10.5 10.5 0 0 1 13 0M8.5 16a6 6 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  coffee: (
    <>
      <path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M7.5 5.5c0-1 .8-1 .8-2M11.5 5.5c0-1 .8-1 .8-2" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z" />,
  chat: (
    <>
      <path d="M21 12a8 8 0 0 1-8 8H4l2.2-3.2A8 8 0 1 1 21 12z" />
      <path d="M8.5 10.5h7M8.5 13.5h4.5" strokeWidth="1.4" />
    </>
  ),
  paw: (
    <>
      <ellipse cx="7" cy="9" rx="1.8" ry="2.3" />
      <ellipse cx="12" cy="7.5" rx="1.8" ry="2.3" />
      <ellipse cx="17" cy="9" rx="1.8" ry="2.3" />
      <path d="M12 12.5c3 0 5.5 2.2 5.5 4.6 0 1.4-1.1 2.4-2.5 2.4-1.2 0-2-.6-3-.6s-1.8.6-3 .6c-1.4 0-2.5-1-2.5-2.4 0-2.4 2.5-4.6 5.5-4.6z" />
    </>
  ),
  nosmoke: (
    <>
      <path d="M3 15h11v3H3zM17 15h2v3h-2M19.5 12c0-2-2-2.2-2-4M4 4l16 16" />
    </>
  ),
  luggage: (
    <>
      <rect x="5" y="8" width="14" height="12" rx="2" />
      <path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M9 12v4M15 12v4" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0V8zM12 16.5V21" />
    </>
  ),
  child: (
    <>
      <circle cx="12" cy="6" r="2.6" />
      <path d="M6.5 12.5C8 10.8 10 10 12 10s4 .8 5.5 2.5M9.5 21l1-5.5h3l1 5.5" />
    </>
  ),
  // ─── interface ───
  star: (
    <path d="M12 2.8l2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.2l-5.5 3 1-6.3L3 9.5l6.2-.9L12 2.8z" />
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c.5-3.5 2.7-5.5 5.5-5.5S14 16.5 14.5 20M15.5 5.2a3.2 3.2 0 0 1 0 5.6M17 14.7c2 .6 3.2 2.4 3.5 5.3" />
    </>
  ),
  car: (
    <>
      <path d="M4 12l1.5-4.5A2 2 0 0 1 7.4 6h9.2a2 2 0 0 1 1.9 1.5L20 12M4 12h16v5.5h-2M4 12v5.5h2M6 17.5h12" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5l7.5 3v6c0 5-3.2 8.4-7.5 10-4.3-1.6-7.5-5-7.5-10v-6l7.5-3z" />
      <path d="M8.8 12l2.2 2.2 4.2-4.4" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  "arrow-right": <path d="M4 12h16m0 0l-6-6m6 6l-6 6" />,
  heart: (
    <path d="M12 20.5S3.5 15 3.5 9.2a4.7 4.7 0 0 1 8.5-2.8A4.7 4.7 0 0 1 20.5 9.2C20.5 15 12 20.5 12 20.5z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  "chevron-down": <path d="M6 9.5l6 6 6-6" />,
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17.5" cy="5.5" r="2.5" />
      <circle cx="17.5" cy="18.5" r="2.5" />
      <path d="M8.2 10.8l7-4M8.2 13.2l7 4" />
    </>
  ),
  phone: (
    <path d="M6.8 3.5h2.7L11 8l-2 1.5a12.5 12.5 0 0 0 5.5 5.5L16 13l4.5 1.5v2.7a2.3 2.3 0 0 1-2.5 2.3C10.5 18.8 5.2 13.5 4.5 6a2.3 2.3 0 0 1 2.3-2.5z" />
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2.5" />
      <path d="M3 10h18M16.5 15h.01" strokeWidth="2.2" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5" strokeDasharray="3 3" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3L2.5 20h19L12 3z" />
      <path d="M12 10v4M12 17.2v.01" strokeWidth="2.2" />
    </>
  ),
  message: (
    <>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.2 0-2.4-.2-3.4-.7L4 20l.8-4A8.5 8.5 0 1 1 21 11.5z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" />
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  className,
  ...rest
}: { name: string; size?: number } & SVGProps<SVGSVGElement>) {
  const paths = PATHS[name] ?? PATHS["sparkle"];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {paths}
    </svg>
  );
}
