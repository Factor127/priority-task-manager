// frontend/src/utils/idGenerator.js
// Create this file to fix the generateUniqueId undefined errors

let idCounter = 0;

export const generateUniqueId = () => {
  const timestamp = Date.now();
  const counter = ++idCounter;
  const random = Math.random().toString(36).substr(2, 5);
  return `${timestamp}-${counter}-${random}`;
};

// Alternative method using crypto if available
export const generateCryptoId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return generateUniqueId();
};

// Export as default
export default generateUniqueId;