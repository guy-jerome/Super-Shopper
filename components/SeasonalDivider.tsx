import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle, Ellipse, Line } from 'react-native-svg';
import { useColors, spacing, type Colors } from '../constants/theme';
import { useSettingsStore } from '../stores/useSettingsStore';

// ─── Spring — Flowering Vine ─────────────────────────────────────────────────

function SpringVine({ colors }: { colors: Colors }) {
  return (
    <Svg width="100%" height={32} viewBox="0 0 300 32">
      {/* Vine */}
      <Path
        d="M 0,22 C 18,15 37,29 75,22 C 113,15 132,29 150,22 C 168,15 187,29 225,22 C 263,15 282,29 300,22"
        stroke={colors.stripe}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />

      {/* Leaf 1 at x=37, peak going up, angled */}
      <G transform="translate(37,18) rotate(-50)">
        <Path d="M 0,0 C -2,-4 2,-9 0,-13 C -2,-9 2,-4 0,0 Z" fill={colors.stripe} opacity={0.7} />
        <Line x1={0} y1={0} x2={0} y2={-13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.5} />
      </G>
      {/* Leaf 2 at x=112, trough */}
      <G transform="translate(112,26) rotate(130)">
        <Path d="M 0,0 C -2,-4 2,-9 0,-13 C -2,-9 2,-4 0,0 Z" fill={colors.stripe} opacity={0.7} />
        <Line x1={0} y1={0} x2={0} y2={-13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.5} />
      </G>
      {/* Leaf 3 at x=187, peak */}
      <G transform="translate(187,18) rotate(-50)">
        <Path d="M 0,0 C -2,-4 2,-9 0,-13 C -2,-9 2,-4 0,0 Z" fill={colors.stripe} opacity={0.7} />
        <Line x1={0} y1={0} x2={0} y2={-13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.5} />
      </G>
      {/* Leaf 4 at x=262, trough */}
      <G transform="translate(262,26) rotate(130)">
        <Path d="M 0,0 C -2,-4 2,-9 0,-13 C -2,-9 2,-4 0,0 Z" fill={colors.stripe} opacity={0.7} />
        <Line x1={0} y1={0} x2={0} y2={-13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.5} />
      </G>

      {/* Flower 1 at x=75 — blush pink petals, yellow center */}
      <G transform="translate(75,20)">
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(0)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(72)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(144)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(216)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(288)" />
        <Circle r={2.8} fill="#F5C040" />
      </G>
      {/* Flower 2 at x=150 — rose, offset rotation */}
      <G transform="translate(150,20)">
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#FBBDD4" transform="rotate(36)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#FBBDD4" transform="rotate(108)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#FBBDD4" transform="rotate(180)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#FBBDD4" transform="rotate(252)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#FBBDD4" transform="rotate(324)" />
        <Circle r={2.8} fill="#F5C040" />
      </G>
      {/* Flower 3 at x=225 */}
      <G transform="translate(225,20)">
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(0)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(72)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(144)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(216)" />
        <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(288)" />
        <Circle r={2.8} fill="#F5C040" />
      </G>
    </Svg>
  );
}

// ─── Summer — Raspberry Branch ───────────────────────────────────────────────

