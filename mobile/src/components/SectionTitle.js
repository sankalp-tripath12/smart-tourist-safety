import { Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

export default function SectionTitle({ title }) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 13,
  },
});
