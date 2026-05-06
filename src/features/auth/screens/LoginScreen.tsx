import React, { useState } from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActionButton } from '../../../shared/components/buttons/ActionButton';
import { CustomField } from '../../../shared/components/inputs/CustomField';

export function LoginScreen({ navigation }: any) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <View className="w-full px-6" style={{ maxWidth: 384 }}>
        <View className="flex items-center justify-center gap-2">
          <Text className="text-3xl font-bold text-gray-900">Go Hunter</Text>
          <Text className="text-gray-600 mt-2 text-center">Una solucion integral para asesores inmobiliarios</Text>
          <Text className="mt-2 text-base text-gray-600">Inicia sesión en tu cuenta</Text>
        </View>

        <View>
          <CustomField
            label="Email"
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<MaterialCommunityIcons name="email" size={20} color="#9ca3af" />}
          />

          <CustomField
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            leftIcon={<MaterialCommunityIcons name="lock" size={20} color="#9ca3af" />}
            rightIcon={
              <MaterialCommunityIcons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#9ca3af"
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <ActionButton
            className="mt-4 w-full"
            onPress={() => navigation.navigate('Main')}
            size="lg"
          >
            Iniciar Sesión
          </ActionButton>

          <View className="mt-4 flex-row flex-wrap justify-center">
            <Text className="text-gray-600">¿No tienes cuenta? </Text>
            <Text
              className="font-semibold text-red-600"
              onPress={() => navigation.navigate('Register')}
            >
              Regístrate
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
