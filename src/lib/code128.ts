export type Code128BarSegment = {
  x: number;
  width: number;
};

export type Code128BEncoding = {
  status: "printable";
  value: string;
  codewords: number[];
  bars: Code128BarSegment[];
  symbolModules: number;
  totalModules: number;
  widthMm: number;
  barHeightMm: number;
  quietZoneModules: number;
};

export type Code128BBlockedReason =
  | "unsupported-character"
  | "width-exceeded"
  | "height-exceeded";

export type Code128BBlocked = {
  status: "blocked";
  reason: Code128BBlockedReason;
  value: string;
  symbolModules?: number;
  totalModules?: number;
  widthMm?: number;
};

export type Code128BResult = Code128BEncoding | Code128BBlocked;

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312",
  "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
  "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131",
  "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
  "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
  "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
  "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114",
  "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112",
  "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
  "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412",
  "211232", "211214", "2331112",
] as const;

const START_CODE_B = 104;
const STOP_CODE = 106;
export const CODE128_MODULE_WIDTH_MM = 0.25;
export const CODE128_QUIET_ZONE_MODULES = 10;
export const CODE128_BAR_HEIGHT_MM = 10;
export const CODE128_LABEL_WIDTH_MM = 70;
export const CODE128_LABEL_HEIGHT_MM = 35;

function getDataCodewords(value: string): number[] {
  return Array.from(value, (character) => (character.codePointAt(0) ?? 0) - 32);
}

function getChecksum(dataCodewords: readonly number[]): number {
  const weightedSum = dataCodewords.reduce(
    (sum, codeword, index) => sum + codeword * (index + 1),
    START_CODE_B,
  );

  return weightedSum % 103;
}

function getBarSegments(codewords: readonly number[]): {
  bars: Code128BarSegment[];
  symbolModules: number;
} {
  const bars: Code128BarSegment[] = [];
  let symbolModules = 0;

  for (const codeword of codewords) {
    const pattern = CODE128_PATTERNS[codeword];

    if (pattern === undefined) {
      throw new RangeError("El carácter no tiene un patrón Code 128-B válido.");
    }

    for (let runIndex = 0; runIndex < pattern.length; runIndex += 1) {
      const runWidth = Number(pattern[runIndex]);

      if (runIndex % 2 === 0) {
        bars.push({ x: symbolModules, width: runWidth });
      }

      symbolModules += runWidth;
    }
  }

  return { bars, symbolModules };
}

export function encodeCode128B(value: string): Code128BResult {
  const codePoints = Array.from(value, (character) => character.codePointAt(0) ?? 0);

  if (codePoints.some((codePoint) => codePoint < 32 || codePoint > 126)) {
    return { status: "blocked", reason: "unsupported-character", value };
  }

  const dataCodewords = getDataCodewords(value);
  const codewords = [
    START_CODE_B,
    ...dataCodewords,
    getChecksum(dataCodewords),
    STOP_CODE,
  ];
  const { bars, symbolModules } = getBarSegments(codewords);
  const totalModules = symbolModules + CODE128_QUIET_ZONE_MODULES * 2;
  const widthMm = totalModules * CODE128_MODULE_WIDTH_MM;

  if (CODE128_BAR_HEIGHT_MM > CODE128_LABEL_HEIGHT_MM) {
    return {
      status: "blocked",
      reason: "height-exceeded",
      value,
      symbolModules,
      totalModules,
      widthMm,
    };
  }

  if (widthMm > CODE128_LABEL_WIDTH_MM) {
    return {
      status: "blocked",
      reason: "width-exceeded",
      value,
      symbolModules,
      totalModules,
      widthMm,
    };
  }

  return {
    status: "printable",
    value,
    codewords,
    bars: bars.map((bar) => ({
      ...bar,
      x: bar.x + CODE128_QUIET_ZONE_MODULES,
    })),
    symbolModules,
    totalModules,
    widthMm,
    barHeightMm: CODE128_BAR_HEIGHT_MM,
    quietZoneModules: CODE128_QUIET_ZONE_MODULES,
  };
}
