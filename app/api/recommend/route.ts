import { NextResponse } from 'next/server';
import productsData from '@/data/products.json';
import { extractRequirements } from '@/lib/extractRequirements';
import { filterProducts } from '@/lib/filterProducts';
import { rankProducts } from '@/lib/rankProducts';

// Type definitions to keep TypeScript happy
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

// Fallback explanation generator
function generateFallbackExplanation(product: Product, query: string, criteria: SearchCriteria): string {
  const brand = product.brand;
  const name = product.name;
  const priceStr = `₹${product.price.toLocaleString('en-IN')}`;
  
  let explanation = `The ${brand} ${name} is our top-ranked choice matching your request. At ${priceStr}, it provides excellent value for its price.`;
  
  if (criteria.use_case.length > 0) {
    explanation += ` The specifications are highly suitable for ${criteria.use_case.join(' and ')} tasks,`;
  } else {
    explanation += ` Its overall system power is highly balanced,`;
  }
  
  explanation += ` backed by a ${product.specs.cpu} processor, ${product.specs.ram} of RAM, and a fast ${product.specs.storage} drive.`;
  
  if (product.specs.battery_life_hours >= 12) {
    explanation += ` With a long battery life of ~${product.specs.battery_life_hours} hours, it is also highly portable.`;
  }
  
  return explanation;
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (typeof query !== 'string' || !query.trim()) {
      throw new Error('Invalid request payload: "query" must be a non-empty string');
    }

    // 1. Call modular extractRequirements to parse raw text queries
    const { criteria, fallback_mode: isFallbackMode } = await extractRequirements(query);

    const products = productsData as Product[];
    const budgetMax = criteria.budget_max || 150000;
    const budgetMin = criteria.budget_min || 0;

    // 2. Filter products using modular filterProducts helper
    let filteredProducts = filterProducts(criteria, products);
    let strictBudgetMatch = true;

    if (filteredProducts.length === 0) {
      // Relax budget filter if zero products match strictly
      filteredProducts = products;
      strictBudgetMatch = false;
    }

    // 3. Rank products using modular rankProducts helper
    const rankedProducts = rankProducts(filteredProducts, criteria);

    // 4. Annotate match reasons dynamically for results presentation
    const annotatedProducts = rankedProducts.map(product => {
      const matchReasons: string[] = [];

      // Budget match details
      if (!strictBudgetMatch && product.price > budgetMax) {
        const excess = product.price - budgetMax;
        matchReasons.push(`Exceeds budget by ₹${excess.toLocaleString('en-IN')}`);
      } else {
        const budgetBuffer = budgetMax - product.price;
        if (budgetBuffer >= 0) {
          matchReasons.push(`Under budget by ₹${budgetBuffer.toLocaleString('en-IN')}`);
        }
      }

      // Use Case overlap details
      const searchUseCases = criteria.use_case.map(u => u.toLowerCase());
      const overlapUseCases = product.use_case_tags.filter(tag => searchUseCases.includes(tag.toLowerCase()));
      if (overlapUseCases.length > 0) {
        matchReasons.push(`Matches target use cases (${overlapUseCases.join(', ')})`);
      }

      // Feature match details
      const searchFeatures = criteria.must_have_features.map(f => f.toLowerCase());
      const searchableSpecs = [
        product.name,
        product.brand,
        product.specs.cpu,
        product.specs.ram,
        product.specs.storage,
        product.specs.gpu
      ].map(s => s.toLowerCase());

      searchFeatures.forEach(feature => {
        if (searchableSpecs.some(spec => spec.includes(feature))) {
          matchReasons.push(`Matches feature: "${feature}"`);
        }
      });

      // Rating details
      if (product.rating >= 4.5) {
        matchReasons.push(`Highly rated by users (${product.rating} ★)`);
      }

      // Battery details
      if (product.specs.battery_life_hours >= 12) {
        matchReasons.push(`Excellent battery life (~${product.specs.battery_life_hours} hours)`);
      }

      return {
        ...product,
        match_reasons: matchReasons.length > 0 ? matchReasons : ['Good general specifications']
      };
    });

    // 5. Select Top 3 Products
    const top3 = annotatedProducts.slice(0, 3);
    const topProduct = top3[0] || null;

    // 6. Generate 2-3 sentence explanation for the #1 Product
    let explanation = "";
    if (topProduct) {
      if (isFallbackMode) {
        // Generate high-quality local description if API has credentials/billing failures
        explanation = generateFallbackExplanation(topProduct, query, criteria);
      } else {
        try {
          const apiKey = process.env.LLM_API_KEY;
          if (!apiKey) {
            throw new Error('LLM_API_KEY is not defined');
          }

          const explanationPrompt = `You are a laptop shopping expert assistant. The user searched for: "${query}".
Based on our database filtering and scoring, our top recommended laptop is:
- Name: ${topProduct.brand} ${topProduct.name}
- Price: ₹${topProduct.price.toLocaleString('en-IN')}
- Specs: CPU ${topProduct.specs.cpu}, RAM ${topProduct.specs.ram}, Storage ${topProduct.specs.storage}, GPU ${topProduct.specs.gpu}, Battery life ${topProduct.specs.battery_life_hours} hours.

Write a friendly, persuasive 2-3 sentence explanation of why this laptop is the absolute best pick for their needs. Focus on their query context, do not mention match scores, and do not include any other markdown formatting or prefix conversational greeting.`;

          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-6',
              max_tokens: 300,
              messages: [{ role: 'user', content: explanationPrompt }],
            }),
          });

          if (!response.ok) {
            throw new Error(`Anthropic explanation API error: ${response.status}`);
          }

          const result = await response.json();
          const rawExplanation = Array.isArray(result.content)
            ? result.content.map((c: { text: string }) => c.text).join(' ')
            : result.content;
            
          explanation = rawExplanation.trim();
        } catch (err) {
          console.warn('Failed to generate LLM explanation, using rule-based generator:', err);
          explanation = generateFallbackExplanation(topProduct, query, criteria);
        }
      }
    }

    // 7. Return JSON response structure: { requirements, results, recommendation }
    return NextResponse.json({
      requirements: {
        budget_max: budgetMax,
        budget_min: budgetMin === 0 ? null : budgetMin,
        use_case: criteria.use_case,
        must_have_features: criteria.must_have_features
      },
      results: top3,
      recommendation: topProduct ? {
        product: topProduct,
        explanation: explanation
      } : null,
      strict_budget_match: strictBudgetMatch,
      fallback_mode: isFallbackMode
    });

  } catch (error: unknown) {
    console.error('recommend API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new NextResponse(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
