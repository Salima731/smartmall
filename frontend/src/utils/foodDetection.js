export const FOOD_SHOP_TYPES = ['Restaurant', 'Food Court', 'Cafe', 'Bakery', 'Juice Bar'];

const FOOD_KEYWORDS = [
  'food',
  'restaurant',
  'cafe',
  'bakery',
  'juice',
  'burger',
  'kfc',
  'pizza',
  'coffee',
  'biryani',
  'biriyani',
  'briyani',
  'biriani',
  'mcdonald',
  'mcdonalds',
];

const containsFoodKeyword = (value) => {
  if (!value) return false;
  const normalized = value.toString().toLowerCase();
  return FOOD_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

export const isFoodProduct = (product) => (
  Boolean(product?.isFoodItem) ||
  FOOD_SHOP_TYPES.includes(product?.shop?.shopType) ||
  containsFoodKeyword(product?.category) ||
  containsFoodKeyword(product?.name) ||
  containsFoodKeyword(product?.shop?.name) ||
  containsFoodKeyword(product?.shop?.category)
);
