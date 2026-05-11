// We mock the entire expo-image-picker module to avoid loading native bindings
// inside the test runner. The real adapter delegates to it; we want to assert
// our own extraction logic on the asset metadata.
const mockRequest = jest.fn();
const mockLaunch = jest.fn();

jest.mock('expo-image-picker', () => ({
  __esModule: true,
  requestMediaLibraryPermissionsAsync: () => mockRequest(),
  launchImageLibraryAsync: (opts: unknown) => mockLaunch(opts),
  MediaTypeOptions: { Images: 'Images' },
}));

// `fetch` returns a Blob from the asset URI. Stub it deterministically.
const originalFetch = global.fetch;
beforeAll(() => {
  global.fetch = jest.fn(async () => ({
    blob: async () => new Blob([new Uint8Array([1, 2, 3]).buffer], { type: 'image/jpeg' }),
  })) as unknown as typeof fetch;
});
afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  mockRequest.mockReset();
  mockLaunch.mockReset();
});

import { photoPicker } from '../photoPicker';

describe('photoPicker.pickPhoto', () => {
  it('returns null when permission is denied', async () => {
    mockRequest.mockResolvedValueOnce({ granted: false });
    expect(await photoPicker.pickPhoto()).toBeNull();
    expect(mockLaunch).not.toHaveBeenCalled();
  });

  it('returns null when the user cancels the picker', async () => {
    mockRequest.mockResolvedValueOnce({ granted: true });
    mockLaunch.mockResolvedValueOnce({ canceled: true, assets: [] });
    expect(await photoPicker.pickPhoto()).toBeNull();
  });

  it('returns blob + filename + EXIF lat/lng on success', async () => {
    mockRequest.mockResolvedValueOnce({ granted: true });
    mockLaunch.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///mock/path.jpg',
          fileName: 'sunset.jpg',
          exif: {
            GPSLatitude: 4.6411,
            GPSLongitude: -75.4855,
            DateTimeOriginal: '2026:05:08 14:30:00',
          },
        },
      ],
    });

    const out = await photoPicker.pickPhoto();
    expect(out).not.toBeNull();
    expect(out!.filename).toBe('sunset.jpg');
    expect(out!.lat).toBeCloseTo(4.6411, 5);
    expect(out!.lng).toBeCloseTo(-75.4855, 5);
    expect(out!.takenAt).toMatch(/2026/);
    expect(out!.blob).toBeInstanceOf(Blob);
  });

  it('synthesises a filename when the asset has none', async () => {
    mockRequest.mockResolvedValueOnce({ granted: true });
    mockLaunch.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///mock/p.jpg', exif: {} }],
    });
    const out = await photoPicker.pickPhoto();
    expect(out!.filename).toMatch(/^photo-\d+\.jpg$/);
    expect(out!.lat).toBeNull();
    expect(out!.lng).toBeNull();
    expect(out!.takenAt).toBeNull();
  });

  it('asks for the right picker options (images, EXIF, no editing)', async () => {
    mockRequest.mockResolvedValueOnce({ granted: true });
    mockLaunch.mockResolvedValueOnce({ canceled: true, assets: [] });
    await photoPicker.pickPhoto();
    expect(mockLaunch).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaTypes: 'Images',
        exif: true,
        allowsEditing: false,
      }),
    );
  });
});
