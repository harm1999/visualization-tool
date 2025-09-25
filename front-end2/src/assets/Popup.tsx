import React from 'react';
import { X } from 'lucide-react';
import Button from '../components/elements/Button';

interface PopupProps {
  /** Controls visibility of the popup */
  open: boolean;
  /** Title displayed in the header */
  title: string;
  /** Handler to close the popup */
  onClose: () => void;
  /** Main content of the popup */
  children: React.ReactNode;
  /** Optional footer actions (e.g. buttons) */
  footer?: React.ReactNode;
}

/**
 * A reusable modal popup component.
 */
const Popup: React.FC<PopupProps> = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop: click to close */}
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />

      {/* Modal container */}
      <div className="text-tool-dark rounded-2xl p-6 z-10 w-11/12 max-w-md shadow-xl bg-white">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 mb-2 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button className='text-white bg-tool-blue' onClick={onClose} aria-label="Close popup">
            <X size={20} />
          </Button>
        </div>

        {/* Body */}
        <div className="mb-4">
          {children}
        </div>

        {/* Footer: custom or default Close button */}
        <div className="mt-6 flex justify-end space-x-2">
          {footer ? footer : <Button className='text-white bg-tool-blue' onClick={onClose}>Close</Button>}
        </div>
      </div>
    </div>
  );
};

export default Popup;