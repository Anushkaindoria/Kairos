declare module 'lucide-react' {
  import type { ComponentType, SVGProps } from 'react'

  type IconProps = SVGProps<SVGSVGElement> & {
    size?: number | string
    strokeWidth?: number | string
  }
  type LucideIcon = ComponentType<IconProps>

  export const AlertTriangle: LucideIcon
  export const ArrowLeft: LucideIcon
  export const ArrowLeftRight: LucideIcon
  export const ArrowRight: LucideIcon
  export const Bell: LucideIcon
  export const BellOff: LucideIcon
  export const Bot: LucideIcon
  export const CheckCircle2: LucideIcon
  export const ChevronDown: LucideIcon
  export const Cpu: LucideIcon
  export const Download: LucideIcon
  export const Eye: LucideIcon
  export const EyeOff: LucideIcon
  export const Gauge: LucideIcon
  export const HandCoins: LucideIcon
  export const KeyRound: LucideIcon
  export const LayoutDashboard: LucideIcon
  export const Lightbulb: LucideIcon
  export const Lock: LucideIcon
  export const LogOut: LucideIcon
  export const Mail: LucideIcon
  export const Pencil: LucideIcon
  export const Plus: LucideIcon
  export const RotateCcw: LucideIcon
  export const Search: LucideIcon
  export const Send: LucideIcon
  export const ServerOff: LucideIcon
  export const ShieldCheck: LucideIcon
  export const ShoppingBag: LucideIcon
  export const SlidersHorizontal: LucideIcon
  export const Sparkles: LucideIcon
  export const StopCircle: LucideIcon
  export const Target: LucideIcon
  export const Trash2: LucideIcon
  export const TrendingUp: LucideIcon
  export const User: LucideIcon
  export const Wallet: LucideIcon
  export const Wifi: LucideIcon
  export const WifiOff: LucideIcon
  export const X: LucideIcon
  export const Zap: LucideIcon
}
