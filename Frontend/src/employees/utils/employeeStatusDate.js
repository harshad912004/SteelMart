import { formatDateTime, formatRelativeTime } from './dateFormat';
import { getEntityStatus } from './entityStatus';

export const formatEmployeeLastLogin = (lastLogin) => formatRelativeTime(lastLogin);

export const formatEmployeeJoinedDate = (date) => formatDateTime(date);

export const getEmployeeStatus = (employee) => getEntityStatus(employee);