// UIコンポーネントエクスポート
export * from './ui';

// コンポーネントエクスポート
export { LegacyWarningBanner } from './LegacyWarningBanner';
export { PersonaWarnings } from './PersonaWarnings';
export { PriceTable } from './PriceTable';
export { WarningBanner } from './WarningBanner';
export { ScoreDisplay } from './ScoreDisplay';
export { ScoreBreakdown } from './ScoreBreakdown';
export { ProductScoringClient } from './ProductScoringClient';
export { SearchBar } from './SearchBar';
export { AppleSearchBar } from './AppleSearchBar';
export { SuggestChips, defaultSuggestChips } from './SuggestChips';
export { default as HeroSearch } from './HeroSearch';
export { default as SectionHeader } from './SectionHeader';
export { default as CompareCard } from './CompareCard';
export { default as PopularComparisonsSection } from './PopularComparisonsSection';
export {
  AIRecommendationSearchBar,
  useAIRecommendationSearch,
} from './AIRecommendationSearchBar';
export { FavoriteButton } from './FavoriteButton';
export { PriceHistoryChart } from './PriceHistoryChart';
export { PriceComparison } from './PriceComparison';

// 成分ガイド関連コンポーネント
export { default as IngredientCategoryCard } from './IngredientCategoryCard';
export { default as IngredientCard } from './IngredientCard';
export { default as IngredientDetailModal } from './IngredientDetailModal';
export { default as IngredientFilters } from './IngredientFilters';
export { default as IngredientGuideSection } from './IngredientGuideSection';
export { default as PurposeCategoryCard } from './PurposeCategoryCard';

// 比較機能コンポーネント
export { ComparisonTable } from './ComparisonTable';
export { ComparisonFilters } from './ComparisonFilters';
export { ProductComparisonModal } from './ProductComparisonModal';

// 型エクスポート
export type { ScoreDisplayProps } from './ScoreDisplay';
export type { ScoreBreakdownProps } from './ScoreBreakdown';
export type { ProductScoringClientProps } from './ProductScoringClient';
export type { SearchBarProps, Recommendation } from './SearchBar';
export type { AppleSearchBarProps, AISuggestion } from './AppleSearchBar';
export type { SuggestChipsProps, SuggestChip } from './SuggestChips';
export type { AIRecommendationSearchBarProps } from './AIRecommendationSearchBar';
export type {
  Product as ComparisonProduct,
  ComparisonCriteria,
} from './ComparisonTable';
