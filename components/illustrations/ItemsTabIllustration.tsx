/**
 * Items Tab Background Illustration
 * Scene: cosy library / study nook — tall wooden bookshelves with colourful
 *        spine rows, flat-stacked books as risers, glass inkwell with dip pen,
 *        rolled paper scroll, magnifying glass leaning on shelf.
 * Canvas: 390 × 260  |  Rendered behind UI at ~17% opacity.
 */
import React from 'react';
import Svg, {
  Rect, Circle, Path, Ellipse, Line, G, Polygon,
} from 'react-native-svg';
import { useSettingsStore, type Season } from '../../stores/useSettingsStore';

interface Palette {
  wall: string;
  floor: string;
  floorEdge: string;
  shelf: string;
  shelfEdge: string;
  shelfShadow: string;
  spineA: string;
  spineB: string;
  spineC: string;
  spineD: string;
  spineE: string;
  spineF: string;
  paper: string;
  scroll: string;
  scrollText: string;
  inkwell: string;
  inkwellGlass: string;
  ink: string;
  pen: string;
  penNib: string;
  magnifier: string;
  magnifierLens: string;
  shadow: string;
}

const palettes: Record<Season, Palette> = {
  spring: {
    wall:          '#EFF7EC',
    floor:         '#D0B88A',
    floorEdge:     '#B89A68',
    shelf:         '#C0A060',
    shelfEdge:     '#A07E40',
    shelfShadow:   '#7A5E28',
    spineA:        '#7BBFA8',
    spineB:        '#F09098',
    spineC:        '#B8D870',
    spineD:        '#E8C870',
    spineE:        '#98B8E0',
    spineF:        '#D0A8D8',
    paper:         '#FAFEF8',
    scroll:        '#F0ECD8',
    scrollText:    '#8898A8',
    inkwell:       '#C8D8C8',
    inkwellGlass:  '#E8F5E8',
    ink:           '#406880',
    pen:           '#C09060',
    penNib:        '#B0A060',
    magnifier:     '#B0A868',
    magnifierLens: '#C8E8E0',
    shadow:        '#304828',
  },
  summer: {
    wall:          '#EEF8E6',
    floor:         '#C0A870',
    floorEdge:     '#A08850',
    shelf:         '#A88C50',
    shelfEdge:     '#8A7030',
    shelfShadow:   '#604E18',
    spineA:        '#6BA85C',
    spineB:        '#E87060',
    spineC:        '#D4C840',
    spineD:        '#F0A030',
    spineE:        '#7898C8',
    spineF:        '#C098B0',
    paper:         '#FAFDF5',
    scroll:        '#F0EAD0',
    scrollText:    '#708888',
    inkwell:       '#B0C898',
    inkwellGlass:  '#D8F0D0',
    ink:           '#305878',
    pen:           '#A07840',
    penNib:        '#988830',
    magnifier:     '#989840',
    magnifierLens: '#C0E8D0',
    shadow:        '#284018',
  },
  autumn: {
    wall:          '#F7EDD8',
    floor:         '#B07838',
    floorEdge:     '#8A5A28',
    shelf:         '#8A6038',
    shelfEdge:     '#6A4420',
    shelfShadow:   '#442C0A',
    spineA:        '#DA8359',
    spineB:        '#B84A3C',
    spineC:        '#C8A840',
    spineD:        '#8FAF5F',
    spineE:        '#7888B0',
    spineF:        '#A07880',
    paper:         '#FEFAF0',
    scroll:        '#F0E8C8',
    scrollText:    '#707068',
    inkwell:       '#B89860',
    inkwellGlass:  '#EEE0B8',
    ink:           '#283840',
    pen:           '#8A5830',
    penNib:        '#A08840',
    magnifier:     '#B09040',
    magnifierLens: '#D8C898',
    shadow:        '#3A2810',
  },
  winter: {
    wall:          '#E8EEF5',
    floor:         '#8898A8',
    floorEdge:     '#6880A0',
    shelf:         '#708898',
    shelfEdge:     '#506880',
    shelfShadow:   '#304858',
    spineA:        '#7898B8',
    spineB:        '#9090B0',
    spineC:        '#A8C0D0',
    spineD:        '#C8D0B0',
    spineE:        '#B080A0',
    spineF:        '#8898C0',
    paper:         '#F8FAFC',
    scroll:        '#E8ECEE',
    scrollText:    '#6878A0',
    inkwell:       '#90A8C0',
    inkwellGlass:  '#C8DCE8',
    ink:           '#203040',
    pen:           '#6880A0',
    penNib:        '#909898',
    magnifier:     '#8898B0',
    magnifierLens: '#C0D8E8',
    shadow:        '#283848',
  },
};

