import { HeroSearch } from "@/components/search/HeroSearch";
import { PopularComparisonsSection } from "@/components/sections/PopularComparisons";
import { IngredientGuideSection } from "@/components/sections/IngredientGuide";
import { searchProducts } from "@/lib/search";
import {
  getPopularIngredients,
  PURPOSE_CATEGORIES,
} from "@/lib/ingredient-data";
import type { IngredientGuideItem } from "@/components/sections/IngredientGuide";
import { generateSEO } from "@/lib/seo-config";

export const metadata = generateSEO({
  title: "サプティア - 科学的根拠に基づくサプリメント比較",
  description:
    "人気サプリメントの価格・成分・エビデンス情報を横断比較。AIが最適なサプリメント探しをサポートします。",
  url: "https://suptia.com",
  tags: ["サプリメント比較", "価格比較", "成分ガイド"],
});

export const revalidate = 600;

function mapEvidenceLevel(level: "high" | "medium" | "low"): "A" | "B" | "C" {
  if (level === "high") return "A";
  if (level === "medium") return "B";
  return "C";
}

function mapSafety(sideEffectsCount: number): "高" | "中" | "要注意" {
  if (sideEffectsCount === 0) return "高";
  if (sideEffectsCount === 1) return "中";
  return "要注意";
}

export default async function MarketingHomePage() {
  const [searchResponse, popularIngredients] = await Promise.all([
    searchProducts({ sort: "rating_desc", pageSize: 6 }),
    Promise.resolve(getPopularIngredients(9)),
  ]);

  const products = searchResponse.items.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    imageUrl: product.imageUrl,
    mainIngredients: product.mainIngredients?.slice(0, 3) ?? [],
    lowestPrice: product.priceRange[0],
    rating: product.rating,
    reviewCount: product.reviewCount,
    url: `/products/${product.id}`,
  }));

  const ingredientItems: IngredientGuideItem[] = popularIngredients
    .slice(0, 6)
    .map((ingredient) => {
      const purposeNames = ingredient.purposes
        .map(
          (purpose) =>
            PURPOSE_CATEGORIES.find((category) => category.id === purpose)
              ?.name,
        )
        .filter(Boolean)
        .slice(0, 2)
        .join(" / ");

      return {
        id: ingredient.id,
        name: ingredient.name,
        summary: ingredient.description.slice(0, 160),
        tlDr: ingredient.benefits[0],
        evidenceLevel: mapEvidenceLevel(ingredient.evidenceLevel),
        safety: mapSafety(ingredient.sideEffects.length),
        effect: purposeNames || "汎用",
        representativeProducts: ingredient.sources.slice(0, 3),
      };
    });

  return (
    <>
      <HeroSearch />
      <PopularComparisonsSection products={products} />
      <IngredientGuideSection ingredients={ingredientItems} />
    </>
  );
}
