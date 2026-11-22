import { View, Text, StyleSheet } from 'react-native';

export default function SafetyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safety Services</Text>
      <Text style={styles.description}>
        Location monitoring and safety alerts will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#173B57',
  },
  description: {
    marginTop: 10,
    color: '#718096',
    textAlign: 'center',
  },
});
