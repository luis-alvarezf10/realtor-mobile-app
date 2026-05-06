import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../shared/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

  type StatusFilter = 'all' | 'Realizada' | 'Pendiente' | 'Cancelada' | 'No asistí';

interface Appointment {
  id: string;
  description: string | null;
  client_name: string | null;
  date: string;
  status: string | null;
  time: string | null;
}

interface MonthStat {
  month: string;
  total: number;
  confirmed: number;
}

export function AllAppointmentsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filtered, setFiltered] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MonthStat[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const snackbarAnim = useState(() => new Animated.Value(0))[0];

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select('id, description, client_name, date, status, time')
        .eq('id_realtor', user.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (!error && data) {
        setAppointments(data);
        calculateStats(data);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const showHelp = () => {
    setSnackbarVisible(true);
    Animated.sequence([
      Animated.timing(snackbarAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(snackbarAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSnackbarVisible(false));
  };

  const calculateStats = (data: Appointment[]) => {
    const monthMap: { [key: string]: { total: number; confirmed: number } } = {};

    data.forEach(a => {
      if (!a.date) return;
      const d = new Date(a.date + 'T00:00:00');
      const monthKey = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { total: 0, confirmed: 0 };
      }
      monthMap[monthKey].total++;
      if (a.status === 'Realizada') {
        monthMap[monthKey].confirmed++;
      }
    });

    const sorted = Object.entries(monthMap)
      .map(([month, stat]) => ({ month, ...stat }))
      .sort((a, b) => {
        const dateA = new Date(`1 ${a.month}`);
        const dateB = new Date(`1 ${b.month}`);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 6);

    setStats(sorted);
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    let result = appointments;

    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter);
    }

    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(a =>
        (a.client_name || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [search, statusFilter, appointments]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return '#6B7280';
    const s = status.toLowerCase();
    if (s === 'realizada') return '#16A34A';
    if (s === 'pendiente') return '#F59E0B';
    if (s === 'cancelada') return '#EF4444';
    if (s === 'no asistí' || s === 'no asisti') return '#6B7280';
    return '#6B7280';
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return 'ellipse-outline';
    const s = status.toLowerCase();
    if (s === 'realizada') return 'checkmark-circle';
    if (s === 'pendiente') return 'time';
    if (s === 'cancelada') return 'close-circle';
    if (s === 'no asistí' || s === 'no asisti') return 'close-circle-outline';
    return 'ellipse-outline';
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'Sin estado';
    if (status === 'Realizada') return 'Realizada';
    if (status === 'Pendiente') return 'Pendiente';
    if (status === 'Cancelada') return 'Cancelada';
    if (status === 'No asistí') return 'No asistió';
    return status;
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

  const totalAll = appointments.length;
  const totalRealizada = appointments.filter(a => a.status === 'Realizada').length;
  const totalPendiente = appointments.filter(a => a.status === 'Pendiente').length;
  const totalCancelada = appointments.filter(a => a.status === 'Cancelada').length;
  const totalNoAsistio = appointments.filter(a => a.status === 'No asistí').length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Todas las citas"
        onBack={() => navigation.goBack()}
        onHelp={showHelp}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalAll}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={[styles.statCard, styles.statCardGreen]}>
                <Text style={[styles.statValue, styles.statValueGreen]}>{totalRealizada}</Text>
                <Text style={[styles.statLabel, styles.statLabelGreen]}>Realizadas</Text>
              </View>
              <View style={[styles.statCard, styles.statCardYellow]}>
                <Text style={[styles.statValue, styles.statValueYellow]}>{totalPendiente}</Text>
                <Text style={[styles.statLabel, styles.statLabelYellow]}>Pendientes</Text>
              </View>
              {/* <View style={[styles.statCard, styles.statCardRed]}>
                <Text style={[styles.statValue, styles.statValueRed]}>{totalCancelada + totalNoAsistio}</Text>
                <Text style={[styles.statLabel, styles.statLabelRed]}>No realizadas</Text>
              </View> */}
            </View>

            {stats.length > 0 && (
              <View style={styles.monthStatsContainer}>
                <Text style={styles.sectionTitle}>Por mes</Text>
                <View style={styles.monthStatsRow}>
                  {stats.map((s, idx) => (
                    <View key={idx} style={styles.monthStatCard}>
                      <Text style={styles.monthStatName}>{s.month}</Text>
                      <Text style={styles.monthStatTotal}>{s.total} citas</Text>
                      <Text style={styles.monthStatConfirmed}>{s.confirmed} confirmadas</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por cliente..."
                  placeholderTextColor="#9CA3AF"
                  value={search}
                  onChangeText={setSearch}
                />
                {search !== '' && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContainer}
            >
              {(['all', 'Realizada', 'Pendiente', 'Cancelada', 'No asistí'] as StatusFilter[]).map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    statusFilter === status && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text style={[
                    styles.filterChipText,
                    statusFilter === status && styles.filterChipTextActive,
                  ]}>
                    {status === 'all' ? 'Todas' : status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.item, { borderLeftColor: getStatusColor(item.status) }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Ionicons name={getAppointmentIcon(item.description) as any} size={20} color={getStatusColor(item.status)} />
              </View>
            </View>
            <View style={styles.itemCenter}>
              <Text style={styles.itemTitle}>{item.description || 'Cita'}</Text>
              <View style={styles.itemMeta}>
                <Ionicons name="person-outline" size={12} color="#6B7280" />
                <Text style={styles.itemClient}>{item.client_name || 'Sin cliente'}</Text>
              </View>
              <View style={styles.itemFooter}>
                <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
                <Text style={styles.itemTime}>{formatTime(item.time)}</Text>
              </View>
            </View>
            <View style={styles.itemRight}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Ionicons name={getStatusIcon(item.status) as any} size={14} color={getStatusColor(item.status)} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Cargando...</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No se encontraron citas</Text>
            </View>
          )
        }
      />
      {snackbarVisible && (
        <Animated.View style={[
          styles.snackbar,
          {
            opacity: snackbarAnim,
            transform: [{
              translateY: snackbarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}>
          <Ionicons name="information-circle" size={20} color="#fff" />
          <Text style={styles.snackbarText}>
            Aquí puedes ver todas tus citas. Filtra por estado, busca por cliente y revisa tus estadísticas mensuales.
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF9',
  },
  listContent: {
    paddingBottom: 100,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statCardGreen: {
    backgroundColor: '#F0FDF4',
  },
  statCardYellow: {
    backgroundColor: '#FFFBEB',
  },
  statCardRed: {
    backgroundColor: '#FEF2F2',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statValueGreen: {
    color: '#16A34A',
  },
  statValueYellow: {
    color: '#F59E0B',
  },
  statValueRed: {
    color: '#EF4444',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statLabelGreen: {
    color: '#16A34A',
  },
  statLabelYellow: {
    color: '#F59E0B',
  },
  statLabelGray: {
    color: '#6B7280',
  },
  statLabelRed: {
    color: '#EF4444',
  },
  monthStatsContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#686868',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  monthStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  monthStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  monthStatName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#686868',
    textTransform: 'capitalize',
  },
  monthStatTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  monthStatConfirmed: {
    fontSize: 11,
    color: '#16A34A',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#cc2d19',
    borderColor: '#cc2d19',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemLeft: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCenter: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  itemClient: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  itemDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  itemTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  snackbar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  snackbarText: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    lineHeight: 18,
  },
});
