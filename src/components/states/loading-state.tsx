export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return <div className="rounded-md border bg-white p-6 text-sm text-muted-foreground">{label}</div>;
}
