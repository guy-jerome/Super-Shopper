/**
 * Shop Tab Background Illustration
 * Scene: messy-but-charming home desk — spiral notepad, coffee mug with steam,
 *        pencils, sticky note, succulent.
 * Canvas: 390 × 260  |  Rendered behind UI at ~17% opacity.
 * Five colour roles per season keep the art in harmony with the app palette.
 */
import React from 'react';
import Svg, {
  Rect, Circle, Path, Ellipse, Line, G, Polygon,
} from 'react-native-svg';
import { useSettingsStore, type Season } from '../../stores/useSettingsStore';

interface Palette {
  bg: string;
  deskEdge: string;
  deskSurface: string;
  grain: string;
  paper: string;
  paperFaint: string;
  ruled: string;
  margin: string;
  sticky: string;
  stickyLine: string;
  mug: string;
  mugLiquid: string;
  steam: string;
  pencil1: string;
  pencil2: string;
  pencilTip: string;
  pencilEraser: string;
  leaf: string;
  pot: string;
  potRim: string;
  spiral: string;
  shadow: string;
}

const palettes: Record<Season, Palette> = {
  spring: {
    bg:           '#EFF7EC',
    deskEdge:     '#C09E70',
    deskSurface:  '#A8845A',
    grain:        '#906E48',
    paper:        '#FAFEF8',
    paperFaint:   '#ECF5EC',
    ruled:        '#B8D8B8',
    margin:       '#F09098',
    sticky:       '#F8D8E8',
    stickyLine:   '#E0A8B8',
    mug:          '#7BBFA8',
    mugLiquid:    '#5AA090',
    steam:        '#B8E0D0',
    pencil1:      '#98CC78',
    pencil2:      '#78B0A0',
    pencilTip:    '#E8D8A0',
    pencilEraser: '#F0A8B8',
    leaf:         '#5AAA7A',
    pot:          '#C8A060',
    potRim:       '#B89050',
    spiral:       '#8898A8',
    shadow:       '#405030',
  },
  summer: {
    bg:           '#EEF8E6',
    deskEdge:     '#A88858',
    deskSurface:  '#8A7040',
    grain:        '#706030',
    paper:        '#FAFDF5',
    paperFaint:   '#E0F0D8',
    ruled:        '#A8CCA0',
    margin:       '#E87870',
    sticky:       '#F8E840',
    stickyLine:   '#D4C020',
    mug:          '#6BA85C',
    mugLiquid:    '#50904A',
    steam:        '#B8E8A8',
    pencil1:      '#F8C030',
    pencil2:      '#E09020',
    pencilTip:    '#E8D090',
    pencilEraser: '#F09898',
    leaf:         '#48A040',
    pot:          '#C07838',
    potRim:       '#A86028',
    spiral:       '#78987A',
    shadow:       '#305020',
  },
  autumn: {
    bg:           '#F7EDD8',
    deskEdge:     '#9A6A48',
    deskSurface:  '#7A5230',
    grain:        '#603E20',
    paper:        '#FEFAF0',
    paperFaint:   '#F0E8CC',
    ruled:        '#C8C0A0',
    margin:       '#D06050',
    sticky:       '#F8D850',
    stickyLine:   '#D4B430',
    mug:          '#C8704A',
    mugLiquid:    '#A05830',
    steam:        '#C8B098',
    pencil1:      '#E8C840',
    pencil2:      '#F0A850',
    pencilTip:    '#D0B870',
    pencilEraser: '#E89888',
    leaf:         '#6A9850',
    pot:          '#B87848',
    potRim:       '#A06038',
    spiral:       '#888878',
    shadow:       '#3A2810',
  },
  winter: {
    bg:           '#E8EEF5',
    deskEdge:     '#788898',
    deskSurface:  '#607080',
    grain:        '#485868',
    paper:        '#F8FAFC',
    paperFaint:   '#D8E0EC',
    ruled:        '#B0C0D0',
    margin:       '#8898C8',
    sticky:       '#B8C8E8',
    stickyLine:   '#90A8CC',
    mug:          '#7898B8',
    mugLiquid:    '#5878A0',
    steam:        '#C0D0E4',
    pencil1:      '#98B0C8',
    pencil2:      '#7890A8',
    pencilTip:    '#C8D4E0',
    pencilEraser: '#D0A8B0',
    leaf:         '#508078',
    pot:          '#708898',
    potRim:       '#586878',
    spiral:       '#8898A8',
    shadow:       '#303848',
  },
};

const SPIRAL_Y  = [94, 106, 118, 130, 142, 154, 166, 178, 190];
const LEFT_RULED  = [105, 113, 121, 129, 137, 145, 153, 161, 169, 177];
const RIGHT_RULED = [100, 108, 116, 124, 132, 140, 148, 156, 164, 172, 180];
// Succulent leaf angles (upper hemisphere only so they sit above the pot)
const LEAF_ANGLES = [0, 55, 110, 250, 305];

