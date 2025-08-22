// Product comparison types
export interface Product {
  id: string;
  name: string;
  price: number;
  totalScore: number;
  scoreBreakdown: ScoreBreakdown;
  warnings: Warning[];
  imageUrl?: string;
  url: string;
}

export interface ScoreBreakdown {
  [category: string]: number;
}

export interface Warning {
  id: string;
  type: "critical" | "warning" | "info";
  category: string;
  message: string;
  severity: number; // 1-10
  productId: string;
}

export interface ScoreSummary {
  category: string;
  maxScore: number;
  minScore: number;
  averageScore: number;
  products: Array<{
    productId: string;
    score: number;
  }>;
}

export type SortField = "score" | "price" | "name" | "warnings";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface ProductCompareTableProps {
  products: Product[];
  sortBy?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField, direction: SortDirection) => void;
  maxProducts?: number;
  onProductRemove?: (productId: string) => void;
}

export interface CompareTableHeaderProps {
  sortBy?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField, direction: SortDirection) => void;
  showRemoveColumn?: boolean;
}

export interface CompareTableRowProps {
  product: Product;
  index: number;
  warningAnalysis?: WarningAnalysis;
  onProductRemove?: (productId: string) => void;
}

export interface WarningAnalysis {
  totalWarnings: number;
  criticalWarnings: Warning[];
  mostImportantWarning?: Warning;
  warningsByProduct: Record<string, Warning[]>;
  warningsByCategory: Record<string, Warning[]>;
  severitySummary: {
    critical: number;
    warning: number;
    info: number;
  };
}

export interface ScoreSummaryRowProps {
  summary: ScoreSummary;
  products: Product[];
  highlightBest?: boolean;
  highlightWorst?: boolean;
}

export interface CompareControlsProps {
  currentSort: SortConfig;
  onSort: (field: SortField, direction: SortDirection) => void;
  className?: string;
}
