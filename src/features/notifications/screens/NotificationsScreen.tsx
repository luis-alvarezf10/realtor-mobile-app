import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { GradientBackground } from '../../../shared/components/GradientBackground';

export function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'appointment', title: 'Cita pendiente mañana', message: 'Tienes una cita con Juan Pérez a las 10:00', date: '2026-05-05', read: false },
    { id: '2', type: 'appointment', title: 'Recordatorio de cita', message: 'Cita en 2 horas con María García', date: '2026-05-05', read: false },
    { id: '3', type: 'system', title: 'Meta mensual', message: 'Has alcanzado el 75% de tu meta mensual', date: '2026-05-04', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <GradientBackground>
    <View style={styles.container}>
      <ScreenHeader title="Notificaciones" subtitle={`${unreadCount} sin leer`} onBack={() => navigation.goBack()} theme="dark" />

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
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardRead: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardUnread: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderColor: 'rgba(37, 99, 235, 0.3)',
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
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
  },
  iconSystem: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  cardText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleRead: {
    color: '#fff',
  },
  titleUnread: {
    color: '#93C5FD',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#D1D5DB',
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
    backgroundColor: '#3B82F6',
  },
});
