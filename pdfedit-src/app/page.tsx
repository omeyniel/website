"use client"

import { useState } from "react"
import { PDFController } from "@/lib/pdf-controller"
import { SplitMode } from "@/components/split-mode"
import { MergeMode } from "@/components/merge-mode"
import { Button } from "@/components/ui/button"
import { Scissors, Combine } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

const controller = new PDFController()

export default function Home() {
  const [mode, setMode] = useState<"split" | "merge">("split")

  const handleModeChange = (newMode: "split" | "merge") => {
    controller.clearDocuments()
    setMode(newMode)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">PDF Editor</h1>
          <p className="text-muted-foreground text-lg">
            Split PDFs by extracting pages or merge multiple PDFs into one
          </p>
        </header>

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
        </div>

        {mode === "split" ? <SplitMode controller={controller} /> : <MergeMode controller={controller} />}
      </div>
      <Toaster />
    </main>
  )
}