import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { GradientBackground } from '../../../shared/components/GradientBackground';
import { useAuth } from '../../../shared/context/AuthContext';
import { supabase } from '../../../lib/supabase';

type PropertyOption = {
  id: string;
  title: string;
  address: string | null;
};

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDateValue(value?: string) {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDisplayTime(date: Date) {
  return date.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit' });
}

export function AddAppointmentScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [dateValue, setDateValue] = useState(() => parseDateValue(route?.params?.date));
  const [timeValue, setTimeValue] = useState(() => {
    const value = new Date();
    value.setMinutes(0, 0, 0);
    return value;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(route?.params?.propertyId || null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) || null,
    [properties, selectedPropertyId]
  );

  const filteredProperties = useMemo(() => {
    const query = propertySearch.trim().toLowerCase();
    if (!query) return properties;
    return properties.filter((property) =>
      property.title.toLowerCase().includes(query) ||
      property.address?.toLowerCase().includes(query)
    );
  }, [properties, propertySearch]);

  const doneInputProps = {
    returnKeyType: 'done' as const,
    blurOnSubmit: true,
    onSubmitEditing: () => Keyboard.dismiss(),
  };

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user?.id) {
        setLoadingProperties(false);
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select('id, title, address')
        .eq('id_advisor', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties for appointment:', error);
      } else {
        setProperties((data || []) as PropertyOption[]);
      }
      setLoadingProperties(false);
    };

    fetchProperties();
  }, [user?.id]);

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) setDateValue(selectedDate);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    if (selectedTime) setTimeValue(selectedTime);
  };

  const validate = () => {
    if (!description.trim()) {
      Alert.alert('Campo requerido', 'Agrega una descripción para la cita.');
      return false;
    }

    if (!clientName.trim()) {
      Alert.alert('Campo requerido', 'Agrega el nombre del cliente.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user?.id || submitting || !validate()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('schedule')
        .insert({
          id_realtor: user.id,
          id_property: selectedPropertyId,
          description: description.trim(),
          client_name: clientName.trim(),
          date: formatDateValue(dateValue),
          time: formatTimeValue(timeValue),
          status: 'Pendiente',
        });

      if (error) throw error;

      Alert.alert('Cita agregada', 'La cita se guardó correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      Alert.alert('Error', err.message || 'No se pudo guardar la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectProperty = (property: PropertyOption) => {
    setSelectedPropertyId(property.id);
    setShowPropertyModal(false);
    setPropertySearch('');
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScreenHeader title="Nueva cita" onBack={() => navigation.goBack()} theme="dark" />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Detalles</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ej: Visita a la propiedad"
                placeholderTextColor="#6B7280"
                {...doneInputProps}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Cliente *</Text>
              <TextInput
                style={styles.input}
                value={clientName}
                onChangeText={setClientName}
                placeholder="Nombre del cliente"
                placeholderTextColor="#6B7280"
                {...doneInputProps}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>Fecha</Text>
                <TouchableOpacity style={styles.nativePickerButton} onPress={() => setShowDatePicker(true)} activeOpacity={0.85}>
                  <Ionicons name="calendar-outline" size={18} color="#cc2d19" />
                  <Text style={styles.nativePickerText} numberOfLines={1}>{formatDisplayDate(dateValue)}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>Hora</Text>
                <TouchableOpacity style={styles.nativePickerButton} onPress={() => setShowTimePicker(true)} activeOpacity={0.85}>
                  <Ionicons name="time-outline" size={18} color="#cc2d19" />
                  <Text style={styles.nativePickerText}>{formatDisplayTime(timeValue)}</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Propiedad</Text>
              {selectedProperty && (
                <TouchableOpacity onPress={() => setSelectedPropertyId(null)}>
                  <Text style={styles.clearText}>Quitar</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.propertySelector} onPress={() => setShowPropertyModal(true)} activeOpacity={0.85}>
              <View style={styles.propertySelectorIcon}>
                <Ionicons name={selectedProperty ? 'home' : 'search'} size={20} color="#cc2d19" />
              </View>
              <View style={styles.propertySelectorText}>
                <Text style={styles.propertySelectorTitle} numberOfLines={1}>
                  {selectedProperty?.title || 'Buscar propiedad'}
                </Text>
                <Text style={styles.propertySelectorSubtitle} numberOfLines={1}>
                  {selectedProperty?.address || 'Opcional, asociada a esta cita'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.statusNote}>
            <Ionicons name="time-outline" size={18} color="#FBBF24" />
            <Text style={styles.statusNoteText}>La cita se guardará como Pendiente.</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.86}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="calendar" size={20} color="#fff" />
            )}
            <Text style={styles.submitText}>{submitting ? 'Guardando...' : 'Guardar cita'}</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={showPropertyModal} animationType="slide" transparent onRequestClose={() => setShowPropertyModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.propertyModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar propiedad</Text>
                <TouchableOpacity onPress={() => setShowPropertyModal(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  value={propertySearch}
                  onChangeText={setPropertySearch}
                  placeholder="Buscar por título o dirección"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {loadingProperties ? (
                <View style={styles.modalEmpty}>
                  <ActivityIndicator size="small" color="#cc2d19" />
                </View>
              ) : filteredProperties.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>No se encontraron propiedades.</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.modalList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {filteredProperties.map((property) => {
                    const isActive = selectedPropertyId === property.id;
                    return (
                      <TouchableOpacity
                        key={property.id}
                        style={[styles.propertyOption, isActive && styles.propertyOptionActive]}
                        onPress={() => selectProperty(property)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.propertyOptionIcon, isActive && styles.propertyOptionIconActive]}>
                          <Ionicons name={isActive ? 'home' : 'home-outline'} size={20} color={isActive ? '#fff' : '#cc2d19'} />
                        </View>
                        <View style={styles.propertyOptionBody}>
                          <Text style={styles.propertyOptionTitle} numberOfLines={1}>{property.title}</Text>
                          {!!property.address && (
                            <Text style={styles.propertyOptionAddress} numberOfLines={1}>{property.address}</Text>
                          )}
                        </View>
                        {isActive && <Ionicons name="checkmark-circle" size={22} color="#10B981" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={showDatePicker} animationType="slide" transparent onRequestClose={() => setShowDatePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Elegir fecha</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerDoneText}>Listo</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerPreview}>
                <Ionicons name="calendar-outline" size={18} color="#cc2d19" />
                <Text style={styles.pickerPreviewText}>{formatDisplayDate(dateValue)}</Text>
              </View>
              <View style={styles.pickerFrame}>
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                  onChange={handleDateChange}
                  themeVariant="dark"
                  style={styles.datePicker}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showTimePicker} animationType="slide" transparent onRequestClose={() => setShowTimePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Elegir hora</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerDoneText}>Listo</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerPreview}>
                <Ionicons name="time-outline" size={18} color="#cc2d19" />
                <Text style={styles.pickerPreviewText}>{formatDisplayTime(timeValue)}</Text>
              </View>
              <View style={styles.pickerFrame}>
                <DateTimePicker
                  value={timeValue}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  themeVariant="dark"
                  style={styles.timePicker}
                />
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 130,
    gap: 14,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  clearText: {
    color: '#ff6b57',
    fontSize: 13,
    fontWeight: '800',
  },
  field: {
    marginTop: 14,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  nativePickerButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
  },
  nativePickerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  propertySelector: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
  },
  propertySelectorIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(204, 45, 25, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertySelectorText: {
    flex: 1,
  },
  propertySelectorTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  propertySelectorSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 3,
  },
  statusNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.24)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusNoteText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#cc2d19',
    borderRadius: 16,
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    justifyContent: 'flex-end',
  },
  propertyModal: {
    maxHeight: '82%',
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pickerSheet: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'stretch',
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pickerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  pickerCancelText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '800',
  },
  pickerDoneText: {
    color: '#cc2d19',
    fontSize: 14,
    fontWeight: '900',
  },
  pickerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(204, 45, 25, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 45, 25, 0.22)',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  pickerPreviewText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  pickerFrame: {
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  datePicker: {
    width: '100%',
    alignSelf: 'center',
  },
  timePicker: {
    width: 320,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
  },
  modalClose: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 12,
  },
  modalList: {
    gap: 10,
    paddingBottom: 18,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  modalEmptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
  },
  propertyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  propertyOptionActive: {
    borderColor: 'rgba(16, 185, 129, 0.55)',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
  },
  propertyOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(204, 45, 25, 0.14)',
  },
  propertyOptionIconActive: {
    backgroundColor: '#10B981',
  },
  propertyOptionBody: {
    flex: 1,
  },
  propertyOptionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  propertyOptionAddress: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 3,
  },
});
