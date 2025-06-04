"use client";

import { useState } from "react";
import {
  Search,
  TrendingUp,
  FileText,
  Clock,
  Building2,
  DollarSign,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types for the nested structures
type KeyMetrics = {
  peRatio: string;
  eps: string;
  dividend: string;
  beta: string;
};

type BusinessOverviewObject = {
  Description: string;
  "Products/Services": string[];
  "Market Position": string;
};

type FinancialHighlightsObject = Record<string, string | number>;

type ComparableCompany = {
  Company: string;
  "Market Position": string;
  "Valuation Multiple"?: string;
  "Growth Rate"?: string;
};

type ValuationNarrativeObject = {
  Approach: string;
  "Fair Value": string;
};

type RiskEntry = string | { Risk: string; Mitigation?: string };
// We’ll allow either an array of strings or array of objects.

type MemoObject = {
  "Executive Summary": string | Record<string, any>;
  "Business Overview": string | BusinessOverviewObject;
  "Financial Highlights": string | FinancialHighlightsObject;
  "Comparable Companies": string | string[] | ComparableCompany[];
  "Valuation Narrative": string | ValuationNarrativeObject;
  "Risks & Recommendations": string | (string | Record<string, any>)[];
  Recommendation: string;
  "Target Price": string;
};

type BackendResponse = {
  company_name: string;
  Sector: string;
  "Market Cap": string;
  Price: string;
  Volume: string;
  "Price Change": string;
  "Key Metrics": KeyMetrics;
  memo: MemoObject;
};

export default function DealIQApp() {
  const [ticker, setTicker] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<BackendResponse | null>(null);

  // Helper: if value is a JSON string, parse it; else return original
  function parseIfJson(value: any): any {
    if (typeof value === "string") {
      const trimmed = value.trim();
      try {
        return JSON.parse(trimmed);
      } catch {
        return value;
      }
    }
    return value;
  }

  const handleGenerateMemo = async () => {
    if (!ticker.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/generate_memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const json: BackendResponse = await res.json();
      console.log("🔍 Backend response:", json);
      setData(json);
    } catch (err) {
      console.error(err);
      alert("Failed to generate memo. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const recentSearches = ["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DealIQ
                </h1>
                <p className="text-sm text-muted-foreground">
                  Investment Banking Intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Live Data
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Search Card */}
          <Card className="mb-8 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-slate-800">
                Generate Investment Memo
              </CardTitle>
              <CardDescription className="text-lg text-slate-600">
                Enter a stock ticker to generate a comprehensive memo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex space-x-4 max-w-md mx-auto">
                <div className="flex-1">
                  <Input
                    placeholder="Enter ticker (e.g., AAPL)"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="text-lg h-12 text-center font-semibold"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleGenerateMemo()
                    }
                  />
                </div>
                <Button
                  onClick={handleGenerateMemo}
                  disabled={isLoading || !ticker.trim()}
                  className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Search className="w-5 h-5" />
                      <span>Generate Memo</span>
                    </div>
                  )}
                </Button>
              </div>
              {/* Recent Searches */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Recent searches:
                </p>
                <div className="flex justify-center space-x-2 flex-wrap">
                  {recentSearches.map((sym) => (
                    <Button
                      key={sym}
                      variant="outline"
                      size="sm"
                      onClick={() => setTicker(sym)}
                      className="text-xs"
                    >
                      {sym}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memo Results */}
          {data && (
            <div className="space-y-6">
              {/* Top Info Card */}
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center space-x-3">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        <span>
                          {data.company_name} ({ticker})
                        </span>
                      </CardTitle>
                      <CardDescription className="text-lg mt-1">
                        {data.Sector} • Generated {new Date().toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-800">
                        {data.Price}
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          data["Price Change"].startsWith("-")
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {data["Price Change"]}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Key Metrics */}
                    {Object.entries(data["Key Metrics"]).map(([k, v]) => (
                      <div
                        key={k}
                        className="text-center p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="text-sm text-muted-foreground">{k}</div>
                        <div className="text-lg font-semibold">{v}</div>
                      </div>
                    ))}
                    {/* Market Cap */}
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Market Cap
                      </div>
                      <div className="text-lg font-semibold">
                        {data["Market Cap"]}
                      </div>
                    </div>
                    {/* Volume */}
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Volume
                      </div>
                      <div className="text-lg font-semibold">{data.Volume}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Narrative Tabs */}
              <Tabs defaultValue="summary" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm">
                  <TabsTrigger
                    value="summary"
                    className="flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Summary</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="overview"
                    className="flex items-center space-x-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Overview</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="risks"
                    className="flex items-center space-x-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Risks</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="recommendation"
                    className="flex items-center space-x-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Recommendation</span>
                  </TabsTrigger>
                </TabsList>

                {/* Executive Summary */}
                <TabsContent value="summary">
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Executive Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const parsed = parseIfJson(
                          data.memo["Executive Summary"]
                        );
                        if (typeof parsed === "string") {
                          return (
                            <p className="text-slate-700 leading-relaxed text-lg">
                              {parsed || "No summary available."}
                            </p>
                          );
                        } else {
                          return (
                            <pre className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                              {JSON.stringify(parsed, null, 2)}
                            </pre>
                          );
                        }
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Business Overview & Financial Highlights */}
                <TabsContent value="overview">
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm mb-4">
                    <CardHeader>
                      <CardTitle>Business Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const parsed = parseIfJson(
                          data.memo["Business Overview"]
                        );
                        if (typeof parsed === "string") {
                          return (
                            <p className="text-slate-700 leading-relaxed text-lg">
                              {parsed || "No business overview provided."}
                            </p>
                          );
                        } else {
                          const obj = parsed as BusinessOverviewObject;
                          return (
                            <div className="space-y-3 text-slate-700 text-lg">
                              <p>
                                <strong>Description:</strong> {obj.Description}
                              </p>
                              <p>
                                <strong>Market Position:</strong>{" "}
                                {obj["Market Position"]}
                              </p>
                              <div>
                                <strong>Products/Services:</strong>
                                <ul className="list-disc list-inside">
                                  {obj["Products/Services"].map((prod, idx) => (
                                    <li key={idx}>{prod}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Financial Highlights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const parsed = parseIfJson(
                          data.memo["Financial Highlights"]
                        );
                        if (typeof parsed === "string") {
                          return (
                            <p className="text-slate-700 leading-relaxed text-lg">
                              {parsed || "No financial highlights provided."}
                            </p>
                          );
                        } else {
                          const obj = parsed as FinancialHighlightsObject;
                          return (
                            <ul className="space-y-2 text-slate-700 text-lg">
                              {Object.entries(obj).map(([key, value]) => (
                                <li key={key}>
                                  <strong>{key}:</strong> {value}
                                </li>
                              ))}
                            </ul>
                          );
                        }
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Risks */}
                <TabsContent value="risks">
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Risks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const parsed = parseIfJson(
                          data.memo["Risks & Recommendations"]
                        );
                        if (typeof parsed === "string") {
                          return (
                            <p className="text-slate-700 leading-relaxed text-lg">
                              {parsed || "No risks provided."}
                            </p>
                          );
                        } else if (Array.isArray(parsed)) {
                          return (
                            <ul className="space-y-3 text-slate-700 text-lg">
                              {parsed.map((entry, idx) => {
                                // If entry is object, extract entry.Risk; if string, use it directly
                                const riskText =
                                  typeof entry === "string"
                                    ? entry
                                    : (entry as any).Risk || "";
                                return (
                                  <li key={idx}>
                                    <p>
                                      <strong>• {riskText}</strong>
                                    </p>
                                  </li>
                                );
                              })}
                            </ul>
                          );
                        } else {
                          // If it’s an object with array inside, try to extract a “Risks & Recommendations” field:
                          if (
                            typeof parsed === "object" &&
                            Array.isArray(
                              (parsed as any)["Risks & Recommendations"]
                            )
                          ) {
                            const arr2 = (parsed as any)[
                              "Risks & Recommendations"
                            ];
                            return (
                              <ul className="space-y-3 text-slate-700 text-lg">
                                {arr2.map((entry: any, idx: number) => {
                                  const riskText =
                                    typeof entry === "string"
                                      ? entry
                                      : entry.Risk || "";
                                  return (
                                    <li key={idx}>
                                      <p>
                                        <strong>• {riskText}</strong>
                                      </p>
                                    </li>
                                  );
                                })}
                              </ul>
                            );
                          }
                          return (
                            <p className="text-slate-700 leading-relaxed text-lg">
                              No risks provided.
                            </p>
                          );
                        }
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Recommendation & Valuation Narrative */}
                <TabsContent value="recommendation">
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm mb-4">
                    <CardHeader>
                      <CardTitle>Investment Recommendation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-4">
                        <div
                          className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full text-xl font-bold ${
                            data.memo.Recommendation === "BUY"
                              ? "bg-green-100 text-green-800"
                              : data.memo.Recommendation === "SELL"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          <TrendingUp className="w-6 h-6" />
                          <span>{data.memo.Recommendation || "N/A"}</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                          Target Price: {data.memo["Target Price"] || "N/A"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Valuation Narrative</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const parsed = parseIfJson(
                          data.memo["Valuation Narrative"]
                        );
                        if (typeof parsed === "string") {
                          return (
                            <p className="text-slate-700 leading-relaxed text-lg">
                              {parsed || "No valuation narrative provided."}
                            </p>
                          );
                        } else {
                          const obj = parsed as ValuationNarrativeObject;
                          return (
                            <div className="space-y-3 text-slate-700 text-lg">
                              <p>
                                <strong>Approach:</strong> {obj.Approach}
                              </p>
                              <p>
                                <strong>Fair Value:</strong> {obj["Fair Value"]}
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
