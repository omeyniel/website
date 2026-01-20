"use client"

import { useState } from "react"
import type { PDFController } from "@/lib/pdf-controller"
import type { PDFDocument } from "@/lib/pdf-document"
import { PDFUpload } from "./pdf-upload"
import { PDFViewer } from "./pdf-viewer"
import { Button } from "@/components/ui/button"
import { Combine, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"

interface MergeModeProps {
  controller: PDFController
}

export function MergeMode({ controller }: MergeModeProps) {
  const [documents, setDocuments] = useState<PDFDocument[]>([])
  const [, forceUpdate] = useState({})
  const { toast } = useToast()

  const handleFilesSelected = async (files: File[]) => {
    try {
      for (const file of files) {
        await controller.addDocument(file)
      }
      setDocuments(controller.getDocuments())
      forceUpdate({})
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load PDF files",
        variant: "destructive",
      })
    }
  }

  const handleMerge = async () => {
    if (documents.length < 2) {
      toast({
        title: "Not enough files",
        description: "Please add at least 2 PDF files to merge",
        variant: "destructive",
      })
      return
    }

    try {
      await controller.mergeDocuments()
      toast({
        title: "Success",
        description: `Merged ${documents.length} PDF files`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to merge PDFs",
        variant: "destructive",
      })
    }
  }

  const handleRemove = (index: number) => {
    controller.removeDocument(index)
    setDocuments(controller.getDocuments())
    forceUpdate({})
  }

  const handleClear = () => {
    controller.clearDocuments()
    setDocuments([])
    forceUpdate({})
  }

  return (
    <div className="space-y-6">
      <PDFUpload onFilesSelected={handleFilesSelected} multiple={true} />

      {documents.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {documents.length} PDF{documents.length !== 1 ? "s" : ""} Ready to Merge
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClear}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button onClick={handleMerge} disabled={documents.length < 2}>
                <Combine className="w-4 h-4 mr-2" />
                Merge PDFs
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {documents.map((doc, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {index + 1}. {doc.getFileName()}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <PDFViewer document={doc} docIndex={index} showSelection={false} />
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}