function SummerRaspberry({ colors }: { colors: Colors }) {
  return (
    <Svg width="100%" height={34} viewBox="0 0 300 34">
      {/* Branch */}
      <Path
        d="M 0,26 C 50,23 80,21 120,23 C 160,25 180,21 220,23 C 250,25 270,23 300,23"
        stroke="#7A5230"
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />

      {/* Stems to clusters */}
      <Line x1={65} y1={23} x2={65} y2={15} stroke="#7A5230" strokeWidth={1} />
      <Line x1={155} y1={22} x2={155} y2={14} stroke="#7A5230" strokeWidth={1} />
      <Line x1={245} y1={23} x2={245} y2={15} stroke="#7A5230" strokeWidth={1} />

      {/* Raspberry cluster at (65,11) — center + 6 ring drupelets */}
      <G transform="translate(65,11)">
        <Circle cx={0}     cy={0}     r={2.5} fill="#C84B6B" />
        <Circle cx={0}     cy={-3.5}  r={2.5} fill="#D4527A" />
        <Circle cx={3.03}  cy={-1.75} r={2.5} fill="#C84B6B" />
        <Circle cx={3.03}  cy={1.75}  r={2.5} fill="#D4527A" />
        <Circle cx={0}     cy={3.5}   r={2.5} fill="#C84B6B" />
        <Circle cx={-3.03} cy={1.75}  r={2.5} fill="#D4527A" />
        <Circle cx={-3.03} cy={-1.75} r={2.5} fill="#C84B6B" />
        <Circle cx={-0.8}  cy={-4.2}  r={0.7} fill="rgba(255,255,255,0.55)" />
        <Circle cx={2.2}   cy={-2.5}  r={0.7} fill="rgba(255,255,255,0.45)" />
        <Circle cx={-0.8}  cy={-0.8}  r={0.7} fill="rgba(255,255,255,0.4)" />
      </G>

      {/* Leaf near x=95 */}
      <Path d="M 95,23 C 92,17 100,13 102,18 C 99,22 95,23 95,23 Z" fill={colors.primaryDark} opacity={0.85} />
      <Line x1={95} y1={23} x2={102} y2={13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.6} />

      {/* Raspberry cluster at (155,10) */}
      <G transform="translate(155,10)">
        <Circle cx={0}     cy={0}     r={2.5} fill="#C84B6B" />
        <Circle cx={0}     cy={-3.5}  r={2.5} fill="#D4527A" />
        <Circle cx={3.03}  cy={-1.75} r={2.5} fill="#C84B6B" />
        <Circle cx={3.03}  cy={1.75}  r={2.5} fill="#D4527A" />
        <Circle cx={0}     cy={3.5}   r={2.5} fill="#C84B6B" />
        <Circle cx={-3.03} cy={1.75}  r={2.5} fill="#D4527A" />
        <Circle cx={-3.03} cy={-1.75} r={2.5} fill="#C84B6B" />
        <Circle cx={-0.8}  cy={-4.2}  r={0.7} fill="rgba(255,255,255,0.55)" />
        <Circle cx={2.2}   cy={-2.5}  r={0.7} fill="rgba(255,255,255,0.45)" />
      </G>

      {/* Leaf near x=185 */}
      <Path d="M 185,23 C 183,17 191,13 193,18 C 190,22 185,23 185,23 Z" fill={colors.primaryDark} opacity={0.85} />
      <Line x1={185} y1={23} x2={193} y2={13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.6} />

      {/* Raspberry cluster at (245,11) */}
      <G transform="translate(245,11)">
        <Circle cx={0}     cy={0}     r={2.5} fill="#C84B6B" />
        <Circle cx={0}     cy={-3.5}  r={2.5} fill="#D4527A" />
        <Circle cx={3.03}  cy={-1.75} r={2.5} fill="#C84B6B" />
        <Circle cx={3.03}  cy={1.75}  r={2.5} fill="#D4527A" />
        <Circle cx={0}     cy={3.5}   r={2.5} fill="#C84B6B" />
        <Circle cx={-3.03} cy={1.75}  r={2.5} fill="#D4527A" />
        <Circle cx={-3.03} cy={-1.75} r={2.5} fill="#C84B6B" />
        <Circle cx={-0.8}  cy={-4.2}  r={0.7} fill="rgba(255,255,255,0.55)" />
        <Circle cx={2.2}   cy={-2.5}  r={0.7} fill="rgba(255,255,255,0.45)" />
      </G>
    </Svg>
  );
}

// ─── Autumn — Maple Leaves on Twig ───────────────────────────────────────────

const MAPLE_LEAF_PATH =
  'M 0,-11 L 1.2,-7.5 C 2.5,-8.5 4,-9 4,-9 L 3,-5.5 C 4.5,-5.5 7.5,-4 7.5,-4 L 5,-2.5 C 7,0 9,2 9,2 L 6,1.5 C 5.5,3.5 4,4.5 2.5,4.5 L 0,8 L -2.5,4.5 C -4,4.5 -5.5,3.5 -6,1.5 L -9,2 C -9,2 -7,0 -5,-2.5 L -7.5,-4 C -7.5,-4 -4.5,-5.5 -3,-5.5 L -4,-9 C -4,-9 -2.5,-8.5 -1.2,-7.5 Z M 0,8 L 0,11';

