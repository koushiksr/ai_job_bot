'use client'

import React from 'react'

interface TabLoadingSkeletonProps {
  title?: string
}

export default function TabLoadingSkeleton({ title }: TabLoadingSkeletonProps) {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Header bar skeleton */}
      <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800/80 light:border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-zinc-800 light:bg-zinc-200" />
          <div className="h-4 w-36 rounded bg-zinc-800 light:bg-zinc-200" />
          {title && (
            <span className="text-[11px] font-mono text-zinc-600 light:text-zinc-400">
              Loading {title}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-lg bg-zinc-800/80 light:bg-zinc-200" />
          <div className="h-8 w-20 rounded-lg bg-zinc-800/80 light:bg-zinc-200" />
        </div>
      </div>

      {/* Content table skeleton */}
      <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800/80 light:border-zinc-200 p-5 space-y-3">
        <div className="h-4 w-48 rounded bg-zinc-800/70 light:bg-zinc-200 mb-4" />
        <div className="space-y-2.5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-zinc-900/60 light:bg-zinc-100 border border-zinc-800/40 light:border-zinc-200 flex items-center justify-between px-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 light:bg-zinc-300" />
                <div className="space-y-1.5">
                  <div className="h-3 w-40 rounded bg-zinc-800 light:bg-zinc-300" />
                  <div className="h-2.5 w-24 rounded bg-zinc-800/60 light:bg-zinc-200" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-16 rounded-full bg-zinc-800 light:bg-zinc-200" />
                <div className="h-7 w-20 rounded-lg bg-zinc-800 light:bg-zinc-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
