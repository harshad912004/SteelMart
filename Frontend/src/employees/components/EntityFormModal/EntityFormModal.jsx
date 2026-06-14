import React from 'react';
import Modal from '../Modal';

function EntityFormModal({
  isOpen,
  onClose,
  title,
  children,
  actions,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {children}
      {actions}
    </Modal>
  );
}

export default EntityFormModal;