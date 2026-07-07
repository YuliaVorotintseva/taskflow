export default function SidebarLoading() {
  return (
    <div className="w-64 border-r p-4 space-y-4">
      <div className="h-6 bg-muted rounded animate-pulse" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
