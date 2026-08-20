# ShopGenie AI
> Your Intelligent Agentic Laptop Shopping Assistant

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Claude API](https://img.shields.io/badge/Anthropic_Claude-API-orange?logo=anthropic)](https://www.anthropic.com/)

---

## 📌 Problem Statement
Online shopping platforms offer thousands of options with complex, technical specification grids. For average consumers, finding the right product requires extensive research, comparison, and understanding of jargon. The paradox of choice makes product selection difficult, confusing, and time-consuming.

---

## 💡 Solution
**ShopGenie AI** acts as an intelligent shopping agent that simplifies decision-making. By translating natural language queries (e.g., *"laptop for coding under 60000"*) into structured constraints, it filters and ranks products transparently. It provides a personalized match score for each item and generates clear, natural explanations explaining why the top recommendation is the best fit.

---

## 🚀 Key Features
- **AI-Powered Natural Language Understanding**: Parses unstructured user queries to extract budgets, target use cases, and specific feature requirements.
- **Smart Product Filtering**: Strictly filters products within budget limits and aligns technical parameters with desired use cases.
- **Weighted Multi-Criteria Ranking**: Scores matches out of 100 based on price fit (30%), performance specifications (35%), battery life (20%), and ratings (15%).
- **Personalized Recommendations & Explanations**: Generates a 2-3 sentence expert review detailing why the #1 ranked laptop is the best pick.
- **Robust Fallback Operations**: Seamlessly switches to local rule-based keyword extraction and natural explanation generators if the Anthropic Claude API key lacks credits.
- **Interactive Smart Cart (Shopping Plan)**: Allows users to save, compare, track total pricing, and batch-clear items from their personal shopping planner.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API & LLM Integration**: Anthropic Claude API (messages endpoint)
- **Backend**: Node.js Next.js API Routes

---

## 📐 Architecture
```text
  +------------------+
  |    User Query    |   e.g. "gaming laptop under 80000 with 16GB RAM"
  +--------+---------+
           |
           v
+----------+---------+
|   Requirements     |   Extracts Search Constraints (Claude API / Local Regex Fallback)
|  Extraction (LLM)  |   -> budget_max, use_cases, must_have_features
+----------+---------+
           |
           v
+----------+---------+
|   Product Filter   |   Slices product array to find candidates within budget
+----------+---------+
           |
           v
+----------+---------+
|   Ranking Engine   |   Scores and ranks laptops out of 100 on weighted specs
+----------+---------+
           |
           v
+----------+---------+
|   Recommendation   |   Synthesizes a 2-3 sentence justification for #1 pick
|    (LLM / Rule)    |
+----------+---------+
           |
           v
+----------+---------+
|     Web UI       |   Renders Comparison Table (Top 3) & Expert Recommendation Card
+--------------------+
```

---

## 📸 Screenshots

| Landing Page | Results Grid | Shopping Planner |
| :--- | :--- | :--- |
| ![Landing Page](/public/screenshots/landing.png) | ![Results Grid](/public/screenshots/results.png) | ![Shopping Planner](/public/screenshots/cart.png) |

---

## ⚙️ How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/lalbabukumar12/shopgenie-ai.git
cd shopgenie-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory:
```env
LLM_API_KEY=your_anthropic_claude_api_key_here
```
*(Note: If the key is left empty or runs out of credits, ShopGenie AI will automatically run in local fallback mode using regex matchers.)*

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to experience the application.

---

## 🔮 Future Scope
- **Real-time Catalog Integration**: Sync with live e-commerce search APIs (Amazon, Flipkart, Shopify) to fetch current listings.
- **Multi-Category Support**: Expand from laptops to smart home appliances, mobile devices, cameras, and general electronics.
- **User Accounts & Saved Scenarios**: Enable profiles to save shopping plan comparisons and sync across devices.
- **Price Tracking & Alerts**: Track price drops and send alerts when items in the shopping plan reach target budgets.

---

## 🎥 Demo Video
Watch a quick walkthrough of ShopGenie AI in action: [Demo Video Link Placeholder](https://example.com/demo)
