export const getEntityStatus = (entity) => {
  if (entity?.is_deleted) {
    return 'Deleted';
  }

  if (entity?.is_blocked) {
    return 'Blocked';
  }

  if (entity?.is_active) {
    return 'Active';
  }

  return 'Inactive';
};