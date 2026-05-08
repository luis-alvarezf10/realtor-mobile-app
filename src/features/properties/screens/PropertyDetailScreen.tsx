import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY || '';

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f0eb' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a4a4a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f0eb' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8e0d8' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#cc2d19' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f0ebe5' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8e0d8' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d9d0c6' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d4dce4' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6b7b8b' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e8e0d8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b7b8b' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#e8e0d8' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d9d0c6' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#4a4a4a' }] },
];

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
  type_properties: { value: string; color: string | null } | { value: string; color: string | null }[] | null;
  details_properties: {
    area_sqm: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    lot_size: number | null;
    parking_spots: number | null;
    half_bath: number | null;
    price: number | null;
    is_furnished: boolean | null;
    period: string | null;
  } | {
    area_sqm: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    lot_size: number | null;
    parking_spots: number | null;
    half_bath: number | null;
    price: number | null;
    is_furnished: boolean | null;
    period: string | null;
  }[] | null;
  type_offers: { value: string } | { value: string }[] | null;
};

export function PropertyDetailScreen({ route, navigation }: any) {
  const property: Property = route.params.property;
  const mapRef = useRef<MapView>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const details = useMemo(() => {
    if (Array.isArray(property.details_properties)) {
      return property.details_properties[0] || null;
    }
    return property.details_properties || null;
  }, [property.details_properties]);

  const propertyType = useMemo(() => {
    if (Array.isArray(property.type_properties)) {
      return property.type_properties[0] || null;
    }
    return property.type_properties || null;
  }, [property.type_properties]);

  const offerType = useMemo(() => {
    if (Array.isArray(property.type_offers)) {
      return property.type_offers[0] || null;
    }
    return property.type_offers || null;
  }, [property.type_offers]);

  const statusStyle = getStatusStyle(property.status);
  const statusLabel = getStatusLabel(property.status);

  const hasLocation = property.latitude && property.longitude;

  const openDirections = async () => {
    if (!property.latitude || !property.longitude) return;
    setLoadingLocation(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLoadingLocation(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    setLoadingLocation(false);
    setShowDirections(true);
  };

  const destLat = property.latitude!;
  const destLng = property.longitude!;

  const mapRegion = userLocation
    ? {
        latitude: (userLocation.latitude + destLat) / 2,
        longitude: (userLocation.longitude + destLng) / 2,
        latitudeDelta: Math.abs(userLocation.latitude - destLat) * 1.8 + 0.02,
        longitudeDelta: Math.abs(userLocation.longitude - destLng) * 1.8 + 0.02,
      }
    : {
        latitude: destLat,
        longitude: destLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Detalle"
        onBack={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          {property.image ? (
            <Image source={{ uri: property.image }} style={styles.mainImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="home-outline" size={48} color="#cc2d19" />
            </View>
          )}
          <View style={styles.imageBadges}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusStyle.color }]} />
              <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusLabel}</Text>
            </View>
            {!!details?.price && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>
                  {formatPrice(details.price, offerType?.value, details.period)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{property.title}</Text>

          {!!property.address && (
            <View style={styles.addressRow}>
              <Ionicons name="location" size={16} color="#6B7280" />
              <Text style={styles.address}>{property.address}</Text>
            </View>
          )}

          {!!property.description && (
            <Text style={styles.description}>{property.description}</Text>
          )}

          {details && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Detalles</Text>
              <View style={styles.detailsGrid}>
                {details.area_sqm && (
                  <DetailItem icon="resize" label={formatArea(details.area_sqm)} />
                )}
                {details.bedrooms && (
                  <DetailItem icon="bed-outline" label={`${details.bedrooms} hab`} />
                )}
                {details.bathrooms && (
                  <DetailItem icon="water-outline" label={formatBathrooms(details.bathrooms, details.half_bath)} />
                )}
                {details.parking_spots && (
                  <DetailItem icon="car-outline" label={`${details.parking_spots} est`} />
                )}
                {details.lot_size && (
                  <DetailItem icon="cube-outline" label={formatArea(details.lot_size)} />
                )}
                {details.is_furnished && (
                  <DetailItem icon="checkmark-circle" label="Amoblado" />
                )}
              </View>
            </>
          )}

          {!!propertyType?.value && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Tipo de propiedad</Text>
              <View style={[styles.typeBadge, propertyType.color ? { backgroundColor: `${propertyType.color}18` } : null]}>
                <Text style={[styles.typeText, propertyType.color ? { color: propertyType.color } : null]}>
                  {propertyType.value}
                </Text>
              </View>
            </>
          )}

          {hasLocation && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Ubicación</Text>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  customMapStyle={mapStyle}
                  initialRegion={{
                    latitude: destLat,
                    longitude: destLng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{ latitude: destLat, longitude: destLng }}
                    title={property.title}
                    description={property.address || ''}
                  />
                </MapView>
              </View>
              <TouchableOpacity style={[styles.directionsButton, loadingLocation && styles.directionsButtonDisabled]} onPress={openDirections} disabled={loadingLocation}>
                {loadingLocation ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="navigate" size={18} color="#fff" />
                )}
                <Text style={styles.directionsText}>{loadingLocation ? 'Obteniendo ubicación...' : 'Cómo llegar'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={showDirections} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDirections(false)} style={styles.modalBack}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Cómo llegar</Text>
            <View style={{ width: 32 }} />
          </View>
          <MapView
            ref={mapRef}
            style={styles.fullMap}
            provider={PROVIDER_GOOGLE}
            customMapStyle={mapStyle}
            initialRegion={mapRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {userLocation && (
              <Marker
                coordinate={userLocation}
                title="Tu ubicación"
                pinColor="#3B82F6"
              />
            )}
            <Marker
              coordinate={{ latitude: destLat, longitude: destLng }}
              title={property.title}
              description={property.address || ''}
            />
            {userLocation && (
              <MapViewDirections
                origin={userLocation}
                destination={{ latitude: destLat, longitude: destLng }}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor="#cc2d19"
                mode="DRIVING"
                precision="high"
                onReady={(result) => {
                  if (result?.coordinates) {
                    mapRef.current?.fitToCoordinates(result.coordinates, {
                      edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                    });
                  }
                }}
              />
            )}
          </MapView>
        </View>
      </Modal>
    </View>
  );
}

function DetailItem({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={18} color="#cc2d19" />
      <Text style={styles.detailItemText}>{label}</Text>
    </View>
  );
}

function getStatusStyle(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'available') return { color: '#047857', backgroundColor: '#ECFDF5' };
  if (normalized === 'reserved') return { color: '#B45309', backgroundColor: '#FFFBEB' };
  if (normalized === 'saled') return { color: '#7C3AED', backgroundColor: '#F5F3FF' };
  if (normalized === 'rented') return { color: '#2563EB', backgroundColor: '#EFF6FF' };
  return { color: '#6B7280', backgroundColor: '#F3F4F6' };
}

function getStatusLabel(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'available') return 'Disponible';
  if (normalized === 'reserved') return 'Reservado';
  if (normalized === 'saled') return 'Vendido';
  if (normalized === 'rented') return 'Alquilado';
  return status;
}

