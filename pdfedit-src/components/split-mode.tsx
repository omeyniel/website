"use client"

import { useState } from "react"
import type { PDFController } from "@/lib/pdf-controller"
import type { PDFDocument } from "@/lib/pdf-document"
import { PDFUpload } from "./pdf-upload"
import { PDFViewer } from "./pdf-viewer"
import { Button } from "@/components/ui/button"
import { Scissors, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SplitModeProps {
  controller: PDFController
}

export function SplitMode({ controller }: SplitModeProps) {
  const [document, setDocument] = useState<PDFDocument | null>(null)
  const [, forceUpdate] = useState({})
  const { toast } = useToast()

  const handleFileSelected = async (files: File[]) => {
    try {
      const doc = await controller.addDocument(files[0])
      setDocument(doc)
      controller.clearSelectedPages()
      forceUpdate({})
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load PDF file",
        variant: "destructive",
      })
    }
  }

  const handleSplit = async () => {
    if (!document) return

    const selectedPages = Array.from(controller.getSelectedPages())
      .filter((key) => key.startsWith("0-"))
      .map((key) => Number.parseInt(key.split("-")[1]))

    if (selectedPages.length === 0) {
      toast({
        title: "No pages selected",
        description: "Please select at least one page to extract",
        variant: "destructive",
      })
      return
    }

    try {
      await controller.splitDocument(
        0,
        selectedPages.sort((a, b) => a - b),
      )
      toast({
        title: "Success",
        description: `Extracted ${selectedPages.length} page(s)`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to split PDF",
        variant: "destructive",
      })
    }
  }

  const handleClear = () => {
    controller.clearDocuments()
    setDocument(null)
    forceUpdate({})
  }

  return (
    <div className="space-y-6">
      {!document ? (
        <PDFUpload onFilesSelected={handleFileSelected} multiple={false} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Select Pages to Extract</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClear}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button onClick={handleSplit}>
                <Scissors className="w-4 h-4 mr-2" />
                Extract Selected Pages
              </Button>
            </div>
          </div>
          <PDFViewer
            document={document}
            docIndex={0}
            onPageToggle={(docIdx, pageNum) => {
              controller.togglePageSelection(docIdx, pageNum)
              forceUpdate({})
            }}
            isPageSelected={(docIdx, pageNum) => controller.isPageSelected(docIdx, pageNum)}
            showSelection={true}
          />
        </>
      )}
    </div>
  )
}