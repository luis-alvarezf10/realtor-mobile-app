import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../shared/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { GradientBackground } from '../../../shared/components/GradientBackground';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface Appointment {
  id: string;
  description: string | null;
  client_name: string | null;
  date: string;
  status: string | null;
  time: string | null;
  id_property?: string | null;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function todayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function AgendaScreen({ navigation }: any) {
  const { user } = useAuth();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select('id, description, client_name, date, status, time, id_property')
        .eq('id_realtor', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setAppointments((data || []) as Appointment[]);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarDays = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter((appointment) => appointment.date === dateStr);
  };

  const hasAppointments = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return getAppointmentsForDate(dateStr).length > 0;
  };

  const isPastDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr < todayString();
  };

  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === parseInt(selectedDate.split('-')[2], 10) &&
      selectedDate.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
  };

  const selectedDayAppointments = getAppointmentsForDate(selectedDate);
  const monthAppointments = appointments.filter((appointment) =>
    appointment.date?.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)
  );
  const upcomingAppointments = appointments
    .filter((appointment) => appointment.date >= todayString())
    .sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`));
  const nextAppointment = upcomingAppointments[0] || null;

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectDay = (day: number) => {
    setSelectedDate(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  };

  const openAddAppointment = () => {
    navigation.navigate('AddAppointment', { date: selectedDate });
  };

  const getAppointmentIcon = (description: string | null) => {
    if (!description) return 'calendar-outline';
    const desc = description.toLowerCase();
    if (desc.includes('visita') || desc.includes('ver')) return 'home-outline';
    if (desc.includes('firma') || desc.includes('contrato')) return 'create-outline';
    if (desc.includes('llamada') || desc.includes('call')) return 'call-outline';
    if (desc.includes('reunion') || desc.includes('meeting')) return 'people-outline';
    return 'calendar-outline';
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const formatShortDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <ScreenHeader title="Agenda" onNotifications={() => navigation.navigate('Notifications')} theme="dark" />

        <View style={styles.topBar}>
          <View style={styles.monthContext}>
            <Text style={styles.monthContextLabel}>Mes activo</Text>
            <Text style={styles.monthContextTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
          </View>
          <View style={styles.compactStat}>
            <Text style={styles.compactStatValue}>{monthAppointments.length}</Text>
            <Text style={styles.compactStatLabel}>mes</Text>
          </View>
          <View style={styles.compactStat}>
            <Text style={styles.compactStatValue}>{selectedDayAppointments.length}</Text>
            <Text style={styles.compactStatLabel}>dia</Text>
          </View>
        </View>

        <View style={styles.compactStats}>
          <View style={styles.compactNext}>
            <Ionicons name="alarm-outline" size={16} color="#cc2d19" />
            <Text className='text-amber-500 font-bold'>Próxima cita</Text>
            <Text style={styles.compactNextText} numberOfLines={1}>
              {nextAppointment ? `${formatShortDate(nextAppointment.date)} ${formatTime(nextAppointment.time)}` : 'Sin proxima cita'}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.calendarCard}>
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.monthArrow}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.monthArrow}>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {DAYS.map((day) => (
                <Text key={day} style={styles.weekDayLabel}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((day, index) => {
                if (day === null) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const hasAppt = hasAppointments(day);
                const past = isPastDay(day);
                const todayDay = isToday(day);
                const selected = isSelected(day);

                return (
                  <TouchableOpacity key={day} style={styles.dayCell} onPress={() => selectDay(day)} activeOpacity={0.75}>
                    <View style={[
                      styles.dayInner,
                      selected && styles.dayInnerSelected,
                      todayDay && !selected && styles.dayInnerToday,
                    ]}>
                      <Text style={[
                        styles.dayText,
                        selected && styles.dayTextSelected,
                        todayDay && !selected && styles.dayTextToday,
                        past && !selected && !todayDay && styles.dayTextPast,
                      ]}>
                        {day}
                      </Text>
                    </View>
                    <View style={styles.dayDotContainer}>
                      {hasAppt && <View style={[styles.dayDot, selected ? styles.dayDotSelected : past ? styles.dayDotPast : styles.dayDotFuture]} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => navigation.navigate('AllAppointments')} activeOpacity={0.85}>
              <Ionicons name="list" size={18} color="#cc2d19" />
              <Text style={styles.viewAllText}>Ver todas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={openAddAppointment} activeOpacity={0.85}>
              <Ionicons name="calendar" size={18} color="#fff" />
              <Text style={styles.createButtonText}>Agregar cita</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.appointmentsSection}>
            <View style={styles.appointmentsHeader}>
              <View>
                <Text style={styles.appointmentsLabel}>Citas del dia</Text>
                <Text style={styles.appointmentsDate}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color="#cc2d19" />
                <Text style={styles.emptyText}>Cargando...</Text>
              </View>
            ) : selectedDayAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="calendar-outline" size={30} color="#cc2d19" />
                </View>
                <Text style={styles.emptyText}>No hay citas para este dia</Text>
                <Text style={styles.emptySubtext}>Agenda una visita, llamada o seguimiento para esta fecha.</Text>
                <TouchableOpacity style={styles.emptyAction} onPress={openAddAppointment}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.emptyActionText}>Agregar cita</Text>
                </TouchableOpacity>
              </View>
            ) : (
              selectedDayAppointments.map((item, index) => (
                <TouchableOpacity key={item.id} style={styles.appointmentCard} activeOpacity={0.85}>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot} />
                    {index < selectedDayAppointments.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.appointmentContent}>
                    <View style={styles.appointmentTopRow}>
                      <View style={[styles.appointmentTimeBadge, item.status === 'Realizada' && styles.badgeConfirmed]}>
                        <Text style={styles.appointmentTime}>{formatTime(item.time) || 'Sin hora'}</Text>
                      </View>
                    </View>
                    <Text style={styles.appointmentTitle}>{item.description || 'Cita'}</Text>
                    <View style={styles.appointmentMeta}>
                      <Ionicons name="person-outline" size={14} color="#9CA3AF" />
                      <Text style={styles.appointmentClient}>{item.client_name || 'Sin cliente'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
    gap: 4
  },
  monthContext: {
    flex: 1,
  },
  monthContextLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  monthContextTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  addSmallButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#cc2d19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  compactStat: {
    width: 66,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  compactStatValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  compactStatLabel: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  compactNext: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(204, 45, 25, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 45, 25, 0.22)',
  },
  compactNextText: {
    flex: 1,
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '800',
  },
  calendarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    height: 58,
    justifyContent: 'flex-start',
    paddingTop: 3,
  },
  dayInner: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  dayInnerSelected: {
    backgroundColor: '#cc2d19',
  },
  dayInnerToday: {
    borderWidth: 2,
    borderColor: '#cc2d19',
    backgroundColor: 'rgba(204, 45, 25, 0.12)',
  },
  dayText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '900',
  },
  dayTextToday: {
    color: '#fff',
    fontWeight: '900',
  },
  dayTextPast: {
    color: '#6B7280',
  },
  dayDotContainer: {
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dayDotFuture: {
    backgroundColor: '#cc2d19',
  },
  dayDotPast: {
    backgroundColor: '#6B7280',
  },
  dayDotSelected: {
    backgroundColor: '#fff',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  viewAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#cc2d19',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#cc2d19',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  appointmentsSection: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  appointmentsHeader: {
    marginBottom: 12,
  },
  appointmentsLabel: {
    color: '#cc2d19',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  appointmentsDate: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 34,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(204, 45, 25, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#cc2d19',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 16,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  appointmentCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timelineRail: {
    width: 18,
    alignItems: 'center',
    paddingTop: 18,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#cc2d19',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(204, 45, 25, 0.32)',
    marginTop: 4,
  },
  appointmentContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  appointmentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  appointmentTimeBadge: {
    backgroundColor: 'rgba(204, 45, 25, 0.15)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  badgeConfirmed: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  appointmentTime: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ff6b57',
  },
  appointmentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  appointmentClient: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  appointmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
