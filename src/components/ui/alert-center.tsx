import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useAlert, hideAlert } from '@/hooks/use-alert';

export function AlertCenter() {
  const { open, title, description, confirmText, type } = useAlert();

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : AlertTriangle;
  const color = type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-yellow-500';

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && hideAlert()}>
      <AlertDialogContent className="max-w-sm">
        <div className="flex items-center space-x-3">
          <Icon className={`h-6 w-6 ${color}`} />
          {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
        </div>
        {description && (
          <AlertDialogDescription className="mt-2">{description}</AlertDialogDescription>
        )}
        <div className="mt-4 flex justify-end">
          <AlertDialogAction onClick={() => hideAlert()}>
            {confirmText ?? 'OK'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
