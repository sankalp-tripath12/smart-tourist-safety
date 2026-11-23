import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import colors from '../constants/colors';
import AppHeader from '../components/AppHeader';
import SafetyScoreCard from '../components/SafetyScoreCard';
import AnomalyAlertCard from '../components/AnomalyAlertCard';
import SosModal from '../components/SosModal';
import {
  getTourists,
  getSafetyScore,
  getSafetyZones,
  getTouristAnomalies,
  simulateAnomaly,
} from '../services/api';
import { evaluateLocalGeoFences, detectZoneTransitions } from '../services/geoFenceService';
import { LOCATION_PRESETS } from '../services/locationService';

export default function SafetyScreen() {
  const [tourist, setTourist] = useState(null);
  const [coordinates, setCoordinates] = useState({
    latitude: 26.9855,
    longitude: 75.8513,
  });
  const [safetyScoreData, setSafetyScoreData] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [safetyZones, setSafetyZones] = useState([]);
  const [currentRiskLevel, setCurrentRiskLevel] = useState('SAFE');
  const [transitionBanner, setTransitionBanner] = useState(null);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Keep track of active zone IDs across updates to prevent alert spam
  const activeZoneIdsRef = useRef([]);

  useEffect(() => {
    loadSafetyData();
  }, []);

  const loadSafetyData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Tourist
      let currentTourist = null;
      const touristRes = await getTourists();
      if (touristRes?.data && touristRes.data.length > 0) {
        currentTourist = touristRes.data[0];
        setTourist(currentTourist);
      }

      // 2. Fetch Safety Zones
      const zonesRes = await getSafetyZones();
      const loadedZones = zonesRes?.data || [];
      setSafetyZones(loadedZones);

      // 3. Evaluate initial geofence
      const geoEval = evaluateLocalGeoFences(
        coordinates.latitude,
        coordinates.longitude,
        loadedZones
      );
      setCurrentRiskLevel(geoEval.currentRiskLevel);
      activeZoneIdsRef.current = geoEval.insideZones.map((z) => z.id);

      // 4. Fetch Safety Score & Anomalies
      if (currentTourist?.id) {
        await refreshScoreAndAlerts(
          currentTourist.id,
          coordinates.latitude,
          coordinates.longitude
        );
      }
    } catch (err) {
      console.log('Error initializing safety data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshScoreAndAlerts = async (touristId, lat, lon) => {
    try {
      const [scoreRes, alertRes] = await Promise.all([
        getSafetyScore(touristId, lat, lon),
        getTouristAnomalies(touristId),
      ]);

      if (scoreRes?.data) setSafetyScoreData(scoreRes.data);
      if (alertRes?.data) setAnomalies(alertRes.data);
    } catch (err) {
      console.log('Score/Alert refresh error:', err.message);
    }
  };

  const handleSimulateMove = (preset) => {
    const lat = preset.latitude;
    const lon = preset.longitude;
    setCoordinates({ latitude: lat, longitude: lon });

    // Evaluate geo-fence and detect transitions
    const geoEval = evaluateLocalGeoFences(lat, lon, safetyZones);
    setCurrentRiskLevel(geoEval.currentRiskLevel);

    const transition = detectZoneTransitions(
      activeZoneIdsRef.current,
      geoEval.insideZones
    );

    activeZoneIdsRef.current = transition.currentInsideIds;

    // Show alert banner ONLY when actual transition occurs (no spam)
    if (transition.entered.length > 0) {
      const enteredZone = transition.entered[0];
      const isDanger = enteredZone.riskLevel === 'DANGER';
      setTransitionBanner({
        type: isDanger ? 'DANGER' : 'ENTER',
        message: `${isDanger ? '🚨 DANGER ZONE ALERT' : '📍 Safety Notice'}: You entered "${enteredZone.name}".`,
      });
    } else if (transition.exitedIds.length > 0) {
      setTransitionBanner({
        type: 'EXIT',
        message: '✓ You have exited the previous safety zone perimeter.',
      });
    }

    if (tourist?.id) {
      refreshScoreAndAlerts(tourist.id, lat, lon);
    }
  };

  const handleSimulateAnomaly = async (scenario) => {
    if (!tourist?.id) {
      Alert.alert('Tourist Required', 'Please register or select a tourist first.');
      return;
    }

    setSimulating(true);
    try {
      const res = await simulateAnomaly({
        touristId: tourist.id,
        scenario,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      Alert.alert(
        'Anomaly Triggered',
        `Simulated rule "${scenario}" successfully logged.\nSeverity: ${res.data.severity}`
      );

      // Refresh score to demonstrate rule-based impact immediately
      await refreshScoreAndAlerts(
        tourist.id,
        coordinates.latitude,
        coordinates.longitude
      );
    } catch (error) {
      Alert.alert('Simulation Error', error.message || 'Unable to simulate anomaly.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppHeader
        title="Safety & Risk Engine"
        subtitle="Real-time monitoring, anomaly detection & SOS"
      />

      {/* Transition Banner (Enter / Exit Alert) */}
      {transitionBanner && (
        <View
          style={[
            styles.bannerBox,
            transitionBanner.type === 'DANGER'
              ? styles.dangerBanner
              : styles.infoBanner,
          ]}
        >
          <Text
            style={[
              styles.bannerText,
              transitionBanner.type === 'DANGER'
                ? styles.dangerBannerText
                : styles.infoBannerText,
            ]}
          >
            {transitionBanner.message}
          </Text>
          <Pressable onPress={() => setTransitionBanner(null)}>
            <Text style={styles.bannerClose}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Live Safety Score Card */}
      <SafetyScoreCard scoreData={safetyScoreData} />

      {/* Emergency SOS Quick Trigger Button */}
      <Pressable
        style={styles.sosButton}
        onPress={() => setSosModalVisible(true)}
      >
        <View style={styles.sosInner}>
          <Text style={styles.sosIcon}>🚨</Text>
          <View>
            <Text style={styles.sosTitle}>ACTIVATE EMERGENCY SOS</Text>
            <Text style={styles.sosSubtitle}>
              Two-step confirmation • Immediate incident creation
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Geo-Fenced Zone Movement Simulation */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Simulate Location Movement</Text>
        <Text style={styles.sectionSub}>
          Tap presets to test zone entry/exit alerts without physical travel
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
        {LOCATION_PRESETS.map((p) => {
          const isSelected =
            coordinates.latitude === p.latitude && coordinates.longitude === p.longitude;
          const isDanger = p.riskLevel === 'DANGER';

          return (
            <Pressable
              key={p.id}
              style={[
                styles.presetPill,
                isSelected && styles.presetPillActive,
                isDanger && styles.presetPillDanger,
              ]}
              onPress={() => handleSimulateMove(p)}
            >
              <Text
                style={[
                  styles.presetPillText,
                  isSelected && styles.presetPillTextActive,
                ]}
              >
                {p.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Anomaly Detection Engine Simulation Panel */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Rule-Based Anomaly Detection</Text>
        <Text style={styles.sectionSub}>
          Simulate unusual movement patterns to test automated risk alerts
        </Text>
      </View>

      <View style={styles.simGrid}>
        <Pressable
          style={styles.simCard}
          disabled={simulating}
          onPress={() => handleSimulateAnomaly('DANGER_ZONE_ENTRY')}
        >
          <Text style={styles.simCardTitle}>⚡ Danger Zone Entry</Text>
          <Text style={styles.simCardDesc}>Enters restricted Aravalli Ridge perimeter</Text>
        </Pressable>

        <Pressable
          style={styles.simCard}
          disabled={simulating}
          onPress={() => handleSimulateAnomaly('SUDDEN_LOCATION_CHANGE')}
        >
          <Text style={styles.simCardTitle}>🚀 Sudden Location Jump</Text>
          <Text style={styles.simCardDesc}>85km displacement in 3 minutes (~1,700km/h)</Text>
        </Pressable>

        <Pressable
          style={styles.simCard}
          disabled={simulating}
          onPress={() => handleSimulateAnomaly('ROUTE_DEVIATION')}
        >
          <Text style={styles.simCardTitle}>🧭 Route Deviation</Text>
          <Text style={styles.simCardDesc}>Exceeds 4.5km corridor from itinerary</Text>
        </Pressable>

        <Pressable
          style={styles.simCard}
          disabled={simulating}
          onPress={() => handleSimulateAnomaly('INACTIVITY')}
        >
          <Text style={styles.simCardTitle}>⏳ Location Inactivity</Text>
          <Text style={styles.simCardDesc}>GPS silence exceeding 180 min threshold</Text>
        </Pressable>

        <Pressable
          style={[styles.simCard, styles.simCardFull]}
          disabled={simulating}
          onPress={() => handleSimulateAnomaly('REPEATED_SUSPICIOUS_EVENTS')}
        >
          <Text style={styles.simCardTitle}>🔥 Repeated Suspicious Events</Text>
          <Text style={styles.simCardDesc}>
            Clusters multiple risk events in a 45-minute window to escalate severity
          </Text>
        </Pressable>
      </View>

      {/* Recent Anomaly Alerts List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Safety Alerts</Text>
        <Text style={styles.sectionSub}>Generated by rule-based detection engine</Text>
      </View>

      {anomalies.length > 0 ? (
        anomalies.slice(0, 5).map((alert) => (
          <AnomalyAlertCard key={alert.id} alert={alert} />
        ))
      ) : (
        <View style={styles.emptyAlertsBox}>
          <Text style={styles.emptyAlertsText}>
            ✓ No active safety anomalies. System operating normally.
          </Text>
        </View>
      )}

      {/* SOS Modal */}
      <SosModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
        tourist={tourist}
        coordinates={coordinates}
        onSosSuccess={() => {
          if (tourist?.id) {
            refreshScoreAndAlerts(
              tourist.id,
              coordinates.latitude,
              coordinates.longitude
            );
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  bannerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  dangerBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  infoBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  dangerBannerText: {
    color: '#991B1B',
  },
  infoBannerText: {
    color: '#166534',
  },
  bannerClose: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.muted,
    paddingLeft: 10,
  },
  sosButton: {
    backgroundColor: colors.danger,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  sosInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sosIcon: {
    fontSize: 28,
  },
  sosTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sosSubtitle: {
    color: '#FEE2E2',
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  presetScroll: {
    marginBottom: 20,
  },
  presetPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  presetPillActive: {
    borderColor: colors.secondary,
    backgroundColor: '#E6F3F1',
  },
  presetPillDanger: {
    borderColor: '#FCA5A5',
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  presetPillTextActive: {
    color: colors.secondary,
  },
  simGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  simCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  simCardFull: {
    width: '100%',
  },
  simCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  simCardDesc: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 14,
  },
  emptyAlertsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyAlertsText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
});
