export const CATEGORIES = [
  "飲食",
  "交通",
  "購物",
  "娛樂",
  "居住",
  "醫療",
  "教育",
  "薪資",
  "其他",
] as const;

export type Category = (typeof CATEGORIES)[number];

interface CategoryMeta {
  icon: string;
  bar: string;
  tint: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  飲食: { icon: "🍜", bar: "bg-orange-400", tint: "bg-orange-100 dark:bg-orange-500/20" },
  交通: { icon: "🚇", bar: "bg-sky-400", tint: "bg-sky-100 dark:bg-sky-500/20" },
  購物: { icon: "🛍️", bar: "bg-pink-400", tint: "bg-pink-100 dark:bg-pink-500/20" },
  娛樂: { icon: "🎮", bar: "bg-violet-400", tint: "bg-violet-100 dark:bg-violet-500/20" },
  居住: { icon: "🏠", bar: "bg-emerald-400", tint: "bg-emerald-100 dark:bg-emerald-500/20" },
  醫療: { icon: "💊", bar: "bg-red-400", tint: "bg-red-100 dark:bg-red-500/20" },
  教育: { icon: "📚", bar: "bg-indigo-400", tint: "bg-indigo-100 dark:bg-indigo-500/20" },
  薪資: { icon: "💰", bar: "bg-green-400", tint: "bg-green-100 dark:bg-green-500/20" },
  其他: { icon: "✨", bar: "bg-zinc-400", tint: "bg-zinc-200 dark:bg-zinc-500/20" },
};

export function categoryMeta(name: string): CategoryMeta {
  return CATEGORY_META[name as Category] ?? CATEGORY_META["其他"];
}
