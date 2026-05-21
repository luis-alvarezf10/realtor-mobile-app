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
import { LinearGradient } from 'expo-linear-gradient';

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
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_at: string;
  type_properties: PropertyType | PropertyType[] | null;
  details_properties: PropertyDetails | PropertyDetails[] | null;
  type_offers: { value: string } | { value: string }[] | null;
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
        latitude,
        longitude,
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
        ),
        type_offers (
          value
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
    const offerType = firstRelation(item.type_offers);
    const statusStyle = getStatusStyle(item.status);

    const statusLabel =
      item.status === 'available' ? 'Disponible' : item.status === 'reserved' ? 'Reservado' : item.status === 'saled' ? 'Vendido' : item.status === 'rented' ? 'Alquilado' : item.status;

    return (
      <TouchableOpacity style={styles.gridCard} activeOpacity={0.86} onPress={() => navigation.navigate('PropertyDetail', { property: item })}>
        <View style={styles.gridImageWrap}>
          {item.image ? (
            <View style={styles.gridImageContainer}>
              <Image source={{ uri: item.image }} style={styles.gridPropertyImage} resizeMode="cover" />
            </View>
          ) : (
            <View style={styles.gridImageContainer}>
              <Ionicons name="home-outline" size={28} color="#cc2d19" />
            </View>
          )}
          <View style={[styles.gridStatusPill, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={styles.gridStatusText}>{statusLabel}</Text>
          </View>
        </View>
        <View style={styles.gridCardBody}>
          <Text style={styles.gridPropertyTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {!!item.address && (
            <View style={styles.gridAddressRow}>
              <Ionicons name="location" size={12} color="#9CA3AF" />
              <Text style={styles.gridPropertyAddress} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
          )}

          <View style={styles.gridSpecsRow}>
            {details?.bedrooms ? (
              <View style={styles.gridSpecItem}>
                <Ionicons name="bed-outline" size={14} color="#9CA3AF" />
                <Text style={styles.gridSpecText}>{details.bedrooms}</Text>
              </View>
            ) : null}
            {details?.bathrooms ? (
              <>
                <Text style={styles.gridSpecSep}>|</Text>
                <View style={styles.gridSpecItem}>
                  <Ionicons name="water-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.gridSpecText}>{details.bathrooms}</Text>
                </View>
              </>
            ) : null}
            {!!details?.area_sqm && (
              <>
                <Text style={styles.gridSpecSep}>|</Text>
                <View style={styles.gridSpecItem}>
                  <Ionicons name="expand-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.gridSpecText}>{details.area_sqm} m²</Text>
                </View>
              </>
            )}
          </View>
          <View style={styles.gridBadgesRow}>
            {!!propertyType?.value && (
              <View style={[styles.gridTypeBadge, propertyType.color ? { backgroundColor: `${propertyType.color}18` } : null]}>
                <Text style={[styles.gridTypeText, propertyType.color ? { color: propertyType.color } : null]}>
                  {propertyType.value}
                </Text>
              </View>
            )}
            {!!details?.price && (
              <View className='bg-amber-500/20 p-1 rounded'>
                <Text className='text-amber-500 font-bold'>
                  {formatPrice(details.price, offerType?.value, details.period)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#5A0001', '#000000']}
      start={{ x: 0.9, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}>
      <ScreenHeader title="Inventario" onNotifications={() => navigation.navigate('Notifications')} theme="dark" />
      <View className='flex flex-row justify-between items-center p-4 gap-4'>
        <View className='bg-white/20 flex-1' style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar inmuebles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          {hasActiveFilters ? (
            <Ionicons name="funnel" size={18} color='#fff' />
          ) : (
            <Ionicons name="funnel-outline" size={18} color='#fff' />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.pillsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContent}>
          {([
            { key: '', label: 'Todas' },
            { key: 'available', label: 'Disponibles' },
            { key: 'reserved', label: 'Reservadas' },
            { key: 'rented', label: 'Alquiladas' },
            { key: 'saled', label: 'Vendidas' },
          ] as const).map((tab) => {
            const isActive = filterStatus === tab.key;
            return (
              <TouchableOpacity key={tab.key} activeOpacity={0.8} onPress={() => setFilterStatus(tab.key)}>
                {isActive ? (
                  <LinearGradient
                    colors={['#cc2d19', '#8B1A1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.pill, styles.pillActive]}
                  >
                    <Text style={[styles.pillText, styles.pillTextActive]}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{tab.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {hasActiveFilters && (
        <View style={styles.activeFiltersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {searchQuery && <FilterChip label={`"${searchQuery}"`} onRemove={() => setSearchQuery('')} />}
            {filterBedrooms && <FilterChip label={`${filterBedrooms}+ hab`} onRemove={() => setFilterBedrooms('')} />}
            {filterBathrooms && <FilterChip label={`${filterBathrooms}+ baños`} onRemove={() => setFilterBathrooms('')} />}
            {filterHalfBaths && <FilterChip label={`${filterHalfBaths}+ ½ baño`} onRemove={() => setFilterHalfBaths('')} />}
            {filterParking && <FilterChip label={`${filterParking}+ est`} onRemove={() => setFilterParking('')} />}
            {filterStatus && <FilterChip label={filterStatus === 'available' ? 'Disponible' : filterStatus === 'reserved' ? 'Reservado' : filterStatus === 'saled' ? 'Vendido' : filterStatus === 'rented' ? 'Alquilado' : filterStatus} onRemove={() => setFilterStatus('')} />}
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
          renderItem={renderPropertyGrid}
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
                <Ionicons name="albums-outline" size={30} color="#cc2d19" />
              </View>
              <Text style={styles.emptyTitle}>
                {hasActiveFilters ? 'Sin resultados' : (error || 'Sin inventario ')}
              </Text>
              <Text style={styles.emptyDescription}>
                {hasActiveFilters
                  ? 'No se encontraron resultados con estos filtros de busqueda.'
                  : 'Aún no has agregado un inmueble. Crea un nuevo registro para administrar tu inventario.'}
              </Text>
              <TouchableOpacity style={styles.emptyActionButton} onPress={clearFilters}>
                <Text style={styles.emptyActionText}>{hasActiveFilters ? 'Limpiar Filtros' : 'Agregar Propiedad' }</Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <LinearGradient
        colors={['transparent', '#000000']}
        locations={[0, 0.7]}
        style={styles.bottomFade}
        pointerEvents="none"
      />
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1A1A2E', '#0D0D0D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.modalGradient}
            >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar propiedades</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <FilterSection title="Estado">
                <View style={styles.chipRow}>
                  {['available', 'reserved', 'saled', 'rented'].map((status) => {
                    const isActive = filterStatus === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => setFilterStatus(isActive ? '' : status)}
                      >
                        {isActive && (
                          <LinearGradient
                            colors={['#cc2d19', '#8B1A1A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {status === 'available' ? 'Disponible' : status === 'reserved' ? 'Reservado' : status === 'saled' ? 'Vendido' : 'Alquilado'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              <FilterSection title="Habitaciones mínimas">
                <View style={styles.chipRow}>
                  {['1', '2', '3', '4', '5'].map((num) => {
                    const isActive = filterBedrooms === num;
                    return (
                      <TouchableOpacity
                        key={num}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => setFilterBedrooms(isActive ? '' : num)}
                      >
                        {isActive && (
                          <LinearGradient
                            colors={['#cc2d19', '#8B1A1A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {num}+
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              <FilterSection title="Baños completos mínimos">
                <View style={styles.chipRow}>
                  {['1', '2', '3', '4'].map((num) => {
                    const isActive = filterBathrooms === num;
                    return (
                      <TouchableOpacity
                        key={num}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => setFilterBathrooms(isActive ? '' : num)}
                      >
                        {isActive && (
                          <LinearGradient
                            colors={['#cc2d19', '#8B1A1A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {num}+
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              <FilterSection title="Medios baños mínimos">
                <View style={styles.chipRow}>
                  {['1', '2', '3'].map((num) => {
                    const isActive = filterHalfBaths === num;
                    return (
                      <TouchableOpacity
                        key={num}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => setFilterHalfBaths(isActive ? '' : num)}
                      >
                        {isActive && (
                          <LinearGradient
                            colors={['#cc2d19', '#8B1A1A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {num}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>

              <FilterSection title="Estacionamientos mínimos">
                <View style={styles.chipRow}>
                  {['1', '2', '3', '4'].map((num) => {
                    const isActive = filterParking === num;
                    return (
                      <TouchableOpacity
                        key={num}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => setFilterParking(isActive ? '' : num)}
                      >
                        {isActive && (
                          <LinearGradient
                            colors={['#cc2d19', '#8B1A1A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {num}+
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FilterSection>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalClearButton} onPress={clearFilters}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.modalClearText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={() => setShowFilters(false)}
              >
                <LinearGradient
                  colors={['#cc2d19', '#8B1A1A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.modalApplyText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <TouchableOpacity style={styles.filterChip} onPress={onRemove}>
      <LinearGradient
        colors={['#FF383C80', '#99222480']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.filterChipText}>{label}</Text>
      <Ionicons name="close" size={14} color="#FF383C" />
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
    return { backgroundColor: '#34C759' };
  }

  if (normalized === 'reserved') {
    return { backgroundColor: '#FF8D28' };
  }

  if (normalized === 'saled') {
    return { color: '#7C3AED', backgroundColor: '#F5F3FF' };
  }

  if (normalized === 'rented') {
    return { color: '#2563EB', backgroundColor: '#EFF6FF' };
  }

  return { color: '#6B7280', backgroundColor: '#F3F4F6' };
}

function formatPrice(price?: number | null, offerTypeValue?: string | null, period?: string | null) {
  if (!price) {
    return 'Precio por definir';
  }

  const formatted = `${Math.round(price).toLocaleString('en-US')}$`;
  const isRental = offerTypeValue && ['alquiler', 'renta', 'rent', 'lease'].includes(offerTypeValue.toLowerCase());
  if (!isRental) return formatted;

  const periodMap: Record<string, string> = { monthly: 'mes', yearly: 'año', weekly: 'semana', daily: 'día' };
  const periodLabel = period ? (periodMap[period.toLowerCase()] || period) : null;
  return periodLabel ? `${formatted} / ${periodLabel}` : formatted;
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
    backgroundColor: '#99222440',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)'
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#BF2F32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#cc2d19',
  },
  gridCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridImageWrap: {
    width: 140,
    height: 140,
    position: 'relative',
    borderRadius: 12
  },
  gridImageContainer: {
    width: 140,
    height: 140,
    backgroundColor: '#FEF2F2',
    borderRadius: 12
  },
  gridPropertyImage: {
    width: 140,
    height: 140,
    borderRadius: 12
  },
  gridStatusPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  gridStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: "#fff"
  },
  gridPriceBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 'auto',
  },
  gridPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  gridCardBody: {
    flex: 1,
    padding: 12,
  },
  gridPropertyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 18,
    flex: 1,
  },
  gridAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridPropertyAddress: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  gridSpecsRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  gridSpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridSpecSep: {
    fontSize: 14,
    fontWeight: '300',
    color: '#9CA3AF',
  },
  gridSpecText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  gridTypeBadge: {
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 1,
  },
  gridBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  gridTypeText: {
    color: '#7F1D1D',
    fontSize: 10,
    fontWeight: '700',
  },
  pillsContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  pillsContent: {
    gap: 8,
  },
  pill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pillActive: {
    borderColor: '#cc2d19',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  pillTextActive: {
    color: '#fff',
  },
  activeFiltersBar: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FF383C80',
    overflow: 'hidden',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: "#fff"
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalGradient: {
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
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
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
    color: '#D1D5DB',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  chipActive: {
    backgroundColor: 'transparent',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalClearText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  modalApplyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalApplyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  emptyActionButton: {
    backgroundColor: '#BF2F32',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
});
