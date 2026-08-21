import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';
import { haptics } from '../../utils/haptics';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [offlineDownloads, setOfflineDownloads] = useState(true);
  const [highQuality, setHighQuality] = useState(true);

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', onPress: () => haptics.selection() },
        { icon: 'mail-outline', label: 'Change Email', onPress: () => haptics.selection() },
        { icon: 'lock-closed-outline', label: 'Change Password', onPress: () => haptics.selection() },
        { icon: 'card-outline', label: 'Payment Methods', onPress: () => haptics.selection() },
      ],
    },
    {
      title: 'Privacy',
      items: [
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', onPress: () => haptics.selection() },
        { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => haptics.selection() },
        { icon: 'eye-off-outline', label: 'Blocked Users', onPress: () => haptics.selection() },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { haptics.light(); navigation.goBack(); }}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Sections */}
        {sections.map((section, sIndex) => (
          <View key={sIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, iIndex) => (
                <TouchableOpacity
                  key={iIndex}
                  style={[
                    styles.settingItem,
                    iIndex < section.items.length - 1 && styles.settingItemBorder,
                  ]}
                  onPress={item.onPress}
                >
                  <Ionicons name={item.icon as any} size={22} color={Colors.textSecondary} />
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Toggle Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionCard}>
            <View style={[styles.settingItem, styles.settingItemBorder]}>
              <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={(v) => { haptics.selection(); setNotifications(v); }}
                trackColor={{ false: Colors.backgroundHighlight, true: Colors.primary + '60' }}
                thumbColor={notifications ? Colors.primary : Colors.textTertiary}
              />
            </View>
            <View style={[styles.settingItem, styles.settingItemBorder]}>
              <Ionicons name="mail-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Switch
                value={emailNotifications}
                onValueChange={(v) => { haptics.selection(); setEmailNotifications(v); }}
                trackColor={{ false: Colors.backgroundHighlight, true: Colors.primary + '60' }}
                thumbColor={emailNotifications ? Colors.primary : Colors.textTertiary}
              />
            </View>
            <View style={[styles.settingItem, styles.settingItemBorder]}>
              <Ionicons name="download-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Auto-Download Favorites</Text>
              <Switch
                value={offlineDownloads}
                onValueChange={(v) => { haptics.selection(); setOfflineDownloads(v); }}
                trackColor={{ false: Colors.backgroundHighlight, true: Colors.primary + '60' }}
                thumbColor={offlineDownloads ? Colors.primary : Colors.textTertiary}
              />
            </View>
            <View style={[styles.settingItem, styles.settingItemBorder]}>
              <Ionicons name="musical-note-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>High Quality Audio</Text>
              <Switch
                value={highQuality}
                onValueChange={(v) => { haptics.selection(); setHighQuality(v); }}
                trackColor={{ false: Colors.backgroundHighlight, true: Colors.primary + '60' }}
                thumbColor={highQuality ? Colors.primary : Colors.textTertiary}
              />
            </View>
            <View style={styles.settingItem}>
              <Ionicons name="moon-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={() => { haptics.medium(); toggleTheme(); }}
                trackColor={{ false: Colors.backgroundHighlight, true: Colors.primary + '60' }}
                thumbColor={isDark ? Colors.primary : Colors.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionCard}>
            <View style={[styles.settingItem, styles.settingItemBorder]}>
              <Ionicons name="information-circle-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
            <TouchableOpacity
              style={[styles.settingItem, styles.settingItemBorder]}
              onPress={() => { haptics.light(); Alert.alert('Rate Us', 'Thanks for your support!'); }}
            >
              <Ionicons name="star-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Rate ReMix</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => haptics.selection()}
            >
              <Ionicons name="share-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Share ReMix</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => {
              haptics.warning();
              Alert.alert('Delete Account', 'This action cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive' },
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={styles.dangerText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl + 44,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.md,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  settingValue: {
    ...Typography.body,
    color: Colors.textTertiary,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '10',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  dangerText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '600',
  },
});
