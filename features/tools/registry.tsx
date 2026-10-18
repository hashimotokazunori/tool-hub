import type { ComponentType } from "react";
import type { ToolComponentKey } from "./keys";
import { PresentationTime, ReadingTime, WageConverter } from "./business/time/Tools";
import { Average, Discount, Percentage, Ratio, Rounding } from "./calculator/basic/Tools";
import ConsumptionTax from "./calculator/consumption-tax/Tool";
import { Age, DateAdd, Weekday } from "./date/calendar/Tools";
import DaysBetween from "./date/days-between/Tool";
import { Base64, HtmlEscape, JsonFormatter, RegexTester, UrlEncode } from "./developer/encode/Tools";
import PasswordGenerator from "./generator/password-generator/Tool";
import { RandomNumber, Uuid } from "./generator/random/Tools";
import Warikan from "./life/warikan/Tool";
import CharacterCounter from "./text/character-counter/Tool";
import { CaseConverter, HiraganaKatakana, RemoveDuplicateLines, TextReplace, WhitespaceRemover, ZenkakuHankaku } from "./text/convert/Tools";
import ManuscriptPaper from "./text/manuscript-paper/Tool";
import TextDiff from "./text/text-diff/Tool";

/** 画面キー → ツールの画面。keys.ts のキーがすべてそろっていないと型エラーになる */
export const toolComponents: Record<ToolComponentKey, ComponentType> = {
  characterCounter: CharacterCounter,
  manuscriptPaper: ManuscriptPaper,
  hiraganaKatakana: HiraganaKatakana,
  zenkakuHankaku: ZenkakuHankaku,
  caseConverter: CaseConverter,
  whitespaceRemover: WhitespaceRemover,
  textReplace: TextReplace,
  removeDuplicateLines: RemoveDuplicateLines,
  textDiff: TextDiff,
  consumptionTax: ConsumptionTax,
  discount: Discount,
  percentage: Percentage,
  ratio: Ratio,
  average: Average,
  rounding: Rounding,
  daysBetween: DaysBetween,
  dateAdd: DateAdd,
  weekday: Weekday,
  age: Age,
  passwordGenerator: PasswordGenerator,
  randomNumber: RandomNumber,
  uuid: Uuid,
  jsonFormatter: JsonFormatter,
  urlEncode: UrlEncode,
  base64: Base64,
  htmlEscape: HtmlEscape,
  regexTester: RegexTester,
  warikan: Warikan,
  wageConverter: WageConverter,
  presentationTime: PresentationTime,
  readingTime: ReadingTime,
};
