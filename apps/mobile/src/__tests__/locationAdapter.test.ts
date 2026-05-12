// Verifies that the native location adapter forwards callback data into the
// shape the useTracker hook expects, and that permission checks gate the
// stream as expected.

const mockGetPerm = jest.fn();
const mockRequestPerm = jest.fn();
const mockWatch = jest.fn();
const mockRemove = jest.fn();

jest.mock('expo-location', () => ({
  __esModule: true,
  getForegroundPermissionsAsync: () => mockGetPerm(),
  requestForegroundPermissionsAsync: () => mockRequestPerm(),
  watchPositionAsync: (opts: unknown, cb: unknown) => mockWatch(opts, cb),
  Accuracy: { BestForNavigation: 6 },
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
}));

beforeEach(() => {
  mockGetPerm.mockReset();
  mockRequestPerm.mockReset();
  mockWatch.mockReset();
  mockRemove.mockReset();
});

import { locationAdapter } from '../locationAdapter';

const { startLocationStream } = locationAdapter;

describe('locationAdapter.startLocationStream', () => {
  it('reports a permission error and bails out without subscribing', async () => {
    mockGetPerm.mockResolvedValueOnce({ status: 'denied', canAskAgain: false });
    const onPoint = jest.fn();
    const onError = jest.fn();
    const sub = await startLocationStream(onPoint, onError);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/denied/i) }),
    );
    expect(mockWatch).not.toHaveBeenCalled();
    expect(typeof sub.stop).toBe('function');
    sub.stop();
  });

  it('forwards each location update as a TrackPoint', async () => {
    mockGetPerm.mockResolvedValueOnce({ status: 'granted', canAskAgain: true });
    let captured: ((loc: unknown) => void) | null = null;
    mockWatch.mockImplementationOnce(async (_opts, cb) => {
      captured = cb as (loc: unknown) => void;
      return { remove: mockRemove };
    });

    const onPoint = jest.fn();
    await startLocationStream(onPoint);

    expect(captured).not.toBeNull();
    captured!({
      coords: { latitude: 4.6411, longitude: -75.4855, altitude: 2400, speed: 1.5 },
      timestamp: 1_700_000_000_000,
    });

    expect(onPoint).toHaveBeenCalledWith({
      lat: 4.6411,
      lng: -75.4855,
      altitude_m: 2400,
      speed_ms: 1.5,
      timestamp: 1_700_000_000_000,
    });
  });

  it('coerces missing altitude / speed to null', async () => {
    mockGetPerm.mockResolvedValueOnce({ status: 'granted', canAskAgain: true });
    let captured: ((loc: unknown) => void) | null = null;
    mockWatch.mockImplementationOnce(async (_opts, cb) => {
      captured = cb as (loc: unknown) => void;
      return { remove: mockRemove };
    });

    const onPoint = jest.fn();
    await startLocationStream(onPoint);
    captured!({
      coords: { latitude: 1, longitude: 2, altitude: null, speed: null },
      timestamp: 0,
    });

    expect(onPoint).toHaveBeenCalledWith(
      expect.objectContaining({ altitude_m: null, speed_ms: null }),
    );
  });

  it('passes the requested accuracy / interval to expo-location', async () => {
    mockGetPerm.mockResolvedValueOnce({ status: 'granted', canAskAgain: true });
    mockWatch.mockResolvedValueOnce({ remove: mockRemove });
    await startLocationStream(jest.fn());
    expect(mockWatch).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: expect.anything(),
        timeInterval: 1500,
        distanceInterval: 3,
      }),
      expect.any(Function),
    );
  });

  it('returns a stop function that unsubscribes the watcher', async () => {
    mockGetPerm.mockResolvedValueOnce({ status: 'granted', canAskAgain: true });
    mockWatch.mockResolvedValueOnce({ remove: mockRemove });
    const sub = await startLocationStream(jest.fn());
    sub.stop();
    expect(mockRemove).toHaveBeenCalled();
  });
});

describe('locationAdapter.getPermissionStatus', () => {
  it('returns granted when expo-location reports granted', async () => {
    mockGetPerm.mockResolvedValueOnce({ status: 'granted', canAskAgain: true });
    await expect(locationAdapter.getPermissionStatus()).resolves.toBe('granted');
  });

  it('returns undetermined when expo-location reports never-asked', async () => {
    mockGetPerm.mockResolvedValueOnce({ status: 'undetermined', canAskAgain: true });
    await expect(locationAdapter.getPermissionStatus()).resolves.toBe('undetermined');
  });

  it('returns undetermined when denied-but-can-ask-again', async () => {
    // expo flips canAskAgain off only once the user picks "Don't ask again".
    // While we can still ask, treat the state as a fresh prompt opportunity.
    mockGetPerm.mockResolvedValueOnce({ status: 'denied', canAskAgain: true });
    await expect(locationAdapter.getPermissionStatus()).resolves.toBe('undetermined');
  });

  it('returns denied when the OS has blocked future prompts', async () => {
    mockGetPerm.mockResolvedValueOnce({ status: 'denied', canAskAgain: false });
    await expect(locationAdapter.getPermissionStatus()).resolves.toBe('denied');
  });
});

describe('locationAdapter.requestPermission', () => {
  it('returns granted after the system prompt is accepted', async () => {
    mockRequestPerm.mockResolvedValueOnce({ status: 'granted', canAskAgain: true });
    await expect(locationAdapter.requestPermission()).resolves.toBe('granted');
  });

  it('returns denied when the user picks "Don\'t allow"', async () => {
    mockRequestPerm.mockResolvedValueOnce({ status: 'denied', canAskAgain: false });
    await expect(locationAdapter.requestPermission()).resolves.toBe('denied');
  });
});
