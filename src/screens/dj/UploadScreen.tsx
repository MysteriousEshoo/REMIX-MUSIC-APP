import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { genres } from '../../data/mockData';
import { haptics } from '../../utils/haptics';

interface UploadScreenProps {
  navigation: any;
}

type UploadStep = 'select' | 'details' | 'checking' | 'publish';

export const UploadScreen: React.FC<UploadScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState<UploadStep>('select');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);

  const handleSelectFile = () => {
    haptics.medium();
    // Simulate file selection
    Alert.alert(
      'Select Audio File',
      'Choose your mix file',
      [
        { text: 'File Manager', onPress: () => setStep('details') },
        { text: 'Record New', onPress: () => setStep('details') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmitForReview = () => {
    if (!title || !selectedGenre) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setStep('checking');
    // Simulate audio fingerprinting check
    setTimeout(() => {
      setStep('publish');
    }, 3000);
  };

  const handlePublish = () => {
    haptics.success();
    Alert.alert('Success!', 'Your mix has been published!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  // Step 1: Select file
  if (step === 'select') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { haptics.light(); navigation.goBack(); }}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Upload Mix</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.centerContent}>
          <TouchableOpacity style={styles.uploadArea} onPress={handleSelectFile}>
            <View style={styles.uploadIconContainer}>
              <Ionicons name="cloud-upload-outline" size={64} color={Colors.primary} />
            </View>
            <Text style={styles.uploadTitle}>Tap to Upload</Text>
            <Text style={styles.uploadSubtitle}>
              MP3, WAV, FLAC, AAC{'\n'}Max file size: 500MB
            </Text>
          </TouchableOpacity>

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Upload Requirements</Text>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.requirementText}>Original content or CC-licensed</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.requirementText}>Minimum 10 minutes duration</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.requirementText}>High quality audio (320kbps+)</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons name="information-circle" size={18} color={Colors.info} />
              <Text style={styles.requirementText}>Audio fingerprinting will check for copyrighted content</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Step 2: Fill details
  if (step === 'details') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { haptics.light(); setStep('select'); }}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Mix Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* File Preview */}
          <View style={styles.filePreview}>
            <View style={styles.fileIcon}>
              <Ionicons name="musical-note" size={24} color={Colors.primary} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>my_mix_final_v3.mp3</Text>
              <Text style={styles.fileMeta}>128 MB · 1:02:34 · 320kbps</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="close-circle" size={24} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Mix title"
              placeholderTextColor={Colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Tell listeners about this mix..."
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Genre Selection */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Genre *</Text>
            <View style={styles.genreGrid}>
              {genres.slice(0, 8).map((genre) => (
                <TouchableOpacity
                  key={genre.id}
                  style={[
                    styles.genreChip,
                    selectedGenre === genre.name && styles.genreChipActive,
                  ]}
                  onPress={() => setSelectedGenre(genre.name)}
                >
                  <Text style={styles.genreEmoji}>{genre.icon}</Text>
                  <Text
                    style={[
                      styles.genreChipText,
                      selectedGenre === genre.name && styles.genreChipTextActive,
                    ]}
                  >
                    {genre.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exclusive Toggle */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsExclusive(!isExclusive)}
          >
            <View style={styles.toggleInfo}>
              <View style={styles.toggleTitleRow}>
                <Ionicons name="diamond" size={18} color={Colors.diamond} />
                <Text style={styles.toggleTitle}>Exclusive Release</Text>
              </View>
              <Text style={styles.toggleDesc}>
                Only subscribers can listen to this mix
              </Text>
            </View>
            <View style={[styles.toggle, isExclusive && styles.toggleActive]}>
              <View style={[styles.toggleKnob, isExclusive && styles.toggleKnobActive]} />
            </View>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!title || !selectedGenre) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitForReview}
          >
            <Ionicons name="shield-checkmark" size={20} color={Colors.white} />
            <Text style={styles.submitText}>Submit for Review</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Step 3: Checking (audio fingerprinting)
  if (step === 'checking') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.checkingContainer}>
            <View style={styles.checkingSpinner}>
              <Ionicons name="scan" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.checkingTitle}>Analyzing Audio</Text>
            <Text style={styles.checkingSubtitle}>
              Running audio fingerprint check to ensure compliance...
            </Text>
            <View style={styles.checkingSteps}>
              <View style={styles.checkingStep}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.checkingStepText}>File uploaded</Text>
              </View>
              <View style={styles.checkingStep}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.checkingStepText}>Format validated</Text>
              </View>
              <View style={styles.checkingStep}>
                <Ionicons name="sync" size={18} color={Colors.primary} />
                <Text style={[styles.checkingStepText, { color: Colors.primary }]}>
                  Audio fingerprint scan in progress...
                </Text>
              </View>
              <View style={styles.checkingStep}>
                <Ionicons name="ellipse-outline" size={18} color={Colors.textTertiary} />
                <Text style={styles.checkingStepText}>Copyright check</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Step 4: Ready to publish
  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>All Clear!</Text>
          <Text style={styles.successSubtitle}>
            Your mix passed the audio fingerprint check. No copyrighted content detected.
          </Text>

          <View style={styles.successDetails}>
            <View style={styles.successDetailItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.successDetailText}>Original content verified</Text>
            </View>
            <View style={styles.successDetailItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.successDetailText}>Audio quality: Excellent</Text>
            </View>
            <View style={styles.successDetailItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.successDetailText}>License: Cleared</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
            <Ionicons name="rocket" size={20} color={Colors.white} />
            <Text style={styles.publishText}>Publish Mix</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => Alert.alert('Scheduled!', 'Mix will be published tomorrow at 12:00 PM')}
          >
            <Text style={styles.scheduleText}>Schedule for Later</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // Upload Area
  uploadArea: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    padding: Spacing.xxxl,
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  uploadIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  uploadTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  uploadSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // Requirements
  requirements: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  requirementsTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  requirementText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },

  // File Preview
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...Typography.body,
    fontWeight: '600',
  },
  fileMeta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Form Fields
  field: {
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },

  // Genre Grid
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  genreChipActive: {
    backgroundColor: Colors.primary,
  },
  genreEmoji: {
    fontSize: 14,
  },
  genreChipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  genreChipTextActive: {
    color: Colors.white,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toggleTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  toggleDesc: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundHighlight,
    justifyContent: 'center',
    paddingHorizontal: 3,
    marginLeft: Spacing.md,
  },
  toggleActive: {
    backgroundColor: Colors.diamond,
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

  // Submit
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 56,
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...Typography.buttonLarge,
    color: Colors.white,
  },

  // Checking
  checkingContainer: {
    alignItems: 'center',
  },
  checkingSpinner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  checkingTitle: {
    ...Typography.h2,
    marginBottom: Spacing.md,
  },
  checkingSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
  },
  checkingSteps: {
    width: '100%',
  },
  checkingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  checkingStepText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },

  // Success
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: Spacing.xl,
  },
  successTitle: {
    ...Typography.h1,
    marginBottom: Spacing.md,
  },
  successSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  successDetails: {
    width: '100%',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  successDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  successDetailText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 56,
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  publishText: {
    ...Typography.buttonLarge,
    color: Colors.white,
  },
  scheduleButton: {
    paddingVertical: Spacing.md,
  },
  scheduleText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
