export function validateTask(payload) {
  const errors = {};
  if (!payload.title || String(payload.title).trim().length === 0) errors.title = 'Title is required';
  if (payload.effortDays != null && (isNaN(payload.effortDays) || payload.effortDays < 0)) errors.effortDays = 'Effort should be a non-negative number';
  if (payload.dueDate) {
    const d = new Date(payload.dueDate);
    if (isNaN(d.getTime())) errors.dueDate = 'Invalid date';
  }
  return errors;
}
