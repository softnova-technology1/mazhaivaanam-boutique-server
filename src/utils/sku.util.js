import Product from '../models/Product.js';
import Category from '../models/Category.js';

/**
 * Generate a short 2-3 letter code from a string (category or sub-category name)
 * e.g. "Everyday Elegance" → "EE", "Kanjivaram" → "KAN"
 */
export const toCode = (str = '') => {
  const words = str.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words.map(w => w[0]).join('').slice(0, 4).toUpperCase();
};

/**
 * Normalize product name for pattern matching
 * Removes extra spaces, lowercases, trims
 */
export const normalizeName = (name = '') =>
  name.toLowerCase().trim().replace(/\s+/g, ' ');

/**
 * Generate Auto SKU and assign patternCode + patternSeq to a new product.
 *
 * SKU Format: MV-{CAT}-{PAT_NUM}-{SEQ}
 * Example:    MV-EE-001-01
 *
 * Pattern Identity: Products with same normalizedName + same category = same pattern
 *
 * @param {Object} productData - { name, category (ObjectId) }
 * @returns {{ sku, patternCode, patternSeq, normalizedName }}
 */
export const generateSKU = async (productData) => {
  const { name, category } = productData;

  // 1. Get category code
  let catCode = 'MV';
  if (category) {
    const cat = await Category.findById(category).lean();
    if (cat) catCode = toCode(cat.name);
  }

  const normalized = normalizeName(name);

  // 2. Check if same name + category already has a pattern
  const existingPattern = await Product.findOne({
    normalizedName: normalized,
    category: category,
  })
    .sort({ patternSeq: -1 })
    .select('patternCode patternSeq')
    .lean();

  let patternCode, patternSeq;

  if (existingPattern && existingPattern.patternCode) {
    // ✅ Same pattern found — use existing patternCode, increment seq
    patternCode = existingPattern.patternCode;
    patternSeq = (existingPattern.patternSeq || 1) + 1;
  } else {
    // 🆕 New pattern — count distinct patternCodes in this category
    const existingPatterns = await Product.distinct('patternCode', {
      category: category,
      patternCode: { $exists: true, $ne: null, $ne: '' },
    });
    const nextPatNum = String(existingPatterns.length + 1).padStart(3, '0');
    patternCode = `${catCode}-${nextPatNum}`;
    patternSeq = 1;
  }

  // 3. Build SKU: MV-{CAT}-{PAT_NUM}-{SEQ}
  const seqStr = String(patternSeq).padStart(2, '0');
  const sku = `MV-${catCode}-${patternCode.split('-').pop()}-${seqStr}`;

  return { sku, patternCode, patternSeq, normalizedName: normalized };
};
