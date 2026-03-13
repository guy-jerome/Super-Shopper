/**
 * Home Storage Tab Background Illustration
 * Scene: warm Italian pantry — open wooden shelves with labelled jars,
 *        hanging garlic braid, cloth bags, terracotta counter edge,
 *        olive oil bottle and wooden spoon.
 * Canvas: 390 × 260  |  Rendered behind UI at ~17% opacity.
 */
import React from 'react';
import Svg, {
  Rect, Circle, Path, Ellipse, Line, G, Polygon, Text as SvgText,
} from 'react-native-svg';
import { useSettingsStore, type Season } from '../../stores/useSettingsStore';

interface Palette {
  wall: string;
  shelf: string;
  shelfEdge: string;
  shelfShadow: string;
  counter: string;
  counterEdge: string;
  grain: string;
  jar: string;
  jarLid: string;
  jarHighlight: string;
  jarShadow: string;
  bagCloth: string;
  bagBind: string;
  garlicBulb: string;
  garlicBraid: string;
  chili: string;
  oilBottle: string;
  oilLiquid: string;
  spoon: string;
  shadow: string;
}

const palettes: Record<Season, Palette> = {
  spring: {
    wall:        '#EFF7EC',
    shelf:       '#C0A870',
    shelfEdge:   '#A88C58',
    shelfShadow: '#7A6438',
    counter:     '#D4A870',
    counterEdge: '#B89050',
    grain:       '#9A742E',
    jar:         '#C8E0C8',
    jarLid:      '#7BBFA8',
    jarHighlight:'#E8F5E8',
    jarShadow:   '#88B888',
    bagCloth:    '#D8E8B0',
    bagBind:     '#8BAA60',
    garlicBulb:  '#F0EDD0',
    garlicBraid: '#D4C880',
    chili:       '#F07870',
    oilBottle:   '#A0C898',
    oilLiquid:   '#C8E098',
    spoon:       '#C09060',
    shadow:      '#304828',
  },
  summer: {
    wall:        '#EEF8E6',
    shelf:       '#A88C5A',
    shelfEdge:   '#8A7040',
    shelfShadow: '#604E28',
    counter:     '#C89858',
    counterEdge: '#A87838',
    grain:       '#806030',
    jar:         '#B8DCB0',
    jarLid:      '#6BA85C',
    jarHighlight:'#E0F4D0',
    jarShadow:   '#78AA68',
    bagCloth:    '#C8E0A0',
    bagBind:     '#709A4A',
    garlicBulb:  '#F0ECC8',
    garlicBraid: '#CAC070',
    chili:       '#E86858',
    oilBottle:   '#88B880',
    oilLiquid:   '#B8D880',
    spoon:       '#A88050',
    shadow:      '#284018',
  },
  autumn: {
    wall:        '#F7EDD8',
    shelf:       '#9A6A48',
    shelfEdge:   '#7A5230',
    shelfShadow: '#503618',
    counter:     '#C07840',
    counterEdge: '#A06030',
    grain:       '#703C18',
    jar:         '#E8C888',
    jarLid:      '#C8703A',
    jarHighlight:'#F8EAC8',
    jarShadow:   '#B89850',
    bagCloth:    '#D8B870',
    bagBind:     '#A07838',
    garlicBulb:  '#F4EAC0',
    garlicBraid: '#D4BC68',
    chili:       '#D84030',
    oilBottle:   '#B89850',
    oilLiquid:   '#D8C068',
    spoon:       '#A86838',
    shadow:      '#3A2810',
  },
  winter: {
    wall:        '#E8EEF5',
    shelf:       '#788898',
    shelfEdge:   '#607080',
    shelfShadow: '#405060',
    counter:     '#90A0B0',
    counterEdge: '#708090',
    grain:       '#506070',
    jar:         '#C0CFDF',
    jarLid:      '#7898B8',
    jarHighlight:'#E0ECF5',
    jarShadow:   '#90A8C0',
    bagCloth:    '#B8C8D8',
    bagBind:     '#6880A0',
    garlicBulb:  '#E8ECF0',
    garlicBraid: '#C0C8D0',
    chili:       '#9090B0',
    oilBottle:   '#8898B0',
    oilLiquid:   '#A8C0D0',
    spoon:       '#788898',
    shadow:      '#283848',
  },
};

