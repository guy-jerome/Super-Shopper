import { View, Text, StyleSheet } from 'react-native';

export default function HomeStorageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home Storage</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 20 },
});
