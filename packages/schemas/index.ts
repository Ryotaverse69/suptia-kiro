// Sanity schema exports for Suptia MVP
import { ingredient } from './ingredient';
import { product } from './product';
import { evidence } from './evidence';
import { rule } from './rule';
import { persona } from './persona';
import { category } from './category';
import { brand } from './brand';
import { ingredientDetail } from './ingredientDetail';

export {
  ingredient,
  product,
  evidence,
  rule,
  persona,
  category,
  brand,
  ingredientDetail,
};
export { deskStructure } from './desk';

// Schema array for Sanity config
export const schemaTypes = [
  ingredient,
  product,
  evidence,
  rule,
  persona,
  category,
  brand,
  ingredientDetail,
];
