import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'appointment', title: 'Cita pendiente mañana', message: 'Tienes una cita con Juan Pérez a las 10:00', date: '2026-05-05', read: false },
    { id: '2', type: 'appointment', title: 'Recordatorio de cita', message: 'Cita en 2 horas con María García', date: '2026-05-05', read: false },
    { id: '3', type: 'system', title: 'Meta mensual', message: 'Has alcanzado el 75% de tu meta mensual', date: '2026-05-04', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <Text style={styles.headerSubtitle}>{unreadCount} sin leer</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[styles.card, notification.read ? styles.cardRead : styles.cardUnread]}
            onPress={() => {
              setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
              );
            }}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, notification.type === 'appointment' ? styles.iconAppointment : styles.iconSystem]}>
                <Ionicons
                  name={notification.type === 'appointment' ? 'calendar' : 'notifications'}
                  size={20}
                  color={notification.type === 'appointment' ? '#EA580C' : '#2563EB'}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.notificationTitle, notification.read ? styles.titleRead : styles.titleUnread]}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationDate}>{notification.date}</Text>
              </View>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
  },
  cardRead: {
    backgroundColor: '#fff',
    borderColor: '#F3F4F6',
  },
  cardUnread: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconAppointment: {
    backgroundColor: '#FFEDD5',
  },
  iconSystem: {
    backgroundColor: '#DBEAFE',
  },
  cardText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleRead: {
    color: '#111827',
  },
  titleUnread: {
    color: '#1E3A8A',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
});
