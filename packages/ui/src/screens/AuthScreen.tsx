import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { useT } from '@minga/i18n';
import { Screen } from '../primitives/Screen';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { useAuth } from '../hooks/useAuth';

export type OAuthProvider = 'google' | 'facebook';

export interface AuthScreenProps {
  onAuthenticated?: () => void;
  // Platform-specific OAuth handler. Resolves true on successful sign-in,
  // false if the user cancelled (no error shown). Throw to surface an error.
  // Omit to hide OAuth buttons entirely.
  onOAuthSignIn?: (provider: OAuthProvider) => Promise<boolean>;
}

export function AuthScreen({ onAuthenticated, onOAuthSignIn }: AuthScreenProps) {
  const { theme } = useTheme();
  const { t } = useT();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, displayName.trim() || email.split('@')[0], username.trim() || email.split('@')[0]);
      }
      onAuthenticated?.();
    } catch (e: any) {
      setError(e?.message ?? t('common.loadError'));
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: OAuthProvider) => {
    if (!onOAuthSignIn) return;
    setError(null);
    setOauthBusy(provider);
    try {
      const ok = await onOAuthSignIn(provider);
      if (ok) onAuthenticated?.();
    } catch (e: any) {
      setError(e?.message ?? t('auth.oauthFailed'));
    } finally {
      setOauthBusy(null);
    }
  };

  const anyBusy = busy || oauthBusy !== null;

  return (
    <Screen>
      <View style={{ paddingTop: spacing['2xl'], gap: spacing.sm }}>
        <Text style={{ color: theme.primary, fontSize: fontSizes.sm, letterSpacing: 2, fontWeight: fontWeights.bold }}>
          MINGA
        </Text>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
          {mode === 'signin' ? t('auth.welcomeBack') : t('auth.joinTitle')}
        </Text>
        <Text style={{ color: theme.textMuted }}>{t('auth.oauthNote')}</Text>
      </View>

      {onOAuthSignIn ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <Button
            label={t('auth.continueGoogle')}
            variant="secondary"
            loading={oauthBusy === 'google'}
            disabled={anyBusy && oauthBusy !== 'google'}
            onPress={() => oauth('google')}
            fullWidth
          />
          <Button
            label={t('auth.continueFacebook')}
            variant="secondary"
            loading={oauthBusy === 'facebook'}
            disabled={anyBusy && oauthBusy !== 'facebook'}
            onPress={() => oauth('facebook')}
            fullWidth
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xs }}>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
            <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, fontWeight: fontWeights.semibold }}>
              {t('auth.orDivider')}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
          </View>
        </View>
      ) : null}

      <View style={{ gap: spacing.md }}>
        {mode === 'signup' ? (
          <>
            <Input label={t('auth.displayName')} placeholder="Juliana Restrepo" value={displayName} onChangeText={setDisplayName} />
            <Input
              label={t('auth.username')}
              placeholder="juli.trails"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </>
        ) : null}
        <Input
          label={t('auth.email')}
          placeholder="you@minga.co"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label={t('auth.password')}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
        <Button
          label={mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
          loading={busy}
          disabled={oauthBusy !== null}
          onPress={submit}
          fullWidth
        />
        <Pressable onPress={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}>
          <Text style={{ color: theme.primary, textAlign: 'center', fontWeight: fontWeights.semibold }}>
            {mode === 'signin' ? t('auth.switchToSignup') : t('auth.switchToSignin')}
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          marginTop: spacing.xl,
          borderRadius: radii.lg,
          backgroundColor: theme.surfaceAlt,
          padding: spacing.lg,
          gap: spacing.xs,
        }}
      >
        <Text style={{ color: theme.text, fontWeight: fontWeights.semibold }}>{t('auth.demoHeading')}</Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>{t('auth.demoBody')}</Text>
      </View>
    </Screen>
  );
}
