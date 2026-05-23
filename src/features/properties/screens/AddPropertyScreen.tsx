import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { GradientBackground } from '../../../shared/components/GradientBackground';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { mapStyle } from '../../../shared/styles/mapStyle';

const STEPS = ['Info', 'Cliente', 'Ubicación', 'Tipo', 'Detalles', 'Precio'];

type TypeProperty = { id: string; value: string; color: string };
type TypeOffer = { id: string; name: string; value: string };

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function haversineDistance(lat1: number, lon1: number, lat2: number | null, lon2: number | null): number {
  if (lat2 === null || lon2 === null) return -1;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PERIOD_TO_MONTHLY: Record<string, number> = {
  monthly: 1,
  yearly: 1 / 12,
  weekly: 52 / 12,
  daily: 365 / 12,
};

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'daily', label: 'Diario' },
];

export function AddPropertyScreen({ navigation, route }: any) {
  const editProperty = route?.params?.property || null;
  const isEditing = !!editProperty;
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);

  const [typeProperties, setTypeProperties] = useState<TypeProperty[]>([]);
  const [typeOffers, setTypeOffers] = useState<TypeOffer[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [searchCedula, setSearchCedula] = useState('');
  const [searchingClient, setSearchingClient] = useState(false);
  const [clientSearchResult, setClientSearchResult] = useState<any[] | null>(null);
  const [newCedula, setNewCedula] = useState('');
  const [newName, setNewName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [period, setPeriod] = useState('monthly');

  const [areaSqm, setAreaSqm] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [halfBath, setHalfBath] = useState('');
  const [parkingSpots, setParkingSpots] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [isBuilt, setIsBuilt] = useState(true);
  const [isFurnished, setIsFurnished] = useState(false);
  const [price, setPrice] = useState('');

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [region, setRegion] = useState({
    latitude: 19.4326,
    longitude: -99.1332,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [avgPricePerSqm, setAvgPricePerSqm] = useState<number | null>(null);
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null);
  const [recommending, setRecommending] = useState(false);
  const [propertyTypeStats, setPropertyTypeStats] = useState<{ type: string; avg: number; count: number }[]>([]);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editProperty) return;
    const dp = firstRelation(editProperty.details_properties);
    setTitle(editProperty.title || '');
    setDescription(editProperty.description || '');
    setAddress(editProperty.address || '');
    if (editProperty.image) setImageUri(editProperty.image);
    if (editProperty.latitude && editProperty.longitude) {
      setLatitude(editProperty.latitude);
      setLongitude(editProperty.longitude);
      setRegion({ latitude: editProperty.latitude, longitude: editProperty.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    }
    if (editProperty.id_type) setSelectedTypeId(editProperty.id_type);
    if (editProperty.id_type_offer) setSelectedOfferId(editProperty.id_type_offer);
    if (editProperty.id_owner) {
      supabase.from('clients').select('id, name, last_name').eq('id', editProperty.id_owner).single().then(({ data }) => {
        if (data) {
          setSelectedClientId(data.id);
          setSelectedClientName(`${data.name}${data.last_name ? ' ' + data.last_name : ''}`);
        }
      });
    }
    if (dp) {
      if (dp.area_sqm) setAreaSqm(dp.area_sqm.toString());
      if (dp.bedrooms) setBedrooms(dp.bedrooms.toString());
      if (dp.bathrooms) setBathrooms(dp.bathrooms.toString());
      if (dp.half_bath) setHalfBath(dp.half_bath.toString());
      if (dp.parking_spots) setParkingSpots(dp.parking_spots.toString());
      if (dp.lot_size) setLotSize(dp.lot_size.toString());
      if (dp.price) setPrice(dp.price.toString());
      setIsBuilt(dp.is_built ?? true);
      setIsFurnished(dp.is_furnished ?? false);
      if (dp.period) setPeriod(dp.period);
    }
  }, [editProperty]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageUri) return null;
    if (imageUri.startsWith('http')) return imageUri;
    setUploading(true);
    try {
      const ext = imageUri.split('.').pop() || 'jpg';
      const fileName = `properties/${Date.now()}.${ext}`;
      const contentType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: contentType,
        name: fileName.split('/').pop(),
      } as any);
      const { error: uploadError } = await supabase.storage
        .from('properties')
        .upload(fileName, formData, { contentType });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('properties').getPublicUrl(fileName);
      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Error', 'No se pudo subir la imagen.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      supabase.from('type_properties').select('id, value, color'),
      supabase.from('type_offers').select('id, name, value'),
    ]).then(([tpRes, toRes]) => {
      if (!tpRes.error) setTypeProperties(tpRes.data);
      if (!toRes.error) setTypeOffers(toRes.data);
    }).finally(() => setLoadingTypes(false));
  }, []);

  const selectedType = typeProperties.find(tp => tp.id === selectedTypeId) || null;
  const selectedOffer = typeOffers.find(to => to.id === selectedOfferId) || null;

  const searchClientByCedula = async () => {
    const cedula = searchCedula.trim();
    if (!cedula) {
      Alert.alert('Campo requerido', 'Ingresa una cédula de identidad.');
      return;
    }
    setSearchingClient(true);
    setClientSearchResult(null);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('national_id', cedula);
      if (error) throw error;
      setClientSearchResult(data || []);
    } catch (err) {
      console.error('Search error:', err);
      Alert.alert('Error', 'No se pudo buscar el cliente.');
    } finally {
      setSearchingClient(false);
    }
  };

  const selectClient = (client: any) => {
    setSelectedClientId(client.id);
    setSelectedClientName(`${client.name}${client.last_name ? ' ' + client.last_name : ''}`);
    setSearchCedula('');
    setClientSearchResult(null);
  };

  const createClient = async () => {
    if (!newName.trim() || !newCedula.trim()) {
      Alert.alert('Campos requeridos', 'Nombre y cédula son obligatorios.');
      return;
    }
    setCreatingClient(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: newName.trim(),
          last_name: newLastName.trim() || null,
          national_id: newCedula.trim(),
          phone: newPhone.trim() || null,
        })
        .select('id, name, last_name')
        .single();
      if (error) throw error;
      setSelectedClientId(data.id);
      setSelectedClientName(`${data.name}${data.last_name ? ' ' + data.last_name : ''}`);
      setNewCedula('');
      setNewName('');
      setNewLastName('');
      setNewPhone('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear el cliente.');
    } finally {
      setCreatingClient(false);
    }
  };

  const clearSelectedClient = () => {
    setSelectedClientId(null);
    setSelectedClientName(null);
  };

  const canGoNext = () => {
    switch (step) {
      case 0: return title.trim().length > 0;
      case 1: return selectedClientId !== null;
      case 2: return true;
      case 3: return selectedTypeId !== null && selectedOfferId !== null;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (step === 0 && !title.trim()) {
      Alert.alert('Campo requerido', 'El título es obligatorio.');
      return;
    }
    if (step === 1 && !selectedClientId) {
      Alert.alert('Campo requerido', 'Selecciona o agrega un cliente.');
      return;
    }
    if (step === 3 && (!selectedTypeId || !selectedOfferId)) {
      Alert.alert('Campo requerido', 'Selecciona el tipo de propiedad y el tipo de oferta.');
      return;
    }
    if (step < STEPS.length) {
      setStep(step + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const getCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    } finally {
      setLocating(false);
    }
  };

  const handleMapPress = (e: any) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleMarkerDrag = (e: any) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    setLatitude(lat);
    setLongitude(lng);
  };

  const fetchAvgPrice = useCallback(async () => {
    if (!selectedTypeId || !selectedOfferId) {
      Alert.alert('Campos requeridos', 'Selecciona tipo de propiedad y tipo de oferta.');
      return;
    }
    if (latitude === null || longitude === null) {
      Alert.alert('Ubicación requerida', 'Selecciona una ubicación en el mapa primero.');
      return;
    }

    const newLotSize = lotSize ? parseFloat(lotSize) : 0;
    const newAreaSqm = areaSqm ? parseFloat(areaSqm) : 0;

    if (!newLotSize && !newAreaSqm) {
      Alert.alert('Campos requeridos', 'Ingresa el área del terreno (m²) o el área de construcción.');
      return;
    }

    setRecommending(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          latitude,
          longitude,
          type_properties(id, value, color),
          details_properties!inner(price, lot_size, area_sqm, is_furnished, is_built, period)
        `)
        .eq('id_type_offer', selectedOfferId)
        .eq('details_properties.is_built', isBuilt)
        .eq('details_properties.is_furnished', isFurnished)
        .not('details_properties.price', 'is', null);

      if (error) throw error;

      const RADIUS_KM = 15;
      const entries = (data || []).map(d => ({
        ...d,
        distance: haversineDistance(latitude, longitude, d.latitude, d.longitude),
      }));

      let filtered = entries.filter(e => e.distance >= 0 && e.distance <= RADIUS_KM);
      let scopeLabel = `en un radio de ${RADIUS_KM} km`;

      if (filtered.length < 3) {
        const withCoords = entries.filter(e => e.distance >= 0);
        if (withCoords.length >= 3) {
          filtered = withCoords;
          scopeLabel = 'en todas las ubicaciones';
        } else {
          filtered = entries;
          scopeLabel = 'disponibles';
        }
      }

      const typeMap: Record<string, { total: number; count: number; value: string }> = {};
      let currentTotal = 0;
      let currentCount = 0;

      for (const e of filtered) {
        const dp = firstRelation(e.details_properties);
        const tp = firstRelation(e.type_properties);
        if (!dp) continue;
        let p = Number(dp.price);
        const lot = Number(dp.lot_size);
        const area = Number(dp.area_sqm);
        const metric = lot > 0 ? lot : (area > 0 ? area : 0);

        const comparablePeriod = dp.period?.toLowerCase();
        const targetPeriod = period;
        if (comparablePeriod && targetPeriod &&
            comparablePeriod in PERIOD_TO_MONTHLY && targetPeriod in PERIOD_TO_MONTHLY) {
          p = p * (PERIOD_TO_MONTHLY[comparablePeriod] / PERIOD_TO_MONTHLY[targetPeriod]);
        }

        if (p > 0 && metric > 0) {
          const unitPrice = p / metric;
          const tid = tp?.id || 'unknown';
          const tval = tp?.value || tid;

          if (!typeMap[tid]) typeMap[tid] = { total: 0, count: 0, value: tval };
          typeMap[tid].total += unitPrice;
          typeMap[tid].count++;

          if (tid === selectedTypeId) {
            currentTotal += unitPrice;
            currentCount++;
          }
        }
      }

      const statsArray = Object.entries(typeMap)
        .map(([id, s]) => ({ type: s.value, avg: s.count > 0 ? s.total / s.count : 0, count: s.count }))
        .sort((a, b) => b.avg - a.avg);

      setPropertyTypeStats(statsArray);

      const newMetric = newLotSize || newAreaSqm;

      if (currentCount > 0) {
        const avg = currentTotal / currentCount;
        setAvgPricePerSqm(avg);
        if (newMetric > 0) setRecommendedPrice(Math.round(avg * newMetric));
      } else if (statsArray.length > 0) {
        const allTotal = Object.values(typeMap).reduce((s, v) => s + v.total, 0);
        const allCount = Object.values(typeMap).reduce((s, v) => s + v.count, 0);
        if (allCount > 0) {
          const avg = allTotal / allCount;
          setAvgPricePerSqm(avg);
          if (newMetric > 0) setRecommendedPrice(Math.round(avg * newMetric));
        } else {
          Alert.alert('Sin datos', `Sin datos ${scopeLabel} para sugerir un precio.`);
        }
      } else {
        Alert.alert('Sin datos', `Sin datos ${scopeLabel} para sugerir un precio.`);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      Alert.alert('Error', 'No se pudieron obtener las estadísticas.');
    } finally {
      setRecommending(false);
    }
  }, [lotSize, areaSqm, selectedTypeId, selectedOfferId, isFurnished, latitude, longitude]);

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión.');
      return;
    }
    if (!selectedTypeId || !selectedOfferId) {
      Alert.alert('Error', 'Selecciona el tipo de propiedad y el tipo de oferta.');
      return;
    }
    if (!selectedClientId) {
      Alert.alert('Error', 'Selecciona un cliente.');
      return;
    }
    setSubmitting(true);

    const imageUrl = await uploadImage();

    try {
      const propPayload = {
        title: title.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        latitude,
        longitude,
        image: imageUrl,
        id_owner: selectedClientId,
        id_type: selectedTypeId,
        id_type_offer: selectedOfferId,
      };

      const detailsPayload = {
        area_sqm: areaSqm ? parseInt(areaSqm) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        half_bath: halfBath ? parseInt(halfBath) : null,
        parking_spots: parkingSpots ? parseInt(parkingSpots) : null,
        lot_size: lotSize ? parseInt(lotSize) : null,
        price: price ? parseFloat(price) : null,
        is_built: isBuilt,
        is_furnished: isFurnished,
        period: selectedOffer?.value === 'Rent' ? period : null,
      };

      if (isEditing) {
        const { error: propError } = await supabase
          .from('properties')
          .update(propPayload)
          .eq('id', editProperty.id);

        if (propError) throw propError;

        const existingDetails = firstRelation(editProperty.details_properties);
        const { error: detailsError } = existingDetails
          ? await supabase.from('details_properties').update(detailsPayload).eq('id_property', editProperty.id)
          : await supabase.from('details_properties').insert({ id_property: editProperty.id, ...detailsPayload });

        if (detailsError) throw detailsError;

        Alert.alert('¡Listo!', 'Propiedad actualizada correctamente.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const { data: propData, error: propError } = await supabase
          .from('properties')
          .insert({ ...propPayload, id_advisor: user.id, status: 'available' })
          .select('id')
          .single();

        if (propError) throw propError;
        const propertyId = propData.id;

        if (areaSqm || bedrooms || bathrooms || halfBath || parkingSpots || lotSize || price) {
          const { error: detailsError } = await supabase
            .from('details_properties')
            .insert({ id_property: propertyId, ...detailsPayload });

          if (detailsError) throw detailsError;
        }

        Alert.alert('¡Listo!', 'Propiedad creada correctamente.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar la propiedad.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepBar}>
      {STEPS.map((label, i) => (
        <TouchableOpacity
          key={label}
          style={styles.stepItem}
          onPress={() => i <= step && setStep(i)}
          disabled={i > step}
        >
          <View style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone]}>
            {i < step ? (
              <Ionicons name="checkmark" size={12} color="#fff" />
            ) : (
              <Text style={[styles.stepNumber, i === step && styles.stepNumberActive]}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, i === step && styles.stepLabelActive, i < step && styles.stepLabelDone]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderInfoStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.stepCardTitle}>Información básica</Text>
      <Text style={styles.stepCardDesc}>Cuéntanos sobre la propiedad</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Casa en las lomas"
          placeholderTextColor="#6B7280"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe la propiedad..."
          placeholderTextColor="#6B7280"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Dirección</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Calle y número, colonia, ciudad..."
          placeholderTextColor="#6B7280"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Imagen</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePickerPlaceholder}>
              <Ionicons name="camera-outline" size={28} color="#6B7280" />
              <Text style={styles.imagePickerText}>Seleccionar imagen</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderClientStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.stepCardTitle}>Cliente</Text>
      <Text style={styles.stepCardDesc}>Busca por cédula o agrega un nuevo cliente</Text>

      {selectedClientId ? (
        <View style={styles.clientSelected}>
          <View className='bg-emerald-500/20 p-5 rounded-full'>
            <Ionicons name="person-outline" size={36} color="#10B981" />
          </View>
          <Text style={styles.clientSelectedName}>{selectedClientName}</Text>
          <TouchableOpacity style={styles.clientChangeButton} onPress={clearSelectedClient} className='bg-red-500 py-2 px-5 rounded-full'>
            <Ionicons name="close-outline" size={18} color="#fff" />
            <Text style={styles.clientChangeText}>Cambiar cliente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.label}>Buscar por cédula</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={searchCedula}
              onChangeText={setSearchCedula}
              placeholder="Cédula de identidad"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.searchButton} onPress={searchClientByCedula} disabled={searchingClient}>
              {searchingClient ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {clientSearchResult !== null && clientSearchResult.length > 0 && (
            <View style={styles.searchResults}>
              {clientSearchResult.map((c) => (
                <TouchableOpacity key={c.id} style={styles.clientResultRow} onPress={() => selectClient(c)}>
                  <Ionicons name="person-outline" size={20} color="#D1D5DB" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientResultName}>
                      {c.name}{c.last_name ? ' ' + c.last_name : ''}
                    </Text>
                    <Text style={styles.clientResultCedula}>C.I. {c.national_id}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color="#cc2d19" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {clientSearchResult !== null && clientSearchResult.length === 0 && (
            <>
              <Text style={styles.noResultText}>No se encontró ningún cliente con esa cédula</Text>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Agregar nuevo cliente</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Cédula *</Text>
                <TextInput
                  style={styles.input}
                  value={newCedula}
                  onChangeText={setNewCedula}
                  placeholder="Cédula de identidad"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Nombre del cliente"
                  placeholderTextColor="#6B7280"
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Apellido</Text>
                  <TextInput
                    style={styles.input}
                    value={newLastName}
                    onChangeText={setNewLastName}
                    placeholder="Apellido"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View style={[styles.field, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.label}>Teléfono</Text>
                  <TextInput
                    style={styles.input}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    placeholder="Teléfono"
                    placeholderTextColor="#6B7280"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.createClientButton} onPress={createClient} disabled={creatingClient}>
                {creatingClient ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="person-add" size={18} color="#fff" />
                )}
                <Text style={styles.createClientText}>Agregar cliente</Text>
              </TouchableOpacity>
            </>
          )}

          {clientSearchResult === null && (
            <Text style={styles.noResultText}>Ingresa una cédula y presiona buscar</Text>
          )}
        </>
      )}
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.stepCardTitle}>Ubicación</Text>
      <Text style={styles.stepCardDesc}>Arrastra el marcador o usa tu ubicación actual</Text>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={mapStyle}
          region={region}
          onPress={handleMapPress}
        >
          {latitude && longitude && (
            <Marker
              coordinate={{ latitude, longitude }}
              draggable
              onDragEnd={handleMarkerDrag}
              title="Ubicación"
              pinColor="#cc2d19"
            />
          )}
        </MapView>
      </View>

      <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation} disabled={locating}>
        <Ionicons name={locating ? 'sync' : 'locate'} size={18} color="#cc2d19" />
        <Text style={styles.locationButtonText}>
          {locating ? 'Obteniendo ubicación...' : latitude ? 'Actualizar ubicación' : 'Usar mi ubicación actual'}
        </Text>
      </TouchableOpacity>

      {latitude && longitude && (
        <Text style={styles.coordsText}>{latitude.toFixed(5)}, {longitude.toFixed(5)}</Text>
      )}
    </View>
  );

  const renderTypeStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.stepCardTitle}>Clasificación</Text>
      <Text style={styles.stepCardDesc}>Tipo de propiedad y tipo de oferta</Text>

      <Text style={styles.label}>Tipo de propiedad</Text>
      {loadingTypes ? (
        <ActivityIndicator size="small" color="#cc2d19" />
      ) : (
        <View style={styles.chipsRow}>
          {typeProperties.map((tp) => {
            const active = selectedTypeId === tp.id;
            return (
              <TouchableOpacity
                key={tp.id}
                style={[styles.chip, active && { backgroundColor: tp.color + '25', borderColor: tp.color }]}
                onPress={() => setSelectedTypeId(tp.id)}
              >
                <Text style={[styles.chipText, active && { color: tp.color, fontWeight: '700' }]}>
                  {tp.value}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={[styles.label, { marginTop: 16 }]}>Tipo de oferta</Text>
      {loadingTypes ? (
        <ActivityIndicator size="small" color="#cc2d19" />
      ) : (
        <View style={styles.chipsRow}>
          {typeOffers.map((to) => {
            const active = selectedOfferId === to.id;
            return (
              <TouchableOpacity
                key={to.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedOfferId(to.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {to.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.stepCardTitle}>Detalles</Text>
      <Text style={styles.stepCardDesc}>Medidas y características</Text>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Área (m²) *</Text>
          <TextInput
            style={styles.input}
            value={areaSqm}
            onChangeText={setAreaSqm}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: 10 }]}>
          <Text style={styles.label}>Terreno (m²)</Text>
          <TextInput
            style={styles.input}
            value={lotSize}
            onChangeText={setLotSize}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Habitaciones</Text>
          <TextInput
            style={styles.input}
            value={bedrooms}
            onChangeText={setBedrooms}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: 10 }]}>
          <Text style={styles.label}>Baños</Text>
          <TextInput
            style={styles.input}
            value={bathrooms}
            onChangeText={setBathrooms}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Medios baños</Text>
          <TextInput
            style={styles.input}
            value={halfBath}
            onChangeText={setHalfBath}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: 10 }]}>
          <Text style={styles.label}>Estacionamientos</Text>
          <TextInput
            style={styles.input}
            value={parkingSpots}
            onChangeText={setParkingSpots}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.toggle, isBuilt && styles.toggleActive]}
        onPress={() => setIsBuilt(!isBuilt)}
      >
        <Ionicons name={isBuilt ? 'checkmark-circle' : 'close-circle'} size={20} color={isBuilt ? '#10B981' : '#6B7280'} />
        <Text style={[styles.toggleText, isBuilt && { color: '#10B981' }]}>Construido</Text>
      </TouchableOpacity>

      {isBuilt && (
        <TouchableOpacity
          style={[styles.toggle, isFurnished && styles.toggleActive]}
          onPress={() => setIsFurnished(!isFurnished)}
        >
          <Ionicons name={isFurnished ? 'checkmark-circle' : 'close-circle'} size={20} color={isFurnished ? '#10B981' : '#6B7280'} />
          <Text style={[styles.toggleText, isFurnished && { color: '#10B981' }]}>Amoblado</Text>
        </TouchableOpacity>
      )}

      {(selectedOffer?.value === 'Rent') && (
        <View style={[styles.field, { marginTop: 12 }]}>
          <Text style={styles.label}>Período de renta</Text>
          <View style={styles.chipsRow}>
            {PERIOD_OPTIONS.map((per) => (
              <TouchableOpacity
                key={per.value}
                style={[styles.chip, period === per.value && styles.chipActive]}
                onPress={() => setPeriod(per.value)}
              >
                <Text style={[styles.chipText, period === per.value && styles.chipTextActive]}>
                  {per.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderPriceStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.stepCardTitle}>Precio</Text>
      <Text style={styles.stepCardDesc}>Define el precio y obtén una recomendación</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Precio ($)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#6B7280"
        />
      </View>

      <TouchableOpacity
        style={styles.recommendButton}
        onPress={fetchAvgPrice}
        disabled={recommending}
      >
        {recommending ? (
          <ActivityIndicator size="small" color="#cc2d19" />
        ) : (
          <Ionicons name="sparkles-outline" size={18} color="#cc2d19" />
        )}
        <Text style={styles.recommendButtonText}>
          {recommending ? 'Calculando...' : avgPricePerSqm ? 'Recalcular recomendación' : 'Recomendar precio'}
        </Text>
      </TouchableOpacity>

      {propertyTypeStats.length > 0 && (
        <View style={styles.statsWrapper}>
          <Text style={styles.statsTitle}>$/m² por tipo de propiedad</Text>
          {propertyTypeStats.map((s) => {
            const matchedType = typeProperties.find(tp => tp.value === s.type);
            const isCurrent = selectedType?.value === s.type;
            return (
              <View key={s.type} style={[styles.statRow, isCurrent && styles.statRowHighlight]}>
                <View style={styles.statLeft}>
                  <View style={[styles.statBadge, { backgroundColor: (matchedType?.color || '#6B7280') + '25' }]}>
                    <Text style={[styles.statBadgeText, { color: matchedType?.color || '#6B7280' }]}>
                      {s.type}
                    </Text>
                  </View>
                  {isCurrent && (
                    <Ionicons name="arrow-forward" size={12} color="#cc2d19" style={{ marginLeft: 4 }} />
                  )}
                </View>
                <Text style={[styles.statAvg, isCurrent && styles.statAvgHighlight]}>
                  {Math.round(s.avg).toLocaleString('en-US')}$/m²
                </Text>
                <Text style={styles.statCount}>({s.count})</Text>
              </View>
            );
          })}
        </View>
      )}

      {avgPricePerSqm !== null && (
        <View style={[styles.averageInfo, { marginTop: 12 }]}>
          <Text style={styles.recommendLabel}>
            Promedio para <Text className='text-gray-100 font-bold'>{selectedType?.value || ''}</Text>:
          </Text>
          <Text className='text-amber-500 text-2xl font-bold'>{Math.round(avgPricePerSqm).toLocaleString('en-US')} $/m²</Text>
        </View>
      )}

      {recommendedPrice !== null && (
        <View style={styles.recommendInfo} className='bg-emerald-500/10'>
          <Text style={styles.recommendLabel}>Precio sugerido:</Text>
          <Text className='text-emerald-500 text-3xl font-bold'>{recommendedPrice.toLocaleString('en-US')} $</Text>
          <TouchableOpacity onPress={() => setPrice(recommendedPrice.toString())} className='bg-emerald-500 py-2 px-5 rounded-full mt-3'>
            <Text className='text-white font-semibold'>Usar este precio</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.label, { marginTop: 16, textAlign: 'center' }]}>Resumen</Text>
      <View style={styles.summaryBox}>
        <SummaryRow label="Título" value={title} />
        <SummaryRow label="Dirección" value={address || '—'} />
        <SummaryRow label="Tipo" value={selectedType?.value || '—'} />
        <SummaryRow label="Oferta" value={selectedOffer?.name || '—'} />
        <SummaryRow label="Estado" value="Disponible" />
        <SummaryRow label="Área" value={areaSqm ? `${areaSqm} m²` : '—'} />
        <SummaryRow label="Habitaciones" value={bedrooms || '—'} />
        <SummaryRow label="Baños" value={bathrooms || '—'} />
        <SummaryRow label="Ubicación" value={latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : '—'} />
        <SummaryRow label="Precio" value={price ? `${parseFloat(price).toLocaleString('en-US')}$` : '—'} last />
      </View>
    </View>
  );

  return (
    <GradientBackground>
      <ScreenHeader title={isEditing ? 'Editar Propiedad' : 'Nueva Propiedad'} onBack={() => navigation.goBack()} theme="dark" />
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderStepIndicator()}

        {step === 0 && renderInfoStep()}
        {step === 1 && renderClientStep()}
        {step === 2 && renderLocationStep()}
        {step === 3 && renderTypeStep()}
        {step === 4 && renderDetailsStep()}
        {step === 5 && renderPriceStep()}

        {step < 5 ? (
          <View style={styles.navRow}>
            {step > 0 ? (
              <TouchableOpacity style={styles.navButtonBack} onPress={prevStep}>
                <Ionicons name="arrow-back" size={18} color="#D1D5DB" />
                <Text style={styles.navButtonBackText}>Anterior</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <TouchableOpacity
              style={[styles.navButtonNext, !canGoNext() && styles.navButtonDisabled]}
              onPress={nextStep}
            >
              <Text style={styles.navButtonNextText}>Siguiente</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
            )}
            <Text style={styles.submitText}>{submitting ? 'Guardando...' : 'Crear Propiedad'}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[summaryStyles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.value}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  label: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  stepBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepDotActive: {
    backgroundColor: '#cc2d19',
    borderColor: '#cc2d19',
  },
  stepDotDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepNumber: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  stepNumberActive: { color: '#fff' },
  stepLabel: { fontSize: 10, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  stepLabelActive: { color: '#cc2d19', fontWeight: '700' },
  stepLabelDone: { color: '#10B981' },

  stepCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepCardTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  stepCardDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2, marginBottom: 8 },

  field: { marginTop: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#D1D5DB', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipActive: { backgroundColor: 'rgba(204, 45, 25, 0.2)', borderColor: '#cc2d19' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#D1D5DB' },
  chipTextActive: { color: '#cc2d19', fontWeight: '700' },

  mapContainer: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginTop: 8 },
  map: { width: '100%', height: 260 },
  locationButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(204, 45, 25, 0.15)', borderRadius: 12, paddingVertical: 10, marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(204, 45, 25, 0.3)',
  },
  locationButtonText: { fontSize: 13, fontWeight: '600', color: '#cc2d19' },
  coordsText: { fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 6 },

  toggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)', 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  toggleActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  toggleText: { fontSize: 14, fontWeight: '500', color: '#9CA3AF' },

  recommendButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(204, 45, 25, 0.08)', borderRadius: 12, paddingVertical: 12, marginTop: 12,
    borderWidth: 1, borderColor: 'rgba(204, 45, 25, 0.2)',
  },
  recommendButtonText: { fontSize: 14, fontWeight: '600', color: '#cc2d19' },
  statsWrapper: { marginTop: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: 12 },
  statsTitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase' },
  statRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  statRowHighlight: { backgroundColor: 'rgba(204, 45, 25, 0.08)', borderRadius: 6, paddingHorizontal: 6, marginHorizontal: -6 },
  statLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statBadgeText: { fontSize: 11, fontWeight: '600' },
  statAvg: { fontSize: 13, fontWeight: '700', color: '#D1D5DB' },
  statAvgHighlight: { color: '#cc2d19', fontSize: 14 },
  statCount: { fontSize: 11, color: '#6B7280', marginLeft: 4 },
  averageInfo: {
    backgroundColor: 'rgba(238, 180, 21, 0.1)',
    borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(156, 156, 156, 0.2)',
  },
  recommendInfo: {
    marginTop: 8, padding: 12,
    borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  recommendLabel: { fontSize: 12, color: '#9CA3AF' },
  recommendValue: { fontSize: 20, fontWeight: '800', color: '#10B981', marginTop: 4 },
  recommendPrice: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 4 },
  usePriceText: { fontSize: 13, fontWeight: '600', color: '#cc2d19', marginTop: 6 },
  summaryBox: { marginTop: 8, padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 12 },

  clientSelected: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  clientSelectedName: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  clientChangeButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  clientChangeText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchButton: {
    backgroundColor: '#cc2d19', borderRadius: 12, padding: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  noResultText: { fontSize: 13, color: '#ff0000ff', textAlign: 'center', marginTop: 8, fontWeight: '500' },
  searchResults: { marginTop: 8, gap: 6 },
  clientResultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  clientResultName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  clientResultCedula: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  dividerText: { fontSize: 12, color: '#6B7280' },
  createClientButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#cc2d19', borderRadius: 12, paddingVertical: 12, marginTop: 12,
  },
  createClientText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  imagePicker: {
    borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  imagePreview: { width: '100%', height: 180, borderRadius: 12 },
  imagePickerPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 6 },
  imagePickerText: { fontSize: 13, color: '#6B7280' },

  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  navButtonBack: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  navButtonBackText: { fontSize: 15, fontWeight: '600', color: '#D1D5DB' },
  navButtonNext: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 12, backgroundColor: '#cc2d19',
  },
  navButtonDisabled: { opacity: 0.5 },
  navButtonNextText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#cc2d19', borderRadius: 14, paddingVertical: 16, marginTop: 20,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
