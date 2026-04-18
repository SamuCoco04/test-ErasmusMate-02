export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-md border bg-white p-6 text-sm">
      <p className="font-medium">{title}</p>
      {hint ? <p className="mt-1 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
