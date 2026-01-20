import { PDFDocument as PDFLibDocument } from "pdf-lib"

/**
 * PDFOperations class - Handles PDF manipulation operations
 */
export class PDFOperations {
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
}
