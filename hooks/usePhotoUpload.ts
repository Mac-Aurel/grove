import { useState } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';

export interface UsePhotoUploadResult {
  uploading: boolean;
  compressAndUpload: (localUri: string, taskId: string) => Promise<string | null>;
  uploadAvatar: (localUri: string) => Promise<string | null>;
}

export function usePhotoUpload(): UsePhotoUploadResult {
  const { user } = useSession();
  const [uploading, setUploading] = useState<boolean>(false);

  const compressToJpeg = async (localUri: string): Promise<ArrayBuffer | null> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const response = await fetch(result.uri);
      const blob = await response.blob();
      return new Response(blob).arrayBuffer();
    } catch {
      return null;
    }
  };

  const compressAndUpload = async (localUri: string, taskId: string): Promise<string | null> => {
    if (!user) return null;
    setUploading(true);

    try {
      const buffer = await compressToJpeg(localUri);
      if (!buffer) return null;

      const path = `${user.id}/${taskId}`;
      const { error } = await supabase.storage
        .from('task-photos')
        .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });

      if (error) return null;

      const { data } = supabase.storage.from('task-photos').getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const uploadAvatar = async (localUri: string): Promise<string | null> => {
    if (!user) return null;
    setUploading(true);

    try {
      const buffer = await compressToJpeg(localUri);
      if (!buffer) return null;

      const path = `${user.id}/avatar`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });

      if (error) return null;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return `${data.publicUrl}?t=${Date.now()}`;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, compressAndUpload, uploadAvatar };
}