function AutumnLeaves({ colors: _colors }: { colors: Colors }) {
  return (
    <Svg width="100%" height={38} viewBox="0 0 300 38">
      {/* Twig */}
      <Path
        d="M 20,26 C 80,23 140,25 180,24 C 220,23 260,25 280,25"
        stroke="#7A4A20"
        strokeWidth={1.3}
        fill="none"
        strokeLinecap="round"
      />

      {/* Small branches up to leaves */}
      <Line x1={70}  y1={24} x2={68}  y2={17} stroke="#7A4A20" strokeWidth={0.9} />
      <Line x1={150} y1={24} x2={152} y2={16} stroke="#7A4A20" strokeWidth={0.9} />
      <Line x1={230} y1={24} x2={228} y2={17} stroke="#7A4A20" strokeWidth={0.9} />

      {/* Leaf 1 — amber, slight left tilt */}
      <G transform="translate(68,17) rotate(-8)">
        <Path d={MAPLE_LEAF_PATH} fill="#DA8359" stroke="#C06A40" strokeWidth={0.4} />
      </G>

      {/* Leaf 2 — apple red, slight right tilt */}
      <G transform="translate(152,16) rotate(6)">
        <Path d={MAPLE_LEAF_PATH} fill="#B84A3C" stroke="#963C30" strokeWidth={0.4} />
      </G>

      {/* Leaf 3 — warm gold, moderate left tilt */}
      <G transform="translate(228,17) rotate(-14)">
        <Path d={MAPLE_LEAF_PATH} fill="#C89040" stroke="#A87030" strokeWidth={0.4} />
      </G>
    </Svg>
  );
}

// ─── Winter — Crystal Snowflake ──────────────────────────────────────────────

function WinterSnowflake({ colors }: { colors: Colors }) {
  const armAngles = [0, 60, 120, 180, 240, 300];

  return (
    <Svg width="100%" height={32} viewBox="0 0 300 32">
      {/* Left dotted line */}
      <Line
        x1={8}   y1={16} x2={118} y2={16}
        stroke={colors.divider}
        strokeWidth={1}
        strokeDasharray="2,5"
        strokeLinecap="round"
      />
      {/* Right dotted line */}
      <Line
        x1={182} y1={16} x2={292} y2={16}
        stroke={colors.divider}
        strokeWidth={1}
        strokeDasharray="2,5"
        strokeLinecap="round"
      />

      {/* Small flanking snowflake LEFT at x=100 */}
      <G transform="translate(100,16)" stroke={colors.primary} strokeWidth={1} strokeLinecap="round">
        <Line x1={0} y1={-5} x2={0}   y2={5} />
        <Line x1={-5} y1={0} x2={5}   y2={0} />
        <Line x1={-3.5} y1={-3.5} x2={3.5} y2={3.5} />
        <Line x1={3.5}  y1={-3.5} x2={-3.5} y2={3.5} />
        <Circle cx={0} cy={0} r={1.2} fill={colors.primary} stroke="none" />
      </G>

      {/* Small flanking snowflake RIGHT at x=200 */}
      <G transform="translate(200,16)" stroke={colors.primary} strokeWidth={1} strokeLinecap="round">
        <Line x1={0} y1={-5} x2={0}   y2={5} />
        <Line x1={-5} y1={0} x2={5}   y2={0} />
        <Line x1={-3.5} y1={-3.5} x2={3.5} y2={3.5} />
        <Line x1={3.5}  y1={-3.5} x2={-3.5} y2={3.5} />
        <Circle cx={0} cy={0} r={1.2} fill={colors.primary} stroke="none" />
      </G>

      {/* Main snowflake at x=150 — 6 arms */}
      <G transform="translate(150,16)">
        {armAngles.map((angle) => (
          <G key={angle} transform={`rotate(${angle})`} stroke={colors.primary} strokeLinecap="round">
            <Line x1={0} y1={-13} x2={0} y2={13} strokeWidth={1.6} />
            <Line x1={-3.5} y1={-5}  x2={3.5} y2={-5}  strokeWidth={1} />
            <Line x1={-3.5} y1={5}   x2={3.5} y2={5}   strokeWidth={1} />
            <Line x1={-2}   y1={-9}  x2={2}   y2={-9}  strokeWidth={0.9} />
            <Line x1={-2}   y1={9}   x2={2}   y2={9}   strokeWidth={0.9} />
            <Circle cx={0} cy={-13} r={1.2} fill={colors.primary} stroke="none" />
            <Circle cx={0} cy={13}  r={1.2} fill={colors.primary} stroke="none" />
          </G>
        ))}
        {/* Center hex dot */}
        <Circle cx={0} cy={0} r={2.5} fill={colors.primary} stroke="none" />
        <Circle cx={0} cy={0} r={1.2} fill={colors.background} stroke="none" />
      </G>
    </Svg>
  );
}

// ─── SeasonalDivider ─────────────────────────────────────────────────────────

export function SeasonalDivider() {
  const colors = useColors();
  const season = useSettingsStore((s) => s.season);

  return (
    <View style={styles.container}>
      {season === 'spring' && <SpringVine colors={colors} />}
      {season === 'summer' && <SummerRaspberry colors={colors} />}
      {season === 'autumn' && <AutumnLeaves colors={colors} />}
      {season === 'winter' && <WinterSnowflake colors={colors} />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 2,
    paddingHorizontal: spacing.md,
    transform: [{ scaleY: 0.6 }],
  },
});
