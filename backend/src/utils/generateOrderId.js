/**
 * Generate a unique order ID in the format MV-XXXXXX
 */
const generateOrderId = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `MV-${num}`;
};

export default generateOrderId;
