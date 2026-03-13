/**
 * Stores Tab Background Illustration
 * Scene: cheerful farmer's market stall — candy-stripe awning, wooden crates
 *        overflowing with produce, hand-painted chalkboard price sign,
 *        bread loaf, string of bare bulbs across the top.
 * Canvas: 390 × 260  |  Rendered behind UI at ~17% opacity.
 */
import React from 'react';
import Svg, {
  Rect, Circle, Path, Ellipse, Line, G, Text as SvgText,
} from 'react-native-svg';
import { useSettingsStore, type Season } from '../../stores/useSettingsStore';

interface Palette {
  sky: string;
  ground: string;
  groundEdge: string;
  counter: string;
  counterEdge: string;
  crate: string;
  crateEdge: string;
  crateSlat: string;
  awningStripe1: string;
  awningStripe2: string;
  awningFringe: string;
  produce1: string;
  produce2: string;
  produce3: string;
  leafGreen: string;
  chalkboard: string;
  chalkText: string;
  bread: string;
  breadCrust: string;
  bulb: string;
  bulbWire: string;
  sign: string;
  shadow: string;
}

const palettes: Record<Season, Palette> = {
  spring: {
    sky:          '#EFF7EC',
    ground:       '#D0C8A0',
    groundEdge:   '#B0A878',
    counter:      '#D4B880',
    counterEdge:  '#B89860',
    crate:        '#C0A060',
    crateEdge:    '#9A7E40',
    crateSlat:    '#A88848',
    awningStripe1:'#F09898',
    awningStripe2:'#FAFEF8',
    awningFringe: '#F09898',
    produce1:     '#E8A0A0',  // strawberry pink
    produce2:     '#88CC80',  // asparagus green
    produce3:     '#F0D870',  // early corn / lemon
    leafGreen:    '#70B870',
    chalkboard:   '#486848',
    chalkText:    '#E8F0E8',
    bread:        '#D4A060',
    breadCrust:   '#A87040',
    bulb:         '#F8F0A0',
    bulbWire:     '#908070',
    sign:         '#D4C890',
    shadow:       '#304828',
  },
  summer: {
    sky:          '#EEF8E6',
    ground:       '#C8B880',
    groundEdge:   '#A89860',
    counter:      '#C0A060',
    counterEdge:  '#A08040',
    crate:        '#A88040',
    crateEdge:    '#806030',
    crateSlat:    '#906840',
    awningStripe1:'#E85050',
    awningStripe2:'#FFFFF0',
    awningFringe: '#E85050',
    produce1:     '#E04040',  // tomatoes
    produce2:     '#60B050',  // courgette
    produce3:     '#E8C030',  // corn
    leafGreen:    '#50A040',
    chalkboard:   '#305030',
    chalkText:    '#E0F0E0',
    bread:        '#C89050',
    breadCrust:   '#9A6030',
    bulb:         '#F8F080',
    bulbWire:     '#807060',
    sign:         '#D4C068',
    shadow:       '#284018',
  },
  autumn: {
    sky:          '#F7EDD8',
    ground:       '#B89858',
    groundEdge:   '#987838',
    counter:      '#A87840',
    counterEdge:  '#846030',
    crate:        '#8A5E30',
    crateEdge:    '#6A4418',
    crateSlat:    '#7A5228',
    awningStripe1:'#C04030',
    awningStripe2:'#FEFAF0',
    awningFringe: '#C04030',
    produce1:     '#D06020',  // pumpkin
    produce2:     '#C84830',  // apple
    produce3:     '#B88030',  // squash
    leafGreen:    '#7A9048',
    chalkboard:   '#304038',
    chalkText:    '#D8E8D8',
    bread:        '#C08840',
    breadCrust:   '#8A5820',
    bulb:         '#F8E878',
    bulbWire:     '#706848',
    sign:         '#C4A830',
    shadow:       '#3A2810',
  },
  winter: {
    sky:          '#E8EEF5',
    ground:       '#9898A8',
    groundEdge:   '#787888',
    counter:      '#8090A0',
    counterEdge:  '#607080',
    crate:        '#607888',
    crateEdge:    '#485868',
    crateSlat:    '#506878',
    awningStripe1:'#7090B0',
    awningStripe2:'#F0F4F8',
    awningFringe: '#7090B0',
    produce1:     '#9898A8',  // parsnip / pale root veg
    produce2:     '#788898',  // Brussels
    produce3:     '#A8B0B8',  // cabbage
    leafGreen:    '#607870',
    chalkboard:   '#283848',
    chalkText:    '#C8D8E8',
    bread:        '#9098A8',
    breadCrust:   '#607080',
    bulb:         '#E0E8F0',
    bulbWire:     '#688098',
    sign:         '#90A8B8',
    shadow:       '#283848',
  },
};

