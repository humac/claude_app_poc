// Asset status values used throughout the application
export const ASSET_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'returned', label: 'Returned' },
  { value: 'lost', label: 'Lost' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'retired', label: 'Retired' },
];

export const getStatusLabel = (value) => {
  const status = ASSET_STATUSES.find(s => s.value === value);
  return status ? status.label : value;
};
