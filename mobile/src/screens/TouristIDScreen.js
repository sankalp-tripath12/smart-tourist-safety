import { View, Text, StyleSheet } from 'react-native';

export default function TouristIDScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Digital Tourist ID</Text>
      <Text style={styles.description}>
        Your digital identity will appear here.
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#173B57',
  },
  description: {
    marginTop: 10,
    color: '#718096',
  },
});
