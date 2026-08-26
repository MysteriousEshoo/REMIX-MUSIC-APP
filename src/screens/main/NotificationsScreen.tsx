import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { haptics } from '../../utils/haptics';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationsScreenProps {
  navigation: any;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  timeAgo: string;
  isRead: boolean;
  djAvatar?: string;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Notifications fetch karo — SIRF SUPABASE SE
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) {
        // Empty hai toh empty dikhao — MOCK DATA MAT DIKHAO
        setNotifications([]);
      } else {
        const formatted: NotificationItem[] = data.map((n: any) => ({
          id: n.id,
          type: n.type || 'system',
          title: n.title,
          message: n.message,
          timeAgo: formatTimeAgo(n.created_at),
          isRead: n.is_read || false,
        }));
        setNotifications(formatted);
      }
    } catch (err) {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const toggleSelectMode = useCallback(() => {
    haptics.selection();
    setIsSelectMode(prev => !prev);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    haptics.light();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    haptics.medium();
    Alert.alert(
      'Delete Notifications',
      `Delete ${selectedIds.size} notification(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const idsToDelete = Array.from(selectedIds);

            // Pehle local se hatao — turant dikhe
            setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
            setSelectedIds(new Set());
            setIsSelectMode(false);

            // Phir Supabase se delete karo
            if (user) {
              await supabase
                .from('notifications')
                .delete()
                .in('id', idsToDelete);
            }
          },
        },
      ]
    );
  }, [selectedIds, user]);

  const deleteAll = useCallback(async () => {
    haptics.medium();
    Alert.alert(
      'Delete All',
      'Delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            // Pehle local se clear karo
            setNotifications([]);

            // Supabase se delete karo
            if (user) {
              await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id);
            }
          },
        },
      ]
    );
  }, [user]);

  const selectAll = useCallback(() => {
    haptics.selection();
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    }
  }, [notifications, selectedIds.size]);

  const markAsRead = useCallback(async (id: string) => {
    if (isSelectMode) {
      toggleSelect(id);
      return;
    }

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );

    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    }
  }, [isSelectMode, toggleSelect, user]);

  const markAllAsRead = useCallback(async () => {
    haptics.selection();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    }
  }, [user]);

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
        <TouchableOpacity onPress={() => { 
          haptics.light(); 
          setIsSelectMode(false);
          navigation.goBack(); 
        }}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {isSelectMode ? (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={selectAll}>
              <Text style={styles.markAllRead}>
                {selectedIds.size === notifications.length ? 'Deselect' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerActions}>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={toggleSelectMode} style={{ marginRight: Spacing.md }}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            )}
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead}>
                <Text style={styles.markAllRead}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Select Mode Toolbar */}
      {isSelectMode && selectedIds.size > 0 && (
        <View style={styles.selectToolbar}>
          <Text style={styles.selectCount}>{selectedIds.size} selected</Text>
          <TouchableOpacity onPress={deleteSelected} style={styles.deleteButton}>
            <Ionicons name="trash" size={16} color={Colors.white} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Empty State */}
        {notifications.length === 0 && !isLoading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>You're all caught up!</Text>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        )}

        {/* Unread Section */}
        {notifications.some(n => !n.isRead) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New</Text>
            {notifications
              .filter(n => !n.isRead)
              .map(notification => {
                const icon = getNotificationIcon(notification.type);
                const isSelected = selectedIds.has(notification.id);
                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      styles.notificationUnread,
                      isSelected && styles.notificationSelected,
                    ]}
                    onPress={() => { haptics.light(); markAsRead(notification.id); }}
                    onLongPress={() => {
                      if (!isSelectMode) {
                        haptics.medium();
                        setIsSelectMode(true);
                        setSelectedIds(new Set([notification.id]));
                      }
                    }}
                  >
                    {isSelectMode && (
                      <View style={styles.checkboxContainer}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color={Colors.white} />
                          )}
                        </View>
                      </View>
                    )}
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
                  </TouchableOpacity>
                );
              })}
          </View>
        )}

        {/* Earlier Section */}
        {notifications.filter(n => n.isRead).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Earlier</Text>
              {!isSelectMode && (
                <TouchableOpacity onPress={deleteAll} style={styles.deleteAllButton}>
                  <Ionicons name="trash-outline" size={12} color={Colors.error} />
                  <Text style={styles.deleteAllText}>Delete All</Text>
                </TouchableOpacity>
              )}
            </View>
            {notifications
              .filter(n => n.isRead)
              .map(notification => {
                const icon = getNotificationIcon(notification.type);
                const isSelected = selectedIds.has(notification.id);
                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      isSelected && styles.notificationSelected,
                    ]}
                    onPress={() => { haptics.light(); markAsRead(notification.id); }}
                    onLongPress={() => {
                      if (!isSelectMode) {
                        haptics.medium();
                        setIsSelectMode(true);
                        setSelectedIds(new Set([notification.id]));
                      }
                    }}
                  >
                    {isSelectMode && (
                      <View style={styles.checkboxContainer}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color={Colors.white} />
                          )}
                        </View>
                      </View>
                    )}
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
                  </TouchableOpacity>
                );
              })}
          </View>
        )}

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllRead: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  selectToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '30',
  },
  selectCount: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  deleteButtonText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl * 3,
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    color: Colors.textSecondary,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: 4,
    marginBottom: Spacing.md,
  },
  deleteAllText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
    fontSize: 10,
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
  notificationSelected: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  checkboxContainer: {
    marginRight: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
});
