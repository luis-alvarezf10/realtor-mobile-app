import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useEffect } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import ViewShot from 'react-native-view-shot';
import * as Location from 'expo-location';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { GradientBackground } from '../../../shared/components/GradientBackground';
import { useAuth } from '../../../shared/context/AuthContext';
import { supabase } from '../../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_SIZE = 1080;
const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY || '';

import { mapStyle } from '../../../shared/styles/mapStyle';

type MarketingTemplateId = 'classic' | 'bold' | 'clean';

type CompanyBrand = {
  name: string | null;
  logo: string | null;
};

const MARKETING_TEMPLATES: { id: MarketingTemplateId; name: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'classic', name: 'Elegante', description: 'Foto grande, precio y datos clave.', icon: 'albums-outline' },
  { id: 'bold', name: 'Impacto', description: 'Diseño fuerte para captar atención.', icon: 'flash-outline' },
  { id: 'clean', name: 'Minimal', description: 'Claro, directo y fácil de leer.', icon: 'scan-outline' },
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
    is_built: boolean | null;
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
    is_built: boolean | null;
    period: string | null;
  }[] | null;
  type_offers: { name: string; value: string } | { name: string; value: string }[] | null;
};

export function PropertyDetailScreen({ route, navigation }: any) {
  const property: Property = route.params.property;
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const flyerRef = useRef<any>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplateId>('classic');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [companyBrand, setCompanyBrand] = useState<CompanyBrand | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

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
  const selectedTemplateInfo = MARKETING_TEMPLATES.find((template) => template.id === selectedTemplate) || MARKETING_TEMPLATES[0];
  const brandName = companyBrand?.name || 'Go Hunter';

  const hasLocation = property.latitude && property.longitude;

  useEffect(() => {
    let isMounted = true;

    const fetchCompanyBrand = async () => {
      if (!user?.id) {
        setCompanyBrand(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('realtors')
          .select(`
            companies (
              name,
              logo
            )
          `)
          .eq('id_realtor', user.id)
          .maybeSingle();

        if (error) throw error;

        const company = firstRelation((data as any)?.companies);
        if (isMounted) {
          setCompanyBrand(company ? { name: company.name || null, logo: normalizeLogoUrl(company.logo) } : null);
        }
      } catch (err) {
        console.error('Error fetching company brand:', err);
        if (isMounted) setCompanyBrand(null);
      }
    };

    fetchCompanyBrand();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const deleteProperty = async () => {
    if (!user?.id || deleting) return;

    setDeleting(true);
    try {
      const { error: scheduleError } = await supabase
        .from('schedule')
        .update({ id_property: null })
        .eq('id_property', property.id);

      if (scheduleError) throw scheduleError;

      const { error: detailsError } = await supabase
        .from('details_properties')
        .delete()
        .eq('id_property', property.id);

      if (detailsError) throw detailsError;

      const { error: propertyError } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id)
        .eq('id_advisor', user.id);

      if (propertyError) throw propertyError;

      Alert.alert('Propiedad eliminada', 'La propiedad se eliminó correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error('Error deleting property:', err);
      Alert.alert('Error', err.message || 'No se pudo eliminar la propiedad.');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteProperty = () => {
    Alert.alert(
      'Eliminar propiedad',
      `¿Seguro que deseas eliminar "${property.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: deleteProperty },
      ]
    );
  };

  const shareMarketingPost = async () => {
    setSharing(true);
    try {
      await wait(350);
      const uri = await flyerRef.current?.capture?.();
      if (!uri) {
        throw new Error('No se pudo generar el post.');
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir post publicitario' });
      } else {
        Alert.alert('No disponible', 'Compartir archivos no está disponible en este dispositivo.');
      }
    } catch (err: any) {
      console.error('Error sharing marketing post:', err);
      Alert.alert('Error', err.message || 'No se pudo generar el post publicitario.');
    } finally {
      setSharing(false);
    }
  };

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
    <GradientBackground>
    <View style={styles.container}>
      <ScreenHeader
        title="Detalle"
        onBack={() => navigation.goBack()}
        onEdit={() => navigation.navigate('AddProperty', { property })}
        onDelete={confirmDeleteProperty}
        deleteLoading={deleting}
        theme="dark"
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
              <Text style={styles.statusText}>{statusLabel}</Text>
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
          {!!propertyType?.value && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Clasificación</Text>
              <View style={styles.badgesRow}>
                <View style={[styles.typeBadge, propertyType.color ? { backgroundColor: `${propertyType.color}18` } : null]}>
                  <Text style={[styles.typeText, propertyType.color ? { color: propertyType.color } : null]}>
                    {propertyType.value}
                  </Text>
                </View>
                {!!offerType?.name && (
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>{offerType.name}</Text>
                  </View>
                )}
                {details && (
                  <>
                    <View style={[styles.statusBadge, details.is_built ? styles.statusBadgeGreen : styles.statusBadgeGray]}>
                      <Text style={[styles.statusBadgeText, { color: details.is_built ? '#10B981' : '#9CA3AF' }]}>
                        {details.is_built ? 'Construido' : 'No construido'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, details.is_furnished ? styles.statusBadgeGreen : styles.statusBadgeGray]}>
                      <Text style={[styles.statusBadgeText, { color: details.is_furnished ? '#10B981' : '#9CA3AF' }]}>
                        {details.is_furnished ? 'Amoblado' : 'Sin amoblar'}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </>
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
              </View>
            </>
          )}

          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Post publicitario</Text>
            <View style={styles.templateSelectedCard}>
              <View style={styles.templateSelectedIcon}>
                <Ionicons name={selectedTemplateInfo.icon} size={20} color="#cc2d19" />
              </View>
              <View style={styles.templateSelectedText}>
                <Text style={styles.templateSelectedName}>{selectedTemplateInfo.name}</Text>
                <Text style={styles.templateSelectedDesc}>{selectedTemplateInfo.description}</Text>
                <Text style={styles.templateSelectedBrand} numberOfLines={1}>{brandName}</Text>
              </View>
              <TouchableOpacity style={styles.templateChangeButton} onPress={() => setShowTemplateModal(true)}>
                <Text style={styles.templateChangeText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.shareButton, sharing && styles.directionsButtonDisabled]}
              onPress={shareMarketingPost}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="share-social" size={18} color="#fff" />
              )}
              <Text style={styles.shareText}>{sharing ? 'Generando...' : 'Compartir post'}</Text>
            </TouchableOpacity>
          </>

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
            <TouchableOpacity onPress={() => { setShowDirections(false); setRouteCoords([]); setRouteInfo(null); }} style={styles.modalBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalCenter}>
              <Text style={styles.modalTitle}>Cómo llegar</Text>
              {routeInfo && (
                <Text style={styles.modalSubtitle}>
                  {routeInfo.distance < 1
                    ? `${Math.round(routeInfo.distance * 1000)} m`
                    : `${routeInfo.distance.toFixed(1)} km`}
                  {' · '}
                  {routeInfo.duration >= 60
                    ? `${Math.floor(routeInfo.duration / 60)}h ${Math.round(routeInfo.duration % 60)}min`
                    : `${Math.round(routeInfo.duration)} min`}
                </Text>
              )}
            </View>
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
                pinColor="#cc2d19"
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
                strokeColors={['#cc2d19']}
                mode="DRIVING"
                precision="high"
                onReady={(result) => {
                  if (result?.coordinates) {
                    setRouteCoords(result.coordinates);
                    setRouteInfo({ distance: result.distance, duration: result.duration });
                    mapRef.current?.fitToCoordinates(result.coordinates, {
                      edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                    });
                  }
                }}
              />
            )}
            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor="#cc2d19"
                strokeColors={['#cc2d19']}
                strokeWidth={4}
              />
            )}
          </MapView>
        </View>
      </Modal>

      <Modal visible={showTemplateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.templateModal}>
            <View style={styles.templateModalHeader}>
              <Text style={styles.templateModalTitle}>Elegir diseño</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)} style={styles.templateModalClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {MARKETING_TEMPLATES.map((template) => {
              const isActive = selectedTemplate === template.id;
              return (
                <TouchableOpacity
                  key={template.id}
                  style={[styles.templateOption, isActive && styles.templateOptionActive]}
                  onPress={() => {
                    setSelectedTemplate(template.id);
                    setShowTemplateModal(false);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.templateOptionIcon, isActive && styles.templateOptionIconActive]}>
                    <Ionicons name={template.icon} size={22} color={isActive ? '#fff' : '#cc2d19'} />
                  </View>
                  <View style={styles.templateOptionBody}>
                    <Text style={styles.templateOptionTitle}>{template.name}</Text>
                    <Text style={styles.templateOptionDesc}>{template.description}</Text>
                  </View>
                  {isActive && <Ionicons name="checkmark-circle" size={22} color="#10B981" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      <ViewShot
        ref={flyerRef}
        style={styles.flyerHidden}
        options={{ format: 'png', quality: 1, width: POST_SIZE, height: POST_SIZE }}
      >
        <MarketingPost
          property={property}
          details={details}
          propertyType={propertyType}
          offerType={offerType}
          statusLabel={statusLabel}
          template={selectedTemplate}
          advisorName={user?.fullname || user?.name || 'Go Hunter'}
          advisorPhone={user?.phone}
          companyName={brandName}
          companyLogo={companyBrand?.logo}
        />
      </ViewShot>
    </View>
    </GradientBackground>
  );
}

function MarketingPost({
  property,
  details,
  propertyType,
  offerType,
  statusLabel,
  template,
  advisorName,
  advisorPhone,
  companyName,
  companyLogo,
}: {
  property: Property;
  details: Property['details_properties'] extends Array<infer U> ? U | null : any;
  propertyType: { value: string; color: string | null } | null;
  offerType: { name?: string; value: string } | null;
  statusLabel: string;
  template: MarketingTemplateId;
  advisorName: string;
  advisorPhone?: string | null;
  companyName: string;
  companyLogo?: string | null;
}) {
  const price = formatPrice(details?.price, offerType?.value, details?.period);
  const specs = [
    details?.bedrooms ? `${details.bedrooms} hab` : null,
    details?.bathrooms ? formatBathrooms(details.bathrooms, details?.half_bath) : null,
    details?.parking_spots ? `${details.parking_spots} est` : null,
    details?.area_sqm ? formatArea(details.area_sqm) : null,
  ].filter(Boolean);

  if (template === 'bold') {
    return (
      <View style={[styles.postCanvas, styles.postBoldCanvas]}>
        {property.image ? <Image source={{ uri: property.image }} style={styles.postBoldImage} /> : <View style={styles.postBoldImagePlaceholder} />}
        <View style={styles.postBoldOverlay} />
        <View style={styles.postBoldTop}>
          <BrandMark name={companyName} logo={companyLogo} variant="dark" />
          <Text style={styles.postStatusLight}>{statusLabel}</Text>
        </View>
        <View style={styles.postBoldContent}>
          <Text style={styles.postBoldOffer}>{offerType?.name || 'Propiedad'}</Text>
          <Text style={styles.postBoldTitle} numberOfLines={3}>{property.title}</Text>
          <Text style={styles.postBoldPrice}>{price}</Text>
          {!!property.address && <Text style={styles.postBoldAddress} numberOfLines={2}>{property.address}</Text>}
        </View>
        <View style={styles.postBoldSpecs}>
          {specs.slice(0, 4).map((spec) => (
            <Text key={spec} style={styles.postBoldSpec}>{spec}</Text>
          ))}
        </View>
        <Text style={styles.postBoldFooter}>{advisorName}{advisorPhone ? `  |  ${advisorPhone}` : ''}</Text>
      </View>
    );
  }

  if (template === 'clean') {
    return (
      <View style={[styles.postCanvas, styles.postCleanCanvas]}>
        <View style={styles.postCleanHeader}>
          <BrandMark name={companyName} logo={companyLogo} variant="light" />
          <Text style={styles.postCleanStatus}>{statusLabel}</Text>
        </View>
        <View style={styles.postCleanBody}>
          <Text style={styles.postCleanType}>{propertyType?.value || offerType?.name || 'Propiedad'}</Text>
          <Text style={styles.postCleanTitle} numberOfLines={2}>{property.title}</Text>
          <Text style={styles.postCleanPrice}>{price}</Text>
          {!!property.address && <Text style={styles.postCleanAddress} numberOfLines={2}>{property.address}</Text>}
        </View>
        {property.image ? (
          <Image source={{ uri: property.image }} style={styles.postCleanImage} />
        ) : (
          <View style={styles.postCleanImagePlaceholder}>
            <Ionicons name="home-outline" size={110} color="#cc2d19" />
          </View>
        )}
        <View style={styles.postCleanSpecs}>
          {specs.slice(0, 4).map((spec) => (
            <Text key={spec} style={styles.postCleanSpec}>{spec}</Text>
          ))}
        </View>
        <View style={styles.postCleanFooter}>
          <Text style={styles.postCleanAdvisor}>{advisorName}</Text>
          {!!advisorPhone && <Text style={styles.postCleanPhone}>{advisorPhone}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.postCanvas, styles.postClassicCanvas]}>
      <View style={styles.postClassicHeader}>
        <BrandMark name={companyName} logo={companyLogo} variant="dark" />
        <Text style={styles.postClassicStatus}>{statusLabel}</Text>
      </View>
      <View style={styles.postClassicImageFrame}>
        {property.image ? (
          <Image source={{ uri: property.image }} style={styles.postClassicImage} />
        ) : (
          <View style={styles.postClassicImagePlaceholder}>
            <Ionicons name="home-outline" size={120} color="#cc2d19" />
          </View>
        )}
      </View>
      <View style={styles.postClassicInfoCard}>
        <View style={styles.postClassicTypeRow}>
          <Text style={styles.postClassicType}>{propertyType?.value || 'Propiedad'}</Text>
          {!!offerType?.name && <Text style={styles.postClassicOffer}>{offerType.name}</Text>}
        </View>
        <Text style={styles.postClassicTitle} numberOfLines={2}>{property.title}</Text>
        {!!property.address && <Text style={styles.postClassicAddress} numberOfLines={2}>{property.address}</Text>}
        <View style={styles.postClassicBottomRow}>
          <Text style={styles.postClassicPrice}>{price}</Text>
          <View style={styles.postClassicSpecs}>
            {specs.slice(0, 3).map((spec) => (
              <Text key={spec} style={styles.postClassicSpecText}>{spec}</Text>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.postClassicFooter}>
        <Text style={styles.postClassicAdvisor}>{advisorName}</Text>
        {!!advisorPhone && <Text style={styles.postClassicPhone}>{advisorPhone}</Text>}
      </View>
    </View>
  );
}

function BrandMark({ name, logo, variant }: { name: string; logo?: string | null; variant: 'light' | 'dark' }) {
  const textStyle = variant === 'light' ? styles.brandMarkTextLight : styles.brandMarkTextDark;

  return (
    <View style={styles.brandMark}>
      {!!logo && <Image source={{ uri: logo }} style={styles.brandMarkLogo} resizeMode="contain" />}
      <Text style={textStyle} numberOfLines={1}>{name}</Text>
    </View>
  );
}

function DetailItem({ icon, label, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; color?: string }) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={18} color={color || '#9CA3AF'} />
      <Text style={[styles.detailItemText, color ? { color } : null]}>{label}</Text>
    </View>
  );
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function normalizeLogoUrl(logo?: string | null) {
  if (!logo) return null;

  const cleaned = logo.replace(/\s+/g, '').trim();
  if (!cleaned) return null;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;

  return supabase.storage.from('company-logos').getPublicUrl(cleaned.replace(/^\/+/, '')).data.publicUrl;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatusStyle(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'available') return { backgroundColor: '#34C759' };
  if (normalized === 'reserved') return { backgroundColor: '#FF8D28' };
  if (normalized === 'saled') return { backgroundColor: '#6155F5' };
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
  },
  imageSection: {
    position: 'relative',
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  imagePlaceholder: {
    width: SCREEN_WIDTH,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    paddingHorizontal: 18,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff'
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
    color: '#fff',
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
    color: '#9CA3AF',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 22,
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  detailItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  offerBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(204, 45, 25, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(204, 45, 25, 0.3)',
  },
  offerBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cc2d19',
  },
  statusBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBadgeGray: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalBack: {
    padding: 4,
  },
  modalCenter: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  fullMap: {
    flex: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#cc2d19',
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  templateSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
  },
  templateSelectedIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(204, 45, 25, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateSelectedText: {
    flex: 1,
  },
  templateSelectedName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  templateSelectedDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  templateSelectedBrand: {
    fontSize: 12,
    color: '#ff6b57',
    fontWeight: '800',
    marginTop: 4,
  },
  templateChangeButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(204, 45, 25, 0.16)',
  },
  templateChangeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ff6b57',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'flex-end',
  },
  templateModal: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  templateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  templateModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  templateModalClose: {
    padding: 4,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 10,
  },
  templateOptionActive: {
    borderColor: 'rgba(16, 185, 129, 0.55)',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
  },
  templateOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(204, 45, 25, 0.14)',
  },
  templateOptionIconActive: {
    backgroundColor: '#10B981',
  },
  templateOptionBody: {
    flex: 1,
  },
  templateOptionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  templateOptionDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  flyerHidden: {
    position: 'absolute',
    top: -2000,
    left: 0,
    width: POST_SIZE,
    height: POST_SIZE,
  },
  postCanvas: {
    width: POST_SIZE,
    height: POST_SIZE,
    overflow: 'hidden',
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexShrink: 1,
    maxWidth: 560,
  },
  brandMarkLogo: {
    width: 88,
    height: 88,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  brandMarkTextDark: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    flexShrink: 1,
  },
  brandMarkTextLight: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '900',
    flexShrink: 1,
  },
  postStatusLight: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  postBoldCanvas: {
    backgroundColor: '#0B0B0B',
  },
  postBoldImage: {
    ...StyleSheet.absoluteFillObject,
    width: POST_SIZE,
    height: POST_SIZE,
  },
  postBoldImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#220704',
  },
  postBoldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.46)',
  },
  postBoldTop: {
    position: 'absolute',
    top: 62,
    left: 62,
    right: 62,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postBoldContent: {
    position: 'absolute',
    left: 62,
    right: 62,
    bottom: 245,
  },
  postBoldOffer: {
    color: '#ff6b57',
    fontSize: 34,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  postBoldTitle: {
    color: '#fff',
    fontSize: 76,
    fontWeight: '900',
    lineHeight: 84,
    marginTop: 16,
  },
  postBoldPrice: {
    color: '#fff',
    fontSize: 58,
    fontWeight: '900',
    marginTop: 24,
  },
  postBoldAddress: {
    color: '#E5E7EB',
    fontSize: 28,
    lineHeight: 36,
    marginTop: 16,
  },
  postBoldSpecs: {
    position: 'absolute',
    left: 62,
    right: 62,
    bottom: 130,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  postBoldSpec: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    backgroundColor: 'rgba(204, 45, 25, 0.86)',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  postBoldFooter: {
    position: 'absolute',
    left: 62,
    right: 62,
    bottom: 58,
    color: '#fff',
    fontSize: 25,
    fontWeight: '700',
  },
  postCleanCanvas: {
    backgroundColor: '#FFFFFF',
  },
  postCleanHeader: {
    height: 132,
    paddingHorizontal: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postCleanStatus: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    borderWidth: 2,
    borderColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  postCleanImage: {
    width: 952,
    height: 430,
    marginHorizontal: 64,
    borderRadius: 28,
  },
  postCleanImagePlaceholder: {
    width: 952,
    height: 430,
    marginHorizontal: 64,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  postCleanBody: {
    paddingHorizontal: 64,
    paddingTop: 22,
    paddingBottom: 28,
  },
  postCleanType: {
    color: '#cc2d19',
    fontSize: 23,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  postCleanTitle: {
    color: '#111827',
    fontSize: 60,
    fontWeight: '900',
    lineHeight: 66,
    marginTop: 10,
  },
  postCleanPrice: {
    color: '#111827',
    fontSize: 48,
    fontWeight: '900',
    marginTop: 18,
  },
  postCleanAddress: {
    color: '#4B5563',
    fontSize: 25,
    lineHeight: 34,
    marginTop: 12,
  },
  postCleanSpecs: {
    position: 'absolute',
    left: 64,
    right: 64,
    bottom: 118,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 18,
  },
  postCleanSpec: {
    color: '#111827',
    fontSize: 25,
    fontWeight: '900',
  },
  postCleanFooter: {
    position: 'absolute',
    left: 64,
    right: 64,
    bottom: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postCleanAdvisor: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
  },
  postCleanPhone: {
    color: '#6B7280',
    fontSize: 24,
    fontWeight: '700',
  },
  postClassicCanvas: {
    backgroundColor: '#0B0F14',
  },
  postClassicHeader: {
    height: 142,
    paddingHorizontal: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postClassicStatus: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(204, 45, 25, 0.92)',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  postClassicImageFrame: {
    width: 968,
    height: 560,
    marginHorizontal: 56,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  postClassicImage: {
    width: '100%',
    height: '100%',
  },
  postClassicImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postClassicInfoCard: {
    marginHorizontal: 56,
    marginTop: -58,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 38,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.08)',
  },
  postClassicTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  postClassicType: {
    color: '#cc2d19',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  postClassicOffer: {
    color: '#6B7280',
    fontSize: 22,
    fontWeight: '800',
  },
  postClassicTitle: {
    color: '#111827',
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 58,
    marginTop: 14,
  },
  postClassicAddress: {
    color: '#4B5563',
    fontSize: 23,
    lineHeight: 30,
    marginTop: 12,
  },
  postClassicBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
    marginTop: 22,
  },
  postClassicPrice: {
    color: '#cc2d19',
    fontSize: 46,
    fontWeight: '900',
    flex: 1,
  },
  postClassicSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 14,
    flex: 1,
  },
  postClassicSpecText: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
  },
  postClassicFooter: {
    position: 'absolute',
    left: 56,
    right: 56,
    bottom: 38,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postClassicAdvisor: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  postClassicPhone: {
    color: '#D1D5DB',
    fontSize: 24,
    fontWeight: '700',
  },
});
