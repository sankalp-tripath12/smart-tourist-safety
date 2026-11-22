import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function App() {
  const [showIdDetails, setShowIdDetails] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7FB" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>SAFETRAVEL</Text>
            <Text style={styles.heading}>Tourist Dashboard</Text>
          </View>

          <View style={styles.profile}>
            <Text style={styles.profileText}>T</Text>
          </View>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.welcomeTitle}>Welcome, Tourist!</Text>
          <Text style={styles.subtitle}>
            Your journey matters. Stay safe wherever you go.
          </Text>
        </View>

        <View style={styles.safetyCard}>
          <View style={styles.safetyTop}>
            <Text style={styles.cardLabel}>YOUR SAFETY STATUS</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>DEMO</Text>
            </View>
          </View>

          <Text style={styles.safetyTitle}>Safety monitoring is ready</Text>
          <Text style={styles.safetyDescription}>
            Location monitoring is not connected yet. Complete your setup
            to activate safety features.
          </Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressLabel}>Setup in progress</Text>
        </View>

        <Text style={styles.sectionTitle}>Your Digital Tourist ID</Text>

        <View style={styles.idCard}>
          <View style={styles.idHeader}>
            <Text style={styles.idHeaderText}>DIGITAL TOURIST ID</Text>
            <Text style={styles.idIcon}>✦</Text>
          </View>

          <Text style={styles.idNumber}>ST-2026-DEMO-001</Text>
          <Text style={styles.idNote}>
            Sample identity for project demonstration
          </Text>

          <Pressable
            style={styles.idButton}
            onPress={() => setShowIdDetails(!showIdDetails)}
          >
            <Text style={styles.idButtonText}>
              {showIdDetails ? 'Hide ID details' : 'View ID details'}
            </Text>
          </Pressable>

          {showIdDetails && (
            <View style={styles.idDetails}>
              <Text style={styles.detailText}>Name: Demo Tourist</Text>
              <Text style={styles.detailText}>Status: Sample ID</Text>
              <Text style={styles.detailText}>Verification: Not connected</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Safety Services</Text>

        <View style={styles.services}>
          <View style={styles.serviceCard}>
            <Text style={styles.serviceIcon}>⌖</Text>
            <Text style={styles.serviceTitle}>Location</Text>
            <Text style={styles.serviceDescription}>Coming soon</Text>
          </View>

          <View style={styles.serviceCard}>
            <Text style={styles.serviceIcon}>◎</Text>
            <Text style={styles.serviceTitle}>Geo-fencing</Text>
            <Text style={styles.serviceDescription}>Coming soon</Text>
          </View>

          <View style={styles.serviceCard}>
            <Text style={styles.serviceIcon}>◈</Text>
            <Text style={styles.serviceTitle}>Safety alerts</Text>
            <Text style={styles.serviceDescription}>Coming soon</Text>
          </View>

          <View style={styles.serviceCard}>
            <Text style={styles.serviceIcon}>▣</Text>
            <Text style={styles.serviceTitle}>Travel history</Text>
            <Text style={styles.serviceDescription}>Coming soon</Text>
          </View>
        </View>

        <Pressable
          style={styles.sosButton}
          onPress={() =>
            Alert.alert(
              'Demo SOS',
              'This is a visual demo. Emergency services are not connected yet.'
            )
          }
        >
          <Text style={styles.sosTitle}>SOS Emergency</Text>
          <Text style={styles.sosSubtitle}>
            Emergency functionality will be implemented next
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          SMART TOURIST SAFETY • PROJECT DEMO
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  content: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#147D78',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#172B4D',
    marginTop: 5,
  },
  profile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCEFEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#147D78',
  },
  welcome: {
    marginTop: 30,
    marginBottom: 22,
  },
  welcomeTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#172B4D',
  },
  subtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 7,
    lineHeight: 20,
  },
  safetyCard: {
    backgroundColor: '#173B57',
    borderRadius: 18,
    padding: 20,
    marginBottom: 27,
  },
  safetyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    color: '#B8D5DF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: '#FCE9C5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    color: '#875A13',
    fontSize: 10,
    fontWeight: '800',
  },
  safetyTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 19,
  },
  safetyDescription: {
    color: '#D1E0E8',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#496477',
    borderRadius: 5,
    marginTop: 20,
  },
  progressFill: {
    width: '35%',
    height: 6,
    backgroundColor: '#61C5B4',
    borderRadius: 5,
  },
  progressLabel: {
    color: '#B8D5DF',
    fontSize: 11,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#172B4D',
    marginBottom: 13,
  },
  idCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 19,
    marginBottom: 27,
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  idHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  idHeaderText: {
    fontSize: 11,
    color: '#147D78',
    fontWeight: '800',
    letterSpacing: 1,
  },
  idIcon: {
    color: '#147D78',
    fontSize: 22,
  },
  idNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172B4D',
    marginTop: 20,
  },
  idNote: {
    color: '#8290A2',
    fontSize: 11,
    marginTop: 6,
  },
  idButton: {
    backgroundColor: '#E6F3F1',
    padding: 12,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 17,
  },
  idButtonText: {
    color: '#147D78',
    fontWeight: '700',
    fontSize: 13,
  },
  idDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E8EDF2',
    marginTop: 15,
    paddingTop: 12,
    gap: 8,
  },
  detailText: {
    color: '#526276',
    fontSize: 12,
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 25,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E8EDF2',
  },
  serviceIcon: {
    fontSize: 25,
    color: '#147D78',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#243B53',
  },
  serviceDescription: {
    fontSize: 11,
    color: '#8290A2',
    marginTop: 5,
  },
  sosButton: {
    backgroundColor: '#B83240',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  sosTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  sosSubtitle: {
    color: '#FBE3E5',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    color: '#9AA6B2',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 25,
  },
});
