import type { PDFDocument } from "./pdf-document"

export type ExportQuality = "high" | "medium" | "low"

export interface ImagePlacement {
  x: number
  y: number
}

export interface PDFPageSource {
  kind: "pdf"
  file: File
  document: PDFDocument
  pageNumber: number
}

export interface ImagePageSource {
  kind: "image"
  file: File
  position: ImagePlacement
  frame: {
    width: number
    height: number
  }
}

export type WorkspacePageSource = PDFPageSource | ImagePageSource

export interface WorkspacePage {
  id: string
  label: string
  source: WorkspacePageSource
  rotation: number
  insertedAt: number
  lastKnownIndex: number
}

export interface WorkspaceState {
  pages: WorkspacePage[]
  bin: WorkspacePage[]
  selectedPageIds: string[]
}
