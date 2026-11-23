import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import colors from '../constants/colors';
import { triggerSos } from '../services/api';

export default function SosModal({
  visible,
  onClose,
  tourist,
  coordinates,
  onSosSuccess,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [incidentResult, setIncidentResult] = useState(null);

  const handleActivateSos = async () => {
    if (!tourist?.id) {
      Alert.alert(
        'Tourist Record Required',
        'Please register or select a valid Tourist ID before activating SOS.'
      );
      return;
    }

    const lat = coordinates?.latitude || 26.9855;
    const lon = coordinates?.longitude || 75.8513;

    try {
      setSubmitting(true);
      const res = await triggerSos({
        touristId: tourist.id,
        latitude: lat,
        longitude: lon,
        description: `Emergency SOS triggered by ${tourist.fullName || 'Tourist'}.`,
      });

      setIncidentResult(res.data);
      if (onSosSuccess) {
        onSosSuccess(res.data);
      }
    } catch (error) {
      Alert.alert('SOS Trigger Failed', error.message || 'Unable to record SOS incident.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setConfirmed(false);
    setIncidentResult(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleReset}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {incidentResult ? (
            /* SUCCESS STATE */
            <View style={styles.successContainer}>
              <View style={styles.successIconBox}>
                <Text style={styles.successCheck}>✓</Text>
              </View>

              <Text style={styles.successTitle}>SOS Incident Transmitted</Text>
              <Text style={styles.successRef}>
                REFERENCE: {incidentResult.referenceCode || incidentResult.id}
              </Text>

              <View style={styles.detailsBox}>
                <Text style={styles.detailLine}>
                  <Text style={styles.detailBold}>Tourist:</Text> {tourist?.fullName} (
                  {tourist?.touristCode})
                </Text>
                <Text style={styles.detailLine}>
                  <Text style={styles.detailBold}>Status:</Text>{' '}
                  <Text style={{ color: colors.danger, fontWeight: '800' }}>
                    {incidentResult.status}
                  </Text>
                </Text>
                <Text style={styles.detailLine}>
                  <Text style={styles.detailBold}>Coordinates:</Text> [
                  {incidentResult.latitude?.toFixed(4)},{' '}
                  {incidentResult.longitude?.toFixed(4)}]
                </Text>
                <Text style={styles.detailLine}>
                  <Text style={styles.detailBold}>Logged At:</Text>{' '}
                  {new Date(incidentResult.createdAt).toLocaleTimeString()}
                </Text>
              </View>

              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>
                  ℹ MVP SIMULATION NOTICE: This is an educational project demo incident recorded in SQLite. No real police, ambulance, or government dispatch has been notified.
                </Text>
              </View>

              <Pressable style={styles.doneButton} onPress={handleReset}>
                <Text style={styles.doneButtonText}>Return to Dashboard</Text>
              </Pressable>
            </View>
          ) : (
            /* CONFIRMATION WORKFLOW */
            <View>
              <View style={styles.header}>
                <Text style={styles.warningIcon}>🚨</Text>
                <Text style={styles.title}>EMERGENCY SOS ACTIVATION</Text>
              </View>

              <Text style={styles.subtitle}>
                You are about to transmit a high-priority emergency incident to the incident response backend.
              </Text>

              {/* Coordinates Preview */}
              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>TRANSMITTING LOCATION:</Text>
                <Text style={styles.previewCoords}>
                  Latitude: {coordinates?.latitude ? coordinates.latitude.toFixed(5) : '26.9855'}° N{'\n'}
                  Longitude: {coordinates?.longitude ? coordinates.longitude.toFixed(5) : '75.8513'}° E
                </Text>
                <Text style={styles.previewTourist}>
                  Tourist ID: {tourist?.touristCode || 'TST-DEMO-001'} ({tourist?.fullName || 'Demo Tourist'})
                </Text>
              </View>

              {/* Two-step safety switch */}
              <Pressable
                style={[
                  styles.checkboxRow,
                  confirmed && styles.checkboxRowActive,
                ]}
                onPress={() => setConfirmed(!confirmed)}
              >
                <View style={[styles.checkbox, confirmed && styles.checkboxActive]}>
                  {confirmed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I confirm this is an emergency activation and want to log an urgent incident.
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.sosSubmitButton,
                  !confirmed && styles.sosButtonDisabled,
                ]}
                disabled={!confirmed || submitting}
                onPress={handleActivateSos}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.sosSubmitText}>CONFIRM & BROADCAST SOS</Text>
                    <Text style={styles.sosSubmitSub}>Tap to transmit incident</Text>
                  </>
                )}
              </Pressable>

              <Pressable style={styles.cancelButton} onPress={handleReset}>
                <Text style={styles.cancelButtonText}>Cancel / False Alarm</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  warningIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.danger,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
    marginBottom: 4,
  },
  previewCoords: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 18,
  },
  previewTourist: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7D7',
    marginBottom: 16,
    gap: 10,
  },
  checkboxRowActive: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.danger,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 16,
  },
  sosSubmitButton: {
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  sosSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sosSubmitSub: {
    color: '#FEE2E2',
    fontSize: 11,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  // Success styles
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  successCheck: {
    fontSize: 32,
    color: '#137333',
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  successRef: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 4,
    letterSpacing: 1,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 16,
    gap: 6,
  },
  detailLine: {
    fontSize: 12,
    color: '#334155',
  },
  detailBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  disclaimerBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 10,
    color: '#92400E',
    lineHeight: 14,
  },
  doneButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
