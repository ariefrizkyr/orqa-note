import { useToastStore } from '../../stores/toast-store'

const placementClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4'
}

export function Toast() {
  const toast = useToastStore((s) => s.toast)

  if (!toast) return null

  return (
    <div className={`fixed z-50 ${placementClasses[toast.placement]}`}>
      <div className="rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-100 shadow-lg border border-neutral-700">
        {toast.message}
      </div>
    </div>
  )
}
