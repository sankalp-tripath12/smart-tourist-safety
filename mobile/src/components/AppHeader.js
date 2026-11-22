import { View, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

export default function AppHeader({ title, subtitle }) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>SAFETRAVEL</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  brand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.secondary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 7,
  },
});
