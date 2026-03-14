import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        ref={modalRef}
        className="bg-surface border border-white/10 w-full max-w-lg rounded-3xl shadow-premium overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
