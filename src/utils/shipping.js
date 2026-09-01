/**
 * Weight-Based Shipping Rate Calculator
 * Mazhai Vaanam Boutique
 *
 * Standard  (<=0.5 kg)  -> Rs.60
 * Upto 1kg  (<=1.0 kg)  -> Rs.75
 * Upto 1.5kg            -> Rs.90
 * Upto 2kg              -> Rs.115
 * Upto 2.5kg            -> Rs.130
 * Upto 3kg              -> Rs.145
 * Upto 4kg              -> Rs.170
 * Upto 5kg              -> Rs.190
 * Above 5kg             -> Rs.220
 * Express surcharge     -> +Rs.60
 * Store Pickup          -> Rs.0 Free
 */

export const DEFAULT_SAREE_WEIGHT_KG = 0.5;

export const SHIPPING_RATES = [
  { label: 'Standard',   uptoKg: 0.5,       price: 60  },
  { label: 'Upto 1kg',   uptoKg: 1.0,       price: 75  },
  { label: 'Upto 1.5kg', uptoKg: 1.5,       price: 90  },
  { label: 'Upto 2kg',   uptoKg: 2.0,       price: 115 },
  { label: 'Upto 2.5kg', uptoKg: 2.5,       price: 130 },
  { label: 'Upto 3kg',   uptoKg: 3.0,       price: 145 },
  { label: 'Upto 4kg',   uptoKg: 4.0,       price: 170 },
  { label: 'Upto 5kg',   uptoKg: 5.0,       price: 190 },
  { label: 'Above 5kg',  uptoKg: Infinity,   price: 220 },
];

export const EXPRESS_SURCHARGE = 60;

export function getBaseShippingRate(totalWeightKg) {
  const slab = SHIPPING_RATES.find((r) => totalWeightKg <= r.uptoKg);
  return slab ? slab.price : 220;
}

export function calculateShipping(totalWeightKg, deliveryMode) {
  if (deliveryMode === 'pickup') {
    return { shippingFee: 0, shippingWeight: totalWeightKg, shippingLabel: 'Store Pickup (Free)' };
  }
  const baseRate = getBaseShippingRate(totalWeightKg);
  const surcharge = deliveryMode === 'express' ? EXPRESS_SURCHARGE : 0;
  const shippingFee = baseRate + surcharge;
  const slab = SHIPPING_RATES.find((r) => totalWeightKg <= r.uptoKg);
  const label = (slab ? slab.label : 'Heavy') + ' (' + totalWeightKg.toFixed(2) + ' kg)' + (deliveryMode === 'express' ? ' + Express' : '');
  return { shippingFee, shippingWeight: totalWeightKg, shippingLabel: label };
}

export function calculateTotalWeight(items) {
  return items.reduce((total, item) => {
    const weight = Number(item.weightKg) || DEFAULT_SAREE_WEIGHT_KG;
    const qty = Number(item.quantity) || 1;
    return total + weight * qty;
  }, 0);
}
