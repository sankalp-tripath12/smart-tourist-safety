import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import colors from '../constants/colors';
import AppHeader from '../components/AppHeader';
import { getHealth, API_BASE_URL, setApiBaseUrl, getTourists } from '../services/api';

export default function ProfileScreen() {
  const [tourist, setTourist] = useState(null);
  const [serverStatus, setServerStatus] = useState('Checking...');
  const [customUrl, setCustomUrl] = useState(API_BASE_URL);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    checkBackend();
    loadProfile();
  }, []);

  const checkBackend = async () => {
    setTestingConnection(true);
    try {
      const res = await getHealth();
      setServerStatus(`Online (${res.message})`);
    } catch (err) {
      setServerStatus(`Offline: ${err.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await getTourists();
      if (res?.data && res.data.length > 0) {
        setTourist(res.data[0]);
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveApiUrl = () => {
    if (!customUrl.trim()) return;
    setApiBaseUrl(customUrl.trim());
    Alert.alert('API URL Updated', `New endpoint: ${customUrl.trim()}`);
    checkBackend();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppHeader
        title="Tourist Profile"
        subtitle="Travel identity, backend config & project architecture"
      />

      {/* Tourist Profile Card */}
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {tourist?.fullName ? tourist.fullName.charAt(0) : 'T'}
            </Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>
              {tourist?.fullName || 'Demo Tourist'}
            </Text>
            <Text style={styles.profileCode}>
              {tourist?.touristCode || 'TST-2026-DEMO-001'}
            </Text>
          </View>
        </View>

        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>PHONE NUMBER</Text>
            <Text style={styles.infoValue}>{tourist?.phone || '9876543210'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>EMAIL</Text>
            <Text style={styles.infoValue}>
              {tourist?.email || 'aarav.demo@example.com'}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>EMERGENCY CONTACT</Text>
            <Text style={styles.infoValue}>
              {tourist?.emergencyContactName || 'Raj Sharma'} (
              {tourist?.emergencyContactPhone || '9876501234'})
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>ITINERARY CORRIDOR</Text>
            <Text style={styles.infoValue}>
              {tourist?.itinerary || 'Delhi to Jaipur to Agra'}
            </Text>
          </View>
        </View>
      </View>

      {/* Backend API Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend Server Configuration</Text>
        <Text style={styles.cardSub}>
          Configure Node.js/Express API address for local or LAN Expo Go testing
        </Text>

        <Text style={styles.fieldLabel}>API Base URL:</Text>
        <TextInput
          style={styles.input}
          value={customUrl}
          onChangeText={setCustomUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.buttonRow}>
          <Pressable style={styles.saveBtn} onPress={handleSaveApiUrl}>
            <Text style={styles.saveBtnText}>Save & Apply</Text>
          </Pressable>

          <Pressable
            style={styles.testBtn}
            disabled={testingConnection}
            onPress={checkBackend}
          >
            {testingConnection ? (
              <ActivityIndicator size="small" color={colors.secondary} />
            ) : (
              <Text style={styles.testBtnText}>Test Connection</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>SERVER HEALTH:</Text>
          <Text
            style={[
              styles.statusValue,
              serverStatus.includes('Online')
                ? styles.statusOnline
                : styles.statusOffline,
            ]}
          >
            {serverStatus}
          </Text>
        </View>
      </View>

      {/* Project Architecture & Disclaimers */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Academic Project Disclaimers</Text>
        <Text style={styles.disclaimerItem}>
          • <Text style={styles.bold}>Rule-Based Anomaly Detection:</Text> Evaluates explainable thresholds (inactivity, speed spikes, corridor deviation, danger zones). Not a trained black-box neural network.
        </Text>
        <Text style={styles.disclaimerItem}>
          • <Text style={styles.bold}>Simulated Emergency SOS:</Text> Dispatches incidents to local SQLite database for demonstration. Not connected to police, 112, or municipal emergency services.
        </Text>
        <Text style={styles.disclaimerItem}>
          • <Text style={styles.bold}>Demo Geo-Fencing:</Text> Safety zones (Amer Fort, Aravalli Ridge, Riverbank) use demonstration coordinates in Jaipur, not official government danger classifications.
        </Text>
        <Text style={styles.disclaimerItem}>
          • <Text style={styles.bold}>Foreground Location Priority:</Text> Respects privacy and Expo Go platform boundaries by monitoring GPS only during active foreground usage.
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DCEFEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.secondary,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  profileCode: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  infoList: {
    gap: 10,
  },
  infoItem: {
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 12,
    lineHeight: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  testBtn: {
    flex: 1,
    backgroundColor: '#E6F3F1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  testBtnText: {
    color: colors.secondary,
    fontWeight: '800',
    fontSize: 12,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
  },
  statusValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusOnline: {
    color: colors.success,
  },
  statusOffline: {
    color: colors.danger,
  },
  disclaimerItem: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '800',
    color: colors.primary,
  },
});
