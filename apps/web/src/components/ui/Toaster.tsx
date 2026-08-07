import * as React from "react"
import { Toaster as ToastPrimitive } from "react-hot-toast"

/** CSS vars are RGB channel triples — use rgb(), never hsl(). */
export function Toaster() {
  return (
    <ToastPrimitive
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgb(var(--surface))',
          color: 'rgb(var(--ink))',
          border: '1px solid rgb(var(--border))',
        },
        success: {
          iconTheme: {
            primary: 'rgb(var(--success))',
            secondary: 'rgb(var(--surface))',
          },
        },
        error: {
          iconTheme: {
            primary: 'rgb(var(--danger))',
            secondary: 'rgb(var(--surface))',
          },
        },
      }}
    />
  )
}
