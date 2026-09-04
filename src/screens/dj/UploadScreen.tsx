/**
 * UploadScreen — Creator ke liye mix upload karne ka screen
 *
 * KYUN zaruri hai:
 * - Creator apne mixes yahan se upload kar sake
 * - Audio file Supabase Storage mein jaata hai
 * - Cover image bhi Storage mein jaata hai
 * - Metadata (title, genre, description) songs table mein save hota hai
 * - Progress indicator dikhta hai upload ke dauran
 * - Followers ko push notification jaata hai new song pe
 *
 * STEPS:
 * 1. Select audio file (document picker)
 * 2. Fill details (title, description, genre, cover image)
 * 3. Upload files to Supabase Storage + save metadata to songs table
 * 4. Send notification to all followers
 * 5. Success screen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { genres } from '../../data/mockData';
import { haptics } from '../../utils/haptics';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { notifyNewUpload } from '../../utils/notifications';

interface UploadScreenProps {
  navigation: any;
}

type UploadStep = 'select' | 'details' | 'uploading' | 'success' | 'error';

interface SelectedFile {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<UploadStep>('select');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);

  // File states
  const [audioFile, setAudioFile] = useState<SelectedFile | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Upload states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [songId, setSongId] = useState<string | null>(null);

  // ==================== FILE PICKING ====================

  const handleSelectAudio = useCallback(async () => {
    haptics.medium();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'audio/mpeg',
          'audio/wav',
          'audio/flac',
          'audio/aac',
          'audio/mp4',
          'audio/x-m4a',
          'audio/*',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      // 500MB limit check
      if (file.size && file.size > 500 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Maximum file size is 500MB. Please choose a smaller file.');
        return;
      }

      setAudioFile({
        uri: file.uri,
        name: file.name,
        size: file.size || 0,
        mimeType: file.mimeType || 'audio/mpeg',
      });
      setStep('details');
    } catch (err) {
      console.log('[UploadScreen] Document picker error:', err);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  }, []);

  const handleSelectCoverImage = useCallback(async () => {
    haptics.light();
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Needed', 'Please allow access to your photo library to select a cover image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setCoverImage(result.assets[0].uri);
    } catch (err) {
      console.log('[UploadScreen] Image picker error:', err);
    }
  }, []);

  // ==================== UPLOAD LOGIC ====================

  const handleUpload = useCallback(async () => {
    if (!title || !selectedGenre) {
      Alert.alert('Error', 'Please fill in all required fields (Title and Genre).');
      return;
    }
    if (!audioFile) {
      Alert.alert('Error', 'Please select an audio file first.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload.');
      return;
    }

    haptics.medium();
    setStep('uploading');
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    try {
      // Step 1: Upload audio file to Supabase Storage
      setUploadStatus('Uploading audio file...');
      setUploadProgress(10);

      const audioExt = audioFile.name.split('.').pop() || 'mp3';
      const audioPath = `${user.id}/${Date.now()}_audio.${audioExt}`;

      const audioFormData = new FormData();
      audioFormData.append('file', {
        uri: audioFile.uri,
        name: audioFile.name,
        type: audioFile.mimeType || 'audio/mpeg',
      } as any);

      // Upload audio using supabase storage
      const { data: audioData, error: audioError } = await supabase.storage
        .from('remix-uploads')
        .upload(audioPath, audioFormData, {
          contentType: audioFile.mimeType || 'audio/mpeg',
          upsert: false,
        });

      if (audioError) {
        console.log('[UploadScreen] Audio upload error:', audioError);
        throw new Error('Failed to upload audio file. Please try again.');
      }

      setUploadProgress(50);
      setUploadStatus('Audio uploaded! Getting URL...');

      // Get audio public URL
      const { data: audioUrlData } = supabase.storage
        .from('remix-uploads')
        .getPublicUrl(audioPath);

      const audioUrl = audioUrlData?.publicUrl || '';

      // Step 2: Upload cover image (if selected)
      let coverUrl = '';
      if (coverImage) {
        setUploadStatus('Uploading cover image...');
        setUploadProgress(60);

        const coverPath = `${user.id}/${Date.now()}_cover.jpg`;
        const coverFormData = new FormData();
        coverFormData.append('file', {
          uri: coverImage,
          name: 'cover.jpg',
          type: 'image/jpeg',
        } as any);

        const { error: coverError } = await supabase.storage
          .from('remix-uploads')
          .upload(coverPath, coverFormData, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (coverError) {
          console.log('[UploadScreen] Cover upload warning:', coverError);
          // Cover upload fail hon pe bhi continue karo — audio important hai
        } else {
          const { data: coverUrlData } = supabase.storage
            .from('remix-uploads')
            .getPublicUrl(coverPath);
          coverUrl = coverUrlData?.publicUrl || '';
        }
      }

      setUploadProgress(75);
      setUploadStatus('Saving song details...');

      // Step 3: Save metadata to songs table
      const { data: songData, error: insertError } = await supabase
        .from('songs')
        .insert({
          title: title.trim(),
          artist: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown Artist',
          genre: selectedGenre,
          description: description.trim(),
          audio_url: audioUrl,
          cover_image: coverUrl || `https://picsum.photos/seed/${Date.now()}/400/400`,
          duration: 0, // Audio duration would need expo-av to detect
          uploaded_by: user.id,
          is_exclusive: isExclusive,
          plays_count: 0,
          likes_count: 0,
        })
        .select('id')
        .single();

      if (insertError) {
        console.log('[UploadScreen] Insert error:', insertError);
        throw new Error('Failed to save song details. Please try again.');
      }

      // Save song ID for notification
      if (songData?.id) {
        setSongId(songData.id);
      }

      setUploadProgress(90);
      setUploadStatus('Notifying followers...');

      // Step 4: Send push notification to all followers
      if (songData?.id) {
        await notifyNewUpload(user.id, songData.id, title.trim());
      }

      setUploadProgress(100);
      setUploadStatus('Upload complete!');
      haptics.success();

      setStep('success');
    } catch (err: any) {
      console.error('[UploadScreen] Upload error:', err);
      setErrorMessage(err.message || 'Something went wrong during upload.');
      setStep('error');
    }
  }, [title, description, selectedGenre, isExclusive, audioFile, coverImage, user]);

  // ==================== RENDER: SELECT FILE ====================
  if (step === 'select') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { haptics.light(); navigation.goBack(); }}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Mix</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.centerContent}>
          <TouchableOpacity style={styles.uploadArea} onPress={handleSelectAudio}>
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

  // ==================== RENDER: FILL DETAILS ====================
  if (step === 'details') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { haptics.light(); setStep('select'); }}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mix Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Audio File Preview */}
          <View style={styles.filePreview}>
            <View style={styles.fileIcon}>
              <Ionicons name="musical-note" size={24} color={Colors.primary} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{audioFile?.name || 'audio_file.mp3'}</Text>
              <Text style={styles.fileMeta}>
                {audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(1)} MB` : 'Unknown size'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { setAudioFile(null); setStep('select'); }}>
              <Ionicons name="close-circle" size={24} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Cover Image */}
          <TouchableOpacity style={styles.coverPicker} onPress={handleSelectCoverImage}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.coverPreview} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="image-outline" size={32} color={Colors.textTertiary} />
                <Text style={styles.coverPlaceholderText}>Add Cover Image</Text>
                <Text style={styles.coverPlaceholderSub}>Tap to select (optional)</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Mix title"
              placeholderTextColor={Colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
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
              maxLength={500}
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
                  onPress={() => { haptics.selection(); setSelectedGenre(genre.name); }}
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

          {/* Upload Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!title || !selectedGenre) && styles.submitButtonDisabled,
            ]}
            onPress={handleUpload}
            disabled={!title || !selectedGenre}
          >
            <Ionicons name="cloud-upload" size={20} color={Colors.white} />
            <Text style={styles.submitText}>Upload Mix</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ==================== RENDER: UPLOADING ====================
  if (step === 'uploading') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.progressContainer}>
            <View style={styles.progressSpinner}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
            <Text style={styles.progressTitle}>Uploading Your Mix</Text>
            <Text style={styles.progressSubtitle}>{uploadStatus}</Text>

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{uploadProgress}%</Text>

            {/* Steps */}
            <View style={styles.uploadSteps}>
              <View style={styles.uploadStep}>
                <Ionicons
                  name={uploadProgress >= 50 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={uploadProgress >= 50 ? Colors.success : Colors.textTertiary}
                />
                <Text style={styles.uploadStepText}>Audio file uploaded</Text>
              </View>
              <View style={styles.uploadStep}>
                <Ionicons
                  name={uploadProgress >= 70 ? 'checkmark-circle' : uploadProgress >= 50 ? 'sync' : 'ellipse-outline'}
                  size={18}
                  color={uploadProgress >= 70 ? Colors.success : uploadProgress >= 50 ? Colors.primary : Colors.textTertiary}
                />
                <Text style={styles.uploadStepText}>
                  {uploadProgress >= 70 ? 'Cover image uploaded' : 'Uploading cover image...'}
                </Text>
              </View>
              <View style={styles.uploadStep}>
                <Ionicons
                  name={uploadProgress >= 100 ? 'checkmark-circle' : uploadProgress >= 75 ? 'sync' : 'ellipse-outline'}
                  size={18}
                  color={uploadProgress >= 100 ? Colors.success : uploadProgress >= 75 ? Colors.primary : Colors.textTertiary}
                />
                <Text style={styles.uploadStepText}>
                  {uploadProgress >= 100 ? 'Song published!' : 'Saving song details...'}
                </Text>
              </View>
              <View style={styles.uploadStep}>
                <Ionicons
                  name={uploadProgress >= 100 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={uploadProgress >= 100 ? Colors.success : Colors.textTertiary}
                />
                <Text style={styles.uploadStepText}>
                  {uploadProgress >= 100 ? 'Followers notified!' : 'Notifying followers...'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ==================== RENDER: SUCCESS ====================
  if (step === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Upload Complete! 🎉</Text>
            <Text style={styles.successSubtitle}>
              Your mix "{title}" is now live and available for everyone to listen!
            </Text>

            <View style={styles.successDetails}>
              <View style={styles.successDetailItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.successDetailText}>Audio file uploaded to storage</Text>
              </View>
              {coverImage && (
                <View style={styles.successDetailItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.successDetailText}>Cover image uploaded</Text>
                </View>
              )}
              <View style={styles.successDetailItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.successDetailText}>Song metadata saved to database</Text>
              </View>
              <View style={styles.successDetailItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.successDetailText}>Followers notified about new song</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.publishButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="home" size={20} color={Colors.white} />
              <Text style={styles.publishText}>Back to Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadAnotherButton}
              onPress={() => {
                // Reset all states
                setTitle('');
                setDescription('');
                setSelectedGenre('');
                setIsExclusive(false);
                setAudioFile(null);
                setCoverImage(null);
                setUploadProgress(0);
                setUploadStatus('');
                setSongId(null);
                setStep('select');
              }}
            >
              <Text style={styles.uploadAnotherText}>Upload Another Mix</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ==================== RENDER: ERROR ====================
  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color={Colors.error} />
          </View>
          <Text style={styles.errorTitle}>Upload Failed</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setErrorMessage('');
              setUploadProgress(0);
              setStep('details');
            }}
          >
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
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
  headerTitle: {
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
    marginBottom: Spacing.lg,
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

  // Cover Image
  coverPicker: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  coverPreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
  },
  coverPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  coverPlaceholderSub: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
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
    marginBottom: Spacing.xxxl,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...Typography.buttonLarge,
    color: Colors.white,
  },

  // Progress
  progressContainer: {
    alignItems: 'center',
  },
  progressSpinner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  progressTitle: {
    ...Typography.h2,
    marginBottom: Spacing.md,
  },
  progressSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressPercent: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xxl,
  },
  uploadSteps: {
    width: '100%',
  },
  uploadStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  uploadStepText: {
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
  uploadAnotherButton: {
    paddingVertical: Spacing.md,
  },
  uploadAnotherText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    ...Typography.h2,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  errorSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  retryButton: {
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
  retryText: {
    ...Typography.buttonLarge,
    color: Colors.white,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
