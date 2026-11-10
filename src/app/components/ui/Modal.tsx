import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, children }) => {
  // Impede a página de fundo de rolar enquanto o modal está aberto
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      {/* min-h-full + items-start: em telas baixas o conteúdo começa no topo e a janela rola */}
      <div className="flex min-h-full items-start sm:items-center justify-center p-3 sm:p-4">
        {children}
      </div>
    </div>
  );
};
