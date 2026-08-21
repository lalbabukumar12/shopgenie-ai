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
  rank?: number;
  gap_reason?: string;
  badges?: string[];
}

interface TempRankedProduct extends Product {
  match_score: number;
  rank?: number;
  gap_reason?: string;
  badges?: string[];
  _subScores?: {
    priceScore: number;
    specScore: number;
    batteryScore: number;
    ratingScore: number;
  };
}

export function rankProducts(
  products: Product[],
  criteria: SearchCriteria
): RankedProduct[] {
  const budgetMax = criteria.budget_max || 150000;
  const useCases = Array.isArray(criteria.use_case) ? criteria.use_case : [];

  const ranked: TempRankedProduct[] = products.map(product => {
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
      match_score: finalScore,
      _subScores: {
        priceScore,
        specScore,
        batteryScore,
        ratingScore
      }
    };
  });

  // Sort descending by match score
  const sorted = ranked.sort((a, b) => b.match_score - a.match_score);

  // Assign ranks
  sorted.forEach((item, index) => {
    item.rank = index + 1;
  });

  // Compute gap reasons for ranks #2 and #3 against rank #1
  const rank1 = sorted[0];
  if (rank1 && rank1._subScores) {
    for (let i = 1; i < Math.min(sorted.length, 3); i++) {
      const current = sorted[i];
      const r1Sub = rank1._subScores;
      const curSub = current._subScores;

      if (r1Sub && curSub) {
        const priceFitGap = current.price > rank1.price
          ? ((current.price - rank1.price) / budgetMax) * 30
          : Math.max(0, r1Sub.priceScore - curSub.priceScore);

        const pricePhrase = current.price > rank1.price
          ? "Higher price than #1"
          : "Lower price fit";

        const performanceGap = Math.max(0, r1Sub.specScore - curSub.specScore);
        const batteryGap = Math.max(0, r1Sub.batteryScore - curSub.batteryScore);
        const ratingGap = Math.max(0, r1Sub.ratingScore - curSub.ratingScore);

        const gaps = [
          { name: 'price', value: priceFitGap, phrase: pricePhrase },
          { name: 'performance', value: performanceGap, phrase: "Lower performance match" },
          { name: 'battery', value: batteryGap, phrase: "Lower battery life reduced the score" },
          { name: 'rating', value: ratingGap, phrase: "Lower user rating" }
        ];

        gaps.sort((a, b) => b.value - a.value);

        const biggestGap = gaps[0];
        if (biggestGap && biggestGap.value > 0.01) {
          current.gap_reason = biggestGap.phrase;
        } else {
          current.gap_reason = "Slightly lower overall match";
        }
      }
    }
  }

  // Compute category winners (Best Battery, Best Performance, Best Value)
  if (sorted.length > 0) {
    let maxBattery = -1;
    let maxPerf = -1;
    let minRatio = Infinity;

    sorted.forEach(item => {
      // Battery
      if (item.specs.battery_life_hours > maxBattery) {
        maxBattery = item.specs.battery_life_hours;
      }
      // Performance (specScore)
      const spec = item._subScores?.specScore || 0;
      if (spec > maxPerf) {
        maxPerf = spec;
      }
      // Value (price / specScore)
      const ratio = spec > 0 ? (item.price / spec) : Infinity;
      if (ratio < minRatio) {
        minRatio = ratio;
      }
    });

    sorted.forEach(item => {
      const productBadges: string[] = [];
      if (item.specs.battery_life_hours === maxBattery && maxBattery > 0) {
        productBadges.push("battery");
      }
      const spec = item._subScores?.specScore || 0;
      if (spec === maxPerf && maxPerf > 0) {
        productBadges.push("performance");
      }
      const ratio = spec > 0 ? (item.price / spec) : Infinity;
      if (ratio === minRatio && minRatio !== Infinity) {
        productBadges.push("value");
      }
      item.badges = productBadges;
    });
  }

  // Clean up temporary sub-scores
  return sorted.map(item => {
    delete item._subScores;
    return item;
  }) as RankedProduct[];
}
