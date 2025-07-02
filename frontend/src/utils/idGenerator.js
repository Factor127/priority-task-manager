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

// Use this in your task creation code instead of just Date.now()
export default generateUniqueId;