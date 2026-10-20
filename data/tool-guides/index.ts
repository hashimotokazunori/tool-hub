import { guides1 } from "./part1";
import { guides2 } from "./part2";
import { guides3 } from "./part3";
import { guides4 } from "./part4";
import { guides5 } from "./part5";
import { guides6 } from "./part6";
import { guides7 } from "./part7";
import { guides8 } from "./part8";
import { guides9 } from "./part9";
import { guides10 } from "./part10";
import { guides11 } from "./part11";
import { guides12 } from "./part12";
import type { ToolGuide } from "./types";

/** ツールの slug → 使い方とよくある質問 */
export const toolGuides: Record<string, ToolGuide> = { ...guides1, ...guides2, ...guides3, ...guides4, ...guides5, ...guides6, ...guides7, ...guides8, ...guides9, ...guides10, ...guides11, ...guides12 };

export const getToolGuide = (slug: string): ToolGuide | undefined => toolGuides[slug];
