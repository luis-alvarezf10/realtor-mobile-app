require('dotenv').config()
const config = require('./app.json')

module.exports = {
  ...config,
  expo: {
    ...config.expo,
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
    plugins: [
      ...(config.expo.plugins || []),
      '@react-native-community/datetimepicker',
    ],
  },
}