export function ShopTabIllustration() {
  const { season } = useSettingsStore();
  const p = palettes[season] ?? palettes.autumn;

  return (
    <Svg
      viewBox="0 0 390 260"
      preserveAspectRatio="xMidYMax slice"
      width="100%"
      height="100%"
    >

      {/* ── WALL ──────────────────────────────────────────────────────────── */}
      <Rect x={0} y={0} width={390} height={260} fill={p.bg} />

      <G transform="translate(0, 60)">
      {/* ── DESK SURFACE ──────────────────────────────────────────────────── */}
      {/* Top edge highlight */}
      <Rect x={0} y={155} width={390} height={10} fill={p.deskEdge} />
      {/* Desk body */}
      <Rect x={0} y={165} width={390} height={95} fill={p.deskSurface} />
      {/* Wood grain lines */}
      <Line x1={0} y1={177} x2={390} y2={177} stroke={p.grain} strokeWidth={1}   opacity={0.35} />
      <Line x1={0} y1={191} x2={390} y2={191} stroke={p.grain} strokeWidth={1}   opacity={0.25} />
      <Line x1={0} y1={207} x2={390} y2={207} stroke={p.grain} strokeWidth={1.5} opacity={0.30} />
      <Line x1={0} y1={224} x2={390} y2={224} stroke={p.grain} strokeWidth={1}   opacity={0.20} />

      {/* ── STICKY NOTE (on wall, upper-left, tilted 4°) ──────────────────── */}
      <G transform="rotate(4, 52, 81)">
        <Rect x={18} y={52} width={68} height={58} fill={p.sticky} />
        {/* Fold crease triangle at bottom-right corner */}
        <Polygon
          points={`${18 + 68 - 14},${52 + 58} ${18 + 68},${52 + 58} ${18 + 68},${52 + 58 - 14}`}
          fill={p.stickyLine}
          opacity={0.5}
        />
        <Line x1={28} y1={70} x2={74} y2={70} stroke={p.stickyLine} strokeWidth={1.5} />
        <Line x1={28} y1={80} x2={70} y2={80} stroke={p.stickyLine} strokeWidth={1.5} />
        <Line x1={28} y1={90} x2={74} y2={90} stroke={p.stickyLine} strokeWidth={1.5} />
      </G>

      {/* ── LOOSE PAPER (on desk, peeking behind notepad, −5° tilt) ───────── */}
      <G transform="rotate(-5, 100, 137)">
        <Rect x={44} y={95} width={112} height={84} fill={p.paper} />
        <Line x1={55} y1={113} x2={143} y2={113} stroke={p.ruled} strokeWidth={1} />
        <Line x1={55} y1={123} x2={143} y2={123} stroke={p.ruled} strokeWidth={1} />
        <Line x1={55} y1={133} x2={143} y2={133} stroke={p.ruled} strokeWidth={1} />
        <Line x1={55} y1={143} x2={143} y2={143} stroke={p.ruled} strokeWidth={1} />
        <Line x1={55} y1={153} x2={143} y2={153} stroke={p.ruled} strokeWidth={1} />
      </G>

      {/* ── OPEN NOTEPAD ──────────────────────────────────────────────────── */}
      {/* Spine shadow */}
      <Rect x={140} y={82} width={8} height={125} fill={p.shadow} opacity={0.12} />
      {/* Left page */}
      <Rect x={62} y={84} width={80} height={123} fill={p.paperFaint} />
      {/* Right page */}
      <Rect x={144} y={82} width={80} height={125} fill={p.paper} />

      {/* Red margin line on left page */}
      <Line x1={88} y1={87} x2={88} y2={205} stroke={p.margin} strokeWidth={1.5} opacity={0.7} />

      {/* Ruled lines — left page */}
      {LEFT_RULED.map(y => (
        <Line key={`ll${y}`} x1={65} y1={y} x2={138} y2={y} stroke={p.ruled} strokeWidth={1} />
      ))}
      {/* Ruled lines — right page */}
      {RIGHT_RULED.map(y => (
        <Line key={`rl${y}`} x1={148} y1={y} x2={221} y2={y} stroke={p.ruled} strokeWidth={1} />
      ))}

      {/* Check-boxes on right page (3 checked items, 1 unchecked) */}
      <Rect x={150} y={101} width={5} height={5} stroke={p.spiral} strokeWidth={1} fill="none" />
      <Line x1={151} y1={104} x2={153} y2={106} stroke={p.spiral} strokeWidth={1.2} />
      <Line x1={153} y1={106} x2={157} y2={101} stroke={p.spiral} strokeWidth={1.2} />

      <Rect x={150} y={113} width={5} height={5} stroke={p.spiral} strokeWidth={1} fill="none" />
      <Line x1={151} y1={116} x2={153} y2={118} stroke={p.spiral} strokeWidth={1.2} />
      <Line x1={153} y1={118} x2={157} y2={113} stroke={p.spiral} strokeWidth={1.2} />

      <Rect x={150} y={125} width={5} height={5} stroke={p.spiral} strokeWidth={1} fill="none" />
      {/* ↑ unchecked — no tick */}

      {/* Spiral coil binding */}
      {SPIRAL_Y.map(y => (
        <Ellipse
          key={`sp${y}`}
          cx={142} cy={y}
          rx={5.5} ry={5}
          fill="none"
          stroke={p.spiral}
          strokeWidth={1.5}
        />
      ))}

      {/* ── COFFEE MUG ────────────────────────────────────────────────────── */}
      {/* Handle drawn first so mug body overlaps the inner gap */}
      <Path
        d="M 323,126 C 352,126 358,137 358,149 C 358,161 352,170 323,168
           L 323,159 C 344,157 348,150 348,149 C 348,148 344,141 323,133 Z"
        fill={p.mug}
      />
      {/* Mug body */}
      <Rect x={278} y={112} width={48} height={60} rx={5} ry={5} fill={p.mug} />
      {/* Left-side highlight strip */}
      <Rect x={282} y={114} width={10} height={55} rx={4} ry={4} fill="white" opacity={0.18} />
      {/* Liquid surface inside mug */}
      <Ellipse cx={302} cy={119} rx={20} ry={5} fill={p.mugLiquid} />
      {/* Steam wisps */}
      <Path
        d="M 289,110 Q 284,101 291,93 Q 298,85 292,77"
        stroke={p.steam} strokeWidth={2.5} fill="none"
        strokeLinecap="round" opacity={0.80}
      />
      <Path
        d="M 302,108 Q 297,99 304,91 Q 311,83 305,75"
        stroke={p.steam} strokeWidth={2.5} fill="none"
        strokeLinecap="round" opacity={0.80}
      />
      <Path
        d="M 315,110 Q 310,101 317,93 Q 324,85 318,77"
        stroke={p.steam} strokeWidth={2} fill="none"
        strokeLinecap="round" opacity={0.60}
      />

      {/* ── PENCIL 1 (−22° rotation) ──────────────────────────────────────── */}
      <G transform="rotate(-22, 194, 216)">
        {/* Graphite tip triangle */}
        <Polygon points="110,212 118,208 118,216" fill={p.shadow} />
        {/* Natural wood tip */}
        <Rect x={118} y={208} width={12} height={8} fill={p.pencilTip} />
        {/* Painted body */}
        <Rect x={130} y={208} width={132} height={8} fill={p.pencil1} />
        {/* Highlight along top edge */}
        <Line x1={130} y1={209.5} x2={262} y2={209.5} stroke="white" strokeWidth={1} opacity={0.28} />
        {/* Ferrule (metal band) */}
        <Rect x={262} y={208} width={10} height={8} fill={p.spiral} opacity={0.65} />
        {/* Eraser */}
        <Rect x={272} y={208} width={16} height={8} fill={p.pencilEraser} />
      </G>

      {/* ── PENCIL 2 (−40° rotation, different colour) ────────────────────── */}
      <G transform="rotate(-40, 300, 232)">
        <Polygon points="216,228 224,224 224,232" fill={p.shadow} />
        <Rect x={224} y={224} width={10} height={8} fill={p.pencilTip} />
        <Rect x={234} y={224} width={110} height={8} fill={p.pencil2} />
        <Line x1={234} y1={225.5} x2={344} y2={225.5} stroke="white" strokeWidth={1} opacity={0.28} />
        <Rect x={344} y={224} width={8}  height={8} fill={p.spiral} opacity={0.65} />
        <Rect x={352} y={224} width={13} height={8} fill={p.pencilEraser} />
      </G>

      {/* ── SUCCULENT IN POT (far right) ──────────────────────────────────── */}
      {/* Pot body (trapezoid) */}
      <Path d="M 330,163 L 372,163 L 366,196 L 336,196 Z" fill={p.pot} />
      {/* Pot rim ellipse */}
      <Ellipse cx={351} cy={163} rx={21} ry={5} fill={p.potRim} />
      {/* Soil */}
      <Ellipse cx={351} cy={163} rx={17} ry={3.5} fill={p.shadow} opacity={0.30} />
      {/* Leaves — ellipses rotated around the pot-centre (351,163) */}
      {LEAF_ANGLES.map(angle => (
        <Ellipse
          key={`lf${angle}`}
          cx={351} cy={149}
          rx={6} ry={13}
          fill={p.leaf}
          transform={`rotate(${angle}, 351, 163)`}
        />
      ))}
      {/* Central rosette bud */}
      <Circle cx={351} cy={163} r={5} fill={p.leaf} />

      {/* ── SOFT SHADOWS (ground contact / depth) ─────────────────────────── */}
      <Ellipse cx={302} cy={172} rx={25} ry={4}   fill={p.shadow} opacity={0.10} />
      <Ellipse cx={351} cy={197} rx={20} ry={3.5} fill={p.shadow} opacity={0.10} />
      <Rect x={66} y={205} width={158} height={5} rx={3} fill={p.shadow} opacity={0.07} />
      </G>

    </Svg>
  );
}
