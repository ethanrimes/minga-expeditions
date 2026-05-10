// Stub for react-native/Libraries/Utilities/codegenNativeComponent on web.
// react-native-svg's Fabric files import this at module load time, but the
// Fabric path is only used by the native renderer, so a no-op factory is
// safe — the components are never actually mounted on react-native-web.
export default function codegenNativeComponent() {
  return function NoopNativeComponent() {
    return null;
  };
}
