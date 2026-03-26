"use client"

import { useEffect, useRef, useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import { PDFUpload } from "@/components/pdf-upload"
import { EditorMenuBar } from "@/components/editor-menu-bar"
import { WorkspaceCanvas } from "@/components/workspace-canvas"
import { BinPanel } from "@/components/bin-panel"
import {
  appendFilesToWorkspace,
  clearSelection,
  clearWorkspace,
  createEmptyWorkspaceState,
  exportBin,
  exportSelection,
  exportWorkspace,
  invertSelection,
  movePage,
  restorePagesFromBin,
  rotatePage,
  rotateSelectedPages,
  selectAllPages,
  sendPagesToBin,
  togglePageSelection,
  updateImagePagePosition,
} from "@/lib/workspace-editor"
import type { ExportQuality } from "@/lib/workspace-types"

export default function Home() {
  const [workspace, setWorkspace] = useState(createEmptyWorkspaceState())
  const [headerShrunk, setHeaderShrunk] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const workspaceRef = useRef(workspace)

  useEffect(() => {
    const handleScroll = () => {
      setHeaderShrunk(window.scrollY > 40)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    workspaceRef.current = workspace
  }, [workspace])

  const handleFilesSelected = async (files: File[]) => {
    setIsBusy(true)
    try {
      const nextWorkspace = await appendFilesToWorkspace(workspaceRef.current, files)
      setWorkspace(nextWorkspace)
    } finally {
      setIsBusy(false)
    }
  }

  const handleExport = async (scope: "workspace" | "selection" | "bin", quality: ExportQuality) => {
    setIsBusy(true)
    try {
      const blob =
        scope === "workspace"
          ? await exportWorkspace(workspace, quality)
          : scope === "selection"
            ? await exportSelection(workspace, quality)
            : await exportBin(workspace, quality)
      const filename =
        scope === "workspace" ? `workspace-${quality}.pdf` : scope === "selection" ? `selection-${quality}.pdf` : `bin-${quality}.pdf`
      const { PDFOperations } = await import("@/lib/pdf-operations")
      PDFOperations.downloadBlob(blob, filename)
    } finally {
      setIsBusy(false)
    }
  }

  const pageCount = workspace.pages.length
  const selectedCount = workspace.selectedPageIds.length
  const binCount = workspace.bin.length

  return (
    <>
      <header className={`site-header pdfedit-header${headerShrunk ? " shrunk" : ""}`}>
        <div className="container header-row">
          <div className="brand">
            <img src="/assets/logo.jpg" alt="meyniel.ca" className="logo" onError={(event) => (event.currentTarget.style.display = "none")} />
            <div className="brand-text">
              <h1>PDF Editor</h1>
              <p className="subtitle">Import, reorder, rotate, restore, and export PDFs or images in one workspace</p>
            </div>
          </div>
        </div>
        <nav className="container nav">
          <a href="/index.html">Accueil</a>
          <a href="/tetris/" className="tool-link">🎮 Tetris</a>
          <a href="/mancala/">Mancala</a>
        </nav>
      </header>

      <main className="min-h-screen bg-background">
        <div className="container">
          <div className="pdfedit-divider" />
          <div className="space-y-6 pb-10">
            <EditorMenuBar
              hasPages={workspace.pages.length > 0}
              hasSelection={workspace.selectedPageIds.length > 0}
              hasBin={workspace.bin.length > 0}
              importLabel={workspace.pages.length > 0 ? "Append Files..." : "Import Files..."}
              onImport={() => document.getElementById("workspace-import-input")?.click()}
              onClearWorkspace={() => setWorkspace(clearWorkspace())}
              onSendToBin={() => setWorkspace((current) => sendPagesToBin(current, current.selectedPageIds))}
              onRotateSelection={(degrees) => setWorkspace((current) => rotateSelectedPages(current, degrees))}
              onSelectAll={() => setWorkspace((current) => selectAllPages(current))}
              onClearSelection={() => setWorkspace((current) => clearSelection(current))}
              onInvertSelection={() => setWorkspace((current) => invertSelection(current))}
              onExportWorkspace={(quality) => void handleExport("workspace", quality)}
              onExportSelection={(quality) => void handleExport("selection", quality)}
              onExportBin={(quality) => void handleExport("bin", quality)}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</div>
                <div className="mt-1 text-2xl font-semibold">{pageCount}</div>
                <div className="text-sm text-muted-foreground">{pageCount === 1 ? "page loaded" : "pages loaded"}</div>
              </div>
              <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Selection</div>
                <div className="mt-1 text-2xl font-semibold">{selectedCount}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedCount === 1 ? "page selected" : "pages selected"}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Bin</div>
                <div className="mt-1 text-2xl font-semibold">{binCount}</div>
                <div className="text-sm text-muted-foreground">{binCount === 1 ? "page in bin" : "pages in bin"}</div>
              </div>
            </div>

            {workspace.pages.length === 0 ? (
              <PDFUpload
                onFilesSelected={(files) => void handleFilesSelected(files)}
                multiple={true}
                accept="application/pdf,image/jpeg,image/png"
                label="Import files into the workspace"
                sublabel="Accepted formats: PDF, JPG, PNG"
                buttonLabel="Import Files"
              />
            ) : null}
            <input
              id="workspace-import-input"
              type="file"
              className="hidden"
              accept="application/pdf,image/jpeg,image/png"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files || [])
                if (files.length > 0) {
                  void handleFilesSelected(files)
                }
                event.currentTarget.value = ""
              }}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <WorkspaceCanvas
                pages={workspace.pages}
                selectedPageIds={workspace.selectedPageIds}
                onToggleSelection={(pageId) => setWorkspace((current) => togglePageSelection(current, pageId))}
                onMovePage={(pageId, direction) => setWorkspace((current) => movePage(current, pageId, direction))}
                onRotatePage={(pageId) => setWorkspace((current) => rotatePage(current, pageId, 90))}
                onSendPageToBin={(pageId) => setWorkspace((current) => sendPagesToBin(current, [pageId]))}
                onUpdateImagePosition={(pageId, position) =>
                  setWorkspace((current) => updateImagePagePosition(current, pageId, position))
                }
              />
              <BinPanel
                pages={workspace.bin}
                onRestorePage={(pageId) => setWorkspace((current) => restorePagesFromBin(current, [pageId]))}
                onRestoreAll={() => setWorkspace((current) => restorePagesFromBin(current, current.bin.map((page) => page.id)))}
              />
            </div>
            {isBusy ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Processing files...
              </div>
            ) : null}
          </div>
        </div>
        <Toaster />
      </main>
    </>
  )
}