function formatPrice(price?: number | null, offerTypeValue?: string | null, period?: string | null) {
  if (!price) return 'Precio por definir';
  const formatted = `${Math.round(price).toLocaleString('en-US')}$`;
  const isRental = offerTypeValue && ['alquiler', 'renta', 'rent', 'lease'].includes(offerTypeValue.toLowerCase());
  if (!isRental) return formatted;
  const periodMap: Record<string, string> = { monthly: 'mes', yearly: 'año', weekly: 'semana', daily: 'día' };
  const periodLabel = period ? (periodMap[period.toLowerCase()] || period) : null;
  return periodLabel ? `${formatted} / ${periodLabel}` : formatted;
}

function formatArea(area?: number | null) {
  return area ? `${Math.round(area)} m2` : 'N/D';
}

function formatBathrooms(bathrooms?: number | null, halfBath?: number | null) {
  if (!bathrooms && !halfBath) return 'N/D';
  const full = bathrooms || 0;
  const half = halfBath ? ` + ${halfBath}/2` : '';
  return `${full}${half} banos`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF9',
  },
  imageSection: {
    position: 'relative',
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: 280,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: SCREEN_WIDTH,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  imageBadges: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  priceBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  body: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  typeBadge: {
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  map: {
    width: '100%',
    height: 200,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#cc2d19',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
  },
  directionsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  directionsButtonDisabled: {
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalBack: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  fullMap: {
    flex: 1,
  },
});
