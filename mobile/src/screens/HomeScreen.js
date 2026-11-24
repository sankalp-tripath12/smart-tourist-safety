import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import colors from '../constants/colors';
import SafetyScoreCard from '../components/SafetyScoreCard';
import LocationCard from '../components/LocationCard';
import SosModal from '../components/SosModal';
import {
  getTourists,
  getSafetyScore,
  getSafetyZones,
  getTouristAnomalies,
} from '../services/api';
import { getCurrentCoordinates, checkLocationPermissions } from '../services/locationService';
import { evaluateLocalGeoFences } from '../services/geoFenceService';
import { t, subscribeLanguageChange } from '../i18n';

export default function HomeScreen({ navigation }) {
  const [tourist, setTourist] = useState(null);
  const [showIdDetails, setShowIdDetails] = useState(false);
  const [coordinates, setCoordinates] = useState({
    latitude: 26.9855,
    longitude: 75.8513,
    accuracy: 10,
    isSimulated: false,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [safetyScoreData, setSafetyScoreData] = useState(null);
  const [activeZone, setActiveZone] = useState(null);
  const [, setRecentAlerts] = useState([]);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [, setLoading] = useState(true);
  const [, setLangTick] = useState(0);

  useEffect(() => {
    loadDashboard();
    const unsub = subscribeLanguageChange(() => setLangTick((k) => k + 1));
    return unsub;
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch tourist
      let currentTourist = null;
      const touristRes = await getTourists();
      if (touristRes?.data && touristRes.data.length > 0) {
        currentTourist = touristRes.data[0];
        setTourist(currentTourist);
      }

      // 2. Check location permissions
      const perm = await checkLocationPermissions();
      setPermissionGranted(perm.granted);

      // 3. Fetch zones & evaluate current proximity
      const zonesRes = await getSafetyZones();
      const zones = zonesRes?.data || [];
      const geoEval = evaluateLocalGeoFences(coordinates.latitude, coordinates.longitude, zones);
      if (geoEval.insideZones.length > 0) {
        setActiveZone(geoEval.insideZones[0]);
      } else if (geoEval.nearestZone) {
        setActiveZone(geoEval.nearestZone);
      }

      // 4. Fetch safety score & alerts
      if (currentTourist?.id) {
        const [scoreRes, alertRes] = await Promise.all([
          getSafetyScore(currentTourist.id, coordinates.latitude, coordinates.longitude),
          getTouristAnomalies(currentTourist.id),
        ]);
        if (scoreRes?.data) setSafetyScoreData(scoreRes.data);
        if (alertRes?.data) setRecentAlerts(alertRes.data);
      }
    } catch (err) {
      console.log('Dashboard load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLocation = async () => {
    setLocLoading(true);
    try {
      const coords = await getCurrentCoordinates();
      setCoordinates(coords);
      setPermissionGranted(true);

      const zonesRes = await getSafetyZones();
      const zones = zonesRes?.data || [];
      const geoEval = evaluateLocalGeoFences(coords.latitude, coords.longitude, zones);
      setActiveZone(geoEval.insideZones[0] || geoEval.nearestZone);

      if (tourist?.id) {
        const scoreRes = await getSafetyScore(tourist.id, coords.latitude, coords.longitude);
        if (scoreRes?.data) setSafetyScoreData(scoreRes.data);
      }
    } catch (err) {
      Alert.alert('Location Update', err.message);
    } finally {
      setLocLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7FB" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{t('app_name')}</Text>
            <Text style={styles.heading}>{t('dashboard')}</Text>
          </View>

          <Pressable style={styles.profile} onPress={() => navigation?.navigate('Profile')}>
            <Text style={styles.profileText}>
              {tourist?.fullName ? tourist.fullName.charAt(0) : 'T'}
            </Text>
          </Pressable>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeTitle}>
            {t('welcome')}, {tourist?.fullName || 'Valued Tourist'}!
          </Text>
          <Text style={styles.subtitle}>
            {t('welcome_sub')}
          </Text>
        </View>

        {/* Live Safety Score Engine Component */}
        <SafetyScoreCard scoreData={safetyScoreData} />

        {/* Live GPS Location Summary Card */}
        <LocationCard
          coordinates={coordinates}
          loading={locLoading}
          permissionGranted={permissionGranted}
          onRefresh={handleRefreshLocation}
          onPickPreset={() => navigation?.navigate('Location')}
        />

        {/* Digital Tourist ID Section */}
        <Text style={styles.sectionTitle}>{t('digital_id')}</Text>

        <View style={styles.idCard}>
          <View style={styles.idHeader}>
            <Text style={styles.idHeaderText}>{t('verified_id')}</Text>
            <Text style={styles.idIcon}>✦</Text>
          </View>

          <Text style={styles.idNumber}>
            {tourist?.touristCode || 'TST-2026-DEMO-001'}
          </Text>
          <Text style={styles.idNote}>
            {tourist?.fullName || 'Demo Tourist'} •{' '}
            {tourist?.itinerary || 'Golden Triangle Corridor'}
          </Text>

          <Pressable
            style={styles.idButton}
            onPress={() => setShowIdDetails(!showIdDetails)}
          >
            <Text style={styles.idButtonText}>
              {showIdDetails ? t('hide_id_details') : t('view_id_details')}
            </Text>
          </Pressable>

          {showIdDetails && (
            <View style={styles.idDetails}>
              <Text style={styles.detailText}>
                <Text style={styles.detailBold}>{t('holder_name')}:</Text>{' '}
                {tourist?.fullName || 'Aarav Sharma'}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailBold}>{t('primary_phone')}:</Text>{' '}
                {tourist?.phone || '9876543210'}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailBold}>{t('emergency_contact')}:</Text>{' '}
                {tourist?.emergencyContactName || 'Raj Sharma'} (
                {tourist?.emergencyContactPhone || '9876501234'})
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailBold}>{t('pass_expiry')}:</Text>{' '}
                {tourist?.visitExpiry
                  ? new Date(tourist.visitExpiry).toLocaleDateString()
                  : 'Dec 31, 2027'}
              </Text>
            </View>
          )}
        </View>

        {/* Geo-Fence Status Banner */}
        {activeZone && (
          <View style={styles.zoneBanner}>
            <View style={styles.zoneBannerTop}>
              <Text style={styles.zoneBannerLabel}>PROXIMITY STATUS</Text>
              <View
                style={[
                  styles.zoneBadge,
                  {
                    backgroundColor:
                      activeZone.riskLevel === 'DANGER'
                        ? '#FEE2E2'
                        : activeZone.riskLevel === 'CAUTION'
                        ? '#FEF3C7'
                        : '#E6F4EA',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.zoneBadgeText,
                    {
                      color:
                        activeZone.riskLevel === 'DANGER'
                          ? colors.danger
                          : activeZone.riskLevel === 'CAUTION'
                          ? '#D97706'
                          : colors.secondary,
                    },
                  ]}
                >
                  {activeZone.riskLevel}
                </Text>
              </View>
            </View>
            <Text style={styles.zoneName}>{activeZone.name}</Text>
            <Text style={styles.zoneDesc}>
              {activeZone.isInside
                ? '● You are currently INSIDE this perimeter.'
                : `Nearest designated zone (~${activeZone.distanceMeters || '250'}m away).`}
            </Text>
          </View>
        )}

        {/* Safety Navigation Grid */}
        <Text style={styles.sectionTitle}>{t('services_title')}</Text>

        <View style={styles.services}>
          <Pressable
            style={styles.serviceCard}
            onPress={() => navigation?.navigate('Location')}
          >
            <Text style={styles.serviceIcon}>⌖</Text>
            <Text style={styles.serviceTitle}>{t('service_location')}</Text>
            <Text style={styles.serviceDescription}>
              {t('service_location_sub')}
            </Text>
          </Pressable>

          <Pressable
            style={styles.serviceCard}
            onPress={() => navigation?.navigate('Safety')}
          >
            <Text style={styles.serviceIcon}>◎</Text>
            <Text style={styles.serviceTitle}>{t('service_safety')}</Text>
            <Text style={styles.serviceDescription}>
              {t('service_safety_sub')}
            </Text>
          </Pressable>

          <Pressable
            style={styles.serviceCard}
            onPress={() => navigation?.navigate('Incidents')}
          >
            <Text style={styles.serviceIcon}>◈</Text>
            <Text style={styles.serviceTitle}>{t('service_incidents')}</Text>
            <Text style={styles.serviceDescription}>
              {t('service_incidents_sub')}
            </Text>
          </Pressable>

          <Pressable
            style={styles.serviceCard}
            onPress={() => navigation?.navigate('Tourist ID')}
          >
            <Text style={styles.serviceIcon}>▣</Text>
            <Text style={styles.serviceTitle}>{t('service_digital_id')}</Text>
            <Text style={styles.serviceDescription}>
              {t('service_digital_id_sub')}
            </Text>
          </Pressable>
        </View>

        {/* SOS Button */}
        <Pressable
          style={styles.sosButton}
          onPress={() => setSosModalVisible(true)}
        >
          <Text style={styles.sosTitle}>{t('sos_button_title')}</Text>
          <Text style={styles.sosSubtitle}>
            {t('sos_button_sub')}
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          SMART TOURIST SAFETY • COLLEGE MVP DEMO • DAY 3 INTEGRATED
        </Text>
      </ScrollView>

      {/* SOS Modal */}
      <SosModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
        tourist={tourist}
        coordinates={coordinates}
        onSosSuccess={() => loadDashboard()}
      />
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
    marginTop: 24,
    marginBottom: 18,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172B4D',
  },
  subtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 5,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#172B4D',
    marginBottom: 12,
    marginTop: 8,
  },
  idCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
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
    fontSize: 18,
  },
  idNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172B4D',
    marginTop: 12,
  },
  idNote: {
    color: '#8290A2',
    fontSize: 12,
    marginTop: 4,
  },
  idButton: {
    backgroundColor: '#E6F3F1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  idButtonText: {
    color: '#147D78',
    fontWeight: '700',
    fontSize: 12,
  },
  idDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E8EDF2',
    marginTop: 12,
    paddingTop: 10,
    gap: 6,
  },
  detailText: {
    color: '#526276',
    fontSize: 12,
  },
  detailBold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  zoneBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  zoneBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1,
  },
  zoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  zoneBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  zoneName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
  },
  zoneDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 20,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EDF2',
  },
  serviceIcon: {
    fontSize: 22,
    color: '#147D78',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#243B53',
  },
  serviceDescription: {
    fontSize: 10,
    color: '#8290A2',
    marginTop: 3,
  },
  sosButton: {
    backgroundColor: '#B83240',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  sosTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  sosSubtitle: {
    color: '#FBE3E5',
    fontSize: 11,
    marginTop: 4,
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
