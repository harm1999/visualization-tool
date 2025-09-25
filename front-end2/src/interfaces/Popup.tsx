// Popup.tsx
import { ReactNode } from 'react';
import Button from '@/components/elements/Button';
import { X } from 'lucide-react';

export interface PopupProps {
  /** Whether the popup is visible */
  open: boolean;
  /** Callback to close the popup */
  onClose: () => void;
  /** Title to render in the header */
  title: string;
  /** Anything you want to render inside the body */
  children: ReactNode;
  /** Optional footer buttons or actions */
  footer?: ReactNode;
}

const Popup = ({ open, onClose, title, children, footer }: PopupProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />

      {/* Modal container */}
      <div className="bg-gray-800 text-gray-100 rounded-2xl p-6 z-10 w-11/12 max-w-md shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Body */}
        <div className="mb-4">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="mt-6 flex justify-end space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
