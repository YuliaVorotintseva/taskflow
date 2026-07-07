export default function BoardLoading() {
  return (
    <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
      {[1, 2, 3, 4].map((colIndex) => (
        <div key={colIndex} className="flex-shrink-0 w-80">
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="h-6 bg-muted-foreground/20 rounded animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3].map((cardIndex) => (
                <div
                  key={cardIndex}
                  className="h-24 bg-muted-foreground/10 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
