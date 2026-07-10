import { BrandLink } from "@/components/ui/brand";
import { RoadDivider } from "@/components/ui/road-divider";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-6 text-center">
          <BrandLink dark size="text-3xl" />
        </div>
        <div className="rounded-3xl bg-sand-card p-7 shadow-card-hover sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{subtitle}</p>
          <RoadDivider subtle className="my-5" />
          {children}
        </div>
      </div>
    </div>
  );
}
