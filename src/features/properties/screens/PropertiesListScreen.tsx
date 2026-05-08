import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { useAuth } from '../../../shared/context/AuthContext';
import { supabase } from '../../../lib/supabase';

type PropertyDetails = {
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lot_size: number | null;
  parking_spots: number | null;
  half_bath: number | null;
  price: number | null;
  is_furnished: boolean | null;
  period: string | null;
};

type PropertyType = {
  value: string;
  color: string | null;
};

type Property = {
  id: string;
  image: string | null;
  title: string;
  description: string | null;
  address: string | null;
  status: string;
  created_at: string;
  type_properties: PropertyType | PropertyType[] | null;
  details_properties: PropertyDetails | PropertyDetails[] | null;
};

export function PropertiesListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBedrooms, setFilterBedrooms] = useState<string>('');
  const [filterBathrooms, setFilterBathrooms] = useState<string>('');
  const [filterHalfBaths, setFilterHalfBaths] = useState<string>('');
  const [filterParking, setFilterParking] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const fetchProperties = useCallback(async () => {
    if (!user?.id) {
      setProperties([]);
      setLoading(false);
      return;
    }

    setError(null);

    const { data, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        image,
        title,
        description,
        address,
        status,
        created_at,
        type_properties (
          value,
          color
        ),
        details_properties (
          area_sqm,
          bedrooms,
          bathrooms,
          lot_size,
          parking_spots,
          half_bath,
          price,
          is_furnished,
          period
        )
      `)
      .eq('id_advisor', user.id)
      .order('created_at', { ascending: false });

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      setError('No pudimos cargar tus propiedades.');
      setProperties([]);
    } else {
      setProperties((data || []) as Property[]);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const details = firstRelation(property.details_properties);

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          property.title?.toLowerCase().includes(query) ||
          property.address?.toLowerCase().includes(query) ||
          property.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (filterStatus && normalizeStatus(property.status) !== filterStatus.toLowerCase()) {
        return false;
      }

      if (filterBedrooms && (!details?.bedrooms || details.bedrooms < parseInt(filterBedrooms))) {
        return false;
      }

      if (filterBathrooms && (!details?.bathrooms || details.bathrooms < parseInt(filterBathrooms))) {
        return false;
      }

      if (filterHalfBaths && (!details?.half_bath || details.half_bath < parseInt(filterHalfBaths))) {
        return false;
      }

      if (filterParking && (!details?.parking_spots || details.parking_spots < parseInt(filterParking))) {
        return false;
      }

      return true;
    });
  }, [properties, searchQuery, filterBedrooms, filterBathrooms, filterHalfBaths, filterParking, filterStatus]);

  const hasActiveFilters = searchQuery || filterBedrooms || filterBathrooms || filterHalfBaths || filterParking || filterStatus;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterBedrooms('');
    setFilterBathrooms('');
    setFilterHalfBaths('');
    setFilterParking('');
    setFilterStatus('');
  };

  const renderPropertyGrid = ({ item }: { item: Property }) => {
    const details = firstRelation(item.details_properties);
    const propertyType = firstRelation(item.type_properties);
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity style={styles.gridCard} activeOpacity={0.86}>
        <View style={styles.gridImageWrap}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.gridPropertyImage} />
          ) : (
            <View style={styles.gridImagePlaceholder}>
              <Ionicons name="home-outline" size={24} color="#cc2d19" />
            </View>
          )}
          <View style={[styles.gridStatusPill, { backgroundColor: statusStyle.backgroundColor }]}>
            <View style={[styles.gridStatusDot, { backgroundColor: statusStyle.color }]} />
            <Text style={[styles.gridStatusText, { color: statusStyle.color }]}>
              {item.status === 'available' ? 'Disponible' : item.status === 'reserved' ? 'Reservado' : item.status === 'saled' ? 'Vendido' : item.status === 'rented' ? 'Alquilado' : item.status}
            </Text>
          </View>
          {!!details?.price && (
            <View style={styles.gridPriceBadge}>
              <Text style={styles.gridPriceText}>
                {formatPrice(details.price, propertyType?.value, details.period)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.gridCardBody}>
          <Text style={styles.gridPropertyTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {!!item.address && (
            <View style={styles.gridAddressRow}>
              <Ionicons name="location" size={11} color="#9CA3AF" />
              <Text style={styles.gridPropertyAddress} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
          )}

          <View style={styles.gridSpecsRow}>
            {details?.bedrooms ? (
              <View style={styles.gridSpecItem}>
                <Ionicons name="bed-outline" size={12} color="#9CA3AF" />
                <Text style={styles.gridSpecText}>{details.bedrooms}</Text>
              </View>
            ) : null}
            {details?.bathrooms ? (
              <View style={styles.gridSpecItem}>
                <Ionicons name="water-outline" size={12} color="#9CA3AF" />
                <Text style={styles.gridSpecText}>{details.bathrooms}</Text>
              </View>
            ) : null}
            {details?.parking_spots ? (
              <View style={styles.gridSpecItem}>
                <Ionicons name="car-outline" size={12} color="#9CA3AF" />
                <Text style={styles.gridSpecText}>{details.parking_spots}</Text>
              </View>
            ) : null}
          </View>

          {!!propertyType?.value && (
            <View style={styles.gridTypeRow}>
              <View style={[styles.gridTypeBadge, propertyType.color ? { backgroundColor: `${propertyType.color}18` } : null]}>
                <Text style={[styles.gridTypeText, propertyType.color ? { color: propertyType.color } : null]}>
                  {propertyType.value}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Propiedades" onNotifications={() => navigation.navigate('Notifications')} />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título o dirección"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={18} color={hasActiveFilters ? '#fff' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      {hasActiveFilters && (
        <View style={styles.activeFiltersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {searchQuery && <FilterChip label={`"${searchQuery}"`} onRemove={() => setSearchQuery('')} />}
            {filterBedrooms && <FilterChip label={`${filterBedrooms}+ hab`} onRemove={() => setFilterBedrooms('')} />}
            {filterBathrooms && <FilterChip label={`${filterBathrooms}+ baños`} onRemove={() => setFilterBathrooms('')} />}
            {filterHalfBaths && <FilterChip label={`${filterHalfBaths}+ ½ baño`} onRemove={() => setFilterHalfBaths('')} />}
            {filterParking && <FilterChip label={`${filterParking}+ est`} onRemove={() => setFilterParking('')} />}
            {filterStatus && <FilterChip label={filterStatus} onRemove={() => setFilterStatus('')} />}
            <TouchableOpacity style={styles.clearAllButton} onPress={clearFilters}>
              <Text style={styles.clearAllText}>Limpiar todo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#cc2d19" />
          <Text style={styles.centerText}>Cargando propiedades...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={renderPropertyGrid}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[
            styles.listContent,
            filteredProperties.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#cc2d19" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="business-outline" size={30} color="#cc2d19" />
              </View>
              <Text style={styles.emptyTitle}>
                {hasActiveFilters ? 'Sin resultados' : (error || 'Aun no tienes propiedades')}
              </Text>
              <Text style={styles.emptyDescription}>
                {hasActiveFilters
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Cuando agregues propiedades asociadas a tu agente, apareceran aqui.'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar propiedades</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <FilterSection title="Estado">
                <View style={styles.chipRow}>
                  {['available', 'reserved', 'saled', 'rented'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.chip, filterStatus === status && styles.chipActive]}
                      onPress={() => setFilterStatus(filterStatus === status ? '' : status)}
                    >
                      <Text style={[styles.chipText, filterStatus === status && styles.chipTextActive]}>
                        {status === 'available' ? 'Disponible' : status === 'reserved' ? 'Reservado' : status === 'saled' ? 'Vendido' : 'Alquilado'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </FilterSection>

              <FilterSection title="Habitaciones mínimas">
                <View style={styles.chipRow}>
                  {['1', '2', '3', '4', '5'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.chip, filterBedrooms === num && styles.chipActive]}
                      onPress={() => setFilterBedrooms(filterBedrooms === num ? '' : num)}
                    >
                      <Text style={[styles.chipText, filterBedrooms === num && styles.chipTextActive]}>
                        {num}+
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </FilterSection>

              <FilterSection title="Baños completos mínimos">
                <View style={styles.chipRow}>
                  {['1', '2', '3', '4'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.chip, filterBathrooms === num && styles.chipActive]}
                      onPress={() => setFilterBathrooms(filterBathrooms === num ? '' : num)}
                    >
                      <Text style={[styles.chipText, filterBathrooms === num && styles.chipTextActive]}>
                        {num}+
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </FilterSection>

              <FilterSection title="Medios baños mínimos">
                <View style={styles.chipRow}>
                  {['1', '2', '3'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.chip, filterHalfBaths === num && styles.chipActive]}
                      onPress={() => setFilterHalfBaths(filterHalfBaths === num ? '' : num)}
                    >
                      <Text style={[styles.chipText, filterHalfBaths === num && styles.chipTextActive]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </FilterSection>

              <FilterSection title="Estacionamientos mínimos">
                <View style={styles.chipRow}>
                  {['1', '2', '3', '4'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.chip, filterParking === num && styles.chipActive]}
                      onPress={() => setFilterParking(filterParking === num ? '' : num)}
                    >
                      <Text style={[styles.chipText, filterParking === num && styles.chipTextActive]}>
                        {num}+
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </FilterSection>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalClearButton} onPress={clearFilters}>
                <Text style={styles.modalClearText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.modalApplyText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <TouchableOpacity style={styles.filterChip} onPress={onRemove}>
      <Text style={styles.filterChipText}>{label}</Text>
      <Ionicons name="close" size={14} color="#6B7280" />
    </TouchableOpacity>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function getStatusStyle(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === 'available') {
    return { color: '#047857', backgroundColor: '#ECFDF5' };
  }

  if (normalized === 'reserved') {
    return { color: '#B45309', backgroundColor: '#FFFBEB' };
  }

  if (normalized === 'saled') {
    return { color: '#7C3AED', backgroundColor: '#F5F3FF' };
  }

  if (normalized === 'rented') {
    return { color: '#2563EB', backgroundColor: '#EFF6FF' };
  }

  return { color: '#6B7280', backgroundColor: '#F3F4F6' };
}

function formatPrice(price?: number | null, propertyTypeValue?: string | null, period?: string | null) {
  if (!price) {
    return 'Precio por definir';
  }

  const formatted = `${Math.round(price).toLocaleString('en-US')}$`;
  const periodMap: Record<string, string> = { monthly: 'mes', yearly: 'año', weekly: 'semana', daily: 'día' };
  const periodLabel = period ? (periodMap[period.toLowerCase()] || period) : null;
  return periodLabel ? `${formatted} / ${periodLabel}` : formatted;
}

function formatArea(area?: number | null) {
  return area ? `${Math.round(area)} m2` : 'N/D';
}

function formatNumber(value: number | null | undefined, suffix: string) {
  return value ? `${value} ${suffix}` : 'N/D';
}

function formatBathrooms(bathrooms?: number | null, halfBath?: number | null) {
  if (!bathrooms && !halfBath) {
    return 'N/D';
  }

  const full = bathrooms || 0;
  const half = halfBath ? ` + ${halfBath}/2` : '';
  return `${full}${half} banos`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF9',
  },
  listContent: {
    padding: 16,
    paddingBottom: 140,
  },
  emptyListContent: {
    flexGrow: 1,
  },

  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  specText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#cc2d19',
  },
  gridRow: {
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridImageWrap: {
    height: 130,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  gridPropertyImage: {
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  gridStatusPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  gridStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gridStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  gridPriceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gridPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  gridCardBody: {
    padding: 10,
  },
  gridPropertyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  gridAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  gridPropertyAddress: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  gridSpecsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  gridSpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridSpecText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  gridTypeRow: {
    marginTop: 8,
  },
  gridTypeBadge: {
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  gridTypeText: {
    color: '#7F1D1D',
    fontSize: 10,
    fontWeight: '700',
  },
  activeFiltersBar: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  clearAllButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cc2d19',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  chipActive: {
    backgroundColor: '#cc2d19',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  modalClearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalClearText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  modalApplyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#cc2d19',
    alignItems: 'center',
  },
  modalApplyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
