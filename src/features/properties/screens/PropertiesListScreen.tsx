import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

export function PropertiesListScreen({ navigation }: any) {
  const properties = [
    { id: '1', title: 'Casa en Zona Norte', price: '$250,000', status: 'Disponible' },
    { id: '2', title: 'Departamento Centro', price: '$180,000', status: 'Reservado' },
    { id: '3', title: 'Local Comercial', price: '$320,000', status: 'Disponible' },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Propiedades" onNotifications={() => navigation.navigate('Notifications')} />

      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.cardText}>
                <Text style={styles.propertyTitle}>{item.title}</Text>
                <Text style={styles.propertyPrice}>{item.price}</Text>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, item.status === 'Disponible' ? styles.statusAvailable : styles.statusReserved]} />
                  <Text style={[styles.statusText, item.status === 'Disponible' ? styles.statusTextAvailable : styles.statusTextReserved]}>{item.status}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
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
    backgroundColor: '#F9FAF9',
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
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  propertyPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusAvailable: {
    backgroundColor: '#10B981',
  },
  statusReserved: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextAvailable: {
    color: '#047857',
  },
  statusTextReserved: {
    color: '#B45309',
  },
});
