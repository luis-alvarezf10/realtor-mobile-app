import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { GradientBackground } from '../../../shared/components/GradientBackground';
import { useAuth } from '../../../shared/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

interface HomeAppointment {
  id: string;
  description: string | null;
  client_name: string | null;
  date: string;
  status: string | null;
  time: string | null;
  id_property?: string | null;
  properties?: {
    title: string | null;
    address: string | null;
  } | {
    title: string | null;
    address: string | null;
  }[] | null;
}

function todayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(time: string | null) {
  if (!time) return 'Sin hora';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function formatAppointmentDate(dateStr: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateStr === todayString()) return 'Hoy';
  if (dateStr === toDateString(tomorrow)) return 'Manana';

  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function getAppointmentDateTime(appointment: HomeAppointment) {
  const time = appointment.time || '23:59:59';
  return new Date(`${appointment.date}T${time}`);
}

function formatCountdown(target: Date, now: Date) {
  const totalSeconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [hideStats, setHideStats] = useState(false);
  const [appointments, setAppointments] = useState<HomeAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  const fetchUpcomingAppointments = useCallback(async () => {
    if (!user?.id) {
      setAppointments([]);
      setAppointmentsLoading(false);
      return;
    }

    setAppointmentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select(`
          id,
          description,
          client_name,
          date,
          status,
          time,
          id_property,
          properties (
            title,
            address
          )
        `)
        .eq('id_realtor', user.id)
        .gte('date', todayString())
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(8);

      if (error) throw error;
      setAppointments((data || []) as HomeAppointment[]);
    } catch (error) {
      console.error('Error fetching home appointments:', error);
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchUpcomingAppointments();
    }, [fetchUpcomingAppointments])
  );

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(appointment => getAppointmentDateTime(appointment).getTime() >= now.getTime())
      .sort((a, b) => getAppointmentDateTime(a).getTime() - getAppointmentDateTime(b).getTime());
  }, [appointments, now]);

  const nextAppointment = upcomingAppointments[0] || null;
  const nextAppointmentProperty = firstRelation(nextAppointment?.properties);

  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 0; i < 15; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      const dateStr = toDateString(nextDate);
      days.push({
        id: i.toString(),
        date: nextDate,
        dayName: dayNames[nextDate.getDay()],
        dayNumber: nextDate.getDate(),
        hasAppointment: upcomingAppointments.some(appointment => appointment.date === dateStr),
        isToday: i === 0,
      });
    }
    return days;
  }, [upcomingAppointments]);

  const getAppointmentIcon = (description: string | null) => {
    if (!description) return 'calendar-outline';
    const normalized = description.toLowerCase();
    if (normalized.includes('visita') || normalized.includes('ver')) return 'home-outline';
    if (normalized.includes('llamada') || normalized.includes('call')) return 'call-outline';
    if (normalized.includes('firma') || normalized.includes('contrato')) return 'create-outline';
    if (normalized.includes('reunion') || normalized.includes('meeting')) return 'people-outline';
    return 'calendar-outline';
  };

  return (
    <GradientBackground style={styles.container}>
      <ScreenHeader
        userName={user?.name || 'Agente'}
        companyName="Century 21"
        onNotifications={() => navigation.navigate('Notifications')}
        theme="dark"
      />
      <View style={styles.welcomeHeaderSection}>
        <View style={styles.welcomeCard}>
          <View className='flex flex-row gap-2 items-center'>
            <View style={styles.welcomeIconContainer}>
              <LinearGradient
                colors={['#FF383C80', '#99222480']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="flame-sharp" size={24} color="#FFF" />
            </View>
            <Text className='text-white text-xl'>
              Dicta tus movimientos
            </Text>
          </View>
          <View className='flex flex-row gap-6 items-center'>
            <TouchableOpacity
              style={styles.welcomeActionButton}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('Chat')}
              hitSlop={10}
              pressRetentionOffset={12}
              accessibilityRole="button"
              accessibilityLabel="Abrir Hunterito"
            >
              <Ionicons name="sparkles-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <View className='w-px h-6 bg-white/20' />
            <TouchableOpacity
              style={styles.welcomeActionButton}
              activeOpacity={0.75}
              onPress={() => setHideStats(prev => !prev)}
              hitSlop={10}
              pressRetentionOffset={12}
              accessibilityRole="button"
              accessibilityLabel={hideStats ? 'Mostrar estadisticas' : 'Ocultar estadisticas'}
            >
              <Ionicons name={hideStats ? 'eye-outline' : 'eye-off-outline'} size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Hola de nuevo! {user?.nickname || 'Agente'}</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.mainStatCard]}>
            <LinearGradient
              colors={['#FF383Ccc', '#992224cc']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <View style={styles.statCardHeader}>
              <View style={[styles.iconContainer, styles.mainIconContainer]}>
                <LinearGradient
                  colors={['#f8f8f8cc', '#f8f8f8cc']}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="layers" size={20} color="#FF383C" />
              </View>
              <Text style={[styles.statLabel, { color: 'rgba(255, 255, 255, 0.9)' }]} numberOfLines={2}>
                Total acumulado
              </Text>
            </View>
            <Text style={styles.statValue}>{hideStats ? '...' : '500'}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#FF383C80', '#99222480']}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="cube-sharp" size={20} color="#FFF" />
              </View>
              <Text style={styles.statLabel} numberOfLines={2}>
                Total este mes
              </Text>
            </View>
            <Text style={styles.statValue}>{hideStats ? '...' : '5'}</Text>
          </View>
        </View>

        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>Próximos días</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
            {calendarDays.map(day => (
              <TouchableOpacity key={day.id} style={[styles.dayCard, day.isToday && styles.todayCard]}>
                <Text style={[styles.dayName, day.isToday && styles.todayText]}>{day.dayName}</Text>
                <Text style={[styles.dayNumber, day.isToday && styles.todayText]}>{day.dayNumber}</Text>
                {day.hasAppointment && <View style={styles.appointmentDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.scheduleCard}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#FF383C80', '#99222480']}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="time-outline" size={20} color="#FFF" />
          </View>
          <View style={styles.nextAppointmentBody}>
            <View style={styles.nextAppointmentTopRow}>
              <Text className="text-white text-lg">Próxima cita en</Text>
              <Text className="text-amber-500 font-bold text-lg">
                {nextAppointment ? formatCountdown(getAppointmentDateTime(nextAppointment), now) : 'Sin citas'}
              </Text>
            </View>
            <View>
              <Text className="text-gray-300 text-sm" numberOfLines={2}>
                {nextAppointment
                  ? `${nextAppointmentProperty?.address || 'Sin direccion'} - ${nextAppointment.client_name || 'Sin cliente'}`
                  : 'No tienes citas proximas en tu agenda.'}
              </Text>
            </View>
          </View>
        </View>
        <View className='flex flex-col gap-4' style={{ marginBottom: 30}}>
          <Text style={styles.sectionTitle}>Recomendaciones del día</Text>
          <View style={styles.recommendationCard}>
            <View className='flex-1 flex-row gap-4 items-center'>
              <View>
                <Ionicons name="flash-outline" size={20} color="#BF2F32" />
              </View>
              <View className='flex-1'>
                <Text className="text-white text-lg">Alta probabilidad de cierre</Text>
                <Text className="text-gray-300 text-sm">Visita en Calle Falsa 123 - Carlos Perez</Text>
              </View>
            </View>
            <View className='items-center'>
              <Text className='text-lg text-amber-500 font-bold text-center bg-amber-500/20 rounded-full px-4'>85 %</Text>
              <Text className='uppercase text-xs text-gray-400'>Probabilidad</Text>
              <Text className='uppercase text-xs text-white'>De venta</Text>
            </View>
          </View>
          <View style={styles.recommendationCard}>
            <View className='flex-1 flex-row gap-4 items-center'>
              <View>
                <Ionicons name="call-outline" size={20} color="#BF2F32" />
              </View>
              <View className='flex-1'>
                <Text className="text-white text-lg">Recordatorio de cita</Text>
                <Text className="text-gray-300 text-sm">Carlos Perez en 2 horas</Text>
              </View>
            </View>
            <View className='items-center'>
              <Text className='text-lg text-amber-500 font-bold text-center bg-amber-500/20 rounded-full px-4'>85 %</Text>
              <Text className='uppercase text-xs text-gray-400'>Probabilidad</Text>
              <Text className='uppercase text-xs text-white'>De venta</Text>
            </View>
          </View>
          <View style={styles.recommendationCard}>
            <View className='flex-1 flex-row gap-4 items-center'>
              <View>
                <Ionicons name="trending-down-outline" size={20} color="#BF2F32" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg">Ajuste de precio sugerido</Text>
                <Text className="text-gray-300 text-sm">El precio actual está 10% por encima del mercado</Text>
              </View>
            </View>
            <View className='items-center'>
              <Text className='text-lg text-amber-500 font-bold text-center bg-amber-500/20 rounded-full px-4'>85 %</Text>
              <Text className='uppercase text-xs text-gray-400'>Probabilidad</Text>
              <Text className='uppercase text-xs text-white'>De venta</Text>
            </View>
          </View>
        </View>
        <View className='flex flex-col gap-4'>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

        </View>
      </ScrollView>
      <LinearGradient
        colors={['transparent', '#000000']}
        locations={[0, 0.7]}
        style={styles.bottomFade}
        pointerEvents="none"
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 25,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  subGreeting: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'space-between',
  },
  mainStatCard: {
    borderColor: '#FF383C80',
    shadowColor: '#FF383C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FF383C80',
    borderWidth: 1,
    overflow: 'hidden',
  },
  mainIconContainer: {
    borderWidth: 0,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  statLabel: {
    flex: 1,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  // yo
  welcomeHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 7,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  welcomeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FF383C80',
    borderWidth: 1,
    overflow: 'hidden',
  },
  welcomeActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Calendar styles
  calendarSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  calendarHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d1d1ff',
    textTransform: 'uppercase',
  },
  calendarScroll: {
    paddingRight: 20,
    gap: 12,
  },
  dayCard: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  todayCard: {
    borderColor: '#FF383C80',
    backgroundColor: 'rgba(255, 56, 60, 0.1)',
  },
  dayName: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    marginBottom: 2,
    textAlign: 'center',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  todayText: {
    color: '#FFF',
    fontWeight: '800',
  },
  appointmentDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 20,
    backgroundColor: '#FF383C',
  },
  scheduleCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FF383C80',
    backgroundColor: 'rgba(255, 56, 60, 0.1)',
    display: "flex",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 12,
    marginBottom: 30,
  },
  nextAppointmentBody: {
    flex: 1,
    minWidth: 0,
  },
  nextAppointmentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleSection: {
    marginBottom: 30,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scheduleLink: {
    color: '#FF6B57',
    fontSize: 12,
    fontWeight: '800',
  },
  scheduleScroll: {
    gap: 12,
    paddingRight: 20,
  },
  scheduleLoadingCard: {
    minHeight: 118,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scheduleLoadingText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyScheduleCard: {
    minHeight: 118,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FF383C80',
    backgroundColor: 'rgba(255, 56, 60, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  emptyScheduleTextWrap: {
    flex: 1,
  },
  emptyScheduleTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyScheduleText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 3,
  },
  appointmentPreviewCard: {
    width: 220,
    minHeight: 138,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    padding: 12,
  },
  appointmentPreviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  appointmentDateBadge: {
    alignItems: 'flex-end',
  },
  appointmentDateText: {
    color: '#FF6B57',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  appointmentTimeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  appointmentPreviewTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  appointmentClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  appointmentClientText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '700',
  },
  appointmentStatus: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 9,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  recommendationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    padding: 10,
    display: "flex",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between"
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
});
