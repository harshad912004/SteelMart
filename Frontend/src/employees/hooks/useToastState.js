import { useCallback, useState } from 'react';

const DEFAULT_TOAST_STATE = {
  isOpen: false,
  message: '',
  isSuccess: true,
};

export default function useToastState() {
  const [toast, setToast] = useState(DEFAULT_TOAST_STATE);

  const showToast = useCallback((message, isSuccess = true) => {
    setToast({ isOpen: true, message, isSuccess });
  }, []);

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, isOpen: false }));
  }, []);

  return {
    toast,
    setToast,
    showToast,
    closeToast,
  };
}