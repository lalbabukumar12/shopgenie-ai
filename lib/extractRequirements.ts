interface SearchCriteria {
  budget_max: number;
  budget_min: number | null;
  use_case: string[];
  must_have_features: string[];
}

interface ExtractionResult {
  criteria: SearchCriteria;
  fallback_mode: boolean;
}

// Local regex-based keyword parser for fallback mode
function fallbackExtract(query: string): SearchCriteria {
  const lower = query.toLowerCase();
  
  let budget_max = 150000;
  let budget_min: number | null = null;
  const use_cases: string[] = [];
  const must_have_features: string[] = [];

  const cleanQuery = lower.replace(/,/g, '');
  
  // Match max budget
  const maxBudgetRegex = /(?:under|below|max|maximum|budget|less than|within)\s*(?:rs\.?|inr)?\s*(\d+)(?:\s*(k|thousand))?/i;
  const matchMax = cleanQuery.match(maxBudgetRegex);
  if (matchMax) {
    let val = parseInt(matchMax[1], 10);
    const unit = matchMax[2];
    if (unit === 'k' || unit === 'thousand') {
      val = val * 1000;
    } else if (val < 1000) {
      val = val * 1000;
    }
    budget_max = val;
  } else {
    const kRegex = /(\d+)\s*k/i;
    const matchK = cleanQuery.match(kRegex);
    if (matchK) {
      budget_max = parseInt(matchK[1], 10) * 1000;
    } else {
      const rawNumRegex = /\b(\d{4,6})\b/;
      const matchRaw = cleanQuery.match(rawNumRegex);
      if (matchRaw) {
        budget_max = parseInt(matchRaw[1], 10);
      }
    }
  }

  // Match min budget
  const minBudgetRegex = /(?:above|over|min|minimum|greater than|at least)\s*(?:rs\.?|inr)?\s*(\d+)(?:\s*(k|thousand))?/i;
  const matchMin = cleanQuery.match(minBudgetRegex);
  if (matchMin) {
    let val = parseInt(matchMin[1], 10);
    const unit = matchMin[2];
    if (unit === 'k' || unit === 'thousand') {
      val = val * 1000;
    } else if (val < 1000) {
      val = val * 1000;
    }
    budget_min = val;
  }

  // Map use cases
  const useCaseMappings: { [key: string]: string[] } = {
    coding: ['coding', 'code', 'developer', 'programming', 'programmer', 'software', 'develop', 'terminal'],
    student: ['student', 'school', 'college', 'study', 'education', 'learning', 'class'],
    office: ['office', 'work', 'business', 'word', 'excel', 'corporate', 'meeting'],
    gaming: ['gaming', 'game', 'gamer', 'games', 'play', 'steam', 'graphics', 'fps'],
    creative: ['creative', 'design', 'video', 'photo', 'edit', 'editing', 'photoshop', 'illustrator', 'rendering', 'premiere']
  };

  for (const [key, keywords] of Object.entries(useCaseMappings)) {
    if (keywords.some(kw => lower.includes(kw))) {
      use_cases.push(key);
    }
  }

  // Map features
  const knownFeatures = [
    '16gb', '8gb', '32gb', '4gb', 'ram',
    'ssd', 'hdd', '1tb', '512gb', '256gb', 'storage',
    'intel', 'amd', 'ryzen', 'core i7', 'core i5', 'core i3', 'core i9', 'm1', 'm2', 'm3',
    'nvidia', 'rtx', 'gtx', 'gpu', 'geforce',
    'battery', 'lightweight', 'thin', 'portable', 'backlit',
    'apple', 'macbook', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'gigabyte'
  ];

  knownFeatures.forEach(feature => {
    const regex = new RegExp(`\\b${feature}\\b`, 'i');
    if (regex.test(lower)) {
      must_have_features.push(feature);
    }
  });

  return {
    budget_max,
    budget_min,
    use_case: use_cases,
    must_have_features
  };
}

export async function extractRequirements(query: string): Promise<ExtractionResult> {
  const systemPrompt = `You are an assistant that extracts structured shopping requirements from the user's natural language query. Return ONLY a JSON object with the exact shape:
{
  "budget_max": number,
  "budget_min": number|null,
  "use_case": string[],
  "must_have_features": string[]
}
If a value is not mentioned, use these defaults:
- budget_max: 150000
- budget_min: null
- use_case: []
- must_have_features: []
Make sure the response contains no extra text, explanations, or markdown fences.`;

  const anthropicPayload = {
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      { role: 'user', content: query },
    ],
  };

  try {
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      throw new Error('LLM_API_KEY environment variable is not set');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicPayload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errBody}`);
    }

    const result = await response.json();
    const rawContent = Array.isArray(result.content)
      ? result.content.map((c: { text: string }) => c.text).join(' ')
      : result.content;

    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed: SearchCriteria = JSON.parse(cleaned);
    
    // Standardize optional arrays / defaults
    return {
      criteria: {
        budget_max: parsed.budget_max || 150000,
        budget_min: parsed.budget_min || null,
        use_case: Array.isArray(parsed.use_case) ? parsed.use_case : [],
        must_have_features: Array.isArray(parsed.must_have_features) ? parsed.must_have_features : []
      },
      fallback_mode: false
    };
  } catch (err) {
    console.warn('extractRequirements: LLM call failed, using rule-based fallback parser:', err);
    return {
      criteria: fallbackExtract(query),
      fallback_mode: true
    };
  }
}
