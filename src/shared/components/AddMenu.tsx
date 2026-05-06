import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddMenuProps {
  visible: boolean;
  onClose: () => void;
  onAddProperty: () => void;
  onAddAppointment: () => void;
  onAddOfferStatus: () => void;
}

export function AddMenu({ visible, onClose, onAddProperty, onAddAppointment, onAddOfferStatus }: AddMenuProps) {
  const menuItems = [
    { icon: 'home-outline', label: 'Propiedad', action: onAddProperty },
    { icon: 'calendar-outline', label: 'Cita', action: onAddAppointment },
    { icon: 'document-text-outline', label: 'Status de Oferta', action: onAddOfferStatus },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              <View style={styles.menuContent}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={() => {
                      item.action();
                      onClose();
                    }}
                  >
                    <Ionicons name={item.icon as any} size={24} color="#cc2d19" />
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: 'transparent',
    paddingBottom: 20,
  },
  menuContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 16,
  },
});
