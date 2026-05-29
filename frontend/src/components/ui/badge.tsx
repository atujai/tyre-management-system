import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        mounted: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        inventory: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
        stepney: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
        worn: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
        damaged: 'border-red-500/30 bg-red-500/10 text-red-400',
        repair: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
        scrapped: 'border-gray-500/30 bg-gray-500/10 text-gray-400',
        godown: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
        retreader: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
        ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        burst: 'border-red-500/30 bg-red-500/10 text-red-400',
        claim: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
        puncture: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
        retreadCheckup: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
