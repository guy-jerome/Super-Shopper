import { useState, useMemo } from "react";
import { Modal, View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useColors, spacing, type Colors } from "@/constants/theme";

type Step = {
  title: string;
  subtitle: string;
};

const STEPS: Step[] = [
  {
    title: "Welcome to Super Shopper",
    subtitle: "Track what's in your home and shop smarter.",
  },
  {
    title: "Set up your home",
    subtitle:
      "Add storage locations like Fridge, Pantry, and Freezer — or use a template to create them instantly.",
  },
  {
    title: "Start shopping",
    subtitle:
      "Check items you need from Home, then head to Shop to see your list organised by aisle.",
  },
];

type Props = {
  visible: boolean;
  onDone: () => void;
};

export function OnboardingModal({ visible, onDone }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const handleNext = () => {
    if (isLast) {
      onDone();
      setStep(0);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    onDone();
    setStep(0);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text variant="headlineSmall" style={styles.title}>
            {current.title}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {current.subtitle}
          </Text>

          {/* Step dots */}
          <View style={styles.dotsRow}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive]}
              />
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {!isLast && (
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text variant="labelLarge" style={styles.skipText}>
                  Skip
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextButton, isLast && styles.nextButtonFull]}
            >
              <Text variant="labelLarge" style={styles.nextText}>
                {isLast ? "Get started!" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: spacing.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 8,
    },
    title: {
      color: colors.text,
      fontWeight: "700",
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    subtitle: {
      color: colors.textLight,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textLight + "50",
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 20,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    skipButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    skipText: {
      color: colors.textLight,
    },
    nextButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    nextButtonFull: {
      flex: 1,
      alignItems: "center",
    },
    nextText: {
      color: "#ffffff",
      fontWeight: "600",
    },
  });
}
