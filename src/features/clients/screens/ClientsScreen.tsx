import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function ClientsScreen() {
  const clients = [
    { id: '1', name: 'Juan Pérez', email: 'juan@email.com', phone: '+54 11 1234-5678', properties: 2 },
    { id: '2', name: 'María García', email: 'maria@email.com', phone: '+54 11 8765-4321', properties: 1 },
    { id: '3', name: 'Carlos López', email: 'carlos@email.com', phone: '+54 11 5555-9999', properties: 3 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Clientes</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{item.name}</Text>
                <Text style={styles.clientDetail}>{item.email}</Text>
                <Text style={styles.clientDetail}>{item.phone}</Text>
              </View>
              <View style={styles.stats}>
                <Text style={styles.statsNumber}>{item.properties}</Text>
                <Text style={styles.statsLabel}>propiedades</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
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
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  clientInfo: {
    marginLeft: 12,
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  clientDetail: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  stats: {
    alignItems: 'flex-end',
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
  },
  statsLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
});
