import { useTheme } from 'next-themes'
import { toast, Toaster as Sonner, ToasterProps } from 'sonner'
import React from 'react'
import { CircleX, X } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

const ErrorToast = ({ t, children, ...props }: { t: number | string; children: React.ReactNode }) => {
  return (
    <div className="flex gap-2 rounded-md border border-rose-500 bg-rose-500/20 p-4 text-rose-500" {...props}>
      <CircleX />
      {children}
      <Button className="absolute right-2 top-2" variant="ghost" size="icon" onClick={() => toast.dismiss(t)}>
        <X />
      </Button>
    </div>
  )
}

export default ErrorToast

export { Toaster }
