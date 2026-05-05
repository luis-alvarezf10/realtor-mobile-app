import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AppointmentsScreen({ navigation }: any) {
  const appointments = [
    { id: '1', client: 'Juan Pérez', property: 'Casa en Zona Norte', date: '2026-05-06', time: '10:00', status: 'pending' },
    { id: '2', client: 'María García', property: 'Departamento Centro', date: '2026-05-07', time: '14:00', status: 'confirmed' },
    { id: '3', client: 'Carlos López', property: 'Local Comercial', date: '2026-05-08', time: '16:00', status: 'pending' },
  ];

  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Citas Agendadas</Text>
        <Text style={styles.headerSubtitle}>Tienes {pendingCount} citas pendientes esta semana</Text>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LocationTracking', { propertyLocation: { name: item.property } })}>
            <View style={styles.cardContent}>
              <View style={styles.cardText}>
                <Text style={styles.clientName}>{item.client}</Text>
                <Text style={styles.propertyName}>{item.property}</Text>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{item.date}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{item.time}</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.statusBadge, item.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending]}>
                <Text style={[styles.statusText, item.status === 'confirmed' ? styles.statusTextConfirmed : styles.statusTextPending]}>
                  {item.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardText: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  propertyName: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusConfirmed: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextConfirmed: {
    color: '#047857',
  },
  statusTextPending: {
    color: '#B45309',
  },
});
