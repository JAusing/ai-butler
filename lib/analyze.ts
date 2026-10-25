import { z } from "zod";
import { openai, OPENAI_MODEL } from "@/lib/openai";

import { CATEGORIES } from "@/lib/categories";

const itemSchema = z.object({
  title: z.string(),
  type: z.enum(["expense", "income"]),
  amount: z.number().positive(),
  currency: z.string(),
  category: z.enum(CATEGORIES),
  merchant: z.string().nullable(),
  occurredAt: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

const analysisSchema = z.object({
  summary: z.string(),
  note: z.string().nullable(),
  items: z.array(itemSchema),
});

export type AnalysisItem = z.infer<typeof itemSchema>;
export type Analysis = z.infer<typeof analysisSchema>;

const jsonSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    note: { type: ["string", "null"] },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          type: { type: "string", enum: ["expense", "income"] },
          amount: { type: "number" },
          currency: { type: "string" },
          category: { type: "string", enum: [...CATEGORIES] },
          merchant: { type: ["string", "null"] },
          occurredAt: { type: ["string", "null"] },
          confidence: { type: "number" },
        },
        required: [
          "title",
          "type",
          "amount",
          "currency",
          "category",
          "merchant",
          "occurredAt",
          "confidence",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "note", "items"],
  additionalProperties: false,
} as const;

/** today is the user's local date (YYYY-MM-DD), used to resolve "昨天" etc. */
export async function analyzeText(text: string, today: string): Promise<Analysis> {
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: [
          "你是記帳助手，把使用者輸入的一段文字拆解成一筆或多筆收支紀錄。",
          `今天日期是 ${today}。`,
          "文字中提到的每一筆消費或收入各自獨立成一個 item，不要合併；沒有金額的項目不要輸出。",
          "summary: 一句繁體中文摘要，格式如「這次解析出 3 筆支出：午餐牛肉麵 200 元、下午打保齡球 190 元」；若同時有收入與支出則如實描述。",
          "title: 簡短標題，例如「午餐 牛肉麵」。",
          "type: 支出為 expense，收入為 income。",
          "category: 從列舉中選最貼切的一項；薪水、獎金等工作收入用「薪資」。",
          "amount: 正數金額。",
          "currency: ISO 4217 代碼，未提及時預設 TWD。",
          "merchant: 店家或對象名稱，文字中看不出來時填 null。",
          "occurredAt: ISO 8601 日期 (YYYY-MM-DD)，把「昨天」等相對說法換算成實際日期；未提及時填 null。",
          "confidence: 0 到 1，表示你對這筆解析結果（金額、分類等）的把握程度。",
          "note: 整段文字的備註，放在頂層而非每個 item；只寫一行簡短中文，例如「跟朋友一起出去」，沒有額外資訊時填 null。",
        ].join("\n"),
      },
      { role: "user", content: text },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "entry_analysis", strict: true, schema: jsonSchema },
    },
  });

  const content = completion.choices[0]?.message.content;
  if (!content) throw new Error("OpenAI returned an empty response");
  return analysisSchema.parse(JSON.parse(content));
}
