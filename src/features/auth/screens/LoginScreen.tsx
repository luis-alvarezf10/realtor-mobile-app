import { View, Text, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { ActionButton } from '../../../shared/components/buttons/ActionButton';

export function LoginScreen({ navigation }: any) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <View className="w-full px-6" style={{ maxWidth: 384 }}>
        <View className="flex items-center justify-center gap-2">
          <Text className="text-3xl font-bold text-gray-900">Go Hunter</Text>
          <Text className="text-gray-600 mt-2 text-center">Una solucion integral para asesores inmobiliarios</Text>
          <Text className="mt-2 text-base text-gray-600">Inicia sesión en tu cuenta</Text>
        </View>

        <View>
          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-gray-700">Email</Text>
            <TextInput
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3"
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-gray-700">Contraseña</Text>
            <TextInput
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3"
              placeholder="••••••••"
              secureTextEntry
            />
          </View>

          <ActionButton
            className="mt-4 w-full"
            onPress={() => navigation.navigate('Main')}
            size="lg"
          >
            Iniciar Sesión
          </ActionButton>

          <View className="mt-4 flex-row flex-wrap justify-center">
            <Text className="text-gray-600">¿No tienes cuenta? </Text>
            <Link href="/register">
              <Text className="font-semibold text-red-600">Regístrate</Text>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}
