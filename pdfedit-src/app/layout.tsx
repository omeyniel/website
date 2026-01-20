import "./globals.css"
import type { ReactNode } from "react"

export const metadata = {
  title: "PDF Editor",
  description: "Split and merge PDF files",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
