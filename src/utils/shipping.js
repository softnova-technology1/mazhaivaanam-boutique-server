/**
 * Weight + Zone Based Shipping Rate Calculator
 * Mazhai Vaanam Boutique
 *
 * Zone is picked from the shipping address — pin code first (that is how couriers
 * actually zone a parcel), state name as fallback when the pin code is missing/invalid.
 *
 *                         Tamil Nadu   Other States
 * Standard  (<=0.5 kg)    Rs.40        Rs.60
 * Upto 1kg  (<=1.0 kg)    Rs.60        Rs.75
 * Upto 1.5kg              Rs.80        Rs.90
 * Upto 2kg                Rs.100       Rs.115
 * Upto 2.5kg              Rs.120       Rs.130
 * Upto 3kg                Rs.140       Rs.145
 * Upto 4kg                Rs.160       Rs.170
 * Upto 5kg                Rs.180       Rs.190
 * Above 5kg               Rs.200       Rs.220
 * Express surcharge       +Rs.60 (both zones)
 * Store Pickup            Rs.0 Free
 */

export const DEFAULT_SAREE_WEIGHT_KG = 0.5;
export const EXPRESS_SURCHARGE = 60;

export const ZONE_TAMIL_NADU = 'Tamil Nadu';
export const ZONE_OTHER = 'Other States';

export const SHIPPING_ZONES = {
  [ZONE_TAMIL_NADU]: [
    { label: 'Standard',   uptoKg: 0.5,      price: 40  },
    { label: 'Upto 1kg',   uptoKg: 1.0,      price: 60  },
    { label: 'Upto 1.5kg', uptoKg: 1.5,      price: 80  },
    { label: 'Upto 2kg',   uptoKg: 2.0,      price: 100 },
    { label: 'Upto 2.5kg', uptoKg: 2.5,      price: 120 },
    { label: 'Upto 3kg',   uptoKg: 3.0,      price: 140 },
    { label: 'Upto 4kg',   uptoKg: 4.0,      price: 160 },
    { label: 'Upto 5kg',   uptoKg: 5.0,      price: 180 },
    { label: 'Above 5kg',  uptoKg: Infinity, price: 200 },
  ],
  [ZONE_OTHER]: [
    { label: 'Standard',   uptoKg: 0.5,      price: 60  },
    { label: 'Upto 1kg',   uptoKg: 1.0,      price: 75  },
    { label: 'Upto 1.5kg', uptoKg: 1.5,      price: 90  },
    { label: 'Upto 2kg',   uptoKg: 2.0,      price: 115 },
    { label: 'Upto 2.5kg', uptoKg: 2.5,      price: 130 },
    { label: 'Upto 3kg',   uptoKg: 3.0,      price: 145 },
    { label: 'Upto 4kg',   uptoKg: 4.0,      price: 170 },
    { label: 'Upto 5kg',   uptoKg: 5.0,      price: 190 },
    { label: 'Above 5kg',  uptoKg: Infinity, price: 220 },
  ],
};

// India Post PIN zone 60–64 = Tamil Nadu (Puducherry's 605xxx/609xxx fall inside and get the TN rate too)
const TN_PIN_MIN = 600000;
const TN_PIN_MAX = 643999;
const TN_STATE_ALIASES = new Set(['tamilnadu', 'tn', 'tamilnad']);

/**
 * Pick the shipping zone from a shipping address ({ state, pinCode }).
 */
export function resolveShippingZone({ state = '', pinCode = '' } = {}) {
  const pin = String(pinCode).replace(/\D/g, '');
  if (pin.length === 6) {
    return Number(pin) >= TN_PIN_MIN && Number(pin) <= TN_PIN_MAX ? ZONE_TAMIL_NADU : ZONE_OTHER;
  }
  const stateKey = String(state).toLowerCase().replace(/[^a-z]/g, '');
  return TN_STATE_ALIASES.has(stateKey) ? ZONE_TAMIL_NADU : ZONE_OTHER;
}

function findSlab(totalWeightKg, zone) {
  const rates = SHIPPING_ZONES[zone] || SHIPPING_ZONES[ZONE_OTHER];
  return rates.find((r) => totalWeightKg <= r.uptoKg);
}

export function calculateShipping(totalWeightKg, deliveryMode, address = {}) {
  if (deliveryMode === 'pickup') {
    return { shippingFee: 0, shippingWeight: totalWeightKg, shippingLabel: 'Store Pickup (Free)', shippingZone: '' };
  }
  const shippingZone = resolveShippingZone(address);
  const slab = findSlab(totalWeightKg, shippingZone);
  const surcharge = deliveryMode === 'express' ? EXPRESS_SURCHARGE : 0;
  const shippingFee = slab.price + surcharge;
  const shippingLabel = slab.label + ' (' + totalWeightKg.toFixed(2) + ' kg) · ' + shippingZone + (deliveryMode === 'express' ? ' + Express' : '');
  return { shippingFee, shippingWeight: totalWeightKg, shippingLabel, shippingZone };
}

export function calculateTotalWeight(items) {
  const total = items.reduce((sum, item) => {
    const weight = Number(item.weightKg) || DEFAULT_SAREE_WEIGHT_KG;
    const qty = Number(item.quantity) || 1;
    return sum + weight * qty;
  }, 0);
  // Round to grams so float noise (0.35 * 3 = 1.0499999…) never pushes an order into the next slab
  return Math.round(total * 1000) / 1000;
}
