export function constructQueryParams(params) {
  // Remove null or blank parameters
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value != null && value !== '')
  );

  return new URLSearchParams(filteredParams).toString();
}
