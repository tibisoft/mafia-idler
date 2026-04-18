// Safely loads react-native-google-mobile-ads; falls back to no-ops in
// environments where the native module is not available (e.g. Expo Go).

export type AdEventCallback = () => void;
export type AdEventUnsubscribe = () => void;

export interface InterstitialAdInstance {
  addAdEventListener(event: string, handler: AdEventCallback): AdEventUnsubscribe;
  load(): void;
  show(): void;
}

export interface InterstitialAdStatic {
  createForAdRequest(adUnitId: string): InterstitialAdInstance;
}

const noOpAd: InterstitialAdInstance = {
  addAdEventListener: () => () => {},
  load: () => {},
  show: () => {},
};

const noOpInterstitialAd: InterstitialAdStatic = {
  createForAdRequest: () => noOpAd,
};

let InterstitialAd: InterstitialAdStatic = noOpInterstitialAd;
// These fallback values are arbitrary – they are only used alongside the
// no-op stubs (which never fire events), so the actual strings don't matter.
let AdEventType: Record<string, string> = {
  LOADED: 'loaded',
  CLOSED: 'closed',
  ERROR: 'error',
};
let TestIds: Record<string, string> = {
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ads = require('react-native-google-mobile-ads');
  InterstitialAd = ads.InterstitialAd;
  AdEventType = ads.AdEventType;
  TestIds = ads.TestIds;
} catch (e) {
  // Native module unavailable (e.g. Expo Go). Ads are disabled.
  if (__DEV__) {
    console.warn(
      '[ads] react-native-google-mobile-ads native module not found – ads disabled. ' +
        'Use a custom dev build to enable ads.',
      e,
    );
  }
}

export { InterstitialAd, AdEventType, TestIds };
