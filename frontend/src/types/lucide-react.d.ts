declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface LucideProps extends Partial<Omit<SVGProps<SVGSVGElement>, "ref">> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  }
  
  export type LucideIcon = ComponentType<LucideProps>;
  
  export const ChevronRight: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const X: LucideIcon;
  export const Send: LucideIcon;
  export const Loader2: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Bell: LucideIcon;
  export const Plus: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Heart: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const TrendingUp: LucideIcon;
  
  // Add other icons as needed
  const lucideReact: {
    [key: string]: LucideIcon;
  };
  
  export default lucideReact;
}
