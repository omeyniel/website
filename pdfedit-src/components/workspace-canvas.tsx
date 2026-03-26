"use client"

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import { ArrowDown, ArrowUp, Crop, RotateCw, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { WorkspacePage } from "@/lib/workspace-types"

interface WorkspaceCanvasProps {
  pages: WorkspacePage[]
  selectedPageIds: string[]
  onToggleSelection: (pageId: string) => void
  onMovePage: (pageId: string, direction: "up" | "down") => void
  onRotatePage: (pageId: string) => void
  onSendPageToBin: (pageId: string) => void
  onUpdateImagePosition: (pageId: string, position: { x: number; y: number }) => void
}

export function WorkspaceCanvas({
  pages,
  selectedPageIds,
  onToggleSelection,
  onMovePage,
  onRotatePage,
  onSendPageToBin,
  onUpdateImagePosition,
}: WorkspaceCanvasProps) {
  if (pages.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-base font-medium">No pages in the workspace yet</p>
        <p className="mt-2 text-sm text-muted-foreground">Import a PDF, JPG, or PNG to start building the document.</p>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {pages.map((page, index) => (
        <WorkspacePageCard
          key={page.id}
          page={page}
          index={index}
          isSelected={selectedPageIds.includes(page.id)}
          isFirst={index === 0}
          isLast={index === pages.length - 1}
          onToggleSelection={() => onToggleSelection(page.id)}
          onMoveUp={() => onMovePage(page.id, "up")}
          onMoveDown={() => onMovePage(page.id, "down")}
          onRotate={() => onRotatePage(page.id)}
          onSendToBin={() => onSendPageToBin(page.id)}
          onUpdateImagePosition={(position) => onUpdateImagePosition(page.id, position)}
        />
      ))}
    </div>
  )
}

function WorkspacePageCard({
  page,
  index,
  isSelected,
  isFirst,
  isLast,
  onToggleSelection,
  onMoveUp,
  onMoveDown,
  onRotate,
  onSendToBin,
  onUpdateImagePosition,
}: {
  page: WorkspacePage
  index: number
  isSelected: boolean
  isFirst: boolean
  isLast: boolean
  onToggleSelection: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRotate: () => void
  onSendToBin: () => void
  onUpdateImagePosition: (position: { x: number; y: number }) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isEditingImage, setIsEditingImage] = useState(false)

  useEffect(() => {
    if (page.source.kind !== "pdf" || !canvasRef.current) {
      return
    }

    const source = page.source
    let cancelled = false
    const render = async () => {
      try {
        await source.document.renderPage(source.pageNumber, canvasRef.current!, 0.8, page.rotation)
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to render workspace page", error)
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [page])

  const imageUrl = useMemo(() => {
    if (page.source.kind !== "image") {
      return null
    }
    return URL.createObjectURL(page.source.file)
  }, [page])

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  return (
    <Card
      className={cn(
        "overflow-hidden border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg",
        isSelected && "ring-2 ring-primary shadow-md",
      )}
    >
      <div className="flex items-center justify-end gap-1 border-b border-border px-4 py-3">
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onMoveUp} disabled={isFirst} aria-label="Move up">
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onMoveDown} disabled={isLast} aria-label="Move down">
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onRotate} aria-label="Rotate page">
            <RotateCw className="w-4 h-4" />
          </Button>
          {page.source.kind === "image" ? (
            <Button
              size="sm"
              variant={isEditingImage ? "outline" : "ghost"}
              onClick={() => setIsEditingImage((current) => !current)}
              aria-label={isEditingImage ? "Close crop editor" : "Open crop editor"}
            >
              <Crop className="w-4 h-4" />
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={onSendToBin} aria-label="Send to bin">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="min-w-0 pr-3 text-xs text-muted-foreground">
            <div className="truncate">{page.label}</div>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} />
            Select
          </label>
        </div>
        {page.source.kind === "pdf" ? (
          <canvas ref={canvasRef} className="min-h-72 w-full rounded-md bg-muted/20 shadow-sm" />
        ) : isEditingImage ? (
          <ImageCropEditor
            imageUrl={imageUrl ?? ""}
            position={page.source.position}
            pageRatio={page.source.frame.width / page.source.frame.height}
            onChange={onUpdateImagePosition}
          />
        ) : (
          <div
            className="min-h-72 w-full overflow-hidden rounded-md bg-muted/20 shadow-sm"
            style={{
              aspectRatio: `${page.source.frame.width} / ${page.source.frame.height}`,
              backgroundImage: `url(${imageUrl ?? ""})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: `${page.source.position.x * 100}% ${page.source.position.y * 100}%`,
              transform: `rotate(${page.rotation}deg)`,
            }}
          />
        )}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">
            {page.source.kind === "pdf" ? `Page ${page.source.pageNumber}` : "Image"}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]",
                page.source.kind === "pdf" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
              )}
            >
              {page.source.kind}
            </span>
            <span className="text-primary">#{index + 1}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function ImageCropEditor({
  imageUrl,
  position,
  pageRatio,
  onChange,
}: {
  imageUrl: string
  position: { x: number; y: number }
  pageRatio: number
  onChange: (position: { x: number; y: number }) => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const startRef = useRef({ x: 0, y: 0, posX: 0.5, posY: 0.5 })

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      posX: position.x,
      posY: position.y,
    }
    setIsDragging(true)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return
    }

    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }

    const dx = (event.clientX - startRef.current.x) / rect.width
    const dy = (event.clientY - startRef.current.y) / rect.height
    onChange({
      x: Math.min(1, Math.max(0, startRef.current.posX + dx)),
      y: Math.min(1, Math.max(0, startRef.current.posY + dy)),
    })
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsDragging(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Drag to reposition the image inside the page frame.</span>
        <button type="button" className="text-primary hover:underline" onClick={() => onChange({ x: 0.5, y: 0.5 })}>
          Center
        </button>
      </div>
      <div
        ref={frameRef}
        className="min-h-72 w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/30 shadow-sm"
        style={{
          aspectRatio: `${pageRatio}`,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: `${position.x * 100}% ${position.y * 100}%`,
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsDragging(false)}
      />
    </div>
  )
}