export function HomeStorageTabIllustration() {
  const { season } = useSettingsStore();
  const p = palettes[season] ?? palettes.autumn;

  // Jar positions: [x, y, width, height, label]
  const jars: [number, number, number, number, string][] = [
    [42,  76, 40, 52, 'FLOUR'],
    [92,  82, 36, 46, 'RICE'],
    [138, 78, 40, 50, 'PASTA'],
    [190, 84, 34, 44, 'SUGAR'],
    [238, 74, 44, 54, 'OATS'],
  ];

  return (
    <Svg
      viewBox="0 0 390 260"
      preserveAspectRatio="xMidYMax slice"
      width="100%"
      height="100%"
    >
      {/* ── WALL ──────────────────────────────────────────────────────────── */}
      <Rect x={0} y={0} width={390} height={260} fill={p.wall} />

      <G transform="translate(0, 80)">
      {/* ── SHELF SUPPORT BRACKET (left) ──────────────────────────────────── */}
      <Polygon points="30,142 30,152 46,152" fill={p.shelfShadow} opacity={0.5} />
      {/* ── SHELF SUPPORT BRACKET (right) ─────────────────────────────────── */}
      <Polygon points="298,142 298,152 282,152" fill={p.shelfShadow} opacity={0.5} />

      {/* ── MAIN SHELF ────────────────────────────────────────────────────── */}
      {/* Shelf underside shadow */}
      <Rect x={28} y={140} width={272} height={5}  fill={p.shelfShadow} opacity={0.35} />
      {/* Shelf board */}
      <Rect x={28} y={132} width={272} height={12} fill={p.shelf} />
      {/* Shelf top highlight edge */}
      <Rect x={28} y={132} width={272} height={2}  fill={p.shelfEdge} />
      {/* Wood grain on shelf */}
      <Line x1={50}  y1={134} x2={50}  y2={144} stroke={p.grain} strokeWidth={1} opacity={0.25} />
      <Line x1={100} y1={134} x2={100} y2={144} stroke={p.grain} strokeWidth={1} opacity={0.20} />
      <Line x1={160} y1={134} x2={160} y2={144} stroke={p.grain} strokeWidth={1} opacity={0.25} />
      <Line x1={220} y1={134} x2={220} y2={144} stroke={p.grain} strokeWidth={1} opacity={0.20} />
      <Line x1={270} y1={134} x2={270} y2={144} stroke={p.grain} strokeWidth={1} opacity={0.25} />

      {/* ── JARS ON SHELF ─────────────────────────────────────────────────── */}
      {jars.map(([jx, jy, jw, jh, label]) => (
        <G key={label}>
          {/* Jar body */}
          <Rect x={jx} y={jy} width={jw} height={jh} rx={5} ry={5} fill={p.jar} />
          {/* Highlight strip */}
          <Rect x={jx + 4} y={jy + 4} width={7} height={jh - 8} rx={3} ry={3} fill={p.jarHighlight} opacity={0.7} />
          {/* Shadow strip right */}
          <Rect x={jx + jw - 8} y={jy + 4} width={4} height={jh - 8} rx={2} ry={2} fill={p.jarShadow} opacity={0.4} />
          {/* Clip-top lid */}
          <Rect x={jx + 4} y={jy - 6} width={jw - 8} height={8} rx={2} ry={2} fill={p.jarLid} />
          {/* Wire latch suggestion */}
          <Ellipse cx={jx + jw / 2} cy={jy - 2} rx={3} ry={2} fill="none" stroke={p.grain} strokeWidth={1} opacity={0.6} />
          {/* Label band */}
          <Rect x={jx + 4} y={jy + jh * 0.38} width={jw - 8} height={14} rx={2} ry={2} fill={p.jarHighlight} opacity={0.85} />
          {/* Label text */}
          <SvgText
            x={jx + jw / 2}
            y={jy + jh * 0.38 + 10}
            textAnchor="middle"
            fontSize={6}
            fontWeight="bold"
            fill={p.shelfShadow}
            opacity={0.75}
          >
            {label}
          </SvgText>
        </G>
      ))}

      {/* ── GARLIC BRAID (right side, hanging) ────────────────────────────── */}
      {/* Twine */}
      <Line x1={330} y1={30} x2={330} y2={100} stroke={p.garlicBraid} strokeWidth={2} />
      {/* Bulbs: 3 rows */}
      {[55, 75, 95].map((by, ri) => (
        <G key={`br${ri}`}>
          {[-14, 0, 14].slice(0, 3 - ri).map((bx, bi) => (
            <G key={`bb${bi}`}>
              <Ellipse cx={330 + bx} cy={by} rx={9} ry={10} fill={p.garlicBulb} />
              {/* Clove line */}
              <Line x1={330 + bx} y1={by - 3} x2={330 + bx} y2={by + 5} stroke={p.garlicBraid} strokeWidth={0.8} opacity={0.5} />
              {/* Stem */}
              <Line x1={330 + bx} y1={by - 10} x2={330} y2={by - 16 - ri * 10} stroke={p.garlicBraid} strokeWidth={1} opacity={0.7} />
            </G>
          ))}
        </G>
      ))}

      {/* ── DRIED CHILI STRAND ────────────────────────────────────────────── */}
      <Line x1={355} y1={28} x2={360} y2={105} stroke={p.garlicBraid} strokeWidth={1.5} />
      {[42, 55, 68, 81, 94].map((cy, i) => (
        <G key={`ch${i}`} transform={`rotate(${(i % 2 === 0 ? 25 : -30)}, 357, ${cy})`}>
          <Ellipse cx={357} cy={cy} rx={3} ry={7} fill={p.chili} />
          {/* Point */}
          <Path d={`M 354,${cy + 7} Q 357,${cy + 12} 360,${cy + 7}`} fill={p.chili} />
        </G>
      ))}

      {/* ── CLOTH BAG (left of jars) ──────────────────────────────────────── */}
      <G transform="rotate(3, 14, 110)">
        {/* Bag body */}
        <Path d="M 4,90 Q 4,145 8,148 L 24,148 Q 28,145 28,90 Z" fill={p.bagCloth} />
        {/* Gather + tie at top */}
        <Ellipse cx={16} cy={90} rx={10} ry={5} fill={p.bagCloth} />
        <Rect x={13} y={78} width={6} height={16} rx={2} ry={2} fill={p.bagBind} />
        {/* Clip suggestion */}
        <Rect x={12} y={82} width={8} height={5} rx={1} fill={p.grain} opacity={0.4} />
        {/* Bag crease lines */}
        <Line x1={10} y1={100} x2={10} y2={140} stroke={p.bagBind} strokeWidth={0.8} opacity={0.35} />
        <Line x1={22} y1={100} x2={22} y2={140} stroke={p.bagBind} strokeWidth={0.8} opacity={0.35} />
      </G>

      {/* ── COUNTER EDGE ──────────────────────────────────────────────────── */}
      <Rect x={0} y={163} width={390} height={8}  fill={p.counterEdge} />
      <Rect x={0} y={171} width={390} height={89} fill={p.counter} />
      {/* Terracotta tile grout lines */}
      <Line x1={0}   y1={195} x2={390} y2={195} stroke={p.counterEdge} strokeWidth={1} opacity={0.4} />
      <Line x1={0}   y1={220} x2={390} y2={220} stroke={p.counterEdge} strokeWidth={1} opacity={0.35} />
      <Line x1={0}   y1={245} x2={390} y2={245} stroke={p.counterEdge} strokeWidth={1} opacity={0.30} />
      <Line x1={80}  y1={163} x2={80}  y2={260} stroke={p.counterEdge} strokeWidth={1} opacity={0.30} />
      <Line x1={160} y1={163} x2={160} y2={260} stroke={p.counterEdge} strokeWidth={1} opacity={0.30} />
      <Line x1={240} y1={163} x2={240} y2={260} stroke={p.counterEdge} strokeWidth={1} opacity={0.30} />
      <Line x1={320} y1={163} x2={320} y2={260} stroke={p.counterEdge} strokeWidth={1} opacity={0.30} />

      {/* ── OLIVE OIL BOTTLE ──────────────────────────────────────────────── */}
      {/* Bottle neck */}
      <Rect x={210} y={140} width={14} height={22} rx={3} ry={3} fill={p.oilBottle} />
      {/* Bottle body */}
      <Path d="M 202,160 L 202,210 Q 202,216 208,216 L 226,216 Q 232,216 232,210 L 232,160 Z" fill={p.oilBottle} />
      {/* Oil level */}
      <Rect x={204} y={175} width={26} height={38} rx={2} ry={2} fill={p.oilLiquid} opacity={0.8} />
      {/* Highlight */}
      <Rect x={206} y={162} width={6} height={50} rx={3} ry={3} fill="white" opacity={0.18} />
      {/* Cork/stopper */}
      <Rect x={212} y={136} width={10} height={8} rx={2} ry={2} fill={p.grain} />
      {/* Label */}
      <Rect x={205} y={183} width={22} height={18} rx={2} ry={2} fill={p.jarHighlight} opacity={0.7} />
      <SvgText x={216} y={194} textAnchor="middle" fontSize={5} fill={p.shelfShadow} opacity={0.7}>OIL</SvgText>

      {/* ── WOODEN SPOON ──────────────────────────────────────────────────── */}
      <G transform="rotate(-18, 265, 180)">
        {/* Handle */}
        <Rect x={258} y={148} width={8} height={82} rx={4} ry={4} fill={p.spoon} />
        {/* Spoon bowl */}
        <Ellipse cx={262} cy={144} rx={11} ry={8} fill={p.spoon} />
        {/* Bowl hollow */}
        <Ellipse cx={262} cy={144} rx={8} ry={5} fill={p.wall} opacity={0.4} />
        {/* Grain line on handle */}
        <Line x1={262} y1={155} x2={262} y2={225} stroke={p.grain} strokeWidth={0.8} opacity={0.3} />
      </G>

      {/* ── SOFT SHADOWS ──────────────────────────────────────────────────── */}
      <Ellipse cx={217} cy={217} rx={18} ry={3} fill={p.shadow} opacity={0.12} />
      <Ellipse cx={262} cy={230} rx={14} ry={2.5} fill={p.shadow} opacity={0.10} />
      </G>
    </Svg>
  );
}
