import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { subscriptionPlans } from '../../data/mockData';
import { haptics } from '../../utils/haptics';

interface SubscriptionScreenProps {
  navigation: any;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState('listener_plus');
  const [isYearly, setIsYearly] = useState(true);

  const handleSubscribe = () => {
    const plan = subscriptionPlans.find(p => p.id === selectedPlan);
    if (!plan) return;
    Alert.alert(
      'Subscribe',
      `Subscribe to ${plan.name} for ${isYearly ? plan.yearlyPrice : plan.price}${plan.period}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: () => Alert.alert('Success!', 'Subscription activated!') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { haptics.light(); navigation.goBack(); }}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Subscription</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, !isYearly && styles.toggleLabelActive]}>
            Monthly
          </Text>
          <TouchableOpacity
            style={styles.toggle}
            onPress={() => { haptics.selection(); setIsYearly(!isYearly); }}
          >
            <View style={[styles.toggleKnob, isYearly && styles.toggleKnobActive]} />
          </TouchableOpacity>
          <Text style={[styles.toggleLabel, isYearly && styles.toggleLabelActive]}>
            Yearly
          </Text>
          {isYearly && (
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>Save 30%</Text>
            </View>
          )}
        </View>

        {/* Plans */}
        {subscriptionPlans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.planCardActive,
              plan.isPopular && styles.planCardPopular,
            ]}
            onPress={() => { haptics.selection(); setSelectedPlan(plan.id); }}
          >
            {plan.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            {plan.isCreator && (
              <View style={styles.creatorBadge}>
                <Ionicons name="musical-notes" size={12} color={Colors.white} />
                <Text style={styles.creatorBadgeText}>FOR CREATORS</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View style={styles.planRadio}>
                {selectedPlan === plan.id && <View style={styles.planRadioActive} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>
                    {isYearly && plan.yearlyPrice
                      ? plan.yearlyPrice.split('/')[0]
                      : plan.price}
                  </Text>
                  <Text style={styles.planPeriod}>
                    /{isYearly && plan.yearlyPrice ? 'year' : 'month'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Features */}
            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
              {plan.notIncluded.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="close" size={16} color={Colors.textTertiary} />
                  <Text style={[styles.featureText, styles.featureNotIncluded]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {/* Subscribe Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.subscribeButton} onPress={() => { haptics.medium(); handleSubscribe(); }}>
            <Text style={styles.subscribeText}>
              {selectedPlan === 'free'
                ? 'Current Plan'
                : `Subscribe to ${
                    subscriptionPlans.find(p => p.id === selectedPlan)?.name
                  }`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.legal}>
            Cancel anytime. By subscribing you agree to our{' '}
            <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  toggleLabel: {
    ...Typography.body,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  toggleLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  saveBadge: {
    backgroundColor: Colors.success + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  saveText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '700',
  },
  planCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardActive: {
    borderColor: Colors.primary,
  },
  planCardPopular: {
    borderColor: Colors.primary + '40',
  },
  popularBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  popularText: {
    ...Typography.labelSmall,
    color: Colors.white,
    fontSize: 10,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    gap: 4,
  },
  creatorBadgeText: {
    ...Typography.labelSmall,
    color: Colors.white,
    fontSize: 10,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  planRadioActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    ...Typography.h3,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    ...Typography.h2,
    color: Colors.primary,
  },
  planPeriod: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  featuresContainer: {
    marginTop: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: Spacing.sm,
  },
  featureText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  featureNotIncluded: {
    color: Colors.textTertiary,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  subscribeText: {
    ...Typography.buttonLarge,
    color: Colors.white,
  },
  legal: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: Colors.primary,
  },
});
