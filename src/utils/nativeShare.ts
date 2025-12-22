import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') return reject(new Error('Failed to read blob'));
      // result is data:<mime>;base64,<data>
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

export async function sharePngWithText(options: {
  blob: Blob;
  filename: string;
  title: string;
  text: string;
}): Promise<void> {
  // Web fallback: native share sheet isn’t available reliably in web previews.
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Native share not available on web');
  }

  const base64 = await blobToBase64(options.blob);
  const path = `share/${Date.now()}-${options.filename}`;

  await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });

  const uriResult = await Filesystem.getUri({
    directory: Directory.Cache,
    path,
  });

  await Share.share({
    title: options.title,
    text: options.text,
    files: [uriResult.uri],
  });
}


