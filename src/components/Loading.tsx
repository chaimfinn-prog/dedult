export default function Loading({ label = "טוען…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-grass-700">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-grass-200 border-t-grass-600" />
      <p className="font-semibold">{label}</p>
    </div>
  );
}
