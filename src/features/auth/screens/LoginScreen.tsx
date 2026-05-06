import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActionButton } from '../../../shared/components/buttons/ActionButton';
import { CustomField } from '../../../shared/components/inputs/CustomField';
import { supabase } from '../../../lib/supabase';

export function LoginScreen({ navigation }: any) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        Alert.alert('Error', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Error', 'No se pudo obtener la información del usuario');
        return;
      }

      const { data: stakeholder, error: stakeholderError } = await supabase
        .from('stakeholders')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (stakeholderError || !stakeholder) {
        await supabase.auth.signOut();
        Alert.alert('Error', 'No se encontró tu perfil de usuario');
        return;
      }

      if (stakeholder.role !== 'realtor') {
        await supabase.auth.signOut();
        Alert.alert('Acceso denegado', 'Solo los asesores inmobiliarios (realtor) pueden acceder a esta aplicación');
        return;
      }

      navigation.navigate('Main');
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

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
            value={email}
            onChangeText={setEmail}
            leftIcon={<MaterialCommunityIcons name="email" size={20} color="#9ca3af" />}
          />

          <CustomField
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
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
            onPress={handleLogin}
            size="lg"
            disabled={loading}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
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
