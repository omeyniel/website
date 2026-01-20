import { PDFDocument } from "./pdf-document"
import { PDFOperations } from "./pdf-operations"

/**
 * PDFController class - Manages PDF operations and state
 */
export class PDFController {
  private documents: PDFDocument[] = []
  private selectedPages: Set<string> = new Set()

  async addDocument(file: File): Promise<PDFDocument> {
    const doc = new PDFDocument(file)
    await doc.load()
    this.documents.push(doc)
    return doc
  }

  getDocuments(): PDFDocument[] {
    return this.documents
  }

  removeDocument(index: number): void {
    this.documents.splice(index, 1)
    this.clearSelectedPages()
  }

  clearDocuments(): void {
    this.documents = []
    this.clearSelectedPages()
  }

  togglePageSelection(docIndex: number, pageNumber: number): void {
    const key = `${docIndex}-${pageNumber}`
    if (this.selectedPages.has(key)) {
      this.selectedPages.delete(key)
    } else {
      this.selectedPages.add(key)
    }
  }

  isPageSelected(docIndex: number, pageNumber: number): boolean {
    return this.selectedPages.has(`${docIndex}-${pageNumber}`)
  }

  getSelectedPages(): Set<string> {
    return this.selectedPages
  }

  clearSelectedPages(): void {
    this.selectedPages.clear()
  }

  async splitDocument(docIndex: number, pageNumbers: number[]): Promise<void> {
    const doc = this.documents[docIndex]
    if (!doc) {
      throw new Error("Document not found")
    }

    const blob = await PDFOperations.splitPDF(doc.getFile(), pageNumbers)
    const filename = `${doc.getFileName().replace(".pdf", "")}_split.pdf`
    PDFOperations.downloadBlob(blob, filename)
  }

  async mergeDocuments(): Promise<void> {
    if (this.documents.length < 2) {
      throw new Error("Need at least 2 documents to merge")
    }

    const files = this.documents.map((doc) => doc.getFile())
    const blob = await PDFOperations.mergePDFs(files)
    PDFOperations.downloadBlob(blob, "merged.pdf")
  }
}