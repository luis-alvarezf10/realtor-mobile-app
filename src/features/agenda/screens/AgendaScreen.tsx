import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../shared/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
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

export function AgendaScreen({ navigation }: any) {
  const { user } = useAuth();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select('id, description, client_name, date, status, time')
        .eq('id_realtor', user.id);

      if (!error && data) {
        setAppointments(data);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter(a => {
      if (!a.date) return false;
      const d = new Date(a.date);
      const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return formatted === dateStr;
    });
  };

  const hasAppointments = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return getAppointmentsForDate(dateStr).length > 0;
  };

  const isPastDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr < `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === parseInt(selectedDate.split('-')[2]) &&
      selectedDate.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
  };

  const selectedDayAppointments = getAppointmentsForDate(selectedDate);

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
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(date);
  };

  const getAppointmentIcon = (description: string | null) => {
    if (!description) return 'calendar-outline';
    const desc = description.toLowerCase();
    if (desc.includes('visita') || desc.includes('ver')) return 'home-outline';
    if (desc.includes('firma') || desc.includes('contrato')) return 'create-outline';
    if (desc.includes('llamada') || desc.includes('call')) return 'call-outline';
    if (desc.includes('reunión') || desc.includes('meeting')) return 'people-outline';
    return 'calendar-outline';
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Agenda" onNotifications={() => navigation.navigate('Notifications')} />

      <View style={styles.viewAllContainer}>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('AllAppointments')}
          activeOpacity={0.85}
        >
          <Text style={styles.viewAllText}>Ver todas las citas</Text>
          <Ionicons name="arrow-forward" size={18} color="#cc2d19" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.monthArrow}>
              <Ionicons name="chevron-back" size={20} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.monthArrow}>
              <Ionicons name="chevron-forward" size={20} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysRow}>
            {DAYS.map(d => (
              <Text key={d} style={styles.weekDayLabel}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, idx) => {
              if (day === null) return <View key={`empty-${idx}`} style={styles.dayCell} />;
              const hasAppt = hasAppointments(day);
              const past = isPastDay(day);
              const todayDay = isToday(day);
              const selected = isSelected(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={styles.dayCell}
                  onPress={() => selectDay(day)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.dayInner,
                    selected && styles.dayInnerSelected,
                    todayDay && !selected && styles.dayInnerToday,
                  ]}>
                    {selected && <View style={styles.daySelectedBg} />}
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
                    {hasAppt && !selected && (
                      <View style={[
                        styles.dayDot,
                        past ? styles.dayDotPast : styles.dayDotFuture,
                      ]} />
                    )}
                    {selected && hasAppt && (
                      <View style={styles.dayDotSelected} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.appointmentsSection}>
          <View style={styles.appointmentsHeader}>
            <Text style={styles.appointmentsDate}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => console.log('Add appointment')}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Cargando...</Text>
            </View>
          ) : selectedDayAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay citas para este día</Text>
              <Text style={styles.emptySubtext}>Toca + para agregar una nueva cita</Text>
            </View>
          ) : (
            selectedDayAppointments.map((item) => (
              <TouchableOpacity key={item.id} style={styles.appointmentCard} activeOpacity={0.85}>
                <View style={[styles.appointmentTimeBadge, item.status === 'confirmed' && styles.badgeConfirmed]}>
                  <Text style={styles.appointmentTime}>{formatTime(item.time)}</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTitle}>{item.description || 'Cita'}</Text>
                  <View style={styles.appointmentMeta}>
                    <Ionicons name="person-outline" size={14} color="#6B7280" />
                    <Text style={styles.appointmentClient}>{item.client_name || 'Sin cliente'}</Text>
                  </View>
                </View>
                <View style={styles.appointmentIcon}>
                  <Ionicons name={getAppointmentIcon(item.description) as any} size={22} color="#cc2d19" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF9',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  viewAllContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cc2d19',
  },
  calendarCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthArrow: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'capitalize',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    height: 70,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  dayDotContainer: {
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dayInner: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 22,
  },
  dayInnerSelected: {
    backgroundColor: '#cc2d19',
  },
  dayInnerToday: {
    borderWidth: 2.5,
    borderColor: '#cc2d19',
    backgroundColor: '#FEF2F2',
  },
  dayText: {
    fontSize: 17,
    color: '#111827',
    fontWeight: '500',
    zIndex: 1,
  },
  daySelected: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelectedBg: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#cc2d19',
    shadowColor: '#cc2d19',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  dayToday: {
    borderWidth: 2.5,
    borderColor: '#cc2d19',
    borderRadius: 999,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  dayTextToday: {
    color: '#cc2d19',
    fontWeight: '700',
    fontSize: 18,
  },
  dayPast: {
    opacity: 0.4,
  },
  dayTextPast: {
    color: '#9CA3AF',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  dayDotFuture: {
    backgroundColor: '#cc2d19',
  },
  dayDotPast: {
    backgroundColor: '#9CA3AF',
  },
  dayDotSelected: {
    backgroundColor: '#fff',
  },
  appointmentsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  appointmentsDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#cc2d19',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#cc2d19',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#D1D5DB',
    marginTop: 4,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  appointmentTimeBadge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  badgeConfirmed: {
    backgroundColor: '#F0FDF4',
  },
  appointmentTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cc2d19',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  appointmentClient: {
    fontSize: 13,
    color: '#6B7280',
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
