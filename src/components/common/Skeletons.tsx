"use client";

function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`}
      style={style}
    />
  );
}

function CircleBone({ size }: { size: number }) {
  return <div className="animate-pulse bg-gray-200 rounded-full shrink-0" style={{ width: size, height: size }} />;
}

interface GridSkeletonProps { count?: number }

export function HomePageSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-4 md:pt-6">
      <div className="flex justify-center mb-4 md:mb-6">
        <Bone className="w-64 h-10 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[21.9%_1fr_21.9%] gap-3 mb-5">
        <div className="hidden md:grid grid-rows-3 gap-3">
          {[0,1,2].map(i => <Bone key={i} className="w-full rounded-lg" style={{ height: 64 }} />)}
        </div>
        <Bone className="w-full rounded-lg" style={{ aspectRatio: "16/10", minHeight: 240 }} />
        <div className="hidden md:grid grid-rows-3 gap-3">
          {[0,1,2].map(i => <Bone key={i} className="w-full rounded-lg" style={{ height: 64 }} />)}
        </div>
      </div>
      <div className="mb-10">
        <Bone className="w-56 h-8 mb-4" />
        <div className="flex gap-6 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="text-center shrink-0">
              <CircleBone size={88} />
              <Bone className="w-20 h-3 mt-2 mx-auto" />
            </div>
          ))}
        </div>
      </div>
      <div className="mb-10">
        <Bone className="w-56 h-8 mb-4" />
        <ProductGridSkeleton count={8} />
      </div>
      <div className="mb-10">
        <Bone className="w-44 h-8 mb-4" />
        <VendorGridSkeleton count={4} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: GridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Bone className="w-full rounded-xl" style={{ aspectRatio: "3/4" }} />
          <Bone className="w-4/5 h-4 mt-2" />
          <Bone className="w-1/2 h-3 mt-1" />
          <Bone className="w-2/5 h-3 mt-1" />
        </div>
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({ count = 8 }: GridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Bone className="w-full rounded-xl" style={{ aspectRatio: "1/1" }} />
          <Bone className="w-3/4 h-3 mt-2 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function VendorGridSkeleton({ count = 6 }: GridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <CircleBone size={56} />
            <div className="flex-1">
              <Bone className="w-3/4 h-4" />
              <Bone className="w-1/2 h-3 mt-1.5" />
            </div>
          </div>
          <Bone className="w-full h-3 mt-4" />
          <Bone className="w-11/12 h-3 mt-1.5" />
        </div>
      ))}
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
      <div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4 mb-3 flex gap-4 items-center">
            <Bone className="rounded-xl shrink-0" style={{ width: 96, height: 96 }} />
            <div className="flex-1">
              <Bone className="w-3/4 h-4" />
              <Bone className="w-2/5 h-3 mt-2" />
              <Bone className="w-1/3 h-3 mt-2" />
            </div>
            <Bone className="rounded-lg" style={{ width: 110, height: 36 }} />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200 p-6" style={{ minWidth: 280 }}>
        <Bone className="w-1/2 h-7" />
        <Bone className="w-full h-3 mt-4" />
        <Bone className="w-full h-3 mt-2" />
        <Bone className="w-full h-3 mt-2" />
        <Bone className="w-full h-11 mt-6 rounded-full" />
      </div>
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: GridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <Bone className="rounded-xl" style={{ width: 52, height: 52 }} />
            <div className="flex-1">
              <Bone className="w-4/5 h-8" />
              <Bone className="w-3/5 h-3 mt-1.5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface TableSkeletonProps { rows?: number; columns?: number }

export function TableRowsSkeleton({ rows = 6, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Bone key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={`p-4 flex items-center gap-4 ${r < rows - 1 ? "border-b border-gray-200" : ""}`}>
          <Bone className="rounded-lg shrink-0" style={{ width: 44, height: 44 }} />
          {Array.from({ length: columns - 1 }).map((_, c) => (
            <Bone key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
