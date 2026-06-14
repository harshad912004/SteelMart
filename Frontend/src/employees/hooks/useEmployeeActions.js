import { useCallback } from 'react';
import {
  activeEmployee,
  blockEmployee,
  deleteEmployee,
  inactiveEmployee,
  unblockEmployee,
} from '../../common/services/api';

export default function useEmployeeActions({ showToast } = {}) {
  const runAction = useCallback(async (employee, requestAction, messages, afterSuccess) => {
    if (!employee) {
      return null;
    }

    try {
      const data = await requestAction(employee.id);
      showToast?.(data.message || messages.success, true);
      await afterSuccess?.(data);
      return data;
    } catch (error) {
      showToast?.(error.message || messages.error, false);
      return null;
    }
  }, [showToast]);

  const activateEmployeeAccount = useCallback((employee, afterSuccess) => (
    runAction(
      employee,
      activeEmployee,
      { success: 'Employee active successfully', error: 'Failed to active employee' },
      afterSuccess,
    )
  ), [runAction]);

  const deactivateEmployeeAccount = useCallback((employee, afterSuccess) => (
    runAction(
      employee,
      inactiveEmployee,
      { success: 'Employee inactive successfully', error: 'Failed to inactive employee' },
      afterSuccess,
    )
  ), [runAction]);

  const blockEmployeeAccount = useCallback((employee, afterSuccess) => (
    runAction(
      employee,
      blockEmployee,
      { success: 'Employee blocked successfully', error: 'Failed to block employee' },
      afterSuccess,
    )
  ), [runAction]);

  const unblockEmployeeAccount = useCallback((employee, afterSuccess) => (
    runAction(
      employee,
      unblockEmployee,
      { success: 'Employee unblocked successfully', error: 'Failed to unblock employee' },
      afterSuccess,
    )
  ), [runAction]);

  const removeEmployee = useCallback((employee, afterSuccess) => (
    runAction(
      employee,
      deleteEmployee,
      { success: 'Employee deleted successfully', error: 'Failed to delete employee' },
      afterSuccess,
    )
  ), [runAction]);

  return {
    activateEmployeeAccount,
    deactivateEmployeeAccount,
    blockEmployeeAccount,
    unblockEmployeeAccount,
    removeEmployee,
  };
}