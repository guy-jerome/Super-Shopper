import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ShopTabIllustration } from './illustrations/ShopTabIllustration';
import { HomeStorageTabIllustration } from './illustrations/HomeStorageTabIllustration';
import { ItemsTabIllustration } from './illustrations/ItemsTabIllustration';
import { StoresTabIllustration } from './illustrations/StoresTabIllustration';
import { SettingsTabIllustration } from './illustrations/SettingsTabIllustration';

export type IllustratedTab = 'shop' | 'home-storage' | 'items' | 'stores' | 'settings';

interface Props {
  tab: IllustratedTab;
  /** Opacity of the illustration layer. Default 0.17. */
  opacity?: number;
}

/**
 * Renders a seasonal illustration absolutely behind tab content.
 * Place as the first child of your tab's root <View>.
 *
 * Usage:
 *   <View style={styles.container}>
 *     <TabBackground tab="home-storage" />
 *     {/* rest of screen content *\/}
 *   </View>
 */
function Illustration({ tab }: { tab: IllustratedTab }) {
  switch (tab) {
    case 'shop':         return <ShopTabIllustration />;
    case 'home-storage': return <HomeStorageTabIllustration />;
    case 'items':        return <ItemsTabIllustration />;
    case 'stores':       return <StoresTabIllustration />;
    case 'settings':     return <SettingsTabIllustration />;
  }
}

export function TabBackground({ tab, opacity = 0.40 }: Props) {
  return (
    <View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      <Illustration tab={tab} />
    </View>
  );
}
