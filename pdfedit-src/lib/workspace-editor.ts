import { PDFDocument } from "./pdf-document"
import type { ExportQuality, WorkspacePage, WorkspaceState } from "./workspace-types"
import { PDFOperations } from "./pdf-operations"

const ACCEPTED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"])
const PORTRAIT_FRAME = { width: 595.28, height: 841.89 }
const LANDSCAPE_FRAME = { width: 841.89, height: 595.28 }

export function createEmptyWorkspaceState(): WorkspaceState {
  return {
    pages: [],
    bin: [],
    selectedPageIds: [],
  }
}

export async function appendFilesToWorkspace(state: WorkspaceState, files: File[]): Promise<WorkspaceState> {
  const acceptedFiles = files.filter((file) => ACCEPTED_TYPES.has(file.type))
  const nextPages = [...state.pages]
  const nextBin = [...state.bin]
  let nextIndex = nextPages.length

  for (const file of acceptedFiles) {
    if (file.type === "application/pdf") {
      const document = new PDFDocument(file)
      await document.load()

      for (let pageNumber = 1; pageNumber <= document.getPageCount(); pageNumber += 1) {
        nextPages.push({
          id: createPageId(file, pageNumber, nextIndex),
          label: `${file.name} - Page ${pageNumber}`,
          source: {
            kind: "pdf",
            file,
            document,
            pageNumber,
          },
          rotation: 0,
          insertedAt: nextIndex,
          lastKnownIndex: nextIndex,
        })
        nextIndex += 1
      }
      continue
    }

    nextPages.push({
      id: createPageId(file, 1, nextIndex),
      label: file.name,
      source: {
        kind: "image",
        file,
        position: { x: 0.5, y: 0.5 },
        frame: await inferImageFrame(file),
      },
      rotation: 0,
      insertedAt: nextIndex,
      lastKnownIndex: nextIndex,
    })
    nextIndex += 1
  }

  return {
    pages: nextPages.map((page, index) => ({ ...page, lastKnownIndex: index })),
    bin: nextBin,
    selectedPageIds: state.selectedPageIds.filter((id) => nextPages.some((page) => page.id === id)),
  }
}

export function togglePageSelection(state: WorkspaceState, pageId: string): WorkspaceState {
  const selectedPageIds = state.selectedPageIds.includes(pageId)
    ? state.selectedPageIds.filter((id) => id !== pageId)
    : [...state.selectedPageIds, pageId]

  return {
    ...state,
    selectedPageIds,
  }
}

export function clearSelection(state: WorkspaceState): WorkspaceState {
  return {
    ...state,
    selectedPageIds: [],
  }
}

export function selectAllPages(state: WorkspaceState): WorkspaceState {
  return {
    ...state,
    selectedPageIds: state.pages.map((page) => page.id),
  }
}

export function invertSelection(state: WorkspaceState): WorkspaceState {
  return {
    ...state,
    selectedPageIds: state.pages.filter((page) => !state.selectedPageIds.includes(page.id)).map((page) => page.id),
  }
}

export function rotateSelectedPages(state: WorkspaceState, degrees: number): WorkspaceState {
  return {
    ...state,
    pages: state.pages.map((page) =>
      state.selectedPageIds.includes(page.id) ? { ...page, rotation: (page.rotation + degrees) % 360 } : page,
    ),
  }
}

export function rotatePage(state: WorkspaceState, pageId: string, degrees: number): WorkspaceState {
  return {
    ...state,
    pages: state.pages.map((page) =>
      page.id === pageId ? { ...page, rotation: (page.rotation + degrees) % 360 } : page,
    ),
  }
}

export function updateImagePagePosition(
  state: WorkspaceState,
  pageId: string,
  position: { x: number; y: number },
): WorkspaceState {
  return {
    ...state,
    pages: state.pages.map((page) => {
      if (page.id !== pageId || page.source.kind !== "image") {
        return page
      }

      return {
        ...page,
        source: {
          ...page.source,
          position: {
            x: Math.min(1, Math.max(0, position.x)),
            y: Math.min(1, Math.max(0, position.y)),
          },
        },
      }
    }),
  }
}

export function movePage(state: WorkspaceState, pageId: string, direction: "up" | "down"): WorkspaceState {
  const currentIndex = state.pages.findIndex((page) => page.id === pageId)
  if (currentIndex === -1) {
    return state
  }

  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  if (nextIndex < 0 || nextIndex >= state.pages.length) {
    return state
  }

  const pages = [...state.pages]
  const [page] = pages.splice(currentIndex, 1)
  pages.splice(nextIndex, 0, page)

  return {
    ...state,
    pages: pages.map((item, index) => ({ ...item, lastKnownIndex: index })),
  }
}

export function sendPagesToBin(state: WorkspaceState, pageIds: string[]): WorkspaceState {
  const ids = new Set(pageIds)
  const pagesToBin: WorkspacePage[] = []
  const remainingPages: WorkspacePage[] = []

  state.pages.forEach((page, index) => {
    if (ids.has(page.id)) {
      pagesToBin.push({ ...page, lastKnownIndex: index })
      return
    }
    remainingPages.push(page)
  })

  return {
    pages: remainingPages.map((page, index) => ({ ...page, lastKnownIndex: index })),
    bin: [...state.bin, ...pagesToBin],
    selectedPageIds: state.selectedPageIds.filter((id) => !ids.has(id)),
  }
}

export function restorePagesFromBin(state: WorkspaceState, pageIds: string[]): WorkspaceState {
  const ids = new Set(pageIds)
  const pages = [...state.pages]
  const remainingBin: WorkspacePage[] = []

  state.bin.forEach((page) => {
    if (!ids.has(page.id)) {
      remainingBin.push(page)
      return
    }

    const restoreIndex = Math.max(0, Math.min(page.lastKnownIndex, pages.length))
    pages.splice(restoreIndex, 0, page)
  })

  return {
    ...state,
    pages: pages.map((page, index) => ({ ...page, lastKnownIndex: index })),
    bin: remainingBin,
  }
}

export function clearWorkspace(): WorkspaceState {
  return createEmptyWorkspaceState()
}

export async function exportWorkspace(state: WorkspaceState, quality: ExportQuality): Promise<Blob> {
  return PDFOperations.exportWorkspace(state.pages, quality)
}

export async function exportSelection(state: WorkspaceState, quality: ExportQuality): Promise<Blob> {
  return PDFOperations.exportSelection(state.pages, state.selectedPageIds, quality)
}

export async function exportBin(state: WorkspaceState, quality: ExportQuality): Promise<Blob> {
  return PDFOperations.exportBin(state.bin, quality)
}

function createPageId(file: File, pageNumber: number, index: number) {
  return `${file.name}-${file.lastModified}-${pageNumber}-${index}`
}

async function inferImageFrame(file: File): Promise<{ width: number; height: number }> {
  const { width, height } = await loadImageDimensions(file)
  return width >= height ? LANDSCAPE_FRAME : PORTRAIT_FRAME
}

function loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image dimensions"))
    }

    image.src = url
  })
}
