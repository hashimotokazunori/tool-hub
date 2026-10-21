const PATHS = {
  home: "M3 11l9-7 9 7M5 10v10h14V10",
  tool: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
  bag: "M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 12l5 5L20 7",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z",
  // ツールのカテゴリ
  text: "M5 6h14M12 6v13M8 19h8",
  calc: "M5 3h14v18H5zM8 7h8M8 12h2M14 12h2M8 16h2M14 16h2",
  image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01",
  pdf: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6",
  gen: "M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1z",
  web: "M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14",
  life: "M3 7h18v12H3zM3 11h18M16 15h2",
  date: "M4 5h16v16H4zM4 9h16M9 3v4M15 3v4",
  biz: "M4 8h16v12H4zM9 8V5h6v3M4 13h16",
  design: "M12 3a9 9 0 0 0 0 18c1.1 0 1.5-.8 1.1-1.7-.6-1.3.3-2.3 1.6-2.3H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10zM7.5 11h.01M10 7h.01M15 7.5h.01",
  data: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14",
  // グッズのカテゴリ
  desk: "M3 10h18M5 10v10M19 10v10M8 10V6h8v4M10 14h4",
  gadgets: "M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2",
  homegoods: "M4 4h16v6H4zM4 14h16v6H4zM10 7h4M10 17h4",
  travel: "M6 7h12v13H6zM9 7V4h6v3M9 20v1M15 20v1M6 12h12",
  stationery: "M15 4l5 5L9 20H4v-5zM13 6l5 5",
} as const;

export type IconName = keyof typeof PATHS;

/** ツールのカテゴリID → アイコン */
export const toolCategoryIcon: Record<string, IconName> = { text: "text", calc: "calc", image: "image", pdf: "pdf", gen: "gen", web: "web", life: "life", date: "date", biz: "biz", design: "design", data: "data" };
/** グッズのカテゴリID → アイコン */
export const goodsCategoryIcon: Record<string, IconName> = { desk: "desk", gadgets: "gadgets", home: "homegoods", travel: "travel", stationery: "stationery", apps: "bolt" };

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
