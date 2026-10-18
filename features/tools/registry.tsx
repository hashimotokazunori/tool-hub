import type { ComponentType } from "react";
import type { ToolComponentKey } from "./keys";
import ConsumptionTax from "./calculator/consumption-tax/Tool";
import DaysBetween from "./date/days-between/Tool";
import PasswordGenerator from "./generator/password-generator/Tool";
import Warikan from "./life/warikan/Tool";
import CharacterCounter from "./text/character-counter/Tool";

/** 画面キー → ツールの画面。keys.ts のキーがすべてそろっていないと型エラーになる */
export const toolComponents: Record<ToolComponentKey, ComponentType> = {
  characterCounter: CharacterCounter,
  consumptionTax: ConsumptionTax,
  daysBetween: DaysBetween,
  warikan: Warikan,
  passwordGenerator: PasswordGenerator,
};
