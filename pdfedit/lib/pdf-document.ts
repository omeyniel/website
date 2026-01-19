/**
 * PDFDocument class - Represents a PDF file with its metadata and pages
 */
export class PDFDocument {
  private file: File
  private pdfDoc: any = null
  private pageCount = 0

  constructor(file: File) {
    this.file = file
  }

  async load(): Promise<void> {
    const pdfjsLib = await import("pdfjs-dist")
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

    const arrayBuffer = await this.file.arrayBuffer()
    this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    this.pageCount = this.pdfDoc.numPages
  }

  getPageCount(): number {
    return this.pageCount
  }

  getFileName(): string {
    return this.file.name
  }

  getFile(): File {
    return this.file
  }

  getPdfDoc(): any {
    return this.pdfDoc
  }

  async renderPage(pageNumber: number, canvas: HTMLCanvasElement): Promise<void> {
    if (!this.pdfDoc) {
      throw new Error("PDF not loaded")
    }

    const page = await this.pdfDoc.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1.5 })
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Canvas context not available")
    }

    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise
  }
}