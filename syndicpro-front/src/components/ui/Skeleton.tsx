interface SkeletonLineProps {
  width?: string;
  className?: string;
}

export function SkeletonLine({ width = '100%', className = '' }: SkeletonLineProps) {
  return (
    <div
      className={`h-4 bg-surface-200 rounded animate-pulse ${className}`}
      style={{ width }}
    />
  );
}

export function SkeletonCircle({ size = 'w-10 h-10' }: { size?: string }) {
  return (
    <div className={`${size} bg-surface-200 rounded-full animate-pulse`} />
  );
}

export function SkeletonRect({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface-200 rounded-lg animate-pulse ${className}`} />
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <SkeletonLine width="40%" />
        <SkeletonLine width="20%" />
        <SkeletonLine width="20%" />
        <SkeletonLine width="15%" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <SkeletonLine width="40%" />
          <SkeletonLine width="20%" />
          <SkeletonLine width="20%" />
          <SkeletonLine width="15%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonKpi({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-card p-6">
          <SkeletonLine width="60%" className="mb-2" />
          <SkeletonLine width="80%" className="h-8" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-card p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <SkeletonCircle size="w-12 h-12" />
        <div className="flex-1">
          <SkeletonLine width="50%" className="mb-2" />
          <SkeletonLine width="30%" />
        </div>
      </div>
      <SkeletonLine width="100%" className="mb-2" />
      <SkeletonLine width="80%" />
    </div>
  );
}

export function SkeletonKpiRow({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-card p-6 space-y-3">
          <SkeletonLine width="50%" className="h-3" />
          <SkeletonLine width="80%" className="h-8" />
          <SkeletonLine width="40%" className="h-3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTableFull({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  const widths = ['30%', '25%', '15%', '15%', '10%'];
  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <div className="bg-surface-100 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width={widths[i % widths.length]} className="h-4" />
        ))}
      </div>
      <div className="divide-y divide-surface-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <SkeletonLine key={j} width={widths[j % widths.length]} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonBudgetTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <div className="bg-surface-100 px-4 py-3 flex gap-4">
        <SkeletonLine width="25%" className="h-4" />
        <SkeletonLine width="15%" className="h-4" />
        <SkeletonLine width="15%" className="h-4" />
        <SkeletonLine width="15%" className="h-4" />
        <SkeletonLine width="8%" className="h-4" />
        <SkeletonLine width="20%" className="h-4" />
      </div>
      <div className="divide-y divide-surface-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-4 flex gap-4 items-center">
            <SkeletonLine width="25%" className="h-5" />
            <SkeletonLine width="15%" className="h-5" />
            <SkeletonLine width="15%" className="h-5" />
            <SkeletonLine width="15%" className="h-5" />
            <SkeletonLine width="8%" className="h-5" />
            <SkeletonRect className="h-3 flex-1 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChartBar({ bars = 5 }: { bars?: number }) {
  const heights = ['h-24', 'h-16', 'h-32', 'h-20', 'h-28'];
  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <div className="flex items-end justify-around h-40 gap-4">
        {Array.from({ length: bars }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className={`w-full bg-surface-200 rounded-t animate-pulse ${heights[i % heights.length]}`} />
            <SkeletonLine width="60%" className="h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChartPie() {
  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6 flex flex-col items-center gap-4">
      <div className="w-40 h-40 rounded-full bg-surface-200 animate-pulse" />
      <div className="space-y-2 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonCircle size="w-3 h-3" />
            <SkeletonLine width="60%" className="h-3" />
            <SkeletonLine width="20%" className="h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDrawer() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SkeletonCircle size="w-14 h-14" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="60%" className="h-5" />
          <SkeletonLine width="40%" className="h-4" />
        </div>
      </div>
      <div className="space-y-3">
        <SkeletonLine width="40%" className="h-4" />
        <SkeletonLine width="100%" className="h-4" />
        <SkeletonLine width="80%" className="h-4" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
            <SkeletonCircle size="w-8 h-8" />
            <div className="flex-1 space-y-1">
              <SkeletonLine width="50%" className="h-4" />
              <SkeletonLine width="30%" className="h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
