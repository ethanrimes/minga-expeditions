import * as ImagePicker from 'expo-image-picker';
import type { ActivityPhotoPicker } from '@minga/ui';

// Wraps expo-image-picker so the shared ActivityDetailScreen can stay
// platform-agnostic. EXIF lat/lng/timestamp arrive in the image metadata
// when the user has granted full photo-library access.
export const photoPicker: ActivityPhotoPicker = {
  async pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      exif: true,
      allowsEditing: false,
    });
    if (result.canceled) return null;

    const asset = result.assets[0];
    const blob = await fetch(asset.uri).then((r) => r.blob());
    const filename = asset.fileName ?? `photo-${Date.now()}.jpg`;

    // Pull GPS + timestamp out of EXIF when available.
    const exif = (asset.exif ?? {}) as Record<string, unknown>;
    const lat = typeof exif.GPSLatitude === 'number' ? (exif.GPSLatitude as number) : null;
    const lng = typeof exif.GPSLongitude === 'number' ? (exif.GPSLongitude as number) : null;
    const taken = typeof exif.DateTimeOriginal === 'string' ? (exif.DateTimeOriginal as string) : null;

    return {
      blob,
      filename,
      lat,
      lng,
      takenAt: taken ? new Date(taken.replace(':', '-').replace(':', '-')).toISOString() : null,
    };
  },
};
