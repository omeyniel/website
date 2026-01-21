"use client"

import type React from "react"

import { useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface PDFUploadProps {
  onFilesSelected: (files: File[]) => void
  multiple?: boolean
  compact?: boolean
}

export function PDFUpload({ onFilesSelected, multiple = false, compact = false }: PDFUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf")
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <Card
      className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className={compact ? "flex items-center justify-between p-4 gap-4" : "flex flex-col items-center justify-center p-12 gap-4"}>
        <div className={compact ? "rounded-full bg-primary/10 p-2" : "rounded-full bg-primary/10 p-4"}>
          <Upload className={compact ? "w-5 h-5 text-primary" : "w-8 h-8 text-primary"} />
        </div>
        <div className={compact ? "flex-1" : "text-center"}>
          <p className={compact ? "text-sm font-medium text-foreground" : "text-lg font-medium text-foreground"}>
            {compact ? "Add more PDFs" : "Drop PDF files here or click to browse"}
          </p>
          <p className={compact ? "text-xs text-muted-foreground mt-1" : "text-sm text-muted-foreground mt-1"}>
            {multiple ? "Select multiple PDFs to merge" : "Select a PDF to split"}
          </p>
        </div>
        <Button variant="secondary" type="button" className={compact ? "" : ""}>
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </Card>
  )
}
