// Re-export canonical implementation from `hooks` to avoid duplicated logic.
// This keeps the original import path `@/components/ui/use-toast` working
// while maintaining a single source-of-truth in `hooks/use-toast`.

export { useToast, toast } from '@/hooks/use-toast'
