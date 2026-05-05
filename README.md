# Go Hunter Realtor - Mobile App

Aplicación móvil para asesores inmobiliarios desarrollada con React Native, Expo y NativeWind (Tailwind CSS).

## Características Principales

### Para Asesores Inmobiliarios:
- **Gestión de Propiedades**: Subir y administrar propiedades inmobiliarias
- **Agendamiento de Citas**: Programar y gestionar citas con clientes
- **Gestión de Clientes**: Mantener base de datos de clientes
- **Notificaciones**: Alertas de citas pendientes de la semana
- **Verificación GPS**: Confirmar asistencia a citas mediante geolocalización
- **Reportes y Estadísticas**: Ver ventas realizadas, citas y métricas de rendimiento

### Para Supervisores/Administradores:
- **Vista de Estadísticas**: Monitorear rendimiento de asesores
- **Reportes de Equipo**: Ver métricas globales de la empresa

## Arquitectura: Screaming Architecture

```
src/
├── features/           # Módulos principales por funcionalidad
│   ├── auth/          # Autenticación y registro
│   ├── properties/    # Gestión de propiedades
│   ├── appointments/  # Citas y agendamiento
│   ├── clients/       # Gestión de clientes
│   ├── reports/       # Reportes y estadísticas
│   ├── notifications/ # Sistema de notificaciones
│   └── location/      # Seguimiento GPS
└── shared/            # Componentes y utilidades compartidas
    ├── components/
    ├── hooks/
    ├── services/
    ├── utils/
    └── styles/
```

## Tecnologías Utilizadas

- **React Native** con **Expo**
- **TypeScript**
- **NativeWind** (Tailwind CSS para React Native)
- **React Navigation** (Navegación)
- **Expo Location** (GPS y geolocalización)
- **Expo Vector Icons**

## Instalación

```bash
cd go-hunter-realtor
npm install
npm run android  # o ios, web
```

## Scripts Disponibles

- `npm run android` - Ejecutar en Android
- `npm run ios` - Ejecutar en iOS (requiere macOS)
- `npm run web` - Ejecutar en navegador

## Próximos Pasos

1. Integrar con backend existente (API web)
2. Implementar notificaciones push reales
3. Configurar base de datos local (SQLite/Realm)
4. Implementar autenticación real con JWT
5. Agregar mapas para visualización de propiedades
6. Desarrollar panel de administrador completo
