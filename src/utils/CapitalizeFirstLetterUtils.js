// Function to capitalize the first letter of a string
export const capitalizeFirstLetter = str => {
  if (str && typeof str === 'string') {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return '';
};
