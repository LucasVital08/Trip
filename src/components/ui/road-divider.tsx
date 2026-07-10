/** Divisor com a faixa tracejada de rodovia — assinatura visual do Trip. */
export function RoadDivider({ className = "", subtle = false }: { className?: string; subtle?: boolean }) {
  return <div aria-hidden="true" className={`${subtle ? "road-stripe-subtle" : "road-stripe"} ${className}`} />;
}
