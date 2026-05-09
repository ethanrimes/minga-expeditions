// Verifies that the native location adapter forwards callback data into the
// shape the useTracker hook expects.

const mockRequestPerm = jest.fn();
const mockWatch = jest.fn();
const mockRemove = jest.fn();

jest.mock('expo-location', () => ({
  __esModule: true,
  requestForegroundPermissionsAsync: () => mockRequestPerm(),
  watchPositionAsync: (opts: unknown, cb: unknown) => mockWatch(opts, cb),
  Accuracy: { BestForNavigation: 6 },
}));

beforeEach(() => {
  mockRequestPerm.mockReset();
  mockWatch.mockReset();
  mockRemove.mockReset();
});

import { startLocationStream } from '../locationAdapter';

describe('startLocationStream', () => {
  it('reports a permission error and bails out without subscribing', async () => {
    mockRequestPerm.mockResolvedValueOnce({ status: 'denied' });
    const onPoint = jest.fn();
    const onError = jest.fn();
    const sub = await startLocationStream(onPoint, onError);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/denied/i) }),
    );
    expect(mockWatch).not.toHaveBeenCalled();
    // The returned subscription should still be safe to call .stop() on.
    expect(typeof sub.stop).toBe('function');
    sub.stop();
  });

  it('forwards each location update as a TrackPoint', async () => {
    mockRequestPerm.mockResolvedValueOnce({ status: 'granted' });
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
    mockRequestPerm.mockResolvedValueOnce({ status: 'granted' });
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
    mockRequestPerm.mockResolvedValueOnce({ status: 'granted' });
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
    mockRequestPerm.mockResolvedValueOnce({ status: 'granted' });
    mockWatch.mockResolvedValueOnce({ remove: mockRemove });
    const sub = await startLocationStream(jest.fn());
    sub.stop();
    expect(mockRemove).toHaveBeenCalled();
  });
});
