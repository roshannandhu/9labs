/**
 * Land dots for the services "signal map": a 104 × 65 hex grid (odd rows shifted half a dot), one bit per
 * dot, 26 hex digits per row. Generated once from dotted-map@2.2.3 (MIT, Natural Earth data):
 * height 56, grid "diagonal", lat −56…76, lng −170…180. Coordinates below are 0..1 of that 104 × 56 box.
 */
const W = 104;
const H = 56;
const ROWS = 65;
const ROW_H = Math.sqrt(3) / 2;
const HEX =
  "00028900fff800000c03f018000000f7e03ff800000807f80e00000000c03ff80000100fe00000000381003ff80000101ffc0000" +
  "0006a2d03ff00000213fff80000002f4f81ff0000031bfff8f000000e2f81ff0000023ffffbf001f007b7e1ff0007001ffffffc0" +
  "3ffe774e1fe000f805ffffffff3fff91ee1fc000febfffffffff3fffffc71f0001fe7f7fffffff7fffff871f0e01f9ffffffffff" +
  "5fffff5e1c0c03bffffffffffe9fffff030e0007ffffffffffff7ffffe180c000f7ffffffffffe3efffe0c0400073fffffffff9c" +
  "387ffc1d00000b7ffffffff9200c1fff0f800043bffffffff830001fff8f0000467fffffffe060000fffffc000a0fffffffff060" +
  "000fffdfc000effffffffff8400007ffff80003ffffffffffc000007fffc60007ffffffffff0000003ffff20003ffdfffffff400" +
  "0003ffff00003deb3fffffe0000003fffc0000f2e19fffffc4000003fff80000e1ffbffffd88000003fff80000e05fdffffc8800" +
  "0003fff000001c07fffffc90000000fff000007c03fffffe200000007fc00000fef7fffffe000000003e200000ffffbffffe0000" +
  "00003c200003ffff8ffffc000000001c000003fffff1fffc000000001c900003fffff0f3c0000000000f800003fffdf071e00000" +
  "000001c00007fffdc040e20000000000400003ffff0060e000000000004f0003ffffc0400000000000000fc000ffffc000008000" +
  "0000000fe00007ff80018800000000001ff00003ff0000dc00000000001ff80007fe0000da10000000001fff0001fe0000010c00" +
  "0000001fff0003fc00001808000000000fff0001fe00000000000000000ffe0003fe000000600000000007fe0003fec00000f400" +
  "00000003fe0003f8800001fc0000000003fe0001fc800007fe0800000003f80001f880000fff0000000003f80000f8000007ff80" +
  "00000007f00000f0000007ff0000000003f00000f00000079f0000000007800000800000041e0000000007c00000000000000700" +
  "00000007000000000000000002000000070000000000000002020000000600000000000000000400000006000000000000000004" +
  "0000000e000000000000000000000000060000000001000000000000000c00000000000000000000000006000000000000000000" +
  "00000006000000000000000000";

/** every land dot as [x, y], 0..1 across the map box (aspect W:H) */
export function landDots(): Float32Array {
  const out: number[] = [];
  for (let k = 0; k < ROWS; k++)
    for (let c = 0; c < W; c++)
      if ((parseInt(HEX[k * 26 + (c >> 2)], 16) >> (3 - (c & 3))) & 1) out.push((c + (k % 2 ? 0 : 0.5)) / W, (k * ROW_H) / H);
  return Float32Array.from(out);
}

export const MAP_ASPECT = W / H;

/** Dubai South, the hub, projected onto the same box */
export const HUB = { x: 0.6394, y: 0.4949 };

/**
 * Nine ends of the world, each the centre of its country (largest landmass, area-weighted, from the same
 * dotted-map shapes): USA, Brazil, UK, South Africa, India, China, Russia, Japan, Australia.
 */
// prettier-ignore
const ENDS_XY = [
  0.202, 0.418,
  0.337, 0.696,
  0.481, 0.294,
  0.553, 0.804,
  0.712, 0.51,
  0.784, 0.433,
  0.764, 0.217,
  0.88, 0.433,
  0.87, 0.773,
];
export const ENDS = Array.from({ length: ENDS_XY.length / 2 }, (_, i) => ({ x: ENDS_XY[2 * i], y: ENDS_XY[2 * i + 1] }));
