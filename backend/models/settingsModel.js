import mongoose from 'mongoose';

const settingsSchema = mongoose.Schema(
  {
    appName: {
      type: String,
      default: 'Smart Mall Platform',
    },
    systemStatus: {
      type: String,
      enum: ['Online', 'Maintenance', 'Offline'],
      default: 'Online',
    },
    apiConfiguration: {
      googleMapsKey: { type: String, default: 'AIzaSyA1...' },
      weatherApiKey: { type: String, default: '9f8e7d...' },
      supportEmail: { type: String, default: 'support@smartmall.com' },
    },
    themeSettings: {
      primaryColor: { type: String, default: '#6366f1' }, // Indigo
      secondaryColor: { type: String, default: '#a855f7' }, // Purple
      defaultTheme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    },
    featureToggles: {
      parkingSystem: { type: Boolean, default: true },
      queueSystem: { type: Boolean, default: true },
      restroomSystem: { type: Boolean, default: true },
      offersSystem: { type: Boolean, default: true },
      googleAuth: { type: Boolean, default: true },
    },
    rbacPermissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        'Super Admin': ['all'],
        'Mall Admin': ['view_all_mall', 'manage_mall_ops'],
        'Shop Owner': ['manage_shop', 'manage_inventory'],
        'Staff': ['update_ops'],
        'User': ['view_mall'],
      },
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
