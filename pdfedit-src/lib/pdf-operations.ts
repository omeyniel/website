import { PDFDocument as PDFLibDocument, degrees } from "pdf-lib"
import type { ExportQuality, WorkspacePage } from "./workspace-types"

/**
 * PDFOperations class - Handles PDF manipulation operations
 */
export class PDFOperations {
  private static async loadImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const image = new Image()
      image.onload = () => {
        URL.revokeObjectURL(url)
        resolve(image)
      }
      image.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("Failed to load image"))
      }
      image.src = url
    })
  }

  private static async encodeImage(
    file: File,
    quality: "high" | "medium" | "low",
  ): Promise<{ bytes: Uint8Array; type: "image/jpeg" | "image/png" }> {
    if (quality === "high") {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const type = file.type === "image/png" ? "image/png" : "image/jpeg"
      return { bytes, type }
    }

    const image = await this.loadImageElement(file)
    const canvas = document.createElement("canvas")
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("Canvas context not available")
    }
    context.drawImage(image, 0, 0)

    const qualityValue = quality === "medium" ? 0.75 : 0.5
    const dataUrl = canvas.toDataURL("image/jpeg", qualityValue)
    const arrayBuffer = await (await fetch(dataUrl)).arrayBuffer()
    return { bytes: new Uint8Array(arrayBuffer), type: "image/jpeg" }
  }

  /**
   * Split a PDF by extracting specific pages
   */
  static async splitPDF(file: File, pageNumbers: number[]): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFLibDocument.load(arrayBuffer)
    const newPdfDoc = await PDFLibDocument.create()

    for (const pageNum of pageNumbers) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1])
      newPdfDoc.addPage(copiedPage)
    }

    const pdfBytes = await newPdfDoc.save()
    const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes)
    const safeBytes = new Uint8Array(bytes)
    return new Blob([safeBytes], { type: "application/pdf" })
  }

  /**
   * Merge multiple PDFs into one
   */
  static async mergePDFs(files: File[]): Promise<Blob> {
    const mergedPdf = await PDFLibDocument.create()

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFLibDocument.load(arrayBuffer)
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
      copiedPages.forEach((page) => mergedPdf.addPage(page))
    }

    const pdfBytes = await mergedPdf.save()
    const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes)
    const safeBytes = new Uint8Array(bytes)
    return new Blob([safeBytes], { type: "application/pdf" })
  }

  /**
   * Reorder pages in a PDF
   */
  static async reorderPDF(file: File, pageOrder: Array<{ pageNumber: number; rotation: number }>): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFLibDocument.load(arrayBuffer)
    const newPdfDoc = await PDFLibDocument.create()

    for (const page of pageOrder) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [page.pageNumber - 1])
      if (page.rotation % 360 !== 0) {
        copiedPage.setRotation(degrees(page.rotation % 360))
      }
      newPdfDoc.addPage(copiedPage)
    }

    const pdfBytes = await newPdfDoc.save()
    const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes)
    const safeBytes = new Uint8Array(bytes)
    return new Blob([safeBytes], { type: "application/pdf" })
  }

  /**
   * Download a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Create a PDF from images (JPG/PNG)
   */
  static async imagesToPDF(
    files: File[],
    quality: "high" | "medium" | "low",
    options?: {
      width?: number
      height?: number
      positions?: Array<{ x: number; y: number }>
    },
  ): Promise<Blob> {
    const pdfDoc = await PDFLibDocument.create()

    for (const [index, file] of files.entries()) {
      const { bytes, type } = await this.encodeImage(file, quality)
      const image = type === "image/png" ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes)
      const pageWidth = options?.width ?? image.width
      const pageHeight = options?.height ?? image.height
      const page = pdfDoc.addPage([pageWidth, pageHeight])

      const scale = Math.max(pageWidth / image.width, pageHeight / image.height)
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      const excessX = drawWidth - pageWidth
      const excessY = drawHeight - pageHeight
      const position = options?.positions?.[index] ?? { x: 0.5, y: 0.5 }
      const posX = Math.min(1, Math.max(0, position.x))
      const posY = Math.min(1, Math.max(0, position.y))
      const x = -excessX * (1 - posX)
      const y = -excessY * (1 - posY)

      page.drawImage(image, { x, y, width: drawWidth, height: drawHeight })
    }

    const pdfBytes = await pdfDoc.save()
    const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes)
    const safeBytes = new Uint8Array(bytes)
    return new Blob([safeBytes], { type: "application/pdf" })
  }

  static async exportWorkspace(pages: WorkspacePage[], quality: ExportQuality): Promise<Blob> {
    return this.composeWorkspacePDF(pages, quality)
  }

  static async exportSelection(
    pages: WorkspacePage[],
    selectedPageIds: string[],
    quality: ExportQuality,
  ): Promise<Blob> {
    const selected = pages.filter((page) => selectedPageIds.includes(page.id))
    return this.composeWorkspacePDF(selected, quality)
  }

  static async exportBin(pages: WorkspacePage[], quality: ExportQuality): Promise<Blob> {
    return this.composeWorkspacePDF(pages, quality)
  }

  private static async composeWorkspacePDF(pages: WorkspacePage[], quality: ExportQuality): Promise<Blob> {
    const pdfDoc = await PDFLibDocument.create()
    const sourceCache = new Map<File, PDFLibDocument>()

    for (const page of pages) {
      if (page.source.kind === "pdf") {
        let sourceDoc = sourceCache.get(page.source.file)
        if (!sourceDoc) {
          sourceDoc = await PDFLibDocument.load(await page.source.file.arrayBuffer())
          sourceCache.set(page.source.file, sourceDoc)
        }

        const [copiedPage] = await pdfDoc.copyPages(sourceDoc, [page.source.pageNumber - 1])
        if (page.rotation % 360 !== 0) {
          copiedPage.setRotation(degrees(page.rotation % 360))
        }
        pdfDoc.addPage(copiedPage)
        continue
      }

      const { bytes, type } = await this.encodeImage(page.source.file, quality)
      const image = type === "image/png" ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes)
      const frame = page.source.frame
      const pdfPage = pdfDoc.addPage([frame.width, frame.height])
      const scale = Math.min(frame.width / image.width, frame.height / image.height)
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      const remainingX = frame.width - drawWidth
      const remainingY = frame.height - drawHeight
      const posX = Math.min(1, Math.max(0, page.source.position.x))
      const posY = Math.min(1, Math.max(0, page.source.position.y))
      const x = remainingX * posX
      const y = remainingY * posY
      pdfPage.drawImage(image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      })
      if (page.rotation % 360 !== 0) {
        pdfPage.setRotation(degrees(page.rotation % 360))
      }
    }

    const pdfBytes = await pdfDoc.save()
    const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes)
    const safeBytes = new Uint8Array(bytes)
    return new Blob([safeBytes], { type: "application/pdf" })
  }
}
