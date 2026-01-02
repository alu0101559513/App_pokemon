import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal visibility state.
 * Provides a simple interface for showing/hiding modals.
 * 
 * @param initialState - Initial visibility state (default: false)
 * @returns Object with isOpen state and open/close/toggle functions
 * 
 * @example
 * ```tsx
 * const loginModal = useModal();
 * const confirmModal = useModal(false);
 * 
 * return (
 *   <>
 *     <button onClick={loginModal.open}>Open Login</button>
 *     <Modal visible={loginModal.isOpen} onClose={loginModal.close}>
 *       <LoginForm />
 *     </Modal>
 *   </>
 * );
 * ```
 */
export function useModal(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);

  /**
   * Opens the modal
   */
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  /**
   * Closes the modal
   */
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Toggles the modal state
   */
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
