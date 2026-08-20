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

interface RankedProduct extends Product {
  match_score: number;
}

export function rankProducts(
  products: Product[],
  criteria: SearchCriteria
): RankedProduct[] {
  const budgetMax = criteria.budget_max || 150000;
  const useCases = Array.isArray(criteria.use_case) ? criteria.use_case : [];

  const ranked = products.map(product => {
    // 1. Price Fit (30%): Closer to budget max without exceeding is better.
    const priceRatio = budgetMax > 0 ? (product.price / budgetMax) : 1;
    const priceScore = Math.min(30, priceRatio * 30);

    // 2. Spec/Performance Match to target Use Case (35%)
    let specScore = 0;
    if (useCases.length > 0) {
      let bestUseCaseScore = 0;
      useCases.forEach(uc => {
        let ucScore = 0;
        const lowerUc = uc.toLowerCase();

        if (lowerUc === 'gaming') {
          const gpu = product.specs.gpu.toLowerCase();
          if (gpu.includes('rtx') || gpu.includes('nvidia') || gpu.includes('geforce') || gpu.includes('radeon')) {
            ucScore += 20; // Dedicated gaming GPU
          }
          if (product.specs.ram.includes('16GB') || product.specs.ram.includes('32GB')) {
            ucScore += 10;
          }
          const cpu = product.specs.cpu.toLowerCase();
          if (cpu.includes('i7') || cpu.includes('i9') || cpu.includes('ryzen 7') || cpu.includes('ryzen 9')) {
            ucScore += 5;
          }
        } else if (lowerUc === 'coding') {
          if (product.specs.ram.includes('16GB') || product.specs.ram.includes('32GB')) {
            ucScore += 15;
          }
          const cpu = product.specs.cpu.toLowerCase();
          if (cpu.includes('i7') || cpu.includes('i9') || cpu.includes('ryzen 7') || cpu.includes('ryzen 9') || cpu.includes('apple m')) {
            ucScore += 12;
          }
          if (product.specs.storage.includes('ssd') || product.specs.storage.includes('1tb')) {
            ucScore += 8;
          }
        } else if (lowerUc === 'creative') {
          const gpu = product.specs.gpu.toLowerCase();
          if (gpu.includes('rtx') || gpu.includes('nvidia') || gpu.includes('radeon') || gpu.includes('apple gpu')) {
            ucScore += 15;
          }
          if (product.specs.ram.includes('16GB') || product.specs.ram.includes('32GB')) {
            ucScore += 10;
          }
          if (product.specs.storage.includes('1tb') || product.specs.storage.includes('512gb')) {
            ucScore += 10;
          }
        } else if (lowerUc === 'student' || lowerUc === 'office') {
          if (product.specs.battery_life_hours >= 12) {
            ucScore += 15;
          } else if (product.specs.battery_life_hours >= 8) {
            ucScore += 10;
          }
          if (product.specs.ram.includes('8GB') || product.specs.ram.includes('16GB')) {
            ucScore += 15;
          }
          if (product.specs.storage.includes('ssd')) {
            ucScore += 5;
          }
        } else {
          // General matching fallback if custom tags
          if (product.specs.ram.includes('16GB') || product.specs.ram.includes('32GB')) ucScore += 15;
          if (product.specs.storage.includes('ssd')) ucScore += 10;
          if (product.specs.battery_life_hours >= 8) ucScore += 10;
        }

        if (ucScore > bestUseCaseScore) {
          bestUseCaseScore = ucScore;
        }
      });
      specScore = bestUseCaseScore;
    } else {
      // Default: If no use case is requested, evaluate general spec power (Max 35)
      if (product.specs.ram.includes('16GB') || product.specs.ram.includes('32GB')) specScore += 15;
      if (product.specs.storage.includes('ssd') || product.specs.storage.includes('1TB')) specScore += 10;
      if (product.specs.battery_life_hours >= 10) specScore += 10;
    }

    // 3. Battery Life (20%): Proportional out of 20 hours max
    const batteryScore = Math.min(20, (product.specs.battery_life_hours / 20) * 20);

    // 4. Star Rating (15%): Linear scaling for rating out of 5 stars
    const ratingScore = (product.rating / 5) * 15;

    // Sum scores and round to nearest integer
    const finalScore = Math.min(100, Math.round(priceScore + specScore + batteryScore + ratingScore));

    return {
      ...product,
      match_score: finalScore
    };
  });

  // Sort descending by match score
  return ranked.sort((a, b) => b.match_score - a.match_score);
}
