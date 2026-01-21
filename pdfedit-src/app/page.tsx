"use client"

import { useEffect, useState } from "react"
import { PDFController } from "@/lib/pdf-controller"
import { SplitMode } from "@/components/split-mode"
import { MergeMode } from "@/components/merge-mode"
import { ReorderMode } from "@/components/reorder-mode"
import { Button } from "@/components/ui/button"
import { Scissors, Combine, ArrowUpDown } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

const controller = new PDFController()

export default function Home() {
  const [mode, setMode] = useState<"split" | "merge" | "reorder">("split")
  const [headerShrunk, setHeaderShrunk] = useState(false)

  const handleModeChange = (newMode: "split" | "merge" | "reorder") => {
    controller.clearDocuments()
    setMode(newMode)
  }

  useEffect(() => {
    const handleScroll = () => {
      setHeaderShrunk(window.scrollY > 40)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <header className={`site-header pdfedit-header${headerShrunk ? " shrunk" : ""}`}>
        <div className="container header-row">
          <div className="brand">
            <img src="/assets/logo.jpg" alt="meyniel.ca" className="logo" onError={(event) => (event.currentTarget.style.display = "none")} />
            <div className="brand-text">
              <h1>PDF Editor</h1>
              <p className="subtitle">Split PDFs by extracting pages or merge multiple PDFs into one</p>
            </div>
          </div>
        </div>
        <nav className="container nav">
          <a href="/index.html">Accueil</a>
          <a href="/tetris/" className="tool-link">🎮 Tetris</a>
          <a href="/pdfedit/">Éditeur PDF</a>
        </nav>
      </header>

      <main className="min-h-screen bg-background">
        <div className="container">
          <div className="pdfedit-divider" />

          <div className="flex gap-2 mb-8">
          <Button
            variant={mode === "split" ? "default" : "outline"}
            onClick={() => handleModeChange("split")}
            className="flex-1 sm:flex-none"
          >
            <Scissors className="w-4 h-4 mr-2" />
            Split PDF
          </Button>
          <Button
            variant={mode === "merge" ? "default" : "outline"}
            onClick={() => handleModeChange("merge")}
            className="flex-1 sm:flex-none"
          >
            <Combine className="w-4 h-4 mr-2" />
            Merge PDFs
          </Button>
          <Button
            variant={mode === "reorder" ? "default" : "outline"}
            onClick={() => handleModeChange("reorder")}
            className="flex-1 sm:flex-none"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Edit PDF
          </Button>
        </div>

          {mode === "split" ? (
            <SplitMode controller={controller} />
          ) : mode === "merge" ? (
            <MergeMode controller={controller} />
          ) : (
            <ReorderMode controller={controller} />
          )}
        </div>
        <Toaster />
      </main>
    </>
  )
}
