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
import { TravelExpenseSplit, UnitPrice, Budget, ElectricityCost, Tip, DataSize } from "./life/money/Tools";
import { BulkImageResize, ImageCompress, ImageConvert, ImageResize } from "./image/convert/Tools";
import { ImageToPdf, PdfCompress, PdfMerge, PdfOrganize, PdfSplit } from "./pdf/Tools";
import { ImageCrop, ImageRotate } from "./image/edit/Tools";
import { Bmi, LoanSimulator } from "./calculator/finance/Tools";
import UnitConverter from "./calculator/unit/Tool";
import SchoolYears from "./date/school/Tool";
import QrCode from "./generator/qr/Tool";
import { LineParagraphCounter } from "./text/lines/Tool";
import { TimeUnits, CronParser } from "./developer/schedule/Tools";
import { DummyData, DummyText, SnsCharacterCount, EmailTemplates } from "./generator/content/Tools";
import { MeetingMinutes, MeetingPlanner } from "./business/meeting/Tools";
import { GradientMaker, ColorPalette, BoxShadowMaker, CssUnitConverter } from "./design/css/Tools";
import { FaviconMaker } from "./design/favicon/Tool";
import { CsvDedupe, CsvColumns, CsvDelimiter, CsvDiff } from "./data/csv/Tools";
import { ImageColorPicker, BackgroundRemover } from "./image/color/Tools";
import { ImageText } from "./image/text/Tool";
import { VideoToGif, AudioConverter } from "./media/Tools";
import { Hanko } from "./generator/hanko/Tool";
import { PdfEditor } from "./pdf/editor/Tool";
import { TextFileMerge, BulkRename } from "./files/Tools";
import { ExcelCsvConverter } from "./data/excel/Tool";
import { Countdown, TimeZone, UnixTime, BusinessDays, WeekNumber } from "./date/time/Tools";
import { HashGenerator, ColorConverter, JwtDecoder } from "./developer/crypto/Tools";
import { CompoundInterest, SavingsGoal, OvertimePay, StepsDistance } from "./life/plan/Tools";
import { AchievementRate, ProgressRate, StudyTime } from "./business/progress/Tools";
import { PdfToImage } from "./pdf/to-image/Tool";
import { SquareImage, ImagePadding, ImageMosaic } from "./image/extra/Tools";
import { ContrastChecker, CsvToJson, JsonToCsv } from "./data/convert/Tools";
import CsvEncoding from "./data/charset/Tool";
import { Bingo, Lottery } from "./generator/random/Lottery";
import TaskPriority from "./business/priority/Tool";
import FurusatoLimit from "./life/furusato/Tool";

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
  imageConvert: ImageConvert,
  imageResize: ImageResize,
  imageCompress: ImageCompress,
  bulkImageResize: BulkImageResize,
  pdfMerge: PdfMerge,
  pdfSplit: PdfSplit,
  imageToPdf: ImageToPdf,
  pdfCompress: PdfCompress,
  csvEncoding: CsvEncoding,
  travelExpenseSplit: TravelExpenseSplit,
  unitPrice: UnitPrice,
  budget: Budget,
  electricityCost: ElectricityCost,
  tip: Tip,
  dataSize: DataSize,
  lottery: Lottery,
  bingo: Bingo,
  taskPriority: TaskPriority,
  qrCode: QrCode,
  loanSimulator: LoanSimulator,
  unitConverter: UnitConverter,
  bmi: Bmi,
  schoolYears: SchoolYears,
  imageCrop: ImageCrop,
  imageRotate: ImageRotate,
  pdfOrganize: PdfOrganize,
  countdown: Countdown,
  timeZone: TimeZone,
  unixTime: UnixTime,
  businessDays: BusinessDays,
  weekNumber: WeekNumber,
  hashGenerator: HashGenerator,
  colorConverter: ColorConverter,
  jwtDecoder: JwtDecoder,
  compoundInterest: CompoundInterest,
  savingsGoal: SavingsGoal,
  overtimePay: OvertimePay,
  stepsDistance: StepsDistance,
  achievementRate: AchievementRate,
  progressRate: ProgressRate,
  studyTime: StudyTime,
  pdfToImage: PdfToImage,
  squareImage: SquareImage,
  imagePadding: ImagePadding,
  imageMosaic: ImageMosaic,
  contrastChecker: ContrastChecker,
  csvToJson: CsvToJson,
  jsonToCsv: JsonToCsv,
  lineParagraphCounter: LineParagraphCounter,
  timeUnits: TimeUnits,
  cronParser: CronParser,
  dummyData: DummyData,
  dummyText: DummyText,
  snsCharacterCount: SnsCharacterCount,
  emailTemplates: EmailTemplates,
  meetingMinutes: MeetingMinutes,
  meetingPlanner: MeetingPlanner,
  gradientMaker: GradientMaker,
  colorPalette: ColorPalette,
  boxShadowMaker: BoxShadowMaker,
  cssUnitConverter: CssUnitConverter,
  faviconMaker: FaviconMaker,
  csvDedupe: CsvDedupe,
  csvColumns: CsvColumns,
  csvDelimiter: CsvDelimiter,
  csvDiff: CsvDiff,
  imageColorPicker: ImageColorPicker,
  backgroundRemover: BackgroundRemover,
  imageText: ImageText,
  videoToGif: VideoToGif,
  audioConverter: AudioConverter,
  hanko: Hanko,
  pdfEditor: PdfEditor,
  textFileMerge: TextFileMerge,
  bulkRename: BulkRename,
  excelCsvConverter: ExcelCsvConverter,
  furusatoLimit: FurusatoLimit,
};
