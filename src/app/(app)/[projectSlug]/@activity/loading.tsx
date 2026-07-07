export default function ActivityLoading() {
  return (
    <div className="w-80 border-l p-4 space-y-4">
      <div className="h-6 bg-muted rounded animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
