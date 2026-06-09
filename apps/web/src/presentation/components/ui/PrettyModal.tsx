import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(Flip, CustomEase);

interface PrettyModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerElement: HTMLElement | null;
  children: React.ReactNode;
  className?: string;
}

export function PrettyModal({
  isOpen,
  onClose,
  triggerElement,
  children,
  className = '',
}: PrettyModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // We use useGSAP to handle transition logic reactively
  useGSAP(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setIsAnimating(true);

      const trigger = triggerElement || (document.activeElement as HTMLElement);
      if (!trigger) {
        dialog.showModal();
        setIsAnimating(false);
        return;
      }

      // Assign matching flip-id
      const flipId = `flip-modal-${Math.random().toString(36).substring(2, 9)}`;
      dialog.dataset.flipId = flipId;
      trigger.dataset.flipId = flipId;

      // Reset styles and classes
      dialog.removeAttribute('style');
      dialog.classList.remove('pretty-modal-closing');
      dialog.classList.add('pretty-modal-opening');

      // Capture trigger state
      const originState = Flip.getState(trigger);

      // Show dialog natively
      dialog.showModal();

      // Morph from trigger's bounds to dialog's center bounds
      Flip.from(originState, {
        targets: dialog,
        scale: true,
        ease: CustomEase.create(
          'custom',
          'M0,0 C0.305,0.206 0.116,0.567 0.3,0.8 0.394,0.921 0.491,1 1,1'
        ),
        duration: 0.7,
        onComplete: () => {
          dialog.classList.remove('pretty-modal-opening');
          setIsAnimating(false);
        },
      });
    } else {
      // Closing flow
      if (dialog.open && !isAnimating) {
        setIsAnimating(true);
        const trigger =
          triggerElement ||
          (document.querySelector(`[data-flip-id="${dialog.dataset.flipId}"]:not([open])`) as HTMLElement);

        dialog.classList.add('pretty-modal-closing');

        const completeClose = () => {
          dialog.classList.remove('pretty-modal-closing');
          dialog.removeAttribute('style');
          dialog.close();
          setIsAnimating(false);
        };

        if (trigger) {
          const originState = Flip.getState(trigger);

          Flip.to(originState, {
            targets: dialog,
            scale: true,
            ease: CustomEase.create(
              'custom',
              'M0,0 C0.305,0.206 0.116,0.567 0.3,0.8 0.394,0.921 0.491,1 1,1'
            ),
            duration: 0.7,
            onComplete: completeClose,
          });
        } else {
          completeClose();
        }
      }
    }
  }, { dependencies: [isOpen], revertOnUpdate: false });

  // Escape key cancels the modal natively. We catch this to update parent state.
  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

  // Click outside (backdrop click) detection
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleDialogClick}
      className={`pretty-modal-dialog ${className}`}
    >
      {children}
    </dialog>
  );
}
