import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useTheme, spacing, fontSizes, fontWeights } from '@minga/theme';
import { useT } from '@minga/i18n';
import { fetchFeedExpeditions, fetchMyActivities, getSupabase } from '@minga/supabase';
import type { ExpeditionWithAuthor, DbActivity } from '@minga/types';
import { GEO_LAYERS } from '@minga/types';
import { buildMapHtml, type MapPayload } from './mapHtml';

// Native map screen: MapLibre GL JS rendered inside a WebView so it works
// in Expo Go without a custom dev client. All data is baked into the
// initial HTML, and marker taps post back up via `ReactNativeWebView.postMessage`.

export function MapScreen({ onOpenExpedition }: { onOpenExpedition: (id: string) => void }) {
  const { theme } = useTheme();
  const { t } = useT();
  const webRef = useRef<WebView | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const labels = useMemo(
    () => ({
      legendOfficial: t('map.legendOfficial'),
      legendUser: t('map.legendUser'),
      legendMyTrack: t('map.legendMyTrack'),
      loading: t('map.loading'),
    }),
    [t],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Parallelize expeditions + activities; fetch track polylines afterwards.
        const [expeditions, activities] = await Promise.all([
          fetchFeedExpeditions(getSupabase(), { limit: 50 }).catch(() => [] as ExpeditionWithAuthor[]),
          fetchMyActivities(getSupabase()).catch(() => [] as DbActivity[]),
        ]);

        const tracks: Record<string, [number, number][]> = {};
        if (activities.length > 0) {
          const ids = activities.slice(0, 10).map((a) => a.id);
          const { data } = await getSupabase()
            .from('activity_tracks')
            .select('activity_id, lat, lng, sequence')
            .in('activity_id', ids)
            .order('sequence', { ascending: true });
          for (const row of (data as { activity_id: string; lat: number; lng: number }[]) ?? []) {
            if (!tracks[row.activity_id]) tracks[row.activity_id] = [];
            tracks[row.activity_id].push([row.lng, row.lat]);
          }
        }

        if (cancelled) return;

        const payload: MapPayload = {
          expeditions,
          activities,
          tracks,
          primary: theme.primary,
          accent: theme.accent,
          text: theme.text,
          muted: theme.textMuted,
          border: theme.border,
          surface: theme.surface,
          surfaceAlt: theme.surfaceAlt,
          background: theme.background,
          supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
          geoLayers: GEO_LAYERS,
          labels,
        };
        setHtml(buildMapHtml(payload));
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'map load error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-build the HTML if the theme or language changes so colors + legend stay current.
  }, [theme.primary, theme.accent, theme.text, theme.textMuted, theme.border, theme.surface, theme.surfaceAlt, theme.background, labels]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data) as { type: string; id?: string; message?: string };
        if (msg.type === 'openExpedition' && msg.id) {
          onOpenExpedition(msg.id);
        } else if (msg.type === 'error') {
          setError(msg.message ?? 'map error');
        }
      } catch {
        // ignore malformed
      }
    },
    [onOpenExpedition],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
        <Text
          style={{
            color: theme.primary,
            fontSize: fontSizes.xs,
            letterSpacing: 2,
            fontWeight: fontWeights.bold,
          }}
        >
          {t('map.title').toUpperCase()}
        </Text>
        <Text style={{ color: theme.text, fontSize: fontSizes.xl, fontWeight: fontWeights.heavy, marginTop: 2 }}>
          {t('map.title')}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, marginTop: 2 }}>{t('map.subtitle')}</Text>
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.danger }}>{error}</Text>
        </View>
      ) : !html ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
          <Text style={{ color: theme.textMuted, marginTop: spacing.sm }}>{t('map.loading')}</Text>
        </View>
      ) : (
        <View style={{ flex: 1, margin: spacing.lg, marginTop: 0, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
          <WebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://minga.local/' }}
            onMessage={onMessage}
            style={{ flex: 1, backgroundColor: theme.surfaceAlt }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            // iOS allows CDN tile fetches by default; Android needs mixed-content off for https→https (fine).
            mixedContentMode="compatibility"
            setSupportMultipleWindows={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
