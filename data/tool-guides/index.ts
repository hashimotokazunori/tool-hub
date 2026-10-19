import { guides1 } from "./part1";
import { guides2 } from "./part2";
import { guides3 } from "./part3";
import { guides4 } from "./part4";
import { guides5 } from "./part5";
import { guides6 } from "./part6";
import type { ToolGuide } from "./types";

/** ツールの slug → 使い方とよくある質問 */
export const toolGuides: Record<string, ToolGuide> = { ...guides1, ...guides2, ...guides3, ...guides4, ...guides5, ...guides6 };

export const getToolGuide = (slug: string): ToolGuide | undefined => toolGuides[slug];
