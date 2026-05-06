import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddMenuProps {
  visible: boolean;
  onClose: () => void;
  onAddProperty: () => void;
  onAddAppointment: () => void;
  onAddOfferStatus: () => void;
  onUseAI: () => void;
}

export function AddMenu({ visible, onClose, onAddProperty, onAddAppointment, onAddOfferStatus, onUseAI }: AddMenuProps) {
  const menuItems = [
    { icon: 'home-outline', label: 'Propiedad', description: 'Aumenta tu inventario', action: onAddProperty },
    { icon: 'calendar-outline', label: 'Cita', description: 'Agenga una cita a tu calendario', action: onAddAppointment },
    { icon: 'document-text-outline', label: 'Status de Oferta', description: 'Actualiza el estado de una oferta', action: onAddOfferStatus },
    { icon: 'mic-outline', label: 'Registro por Voz', description: 'Dicta tus movimientos con Hunter AI', action: onUseAI}
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View style={styles.dialogContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.dialog}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.menuItem}
                    onPress={() => {
                      item.action();
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.iconContainer}>
                      <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuDescription}>{item.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  textContainer: {
    flexShrink: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  menuDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
