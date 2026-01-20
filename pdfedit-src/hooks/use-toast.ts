type ToastOptions = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const toast = (_options: ToastOptions) => {
    // No-op placeholder for build completeness.
  }

  return { toast }
}
