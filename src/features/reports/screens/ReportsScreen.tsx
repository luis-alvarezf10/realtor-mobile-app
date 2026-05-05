import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function ReportsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Estadísticas y Reportes</Text>

        {/* Sales Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ventas Realizadas</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Este mes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statBlue]}>48</Text>
              <Text style={styles.statLabel}>Total año</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statPurple]}>$2.4M</Text>
              <Text style={styles.statLabel}>Volumen</Text>
            </View>
          </View>
        </View>

        {/* Appointments Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Citas Realizadas</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statOrange]}>8</Text>
              <Text style={styles.statLabel}>Esta semana</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statIndigo]}>35</Text>
              <Text style={styles.statLabel}>Este mes</Text>
            </View>
          </View>
        </View>

        {/* Conversion Rate */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tasa de Conversión</Text>
          <View style={styles.conversionContainer}>
            <Text style={[styles.statValue, styles.statGreen, styles.conversionText]}>24%</Text>
            <Text style={styles.conversionLabel}>Citas convertidas en ventas</Text>
          </View>
        </View>

        {/* Admin View - Company Stats */}
        <View style={[styles.card, styles.adminCard]}>
          <View style={styles.adminHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#2563EB" />
            <Text style={styles.adminTitle}>Vista Administrador</Text>
          </View>
          <Text style={styles.adminText}>• Total asesores activos: 15</Text>
          <Text style={styles.adminText}>• Ventas del equipo: 180</Text>
          <Text style={styles.adminText}>• Meta mensual: 75% cumplida</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statBlue: {
    color: '#2563EB',
  },
  statPurple: {
    color: '#7C3AED',
  },
  statOrange: {
    color: '#EA580C',
  },
  statIndigo: {
    color: '#4F46E5',
  },
  statGreen: {
    color: '#16A34A',
  },
  statLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  conversionContainer: {
    alignItems: 'center',
  },
  conversionText: {
    fontSize: 48,
  },
  conversionLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
  },
  adminCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
    marginLeft: 8,
  },
  adminText: {
    fontSize: 14,
    color: '#1D4ED8',
    marginBottom: 8,
  },
});
