import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image } from 'phosphor-react-native';
import { Colors, Radius } from '../constants/theme';

export interface PhotoPickerSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  uploading: boolean;
  onPhotoSelected: (uri: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

export function PhotoPickerSheet({
  sheetRef,
  uploading,
  onPhotoSelected,
  onSkip,
  onClose,
}: PhotoPickerSheetProps): React.JSX.Element {
  const snapPoints = useMemo(() => ['35%'], []);

  const handleCamera = async (): Promise<void> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      onPhotoSelected(result.assets[0].uri);
    }
  };

  const handleGallery = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      onPhotoSelected(result.assets[0].uri);
    }
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      onClose={onClose}
    >
      <BottomSheetView style={s.content}>
        {uploading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={s.loadingText}>Uploading photo...</Text>
          </View>
        ) : (
          <>
            <Text style={s.title}>Add photo proof</Text>

            <View style={s.optionRow}>
              <TouchableOpacity style={s.option} onPress={handleCamera} activeOpacity={0.75}>
                <View style={s.iconWrap}>
                  <Camera size={26} color={Colors.accent} weight="regular" />
                </View>
                <Text style={s.optionLabel}>Take photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.option} onPress={handleGallery} activeOpacity={0.75}>
                <View style={s.iconWrap}>
                  <Image size={26} color={Colors.accent} weight="regular" />
                </View>
                <Text style={s.optionLabel}>Choose from library</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onSkip} activeOpacity={0.7}>
              <Text style={s.skip}>Complete without photo</Text>
            </TouchableOpacity>
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheetBg: { backgroundColor: '#FFFFFF' },
  handle: { backgroundColor: Colors.border, width: 36 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
    gap: 20,
  },
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    color: Colors.text,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.accent}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
  },
  skip: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
  loadingRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.muted,
  },
});
