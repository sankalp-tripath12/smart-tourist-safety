import React, { useState, useEffect } from 'react';
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
import LocationCard from '../components/LocationCard';
import GeoFenceZoneCard from '../components/GeoFenceZoneCard';
import {
  getCurrentCoordinates,
  checkLocationPermissions,
  requestLocationPermissions,
  LOCATION_PRESETS,
} from '../services/locationService';
import { getSafetyZones, evaluateLocationZones } from '../services/api';
import { evaluateLocalGeoFences } from '../services/geoFenceService';

export default function LocationScreen() {
  const [coordinates, setCoordinates] = useState({
    latitude: 26.9855,
    longitude: 75.8513,
    accuracy: 10,
    isSimulated: false,
    timestamp: Date.now(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [safetyZones, setSafetyZones] = useState([]);
  const [evaluatedResult, setEvaluatedResult] = useState(null);

  useEffect(() => {
    initLocation();
    fetchZones();
  }, []);

  const initLocation = async () => {
    const perm = await checkLocationPermissions();
    setPermissionGranted(perm.granted);

    if (perm.granted) {
      fetchRealGps();
    }
  };

  const fetchZones = async () => {
    try {
      const res = await getSafetyZones();
      if (res?.data) {
        setSafetyZones(res.data);
        evaluateAt(coordinates.latitude, coordinates.longitude, res.data);
      }
    } catch (err) {
      console.log('Using local fallback zones if offline:', err.message);
    }
  };

  const evaluateAt = async (lat, lon, zones = safetyZones) => {
    try {
      // Backend evaluation
      const res = await evaluateLocationZones(lat, lon);
      if (res?.data) {
        setEvaluatedResult(res.data);
        return;
      }
    } catch {
      // Local fallback
    }

    const localEval = evaluateLocalGeoFences(lat, lon, zones);
    setEvaluatedResult({
      currentRiskLevel: localEval.currentRiskLevel,
      allZones: localEval.evaluatedZones,
      activeZones: localEval.insideZones,
    });
  };

  const fetchRealGps = async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await getCurrentCoordinates();
      setCoordinates(coords);
      setPermissionGranted(true);
      await evaluateAt(coords.latitude, coords.longitude);
    } catch (err) {
      setError(err.message || 'Unable to retrieve GPS coordinates.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestLocationPermissions();
    setPermissionGranted(res.granted);
    if (res.granted) {
      fetchRealGps();
    } else {
      Alert.alert(
        'Permission Denied',
        'Foreground location permission is needed to monitor safety zones and trigger emergency SOS.'
      );
    }
  };

  const handleSelectPreset = (preset) => {
    const newCoords = {
      latitude: preset.latitude,
      longitude: preset.longitude,
      accuracy: 5.0,
      isSimulated: true,
      presetName: preset.name,
      timestamp: Date.now(),
    };
    setCoordinates(newCoords);
    evaluateAt(preset.latitude, preset.longitude);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppHeader
        title="GPS & Safety Zones"
        subtitle="Foreground location monitoring & geo-fencing"
      />

      {/* Permission Request Banner if not granted */}
      {!permissionGranted && (
        <View style={styles.permBanner}>
          <Text style={styles.permTitle}>📍 Location Permission Required</Text>
          <Text style={styles.permDesc}>
            Enable location services so the app can verify your proximity to safe tourist zones and route assistance.
          </Text>
          <Pressable style={styles.permButton} onPress={handleRequestPermission}>
            <Text style={styles.permButtonText}>Grant Foreground Permission</Text>
          </Pressable>
        </View>
      )}

      {/* Main Location Card */}
      <LocationCard
        coordinates={coordinates}
        loading={loading}
        error={error}
        permissionGranted={permissionGranted}
        onRefresh={fetchRealGps}
      />

      {/* Simulation Selector Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Geo-Fence Demo Simulation</Text>
        <Text style={styles.sectionSub}>Test entering safety zones without travelling</Text>
      </View>

      <View style={styles.presetsGrid}>
        {LOCATION_PRESETS.map((preset) => {
          const isSelected =
            coordinates.isSimulated &&
            coordinates.latitude === preset.latitude &&
            coordinates.longitude === preset.longitude;

          const isDanger = preset.riskLevel === 'DANGER';
          const isCaution = preset.riskLevel === 'CAUTION';
          const chipColor = isDanger
            ? colors.danger
            : isCaution
            ? '#D97706'
            : colors.secondary;

          return (
            <Pressable
              key={preset.id}
              style={[styles.presetCard, isSelected && styles.presetCardSelected]}
              onPress={() => handleSelectPreset(preset)}
            >
              <View style={styles.presetTop}>
                <Text style={styles.presetName}>{preset.name}</Text>
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isDanger
                        ? '#FEE2E2'
                        : isCaution
                        ? '#FEF3C7'
                        : '#E6F4EA',
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: chipColor }]}>
                    {preset.riskLevel}
                  </Text>
                </View>
              </View>
              <Text style={styles.presetDesc}>{preset.description}</Text>
              <Text style={styles.presetCoords}>
                [{preset.latitude.toFixed(4)}, {preset.longitude.toFixed(4)}]
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Zone Evaluation Status */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby Configured Zones</Text>
        <Text style={styles.sectionSub}>
          Calculated via Haversine great-circle formula
        </Text>
      </View>

      {evaluatedResult?.allZones && evaluatedResult.allZones.length > 0 ? (
        evaluatedResult.allZones.map((zone) => (
          <GeoFenceZoneCard key={zone.id} zone={zone} />
        ))
      ) : safetyZones.length > 0 ? (
        safetyZones.map((zone) => (
          <GeoFenceZoneCard key={zone.id} zone={zone} />
        ))
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Loading safety zones from server...</Text>
        </View>
      )}

      <View style={styles.bottomDisclaimer}>
        <Text style={styles.disclaimerText}>
          SMART TOURIST SAFETY • DEMO GEO-FENCING ENGINE • EXPO SDK 58
        </Text>
      </View>
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
  permBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  permTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  permDesc: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 4,
    lineHeight: 16,
  },
  permButton: {
    backgroundColor: '#D97706',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  permButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  presetsGrid: {
    gap: 8,
    marginBottom: 20,
  },
  presetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetCardSelected: {
    borderColor: colors.secondary,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  presetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '800',
  },
  presetDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  presetCoords: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
  },
  bottomDisclaimer: {
    alignItems: 'center',
    marginTop: 24,
  },
  disclaimerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
});
