"use client"

import { RotateCcw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { WorkspacePage } from "@/lib/workspace-types"

interface BinPanelProps {
  pages: WorkspacePage[]
  onRestorePage: (pageId: string) => void
  onRestoreAll: () => void
}

export function BinPanel({ pages, onRestorePage, onRestoreAll }: BinPanelProps) {
  return (
    <Card className="sticky top-24 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Bin</h2>
          <p className="text-sm text-muted-foreground">Pages sent here can be restored at or near their original location.</p>
        </div>
        <div className="flex items-center gap-2">
          {pages.length > 0 ? (
            <Button size="sm" variant="outline" onClick={onRestoreAll}>
              <RotateCcw className="w-4 h-4" />
              Restore All
            </Button>
          ) : null}
          <div className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{pages.length}</div>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          The bin is empty.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{page.label}</div>
                <div className="text-xs text-muted-foreground">
                  Last known position #{page.lastKnownIndex + 1}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => onRestorePage(page.id)}>
                <RotateCcw className="w-4 h-4" />
                Restore
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
