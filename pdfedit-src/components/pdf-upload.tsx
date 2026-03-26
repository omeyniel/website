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
  accept?: string
  label?: string
  sublabel?: string
  buttonLabel?: string
  compactLabel?: string
  compactSublabel?: string
  compactButtonLabel?: string
}

export function PDFUpload({
  onFilesSelected,
  multiple = false,
  compact = false,
  accept = "application/pdf,image/jpeg,image/png",
  label,
  sublabel,
  buttonLabel,
  compactLabel,
  compactSublabel,
  compactButtonLabel,
}: PDFUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowFile = (file: File) => {
    const acceptedTypes = accept.split(",").map((type) => type.trim().toLowerCase())
    const fileType = file.type.toLowerCase()
    return acceptedTypes.some((type) => {
      if (type === "image/*") {
        return fileType.startsWith("image/")
      }
      return type === fileType
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(allowFile)
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
    const files = Array.from(e.dataTransfer.files).filter(allowFile)
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
            {compact ? compactLabel || "Append more files" : label || "Drop PDF, JPG, or PNG files here or click to browse"}
          </p>
          <p className={compact ? "text-xs text-muted-foreground mt-1" : "text-sm text-muted-foreground mt-1"}>
            {compact
              ? compactSublabel || "PDF, JPG, and PNG files"
              : sublabel || "Import one or more PDF, JPG, or PNG files into the workspace"}
          </p>
        </div>
        <Button variant="secondary" type="button" className={compact ? "" : ""}>
          {compact ? compactButtonLabel || "Choose Files" : buttonLabel || "Choose Files"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </Card>
  )
}
