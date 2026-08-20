interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    gpu: string;
    battery_life_hours: number;
  };
  use_case_tags: string[];
  rating: number;
  image_placeholder: string;
}

interface SearchCriteria {
  budget_max: number;
  budget_min: number | null;
  use_case: string[];
  must_have_features: string[];
}

export function filterProducts(criteria: SearchCriteria, products: Product[]): Product[] {
  const budgetMax = criteria.budget_max || 150000;
  const budgetMin = criteria.budget_min || 0;
  const searchUseCases = Array.isArray(criteria.use_case) 
    ? criteria.use_case.map(uc => uc.toLowerCase()) 
    : [];

  return products.filter(product => {
    // 1. Budget check
    if (product.price > budgetMax || product.price < budgetMin) {
      return false;
    }

    // 2. Use case overlap check (if any are specified)
    if (searchUseCases.length > 0) {
      const productUseCases = product.use_case_tags.map(tag => tag.toLowerCase());
      const hasOverlap = searchUseCases.some(uc => productUseCases.includes(uc));
      if (!hasOverlap) {
        return false;
      }
    }

    return true;
  });
}
