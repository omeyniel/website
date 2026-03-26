"use client"

import { useEffect, useRef } from "react"
import { ChevronDown, Download, FileInput, Layers3, MousePointerSquareDashed, RotateCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ExportQuality } from "@/lib/workspace-types"

interface EditorMenuBarProps {
  hasPages: boolean
  hasSelection: boolean
  hasBin: boolean
  importLabel: string
  onImport: () => void
  onClearWorkspace: () => void
  onSendToBin: () => void
  onRotateSelection: (degrees: number) => void
  onSelectAll: () => void
  onClearSelection: () => void
  onInvertSelection: () => void
  onExportWorkspace: (quality: ExportQuality) => void
  onExportSelection: (quality: ExportQuality) => void
  onExportBin: (quality: ExportQuality) => void
}

export function EditorMenuBar({
  hasPages,
  hasSelection,
  hasBin,
  importLabel,
  onImport,
  onClearWorkspace,
  onSendToBin,
  onRotateSelection,
  onSelectAll,
  onClearSelection,
  onInvertSelection,
  onExportWorkspace,
  onExportSelection,
  onExportBin,
}: EditorMenuBarProps) {
  const menuRefs = useRef<Array<HTMLDetailsElement | null>>([])

  const closeMenus = () => {
    menuRefs.current.forEach((menu) => {
      if (menu) {
        menu.open = false
      }
    })
  }

  const handleMenuToggle = (index: number) => {
    const currentMenu = menuRefs.current[index]
    if (!currentMenu?.open) {
      return
    }

    menuRefs.current.forEach((menu, menuIndex) => {
      if (menu && menuIndex !== index) {
        menu.open = false
      }
    })
  }

  const wrapAction = (action: () => void) => () => {
    action()
    closeMenus()
  }

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      const clickedInsideMenu = menuRefs.current.some((menu) => menu?.contains(target))
      if (!clickedInsideMenu) {
        closeMenus()
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  return (
    <div className="sticky top-3 z-10 rounded-2xl border border-border/80 bg-card/95 p-2 shadow-sm backdrop-blur">
      <div className="flex flex-wrap gap-2">
        <Menu label="File" menuRef={(node) => (menuRefs.current[0] = node)} onToggle={() => handleMenuToggle(0)}>
          <MenuButton icon={<FileInput className="w-4 h-4" />} label={importLabel} onClick={wrapAction(onImport)} />
          <MenuButton
            icon={<Layers3 className="w-4 h-4" />}
            label="Clear Workspace"
            onClick={wrapAction(onClearWorkspace)}
            disabled={!hasPages}
          />
        </Menu>

        <Menu label="Edit" menuRef={(node) => (menuRefs.current[1] = node)} onToggle={() => handleMenuToggle(1)}>
          <MenuButton
            icon={<Trash2 className="w-4 h-4" />}
            label="Send to Bin"
            onClick={wrapAction(onSendToBin)}
            disabled={!hasSelection}
          />
          <MenuButton
            icon={<RotateCw className="w-4 h-4" />}
            label="Rotate Selected 90°"
            onClick={wrapAction(() => onRotateSelection(90))}
            disabled={!hasSelection}
          />
          <MenuButton
            icon={<RotateCw className="w-4 h-4" />}
            label="Rotate Selected 180°"
            onClick={wrapAction(() => onRotateSelection(180))}
            disabled={!hasSelection}
          />
          <MenuButton
            icon={<RotateCw className="w-4 h-4" />}
            label="Rotate Selected 270°"
            onClick={wrapAction(() => onRotateSelection(270))}
            disabled={!hasSelection}
          />
        </Menu>

        <Menu
          label="Selection"
          menuRef={(node) => (menuRefs.current[2] = node)}
          onToggle={() => handleMenuToggle(2)}
        >
          <MenuButton
            icon={<MousePointerSquareDashed className="w-4 h-4" />}
            label="Select All"
            onClick={wrapAction(onSelectAll)}
            disabled={!hasPages}
          />
          <MenuButton
            icon={<MousePointerSquareDashed className="w-4 h-4" />}
            label="Clear Selection"
            onClick={wrapAction(onClearSelection)}
            disabled={!hasSelection}
          />
          <MenuButton
            icon={<MousePointerSquareDashed className="w-4 h-4" />}
            label="Invert Selection"
            onClick={wrapAction(onInvertSelection)}
            disabled={!hasPages}
          />
        </Menu>

        <Menu label="Export" menuRef={(node) => (menuRefs.current[3] = node)} onToggle={() => handleMenuToggle(3)}>
          <MenuSection title="Workspace">
            <QualityButtons disabled={!hasPages} onSelect={(quality) => wrapAction(() => onExportWorkspace(quality))()} />
          </MenuSection>
          <MenuSection title="Selection">
            <QualityButtons
              disabled={!hasSelection}
              onSelect={(quality) => wrapAction(() => onExportSelection(quality))()}
            />
          </MenuSection>
          <MenuSection title="Bin">
            <QualityButtons disabled={!hasBin} onSelect={(quality) => wrapAction(() => onExportBin(quality))()} />
          </MenuSection>
        </Menu>
      </div>
    </div>
  )
}

function Menu({
  label,
  children,
  menuRef,
  onToggle,
}: {
  label: string
  children: React.ReactNode
  menuRef?: (node: HTMLDetailsElement | null) => void
  onToggle?: () => void
}) {
  return (
    <details className="group relative" ref={menuRef} onToggle={onToggle}>
      <summary className="flex list-none cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
        {label}
        <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-60 rounded-2xl border border-border bg-card/98 p-2 shadow-xl backdrop-blur">
        {children}
      </div>
    </details>
  )
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-2 py-1">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
      {children}
    </div>
  )
}

function MenuButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function QualityButtons({
  disabled,
  onSelect,
}: {
  disabled?: boolean
  onSelect: (quality: ExportQuality) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(["high", "medium", "low"] as const).map((quality) => (
        <Button
          key={quality}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(quality)}
        >
          <Download className="w-4 h-4" />
          {quality[0].toUpperCase() + quality.slice(1)}
        </Button>
      ))}
    </div>
  )
}