export function StoresTabIllustration() {
  const { season } = useSettingsStore();
  const p = palettes[season] ?? palettes.autumn;

  // Stripe widths for awning
  const stripeW = 26;
  const awningTop = 18;
  const awningBottom = 68;

  return (
    <Svg
      viewBox="0 0 390 260"
      preserveAspectRatio="xMidYMax slice"
      width="100%"
      height="100%"
    >
      {/* ── SKY / BACKGROUND ──────────────────────────────────────────────── */}
      <Rect x={0} y={0} width={390} height={260} fill={p.sky} />

      <G transform="translate(0, 50)">
      {/* ── BULB STRING WIRE ──────────────────────────────────────────────── */}
      <Path
        d="M 0,46 Q 50,52 100,48 Q 150,44 200,50 Q 250,56 300,50 Q 350,44 390,48"
        stroke={p.bulbWire}
        strokeWidth={1.5}
        fill="none"
        opacity={0.6}
      />
      {/* Bare bulbs along the wire */}
      {[30, 80, 130, 180, 230, 280, 330, 375].map((bx, i) => {
        const by = i % 2 === 0 ? 50 : 46;
        return (
          <G key={`blb${bx}`}>
            {/* Socket */}
            <Rect x={bx - 3} y={by - 2} width={6} height={4} rx={1} fill={p.bulbWire} />
            {/* Bulb globe */}
            <Ellipse cx={bx} cy={by + 7} rx={5} ry={6} fill={p.bulb} opacity={0.85} />
          </G>
        );
      })}

      {/* ── CANDY-STRIPE AWNING ───────────────────────────────────────────── */}
      {[...Array(16)].map((_, i) => (
        <Rect
          key={`str${i}`}
          x={i * stripeW}
          y={awningTop}
          width={stripeW}
          height={awningBottom - awningTop}
          fill={i % 2 === 0 ? p.awningStripe1 : p.awningStripe2}
        />
      ))}
      {/* Awning bottom scallop fringe */}
      {[...Array(15)].map((_, i) => (
        <Ellipse
          key={`frg${i}`}
          cx={i * 26 + 26}
          cy={awningBottom + 6}
          rx={14}
          ry={8}
          fill={p.awningFringe}
        />
      ))}
      {/* Awning top bar */}
      <Rect x={0} y={awningTop} width={390} height={5} fill={p.awningStripe1} opacity={0.55} />

      {/* ── MARKET COUNTER ────────────────────────────────────────────────── */}
      <Rect x={0}  y={165} width={390} height={8}  fill={p.counterEdge} />
      <Rect x={0}  y={173} width={390} height={87} fill={p.counter} />
      {/* Counter front panel shadow */}
      <Rect x={0}  y={165} width={390} height={3}  fill={p.shadow} opacity={0.12} />

      {/* ── FRONT CRATE FACE (counter-front visible boards) ───────────────── */}
      <Rect x={22}  y={175} width={80} height={60} rx={3} fill={p.crate} />
      <Rect x={162} y={175} width={80} height={60} rx={3} fill={p.crate} />
      <Rect x={292} y={175} width={80} height={60} rx={3} fill={p.crate} />
      {/* Crate slat lines */}
      {[22, 162, 292].map(cx => [0, 20, 40].map(offset => (
        <Line key={`sl${cx}_${offset}`} x1={cx} y1={175 + offset} x2={cx + 80} y2={175 + offset}
          stroke={p.crateSlat} strokeWidth={1} opacity={0.4} />
      )))}
      {/* Crate top rim */}
      {[22, 162, 292].map(cx => (
        <Rect key={`rim${cx}`} x={cx} y={175} width={80} height={5} rx={2} fill={p.crateEdge} opacity={0.7} />
      ))}

      {/* ── PRODUCE IN CRATES ──────────────────────────────────────── */}
      {/* Left crate: round produce (spring: strawberries | summer: tomatoes | autumn: pumpkins | winter: cabbages) */}
      {[
        [38, 168], [56, 164], [74, 168], [44, 158], [64, 155], [82, 160],
      ].map(([px, py], i) => (
        <Circle key={`lp${i}`} cx={px} cy={py} r={8} fill={i % 2 === 0 ? p.produce1 : p.produce2} />
      ))}
      {/* Leaf tops for crate items */}
      {[[44, 158], [64, 155]].map(([px, py], i) => (
        <Path key={`lf${i}`} d={`M ${px},${py - 8} Q ${px - 5},${py - 16} ${px},${py - 14} Q ${px + 5},${py - 16} ${px},${py - 8}`}
          fill={p.leafGreen} />
      ))}

      {/* Middle crate: elongated produce */}
      {[
        [175, 170, 22, 9], [200, 167, 20, 9], [225, 171, 22, 9],
        [180, 160, 20, 9], [210, 157, 22, 9],
      ].map(([px, py, rxx, ryy], i) => (
        <Ellipse key={`mp${i}`} cx={px} cy={py} rx={rxx / 2} ry={ryy / 2}
          fill={i % 2 === 0 ? p.produce3 : p.produce1} />
      ))}

      {/* Right crate: mixed round + leaf */}
      {[
        [308, 168], [326, 164], [344, 168], [318, 158], [338, 160],
      ].map(([px, py], i) => (
        <Circle key={`rp${i}`} cx={px} cy={py} r={7} fill={[p.produce1, p.produce3, p.produce2, p.produce1, p.produce3][i]} />
      ))}

      {/* ── CHALKBOARD PRICE SIGN ─────────────────────────────────────────── */}
      {/* Frame */}
      <Rect x={108} y={94} width={78} height={60} rx={4} fill={p.crateEdge} />
      {/* Board surface */}
      <Rect x={112} y={98} width={70} height={52} rx={2} fill={p.chalkboard} />
      {/* "TODAY'S PICKS" text lines */}
      <Rect x={117} y={104} width={60} height={4} rx={1} fill={p.chalkText} opacity={0.6} />
      <Rect x={122} y={114} width={50} height={3} rx={1} fill={p.chalkText} opacity={0.45} />
      <Rect x={117} y={123} width={60} height={3} rx={1} fill={p.chalkText} opacity={0.45} />
      <Rect x={117} y={131} width={42} height={3} rx={1} fill={p.chalkText} opacity={0.40} />
      {/* Price circle */}
      <Circle cx={160} cy={131} r={10} fill={p.awningStripe1} opacity={0.5} />
      <Rect x={152} y={129} width={16} height={3} rx={1} fill={p.chalkText} opacity={0.7} />

      {/* ── BREAD LOAF (on counter, right of chalkboard) ──────────────────── */}
      <Ellipse cx={280} cy={162} rx={38} ry={18} fill={p.bread} />
      {/* Score lines */}
      {[-16, -6, 4, 14].map((dx, i) => (
        <Path key={`sc${i}`}
          d={`M ${280 + dx},${145} Q ${280 + dx + 3},${162} ${280 + dx},${179}`}
          stroke={p.breadCrust} strokeWidth={1.5} fill="none" opacity={0.5}
        />
      ))}
      {/* Crust top */}
      <Ellipse cx={280} cy={156} rx={32} ry={10} fill={p.breadCrust} opacity={0.5} />

      {/* ── GROUND SHADOW LINE ────────────────────────────────────────────── */}
      <Rect x={0}   y={246} width={390} height={14} fill={p.ground} />
      <Rect x={0}   y={246} width={390} height={3}  fill={p.groundEdge} />

      {/* ── SOFT CONTACT SHADOWS ──────────────────────────────────────────── */}
      <Ellipse cx={62}  cy={172} rx={42} ry={4} fill={p.shadow} opacity={0.10} />
      <Ellipse cx={202} cy={167} rx={40} ry={4} fill={p.shadow} opacity={0.08} />
      <Ellipse cx={332} cy={172} rx={42} ry={4} fill={p.shadow} opacity={0.10} />
      <Ellipse cx={280} cy={176} rx={38} ry={4} fill={p.shadow} opacity={0.10} />
      </G>
    </Svg>
  );
}