// Spine data: [x, y, width, height, colorKey]
type ColorKey = 'spineA' | 'spineB' | 'spineC' | 'spineD' | 'spineE' | 'spineF';

const SHELF1_BOOKS: [number, number, number, ColorKey][] = [
  // [x, width, height, color]
  [32, 14, 58, 'spineA'],
  [48, 10, 52, 'spineD'],
  [60, 16, 60, 'spineB'],
  [78, 12, 55, 'spineF'],
  [92, 14, 62, 'spineC'],
  [108, 11, 50, 'spineE'],
  [121, 16, 58, 'spineA'],
  [139, 13, 54, 'spineD'],
  [154, 15, 65, 'spineB'],
  [171, 10, 52, 'spineC'],
  [183, 16, 60, 'spineF'],
  [201, 12, 55, 'spineE'],
  [215, 14, 63, 'spineA'],
  [231, 11, 50, 'spineB'],
  [244, 16, 58, 'spineD'],
  [262, 13, 54, 'spineC'],
  [277, 15, 62, 'spineE'],
  [294, 10, 56, 'spineF'],
];

export function ItemsTabIllustration() {
  const { season } = useSettingsStore();
  const p = palettes[season] ?? palettes.autumn;

  const SHELF1_Y = 130; // shelf board top
  const FLOOR_Y  = 214; // floor surface

  return (
    <Svg
      viewBox="0 0 390 260"
      preserveAspectRatio="xMidYMax slice"
      width="100%"
      height="100%"
    >
      {/* ── WALL ──────────────────────────────────────────────────────────── */}
      <Rect x={0} y={0} width={390} height={260} fill={p.wall} />

      <G transform="translate(0, 60)">
      {/* ── BOOKSHELVES vertical sides ─────────────────────────────────────── */}
      {/* Left side panel */}
      <Rect x={20} y={20} width={14} height={240} rx={2} ry={2} fill={p.shelf} />
      <Rect x={20} y={20} width={3}  height={240} fill={p.shelfEdge} />
      {/* Right side panel */}
      <Rect x={356} y={20} width={14} height={240} rx={2} ry={2} fill={p.shelf} />
      <Rect x={367} y={20} width={3}  height={240} fill={p.shelfEdge} opacity={0.6} />

      {/* ── SHELF BOARDS ──────────────────────────────────────────────────── */}
      {/* Shelf 1 */}
      <Rect x={20} y={SHELF1_Y} width={350} height={10} fill={p.shelf} />
      <Rect x={20} y={SHELF1_Y} width={350} height={2}  fill={p.shelfEdge} />
      <Rect x={20} y={SHELF1_Y + 10} width={350} height={3} fill={p.shelfShadow} opacity={0.3} />
      {/* Floor / bottom shelf line */}
      <Rect x={20} y={FLOOR_Y} width={350} height={10} fill={p.floor} />
      <Rect x={20} y={FLOOR_Y} width={350} height={2}  fill={p.floorEdge} />

      {/* ── BOOKS ON SHELF 1 ──────────────────────────────────────────────── */}
      {SHELF1_BOOKS.map(([bx, bw, bh, colorKey]) => {
        const by = SHELF1_Y - bh;
        const fill = p[colorKey];
        return (
          <G key={`b1_${bx}`}>
            {/* Spine body */}
            <Rect x={bx} y={by} width={bw} height={bh} fill={fill} />
            {/* Top edge (pages, lighter) */}
            <Rect x={bx} y={by} width={bw} height={3} fill="white" opacity={0.25} />
            {/* Highlight strip */}
            <Rect x={bx + 2} y={by + 4} width={3} height={bh - 8} rx={1} fill="white" opacity={0.15} />
            {/* Shadow strip on right */}
            <Rect x={bx + bw - 2} y={by} width={2} height={bh} fill={p.shelfShadow} opacity={0.20} />
          </G>
        );
      })}

      {/* ── FLAT-STACKED BOOKS (risers on bottom shelf) ────────────────────── */}
      {/* Stack of 3 flat books on bottom shelf, left side */}
      {[0, 1, 2].map(i => (
        <Rect
          key={`fs${i}`}
          x={34}
          y={FLOOR_Y - 12 - i * 12}
          width={62}
          height={10}
          rx={1}
          fill={[p.spineC, p.spineA, p.spineF][i]}
        />
      ))}
      {/* Stack of 2 on right */}
      {[0, 1].map(i => (
        <Rect
          key={`fs2${i}`}
          x={295}
          y={FLOOR_Y - 12 - i * 12}
          width={55}
          height={10}
          rx={1}
          fill={[p.spineE, p.spineB][i]}
        />
      ))}

      {/* ── GLASS INKWELL ─────────────────────────────────────────────────── */}
      {/* Inkwell body */}
      <Path
        d="M 140,200 Q 138,188 146,184 L 170,184 Q 178,188 176,200 Z"
        fill={p.inkwell}
        opacity={0.85}
      />
      {/* Glass highlight */}
      <Path
        d="M 141,200 Q 140,190 148,186 L 152,186 Q 144,190 143,200 Z"
        fill={p.inkwellGlass}
        opacity={0.6}
      />
      {/* Ink inside */}
      <Ellipse cx={158} cy={194} rx={13} ry={7} fill={p.ink} opacity={0.65} />
      {/* Inkwell rim */}
      <Ellipse cx={158} cy={184} rx={12} ry={3} fill={p.inkwell} />

      {/* ── DIP PEN (angled across inkwell) ───────────────────────────────── */}
      <G transform="rotate(-35, 165, 195)">
        {/* Pen nib */}
        <Polygon points="108,196 116,193 116,199" fill={p.penNib} />
        {/* Pen barrel */}
        <Rect x={116} y={193} width={90} height={6} rx={3} ry={3} fill={p.pen} />
        {/* Barrel highlight */}
        <Line x1={118} y1={194.5} x2={204} y2={194.5} stroke="white" strokeWidth={1} opacity={0.22} />
        {/* Ornamental band */}
        <Rect x={186} y={193} width={7} height={6} fill={p.shelfEdge} opacity={0.4} />
      </G>

      {/* ── ROLLED PAPER SCROLL ───────────────────────────────────────────── */}
      {/* Scroll body flat */}
      <Rect x={195} y={185} width={66} height={26} rx={3} ry={3} fill={p.scroll} />
      {/* Left curl */}
      <Ellipse cx={195} cy={198} rx={5} ry={14} fill={p.scroll} />
      <Ellipse cx={195} cy={198} rx={3} ry={11} fill={p.wall} opacity={0.5} />
      {/* Right curl */}
      <Ellipse cx={261} cy={198} rx={5} ry={14} fill={p.scroll} />
      <Ellipse cx={261} cy={198} rx={3} ry={11} fill={p.wall} opacity={0.5} />
      {/* Faint text lines on scroll */}
      <Line x1={202} y1={193} x2={255} y2={193} stroke={p.scrollText} strokeWidth={1} opacity={0.4} />
      <Line x1={202} y1={198} x2={255} y2={198} stroke={p.scrollText} strokeWidth={1} opacity={0.4} />
      <Line x1={202} y1={203} x2={255} y2={203} stroke={p.scrollText} strokeWidth={1} opacity={0.4} />

      {/* ── MAGNIFYING GLASS (leaning right) ──────────────────────────────── */}
      <G transform="rotate(25, 310, 200)">
        {/* Handle */}
        <Rect x={307} y={196} width={8} height={42} rx={4} ry={4} fill={p.magnifier} />
        {/* Lens rim */}
        <Circle cx={311} cy={186} r={18} fill="none" stroke={p.magnifier} strokeWidth={4} />
        {/* Lens glass */}
        <Circle cx={311} cy={186} r={14} fill={p.magnifierLens} opacity={0.55} />
        {/* Lens highlight */}
        <Ellipse cx={305} cy={180} rx={5} ry={4} fill="white" opacity={0.25} />
      </G>

      {/* ── SOFT SHADOWS ──────────────────────────────────────────────────── */}
      <Ellipse cx={158} cy={212} rx={22} ry={3}  fill={p.shadow} opacity={0.10} />
      <Ellipse cx={228} cy={214} rx={38} ry={3}  fill={p.shadow} opacity={0.08} />
      <Ellipse cx={315} cy={222} rx={22} ry={3}  fill={p.shadow} opacity={0.10} />
      </G>
    </Svg>
  );
}
