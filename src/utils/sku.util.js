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
export const normalizeName = (name = '') => {
  let cleaned = name.toLowerCase().trim().replace(/\s+/g, ' ');
  const words = cleaned.split(' ');
  
  // Strip common color words and modifiers from the end of the name to group variants correctly
  const colorWords = ['red', 'green', 'blue', 'yellow', 'black', 'white', 'pink', 'orange', 'purple', 'maroon', 'navy', 'gold', 'silver', 'grey', 'gray', 'brown', 'peach', 'magenta', 'cyan', 'teal', 'violet', 'indigo', 'rose', 'beige', 'mustard', 'olive', 'wine', 'light', 'dark', 'deep', 'pale', 'neon', 'pastel'];
  
  while (words.length > 1 && colorWords.includes(words[words.length - 1])) {
    words.pop();
  }
  
  return words.join(' ');
};

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
  const { name, category, fabric } = productData;

  // 1. Get category code
  let catCode = 'MV';
  if (category) {
    const cat = await Category.findById(category).lean();
    if (cat) catCode = toCode(cat.name);
  }

  // 1.5 Get fabric code
  let fabCode = '';
  if (fabric) {
    fabCode = toCode(fabric);
  }

  const normalized = normalizeName(name);

  // 2. Check if same name + category + fabric already has a pattern
  const existingPattern = await Product.findOne({
    normalizedName: normalized,
    category: category,
    fabric: fabric,
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
    // 🆕 New pattern — count distinct patternCodes in this category AND fabric
    const existingPatterns = await Product.distinct('patternCode', {
      category: category,
      fabric: fabric,
      patternCode: { $exists: true, $ne: null, $ne: '' },
    });
    const nextPatNum = String(existingPatterns.length + 1).padStart(3, '0');
    patternCode = fabCode ? `${catCode}-${fabCode}-${nextPatNum}` : `${catCode}-${nextPatNum}`;
    patternSeq = 1;
  }

  // 3. Build SKU: MV-{CAT}-{FABRIC}-{PAT_NUM}-{SEQ}
  const seqStr = String(patternSeq).padStart(2, '0');
  
  // patternCode is already `CAT-FAB-001` or `CAT-001`, so we just append it to MV-
  const sku = `MV-${patternCode}-${seqStr}`;

  return { sku, patternCode, patternSeq, normalizedName: normalized };
};
