/**
 * 実装済みツールの画面キー。data/tools.ts の componentKey と対応させる。
 * 画面そのものは registry.tsx（クライアント部品）で対応づける。
 * ここに無いキーのツールは公開できない（lib/validation.ts で検査）。
 */
export const TOOL_COMPONENT_KEYS = ["characterCounter", "consumptionTax", "daysBetween", "warikan", "passwordGenerator"] as const;

export type ToolComponentKey = (typeof TOOL_COMPONENT_KEYS)[number];

export const hasToolComponent = (key: string): key is ToolComponentKey => (TOOL_COMPONENT_KEYS as readonly string[]).includes(key);
