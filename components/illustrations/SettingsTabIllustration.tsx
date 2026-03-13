/**
 * Settings Tab Background Illustration
 * Scene: organised utility closet / laundry room — half-open closet door,
 *        mop and broom in a corner, wicker laundry basket with towel draped
 *        over the edge, cleaning spray bottles on a shelf, neatly folded
 *        towels stack, coat/apron on a hook.
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
  door: string;
  doorEdge: string;
  doorShadow: string;
  doorknob: string;
  shelf: string;
  shelfEdge: string;
  basket: string;
  basketRim: string;
  basketWeave: string;
  towelA: string;
  towelB: string;
  towelDrape: string;
  sprayBodyA: string;
  sprayBodyB: string;
  sprayTrigger: string;
  mopHandle: string;
  mopHead: string;
  broomHandle: string;
  broomHead: string;
  hook: string;
  apron: string;
  apronTie: string;
  shadow: string;
}

const palettes: Record<Season, Palette> = {
  spring: {
    wall:         '#EFF7EC',
    floor:        '#D4C49A',
    floorEdge:    '#B8A878',
    door:         '#D8CCA8',
    doorEdge:     '#B8A880',
    doorShadow:   '#8A7C50',
    doorknob:     '#D4C080',
    shelf:        '#C4A860',
    shelfEdge:    '#A88840',
    basket:       '#C8A055',
    basketRim:    '#A88038',
    basketWeave:  '#B89048',
    towelA:       '#7BBFA8',
    towelB:       '#F09098',
    towelDrape:   '#B8E0D0',
    sprayBodyA:   '#98CCA8',
    sprayBodyB:   '#E8A0A0',
    sprayTrigger: '#809888',
    mopHandle:    '#C0A868',
    mopHead:      '#E8E0C8',
    broomHandle:  '#B09050',
    broomHead:    '#D0B870',
    hook:         '#A09060',
    apron:        '#B8D8C0',
    apronTie:     '#88B898',
    shadow:       '#304828',
  },
  summer: {
    wall:         '#EEF8E6',
    floor:        '#C8B880',
    floorEdge:    '#A8986A',
    door:         '#C8C090',
    doorEdge:     '#A8A070',
    doorShadow:   '#787840',
    doorknob:     '#C8B870',
    shelf:        '#B09040',
    shelfEdge:    '#907820',
    basket:       '#B08840',
    basketRim:    '#906820',
    basketWeave:  '#A07838',
    towelA:       '#6BA85C',
    towelB:       '#E87060',
    towelDrape:   '#A0C890',
    sprayBodyA:   '#78B060',
    sprayBodyB:   '#D8A040',
    sprayTrigger: '#609050',
    mopHandle:    '#A89038',
    mopHead:      '#E0D8A8',
    broomHandle:  '#987828',
    broomHead:    '#C0A850',
    hook:         '#888838',
    apron:        '#A8C890',
    apronTie:     '#709868',
    shadow:       '#284018',
  },
  autumn: {
    wall:         '#F7EDD8',
    floor:        '#B09060',
    floorEdge:    '#907040',
    door:         '#C0A870',
    doorEdge:     '#9A8450',
    doorShadow:   '#6A5828',
    doorknob:     '#B89848',
    shelf:        '#9A7040',
    shelfEdge:    '#7A5420',
    basket:       '#A86F38',
    basketRim:    '#885018',
    basketWeave:  '#986030',
    towelA:       '#C8704A',
    towelB:       '#DA8359',
    towelDrape:   '#E0C0A0',
    sprayBodyA:   '#B87840',
    sprayBodyB:   '#A85030',
    sprayTrigger: '#887030',
    mopHandle:    '#A07030',
    mopHead:      '#D8C898',
    broomHandle:  '#906428',
    broomHead:    '#B89048',
    hook:         '#806030',
    apron:        '#C8A868',
    apronTie:     '#A07848',
    shadow:       '#3A2810',
  },
  winter: {
    wall:         '#E8EEF5',
    floor:        '#9090A0',
    floorEdge:    '#707080',
    door:         '#A8B0C0',
    doorEdge:     '#8898B0',
    doorShadow:   '#506070',
    doorknob:     '#9898A8',
    shelf:        '#788898',
    shelfEdge:    '#587080',
    basket:       '#7888A0',
    basketRim:    '#587080',
    basketWeave:  '#687898',
    towelA:       '#7898B8',
    towelB:       '#9090B0',
    towelDrape:   '#B8C8D8',
    sprayBodyA:   '#8898B0',
    sprayBodyB:   '#7080A0',
    sprayTrigger: '#607080',
    mopHandle:    '#788898',
    mopHead:      '#D0D8E0',
    broomHandle:  '#6878A0',
    broomHead:    '#9090B0',
    hook:         '#6878A0',
    apron:        '#A8B8C8',
    apronTie:     '#8898B0',
    shadow:       '#283848',
  },
};

export function SettingsTabIllustration() {
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
      <Rect x={0} y={0} width={390} height={260} fill={p.wall} />

      <G transform="translate(0, 40)">
      {/* ── FLOOR ─────────────────────────────────────────────────────────── */}
      <Rect x={0} y={210} width={390} height={50} fill={p.floor} />
      <Rect x={0} y={210} width={390} height={4}  fill={p.floorEdge} />
      {/* Floor board lines */}
      <Line x1={0} y1={228} x2={390} y2={228} stroke={p.floorEdge} strokeWidth={1} opacity={0.3} />
      <Line x1={0} y1={245} x2={390} y2={245} stroke={p.floorEdge} strokeWidth={1} opacity={0.25} />
      <Line x1={80}  y1={210} x2={80}  y2={260} stroke={p.floorEdge} strokeWidth={1} opacity={0.25} />
      <Line x1={200} y1={210} x2={200} y2={260} stroke={p.floorEdge} strokeWidth={1} opacity={0.25} />
      <Line x1={310} y1={210} x2={310} y2={260} stroke={p.floorEdge} strokeWidth={1} opacity={0.25} />

      {/* ── CLOSET DOOR (left side, half-open) ───────────────────────────── */}
      {/* Door body */}
      <Rect x={22} y={20} width={90} height={192} rx={3} ry={3} fill={p.door} />
      {/* Door panel inset (upper) */}
      <Rect x={30} y={30} width={74} height={80} rx={2} ry={2} fill={p.doorShadow} opacity={0.10} />
      <Rect x={32} y={32} width={70} height={76} rx={2} ry={2} fill={p.door} opacity={0.8} />
      {/* Door panel inset (lower) */}
      <Rect x={30} y={120} width={74} height={80} rx={2} ry={2} fill={p.doorShadow} opacity={0.10} />
      <Rect x={32} y={122} width={70} height={76} rx={2} ry={2} fill={p.door} opacity={0.8} />
      {/* Door edge strip */}
      <Rect x={22} y={20} width={5}  height={192} fill={p.doorEdge} />
      {/* Door shadow (swinging open toward right) */}
      <Rect x={112} y={20} width={12} height={192} fill={p.doorShadow} opacity={0.20} rx={2} />
      {/* Doorknob */}
      <Circle cx={108} cy={106} r={6} fill={p.doorknob} />
      <Ellipse cx={108} cy={106} rx={3} ry={4} fill="white" opacity={0.25} />

      {/* ── SHELF ON WALL (right area) ─────────────────────────────────────── */}
      <Rect x={210} y={118} width={162} height={10} fill={p.shelf} />
      <Rect x={210} y={118} width={162} height={2}  fill={p.shelfEdge} />
      <Rect x={210} y={128} width={162} height={3}  fill={p.shadow} opacity={0.18} />

      {/* ── SPRAY BOTTLES ON SHELF ────────────────────────────────────────── */}
      {/* Bottle A */}
      <G>
        {/* Trigger */}
        <Path d="M 236,98 L 250,102 L 248,110 L 234,106 Z" fill={p.sprayTrigger} />
        {/* Nozzle */}
        <Rect x={250} y={100} width={10} height={3} rx={1} fill={p.sprayTrigger} />
        {/* Body */}
        <Rect x={224} y={75} width={26} height={48} rx={6} ry={6} fill={p.sprayBodyA} />
        {/* Cap */}
        <Rect x={228} y={70} width={18} height={8} rx={3} ry={3} fill={p.sprayTrigger} />
        {/* Highlight */}
        <Rect x={228} y={79} width={6} height={38} rx={3} ry={3} fill="white" opacity={0.18} />
        {/* Label band */}
        <Rect x={226} y={95} width={22} height={14} rx={2} fill={p.shelfEdge} opacity={0.3} />
      </G>
      {/* Bottle B */}
      <G>
        <Path d="M 270,98 L 284,102 L 282,110 L 268,106 Z" fill={p.sprayTrigger} />
        <Rect x={284} y={100} width={10} height={3} rx={1} fill={p.sprayTrigger} />
        <Rect x={258} y={75} width={26} height={48} rx={6} ry={6} fill={p.sprayBodyB} />
        <Rect x={262} y={70} width={18} height={8} rx={3} ry={3} fill={p.sprayTrigger} />
        <Rect x={262} y={79} width={6} height={38} rx={3} ry={3} fill="white" opacity={0.18} />
        <Rect x={260} y={95} width={22} height={14} rx={2} fill={p.shelfEdge} opacity={0.3} />
      </G>
      {/* Small squat bottle C */}
      <G>
        <Rect x={302} y={86} width={24} height={36} rx={4} ry={4} fill={p.sprayBodyA} opacity={0.75} />
        <Rect x={308} y={82} width={12} height={7}  rx={2} fill={p.sprayTrigger} />
        <Rect x={306} y={90} width={6}  height={28} rx={3} fill="white" opacity={0.16} />
      </G>

      {/* ── FOLDED TOWELS STACK (on floor, right) ─────────────────────────── */}
      {[0, 1, 2].map(i => (
        <G key={`twl${i}`}>
          <Rect x={320} y={170 - i * 14} width={58} height={12} rx={3}
            fill={i % 2 === 0 ? p.towelA : p.towelB} />
          {/* Fold line */}
          <Line x1={320} y1={170 - i * 14 + 6} x2={378} y2={170 - i * 14 + 6}
            stroke="white" strokeWidth={1} opacity={0.20} />
        </G>
      ))}

      {/* ── WICKER LAUNDRY BASKET ─────────────────────────────────────────── */}
      {/* Basket body */}
      <Path
        d="M 148,168 Q 140,214 150,215 L 208,215 Q 218,214 210,168 Z"
        fill={p.basket}
      />
      {/* Weave lines horizontal */}
      {[180, 192, 204].map(wy => (
        <Line key={`wv${wy}`} x1={142} y1={wy} x2={218} y2={wy}
          stroke={p.basketWeave} strokeWidth={1} opacity={0.4} />
      ))}
      {/* Weave lines vertical */}
      {[155, 162, 169, 176, 183, 190, 197, 204].map(wx => (
        <Line key={`wvv${wx}`} x1={wx} y1={171} x2={wx - 6} y2={213}
          stroke={p.basketWeave} strokeWidth={0.8} opacity={0.35} />
      ))}
      {/* Basket rim */}
      <Ellipse cx={179} cy={168} rx={32} ry={7} fill={p.basketRim} />
      {/* Handles */}
      <Path d="M 154,168 Q 148,148 160,148 Q 172,148 166,168" fill="none"
        stroke={p.basketRim} strokeWidth={4} />
      <Path d="M 192,168 Q 186,148 198,148 Q 210,148 204,168" fill="none"
        stroke={p.basketRim} strokeWidth={4} />
      {/* Towel draped over edge */}
      <Path
        d="M 148,162 Q 160,155 178,158 Q 196,161 208,162 Q 196,170 178,168 Q 160,166 148,162 Z"
        fill={p.towelDrape}
        opacity={0.85}
      />

      {/* ── MOP (leaning against wall, far left inside closet) ────────────── */}
      <G transform="rotate(12, 60, 120)">
        {/* Handle */}
        <Rect x={56} y={20} width={8} height={185} rx={4} fill={p.mopHandle} />
        {/* Mop head */}
        <Ellipse cx={60} cy={205} rx={18} ry={10} fill={p.mopHead} />
        {/* Mop strands */}
        {[-12, -7, 0, 7, 12].map(dx => (
          <Line key={`mp${dx}`} x1={60 + dx} y1={205} x2={60 + dx * 1.2} y2={218}
            stroke={p.mopHead} strokeWidth={2} opacity={0.6} />
        ))}
      </G>

      {/* ── BROOM (leaning, right of mop) ────────────────────────────────── */}
      <G transform="rotate(8, 88, 110)">
        <Rect x={84} y={20} width={8} height={175} rx={4} fill={p.broomHandle} />
        {/* Broom bristles trapezoid */}
        <Path d="M 76,194 L 100,194 L 106,214 L 70,214 Z" fill={p.broomHead} />
        {/* Bristle lines */}
        {[78, 84, 88, 92, 96, 100].map(bx => (
          <Line key={`br${bx}`} x1={bx} y1={196} x2={bx} y2={210}
            stroke={p.broomHandle} strokeWidth={1} opacity={0.4} />
        ))}
        {/* Broom band */}
        <Rect x={76} y={192} width={24} height={5} fill={p.shadow} opacity={0.2} />
      </G>

      {/* ── HOOK ON WALL + APRON ──────────────────────────────────────────── */}
      {/* Hook */}
      <Rect x={354} y={30} width={8} height={16} rx={3} fill={p.hook} />
      <Path d="M 358,46 C 358,56 376,62 370,74" stroke={p.hook} strokeWidth={5}
        fill="none" strokeLinecap="round" />
      {/* Apron hanging */}
      <Path
        d="M 346,76 Q 340,90 342,130 L 380,130 Q 382,90 376,76 Q 366,70 358,72 Q 350,70 346,76 Z"
        fill={p.apron}
      />
      {/* Apron ties */}
      <Path d="M 344,80 Q 328,88 320,100" stroke={p.apronTie} strokeWidth={4}
        fill="none" strokeLinecap="round" />
      <Path d="M 374,80 Q 390,88 390,100" stroke={p.apronTie} strokeWidth={4}
        fill="none" strokeLinecap="round" />
      {/* Apron pocket */}
      <Rect x={350} y={104} width={24} height={18} rx={3} fill={p.apronTie} opacity={0.5} />
      {/* Apron highlight */}
      <Rect x={348} y={78} width={8} height={48} rx={4} fill="white" opacity={0.14} />

      {/* ── SOFT SHADOWS ──────────────────────────────────────────────────── */}
      <Ellipse cx={179} cy={216} rx={38} ry={4} fill={p.shadow} opacity={0.12} />
      <Ellipse cx={60}  cy={215} rx={18} ry={3} fill={p.shadow} opacity={0.10} />
      <Ellipse cx={88}  cy={215} rx={16} ry={3} fill={p.shadow} opacity={0.10} />
      <Ellipse cx={349} cy={212} rx={25} ry={3} fill={p.shadow} opacity={0.08} />
      </G>
    </Svg>
  );
}
