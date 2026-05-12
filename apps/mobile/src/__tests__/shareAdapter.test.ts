// Mock expo-file-system + expo-sharing so we can assert how shareAdapter
// chooses between sharing the SVG file and the deep-link fallback.

const mockIsAvailable = jest.fn();
const mockShareAsync = jest.fn();
const mockDownloadAsync = jest.fn();

jest.mock('expo-file-system', () => ({
  __esModule: true,
  cacheDirectory: 'file:///cache/',
  downloadAsync: (...args: unknown[]) => mockDownloadAsync(...args),
}));

jest.mock('expo-sharing', () => ({
  __esModule: true,
  isAvailableAsync: () => mockIsAvailable(),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

beforeEach(() => {
  mockIsAvailable.mockReset();
  mockShareAsync.mockReset();
  mockDownloadAsync.mockReset();
});

import { shareAdapter } from '../shareAdapter';

const baseInput = {
  activityId: 'a1',
  title: 'Cocora loop',
  cardUrl: 'https://api.example/share?activity_id=a1',
  deepLink: 'https://minga-expeditions-web.vercel.app/activities/a1',
  caption: 'Just finished',
};

describe('shareAdapter.share', () => {
  it('no-ops if the device cannot share', async () => {
    mockIsAvailable.mockResolvedValueOnce(false);
    await shareAdapter.share(baseInput);
    expect(mockDownloadAsync).not.toHaveBeenCalled();
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it('downloads the SVG and opens the share sheet on success', async () => {
    mockIsAvailable.mockResolvedValueOnce(true);
    mockDownloadAsync.mockResolvedValueOnce({ uri: 'file:///cache/minga-share-a1.svg' });
    mockShareAsync.mockResolvedValueOnce(undefined);

    await shareAdapter.share(baseInput);

    expect(mockDownloadAsync).toHaveBeenCalledWith(
      baseInput.cardUrl,
      expect.stringContaining('minga-share-a1.svg'),
    );
    expect(mockShareAsync).toHaveBeenCalledWith(
      expect.stringContaining('minga-share-a1.svg'),
      expect.objectContaining({ mimeType: 'image/svg+xml', dialogTitle: baseInput.caption }),
    );
  });

  it('falls back to sharing the deep link when the SVG download fails', async () => {
    mockIsAvailable.mockResolvedValueOnce(true);
    mockDownloadAsync.mockRejectedValueOnce(new Error('network down'));
    mockShareAsync.mockResolvedValueOnce(undefined);

    await shareAdapter.share(baseInput);

    // Two share attempts: the failing SVG path is the first arg, then the deep link
    const firstShareArg = mockShareAsync.mock.calls[0][0];
    expect(typeof firstShareArg).toBe('string');
    expect(firstShareArg).toBe(baseInput.deepLink);
  });

  it('uses a per-activity cache filename', async () => {
    mockIsAvailable.mockResolvedValueOnce(true);
    mockDownloadAsync.mockResolvedValueOnce({ uri: 'x' });
    mockShareAsync.mockResolvedValueOnce(undefined);
    await shareAdapter.share({ ...baseInput, activityId: 'different-id' });
    expect(mockDownloadAsync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('minga-share-different-id.svg'),
    );
  });
});
