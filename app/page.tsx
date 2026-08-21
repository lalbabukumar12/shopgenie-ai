"use client";

import React, { useState } from "react";
import LaptopImage from "@/components/LaptopImage";

// Interfaces for TypeScript type safety
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
  match_score?: number;
  match_reasons?: string[];
  rank?: number;
  gap_reason?: string;
  badges?: string[];
}

interface SearchCriteria {
  budget_max: number;
  budget_min: number | null;
  use_case: string[];
  must_have_features: string[];
}

interface Recommendation {
  product: Product;
  explanation: string;
}

interface SearchResponse {
  requirements: SearchCriteria;
  results: Product[];
  recommendation: Recommendation | null;
  strict_budget_match: boolean;
  fallback_mode: boolean;
}

// -------------------------------------------------------------
// SVG Helper Icons (Zero External Dependencies)
// -------------------------------------------------------------

const SparklesIcon = () => (
  <svg className="w-5 h-5 text-violet-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21L7.188 15.904L2 15L7.188 14.096L9 9L9.813 14.096L15 15L9.813 15.904ZM18.25 5.25L17.5 9L16 5.25L12.25 4.5L16 3.75L17.5 0L19 3.75L22.75 4.5L18.25 5.25Z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className={`w-4 h-4 ${filled ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const CartIcon = () => (
  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

// Helper function to dynamically rate laptop performance out of 5 stars based on CPU/GPU
function getPerformanceStars(cpu: string, gpu: string): number {
  const cpuLower = cpu.toLowerCase();
  const gpuLower = gpu.toLowerCase();

  // 5 Stars: Core i9/Ryzen 9 or Dedicated RTX 40/30 GPU or M1/M2/M3 Pro/Max series
  if (
    gpuLower.includes('rtx 40') || 
    gpuLower.includes('rtx 30') || 
    cpuLower.includes('i9') || 
    cpuLower.includes('ryzen 9') || 
    cpuLower.includes('pro') || 
    cpuLower.includes('max')
  ) {
    return 5;
  }

  // 4 Stars: Core i7/Ryzen 7 or other dedicated GPUs or standard Apple M series
  if (
    gpuLower.includes('rtx') || 
    gpuLower.includes('nvidia') || 
    gpuLower.includes('gtx') || 
    gpuLower.includes('radeon') ||
    cpuLower.includes('i7') || 
    cpuLower.includes('ryzen 7') || 
    cpuLower.includes('m1') || 
    cpuLower.includes('m2') || 
    cpuLower.includes('m3')
  ) {
    return 4;
  }

  // 3 Stars: Core i5/Ryzen 5 or Iris Xe graphics
  if (
    cpuLower.includes('i5') || 
    cpuLower.includes('ryzen 5') || 
    gpuLower.includes('iris xe') || 
    gpuLower.includes('intel iris')
  ) {
    return 3;
  }

  // 2 Stars: Core i3/Ryzen 3 or basic Intel HD/UHD graphics
  if (
    cpuLower.includes('i3') || 
    cpuLower.includes('ryzen 3') || 
    gpuLower.includes('uhd') || 
    gpuLower.includes('intel hd')
  ) {
    return 2;
  }

  return 1;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  
  // API Response States
  const [results, setResults] = useState<Product[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [strictBudgetMatch, setStrictBudgetMatch] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  // Smart Cart States
  const [cart, setCart] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product: Product) => {
    if (!cart.some((item) => item.id === product.id)) {
      setCart((prev) => [...prev, product]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // Checkout flow states & actions
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form" | "success">("cart");
  const [checkoutForm, setCheckoutForm] = useState({ name: "", email: "", address: "" });
  const [orderId, setOrderId] = useState("");

  const estimatedTax = cartTotal * 0.05;
  const grandTotal = cartTotal + estimatedTax;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    setOrderId(newOrderId);
    setCheckoutStep("success");

    // Send confirmation email asynchronously using Resend API route
    fetch("/api/send-order-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: checkoutForm.email,
        orderId: newOrderId,
        productName: cart.map((item) => `${item.brand} ${item.name}`).join(", "),
        price: grandTotal,
        address: checkoutForm.address,
      }),
    }).catch((err) => {
      console.error("Failed to send checkout confirmation email:", err);
    });
  };

  const handleContinueShopping = () => {
    setCart([]);
    setCheckoutForm({ name: "", email: "", address: "" });
    setOrderId("");
    setCheckoutStep("cart");
    setIsCartOpen(false);
  };

  const handleProceedToBuy = (product: Product) => {
    if (!cart.some((item) => item.id === product.id)) {
      setCart((prev) => [...prev, product]);
    }
    setCheckoutStep("form");
    setIsCartOpen(true);
  };

  const closeDrawer = () => {
    setIsCartOpen(false);
    // If closing on success step, we complete the checkout cycle
    if (checkoutStep === "success") {
      setCart([]);
      setCheckoutForm({ name: "", email: "", address: "" });
      setOrderId("");
    }
    setCheckoutStep("cart");
  };

  const exampleQueries = [
    "Gaming laptop under ₹70,000",
    "Lightweight laptop for travel",
    "Best value under ₹50,000",
    "Laptop with best battery life"
  ];

  const executeSearch = async (searchQuery: string) => {
    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      
      setResults(data.results);
      setRecommendation(data.recommendation);
      setStrictBudgetMatch(data.strict_budget_match);
      setFallbackMode(data.fallback_mode);

    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    await executeSearch(query);
  };

  const handleChipClick = async (text: string) => {
    if (loading) return;
    setQuery(text);
    await executeSearch(text);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setRecommendation(null);
    setHasSearched(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#030712] bg-gradient-to-b from-[#030712] via-[#090d1f] to-[#030712] text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* ----------------- MAIN LAYOUT CONTAINER ----------------- */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-start gap-12">
        
        {/* HEADER SECTION */}
        <header className="w-full flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 border border-violet-400/20">
              <SparklesIcon />
            </div>
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-200 via-fuchsia-100 to-indigo-200 bg-clip-text text-transparent">
                ShopGenie AI
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-tight">
                Your Intelligent Agentic Shopping Assistant
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500/40 text-slate-300 hover:text-white transition-all duration-300 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
            id="cart-button"
            aria-label="Open Shopping Plan"
          >
            <CartIcon />
            <span className="text-xs font-semibold hidden md:inline">Shopping Plan</span>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white ring-2 ring-[#030712] animate-bounce">
                {cart.length}
              </span>
            )}
          </button>
        </header>

        {/* SEARCH BOX BOX */}
        <section className="w-full max-w-2xl space-y-3" aria-label="Search Form Container">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row items-stretch gap-3 bg-slate-900/60 backdrop-blur-xl border border-slate-800 focus-within:border-violet-500/50 rounded-2xl p-2.5 transition-all duration-300 shadow-2xl"
          >
            <div className="flex-1 flex items-center gap-3 px-3 py-1 bg-slate-950/40 rounded-xl">
              <SearchIcon />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="laptop for coding under 60000"
                className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm text-slate-100 placeholder-slate-500"
                id="search-input"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              className={`px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md active:scale-98 transition-all duration-200 cursor-pointer ${
                loading ? "opacity-50 pointer-events-none" : "shadow-violet-500/10"
              }`}
              id="search-button"
            >
              Find My Laptop
            </button>
            {(query.trim() !== "" || hasSearched) && (
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-3.5 rounded-xl border border-slate-800 hover:bg-slate-800/60 hover:text-white text-slate-400 font-semibold text-sm transition-all duration-200 active:scale-98 cursor-pointer"
                id="clear-search-button"
                disabled={loading}
              >
                Clear
              </button>
            )}
          </form>

          {!hasSearched && (
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start px-1 animate-fade-in">
              <span className="text-2xs text-slate-500 self-center mr-1 font-medium">Examples:</span>
              {exampleQueries.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => handleChipClick(text)}
                  className="px-3 py-1.5 text-2xs rounded-full bg-slate-900/50 hover:bg-violet-600/20 border border-slate-800 hover:border-violet-500/30 text-slate-400 hover:text-violet-300 transition-all duration-200 active:scale-95 cursor-pointer font-medium"
                >
                  {text}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ----------------- DYNAMIC STATES BOARD ----------------- */}
        
        {/* 1. LOADING SCREEN */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-violet-500/10 border-t-violet-500 animate-spin" />
            </div>
            <span className="text-sm font-semibold text-violet-300 animate-pulse">ShopGenie is thinking...</span>
          </div>
        )}

        {/* 2. ERROR DISPLAY */}
        {error && !loading && (
          <div className="w-full max-w-2xl bg-red-950/20 border border-red-500/30 text-red-300 p-4 rounded-xl text-sm leading-relaxed text-center">
            ⚠️ {error}
          </div>
        )}

        {/* 3. RESULTS AND DASHBOARD VIEW */}
        {!loading && hasSearched && !error && (
          <div className="w-full space-y-10 animate-fade-in">
            {/* Fallback & Strict warnings */}
            {fallbackMode && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs leading-relaxed text-center">
                ⚠️ **LLM Offline (Local Fallback Search Enabled)**: Your API key has an insufficient credit balance. Search matches are processed locally via keywords.
              </div>
            )}
            {!strictBudgetMatch && (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 p-3.5 rounded-xl text-xs leading-relaxed text-center">
                ℹ️ **Budget Adjusted**: No products met your exact budget strictly. Budget limits were relaxed to return the closest matching models.
              </div>
            )}

            {results.length > 0 ? (
              <>
                {/* A. COMPARISON TABLE BOARD */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-200 tracking-tight flex items-center gap-2 px-1">
                    System Comparison
                    <span className="text-2xs bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Top 3 Matches</span>
                  </h2>
                  
                  <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <th className="px-6 py-4">Rank</th>
                            <th className="px-6 py-4">Product Name</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Performance</th>
                            <th className="px-6 py-4">Battery</th>
                            <th className="px-6 py-4 text-right">Match Score</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {results.map((product) => {
                            const performanceStars = getPerformanceStars(product.specs.cpu, product.specs.gpu);
                            const isInCart = cart.some(item => item.id === product.id);
                            return (
                              <tr key={product.id} className="hover:bg-slate-900/30 transition-colors duration-150">
                                <td className="px-6 py-4.5 font-bold text-slate-400">
                                  #{product.rank || 1}
                                </td>
                                <td className="px-6 py-4.5 font-bold">
                                  {product.badges && product.badges.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                                      {product.badges.map((badge) => {
                                        if (badge === "battery") {
                                          return (
                                            <span key={badge} className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-wide uppercase">
                                              🔋 Best Battery
                                            </span>
                                          );
                                        }
                                        if (badge === "performance") {
                                          return (
                                            <span key={badge} className="inline-flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-wide uppercase">
                                              ⚡ Best Performance
                                            </span>
                                          );
                                        }
                                        if (badge === "value") {
                                          return (
                                            <span key={badge} className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-wide uppercase">
                                              💰 Best Value
                                            </span>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  )}
                                  <div className="text-slate-100 font-bold">
                                    {product.brand} {product.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4.5 font-semibold text-emerald-400">
                                  ₹{product.price.toLocaleString("en-IN")}
                                </td>
                                <td className="px-6 py-4.5">
                                  <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <StarIcon key={i} filled={i < performanceStars} />
                                    ))}
                                  </div>
                                </td>
                                <td className="px-6 py-4.5 text-slate-400">
                                  ~{product.specs.battery_life_hours} hours
                                </td>
                                <td className="px-6 py-4.5 text-right">
                                  <div className="font-extrabold text-violet-400 text-sm">
                                    {product.match_score}%
                                  </div>
                                  {(product.rank === 2 || product.rank === 3) && product.gap_reason && (
                                    <div className="text-[10px] text-slate-500 mt-1 max-w-[160px] ml-auto leading-tight font-normal normal-case">
                                      {product.gap_reason}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4.5 text-right">
                                  {isInCart ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 text-slate-500 text-2xs font-semibold select-none">
                                      ✓ Added
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => addToCart(product)}
                                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-2xs font-semibold active:scale-95 transition-all duration-200 cursor-pointer"
                                    >
                                      + Plan
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* B. RECOMMENDED TARGET CARD */}
                {recommendation && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-200 tracking-tight flex items-center gap-2 px-1">
                      Expert Selection
                    </h2>
                    
                    <div className="relative rounded-2xl bg-gradient-to-tr from-slate-900 to-[#12132e]/50 border border-violet-500/20 p-6 shadow-2xl flex flex-col md:flex-row items-center gap-6 overflow-hidden">
                      {/* Top Match Tag Overlay */}
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-extrabold text-[10px] tracking-wide uppercase px-3 py-1 rounded-full shadow-md">
                        <SparklesIcon />
                        #1 Ranked Choice - {recommendation.product.match_score}% Match
                      </div>

                      {/* Customized Vector Laptop SVG */}
                      <div className="w-40 h-32 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-center shrink-0 shadow-inner p-2 relative group-hover:scale-102 transition-transform duration-300">
                        <LaptopImage brand={recommendation.product.brand} className="w-full h-full" />
                      </div>

                      {/* Review details */}
                      <div className="flex-1 space-y-3.5 text-center md:text-left">
                        <div>
                          {recommendation.product.badges && recommendation.product.badges.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2.5 justify-center md:justify-start">
                              {recommendation.product.badges.map((badge) => {
                                if (badge === "battery") {
                                  return (
                                    <span key={badge} className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-wide uppercase">
                                      🔋 Best Battery
                                    </span>
                                  );
                                }
                                if (badge === "performance") {
                                  return (
                                    <span key={badge} className="inline-flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-wide uppercase">
                                      ⚡ Best Performance
                                    </span>
                                  );
                                }
                                if (badge === "value") {
                                  return (
                                    <span key={badge} className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-wide uppercase">
                                      💰 Best Value
                                    </span>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}
                          <span className="text-[10px] uppercase font-extrabold tracking-widest text-violet-400">
                            {recommendation.product.brand}
                          </span>
                          <h3 className="text-xl font-bold text-slate-100">
                            {recommendation.product.name}
                          </h3>
                        </div>

                        {/* Specs grid */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-400">
                          <span className="bg-slate-800/80 border border-slate-700/50 px-2 py-0.5 rounded-md">
                            💻 {recommendation.product.specs.cpu}
                          </span>
                          <span className="bg-slate-800/80 border border-slate-700/50 px-2 py-0.5 rounded-md">
                            💾 {recommendation.product.specs.ram} RAM
                          </span>
                          <span className="bg-slate-800/80 border border-slate-700/50 px-2 py-0.5 rounded-md">
                            💿 {recommendation.product.specs.storage}
                          </span>
                        </div>

                        {/* Explanation block */}
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 shadow-inner">
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                            &quot;{recommendation.explanation}&quot;
                          </p>
                        </div>

                        {/* Price Tag & CTA */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-900 mt-4">
                          <span className="text-lg font-extrabold text-emerald-400">
                            ₹{recommendation.product.price.toLocaleString("en-IN")}
                          </span>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {cart.some(item => item.id === recommendation.product.id) ? (
                              <span className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-500 text-xs font-semibold select-none">
                                ✓ Added to Shopping Plan
                              </span>
                            ) : (
                              <button
                                onClick={() => addToCart(recommendation.product)}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all duration-200 active:scale-95 cursor-pointer shadow-md shadow-violet-600/10"
                              >
                                Add to Shopping Plan
                              </button>
                            )}
                            <button
                              onClick={() => handleProceedToBuy(recommendation.product)}
                              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white font-semibold text-xs transition-all active:scale-97 cursor-pointer"
                            >
                              Proceed to Buy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* C. NO MATCH STATE CHANNELS */
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/20 rounded-2xl border border-slate-800/60 max-w-xl mx-auto">
                <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 animate-pulse">
                  ⚠️
                </div>
                <h3 className="text-base font-bold text-slate-300">No exact matches found</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                  Try increasing your budget or simplifying the search features in your query.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CART DRAWER SIDEBAR & BACKDROP OVERLAY */}
      {/* CART DRAWER SIDEBAR & BACKDROP OVERLAY */}
      {isCartOpen && (
        <div
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-[#050914]/95 backdrop-blur-2xl border-l border-slate-800/80 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col justify-between ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping Plan Cart Sidebar"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CartIcon />
            <h3 className="font-extrabold text-base text-slate-100">
              {checkoutStep === "cart" ? "Your Shopping Plan" : checkoutStep === "form" ? "Checkout Details" : "Success"}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {checkoutStep === "cart" && cart.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear your shopping plan?")) {
                    setCart([]);
                  }
                }}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider hover:underline cursor-pointer active:scale-95 transition-all duration-200"
                id="clear-cart-button"
              >
                Clear All
              </button>
            )}
            <button
              onClick={closeDrawer}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 active:scale-95 transition-all duration-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* STEP 1: CART VIEW */}
        {checkoutStep === "cart" && (
          <>
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-md">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-violet-400 tracking-wider">{item.brand}</span>
                      <h4 className="font-bold text-xs text-slate-100 truncate">{item.name}</h4>
                      <p className="text-2xs text-slate-400 mt-0.5 line-clamp-1">{item.specs.cpu} | {item.specs.ram} RAM</p>
                      <span className="text-xs font-extrabold text-emerald-400 block mt-1">₹{item.price.toLocaleString("en-IN")}</span>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 rounded-lg bg-red-950/20 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
                      aria-label={`Remove ${item.name} from plan`}
                    >
                      🗑️
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-20 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-600 text-lg">
                    🛒
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Your shopping plan is currently empty.</p>
                  <p className="text-3xs text-slate-500 max-w-[200px]">Add laptops from the matches grid to compare them here!</p>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-800/80 bg-slate-950/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Total Price ({cart.length} items):</span>
                  <span className="text-lg font-black text-emerald-400">₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <button
                  onClick={() => setCheckoutStep("form")}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/10 transition-all active:scale-98 cursor-pointer text-center"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP 2: CHECKOUT FORM SUMMARY VIEW */}
        {checkoutStep === "form" && (
          <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
              {/* Back Link */}
              <button
                type="button"
                onClick={() => setCheckoutStep("cart")}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1 hover:underline cursor-pointer uppercase tracking-wider"
              >
                ← Back to plan
              </button>

              {/* Order Summary breakdown */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Summary</h4>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center gap-3">
                      <span className="truncate max-w-[220px] text-slate-400">{item.brand} {item.name}</span>
                      <span className="font-semibold shrink-0">₹{item.price.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-850 pt-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Estimated Tax (5%)</span>
                    <span>₹{estimatedTax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-200 font-bold text-sm pt-2 border-t border-slate-800/50">
                    <span>Grand Total</span>
                    <span className="text-emerald-400">₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Fields */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shipping Details</h4>
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label htmlFor="checkout-name" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      id="checkout-name"
                      value={checkoutForm.name}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-950/40 border border-slate-800 focus:border-violet-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all duration-200 shadow-inner"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="checkout-email" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      id="checkout-email"
                      value={checkoutForm.email}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-950/40 border border-slate-800 focus:border-violet-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all duration-200 shadow-inner"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="checkout-address" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivery Address</label>
                    <textarea
                      id="checkout-address"
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="w-full bg-slate-950/40 border border-slate-800 focus:border-violet-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all duration-200 resize-none shadow-inner"
                      placeholder="123 Main St, Mumbai, India"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="p-5 border-t border-slate-800/80 bg-slate-950/80">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/10 transition-all active:scale-98 cursor-pointer text-center"
              >
                Place Order
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS STATE VIEW */}
        {checkoutStep === "success" && (
          <div className="flex-1 flex flex-col justify-between p-5">
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              {/* Checkmark circle */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl shadow-lg shadow-emerald-500/5 animate-pulse">
                ✓
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-100 tracking-tight">Order Placed Successfully!</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Thank you for your order. ShopGenie has successfully registered your laptop shopping plan.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl px-5 py-3 text-center space-y-1">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-500">Order Reference ID</span>
                <span className="text-xs font-bold text-violet-400 block tracking-wider">{orderId}</span>
              </div>
            </div>

            <button
              onClick={handleContinueShopping}
              className="w-full py-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-all active:scale-98 cursor-pointer text-center"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-900 bg-slate-950/40 py-4 text-center px-4">
        <p className="text-[10px] text-slate-500 font-medium tracking-tight">
          ShopGenie AI © 2026 — Natural Language shopping matching engine powered by Gemini & Claude.
        </p>
      </footer>
    </div>
  );
}
