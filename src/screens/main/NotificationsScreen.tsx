import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { mockNotifications } from '../../data/mockData';
import { haptics } from '../../utils/haptics';

interface NotificationsScreenProps {
  navigation: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow': return { name: 'person-add', color: Colors.info };
      case 'like': return { name: 'heart', color: Colors.error };
      case 'tip': return { name: 'gift', color: Colors.gold };
      case 'release': return { name: 'musical-note', color: Colors.primary };
      case 'contest': return { name: 'trophy', color: Colors.warning };
      case 'system': return { name: 'information-circle', color: Colors.textSecondary };
      default: return { name: 'notifications', color: Colors.textSecondary };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { haptics.light(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => { haptics.selection(); markAllAsRead(); }}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Unread Section */}
        {notifications.some(n => !n.isRead) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New</Text>
            {notifications
              .filter(n => !n.isRead)
              .map(notification => {
                const icon = getNotificationIcon(notification.type);
                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[styles.notificationCard, styles.notificationUnread]}
                    onPress={() => { haptics.light(); markAsRead(notification.id); }}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                      <Ionicons name={icon.name as any} size={20} color={icon.color} />
                    </View>
                    <View style={styles.notificationInfo}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <View style={styles.unreadDot} />
                      </View>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>{notification.timeAgo}</Text>
                    </View>
                    {notification.dj && (
                      <Image
                        source={{ uri: notification.dj.avatar }}
                        style={styles.notificationAvatar}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
        )}

        {/* Earlier Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earlier</Text>
          {notifications
            .filter(n => n.isRead)
            .map(notification => {
              const icon = getNotificationIcon(notification.type);
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={styles.notificationCard}
                  onPress={() => { haptics.light(); markAsRead(notification.id); }}
                >
                  <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                    <Ionicons name={icon.name as any} size={20} color={icon.color} />
                  </View>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>{notification.timeAgo}</Text>
                  </View>
                  {notification.dj && (
                    <Image
                      source={{ uri: notification.dj.avatar }}
                      style={styles.notificationAvatar}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
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
  markAllRead: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  notificationUnread: {
    backgroundColor: Colors.primary + '08',
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
  },
  notificationTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  notificationMessage: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  notificationTime: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: Spacing.sm,
  },
});
