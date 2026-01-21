"use client"

import { useEffect, useRef, useState } from "react"
import type { PDFController } from "@/lib/pdf-controller"
import type { PDFDocument } from "@/lib/pdf-document"
import { PDFUpload } from "./pdf-upload"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, RotateCw, Shuffle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"

interface ReorderModeProps {
  controller: PDFController
}

export function ReorderMode({ controller }: ReorderModeProps) {
  const [document, setDocument] = useState<PDFDocument | null>(null)
  const [order, setOrder] = useState<Array<{ pageNumber: number; rotation: number }>>([])
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const [, forceUpdate] = useState({})
  const { toast } = useToast()

  const handleFileSelected = async (files: File[]) => {
    try {
      const doc = await controller.addDocument(files[0])
      setDocument(doc)
      setOrder(Array.from({ length: doc.getPageCount() }, (_, i) => ({ pageNumber: i + 1, rotation: 0 })))
      forceUpdate({})
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load PDF file",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!document) return
    order.forEach(async (page) => {
      const canvas = canvasRefs.current.get(page.pageNumber)
      if (canvas) {
        try {
          await document.renderPage(page.pageNumber, canvas, 0.9, page.rotation)
        } catch (error) {
          console.error(`Error rendering page ${page.pageNumber}:`, error)
        }
      }
    })
  }, [order, document])

  const handleMove = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= order.length) return
    const next = [...order]
    const [page] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, page)
    setOrder(next)
  }

  const handleRemovePage = (index: number) => {
    setOrder((current) => current.filter((_, idx) => idx !== index))
  }

  const handleRotatePage = (index: number) => {
    setOrder((current) =>
      current.map((page, idx) => (idx === index ? { ...page, rotation: (page.rotation + 90) % 360 } : page)),
    )
  }

  const handleReorder = async () => {
    if (!document) return
    try {
      await controller.reorderDocument(0, order)
      toast({
        title: "Success",
        description: "Reordered PDF downloaded",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder PDF",
        variant: "destructive",
      })
    }
  }

  const handleClear = () => {
    controller.clearDocuments()
    setDocument(null)
    setOrder([])
    forceUpdate({})
  }

  return (
    <div className="space-y-6">
      {!document ? (
        <PDFUpload onFilesSelected={handleFileSelected} multiple={false} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Reorder Pages</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClear}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button onClick={handleReorder}>
                <Shuffle className="w-4 h-4 mr-2" />
                Download Reordered PDF
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {order.map((pageNum, index) => (
              <Card key={`${pageNum.pageNumber}-${index}`} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">#{index + 1}</div>
                    <div className="text-sm font-medium text-foreground">Page {pageNum.pageNumber}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(index, "up")}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(index, "down")}
                      disabled={index === order.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRotatePage(index)}
                      aria-label="Rotate right"
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePage(index)}
                      aria-label="Remove page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <canvas
                    ref={(el) => {
                      if (el) canvasRefs.current.set(pageNum.pageNumber, el)
                    }}
                    className="w-full h-auto"
                  />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
