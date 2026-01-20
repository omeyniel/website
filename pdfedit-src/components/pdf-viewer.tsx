"use client"

import { useEffect, useRef, useState } from "react"
import type { PDFDocument } from "@/lib/pdf-document"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface PDFViewerProps {
  document: PDFDocument
  docIndex: number
  onPageToggle?: (docIndex: number, pageNumber: number) => void
  isPageSelected?: (docIndex: number, pageNumber: number) => boolean
  showSelection?: boolean
}

export function PDFViewer({ document, docIndex, onPageToggle, isPageSelected, showSelection = false }: PDFViewerProps) {
  const [pages, setPages] = useState<number[]>([])
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())

  useEffect(() => {
    const pageCount = document.getPageCount()
    setPages(Array.from({ length: pageCount }, (_, i) => i + 1))
  }, [document])

  useEffect(() => {
    pages.forEach(async (pageNum) => {
      const canvas = canvasRefs.current.get(pageNum)
      if (canvas) {
        try {
          await document.renderPage(pageNum, canvas)
        } catch (error) {
          console.error(`Error rendering page ${pageNum}:`, error)
        }
      }
    })
  }, [pages, document])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{document.getFileName()}</h3>
        <span className="text-sm text-muted-foreground">
          {pages.length} {pages.length === 1 ? "page" : "pages"}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {pages.map((pageNum) => {
          const selected = isPageSelected?.(docIndex, pageNum) || false
          return (
            <Card
              key={pageNum}
              className={cn(
                "relative overflow-hidden transition-all cursor-pointer hover:shadow-lg",
                selected && "ring-2 ring-primary",
              )}
              onClick={() => showSelection && onPageToggle?.(docIndex, pageNum)}
            >
              <div className="p-2">
                {showSelection && (
                  <div className="absolute top-3 left-3 z-10">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => onPageToggle?.(docIndex, pageNum)}
                      className="bg-background"
                    />
                  </div>
                )}
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(pageNum, el)
                  }}
                  className="w-full h-auto"
                />
                <p className="text-center text-sm text-muted-foreground mt-2">Page {pageNum}</p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}