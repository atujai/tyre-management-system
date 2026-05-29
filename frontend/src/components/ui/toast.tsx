import * as React from 'react'
import { create } from 'zustand'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  title: string
  description?: string
  variant: 'success' | 'error' | 'info'
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: Math.random().toString(36).substring(7) },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: 'success' }),
  error: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: 'error' }),
  info: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: 'info' }),
}

export function Toaster() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'animate-slide-in flex items-start gap-3 rounded-lg border p-4 shadow-lg min-w-[300px] max-w-[400px]',
            toast.variant === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
            toast.variant === 'error' && 'border-red-500/30 bg-red-500/10 text-red-400',
            toast.variant === 'info' && 'border-blue-500/30 bg-blue-500/10 text-blue-400'
          )}
        >
          {toast.variant === 'success' && <CheckCircle className="h-5 w-5 shrink-0" />}
          {toast.variant === 'error' && <AlertCircle className="h-5 w-5 shrink-0" />}
          {toast.variant === 'info' && <Info className="h-5 w-5 shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold text-sm">{toast.title}</p>
            {toast.description && (
              <p className="text-xs mt-1 opacity-80">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 opacity-60 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
