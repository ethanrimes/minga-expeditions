import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { Screen } from '../primitives/Screen';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { useAuth } from '../hooks/useAuth';

export function AuthScreen({ onAuthenticated }: { onAuthenticated?: () => void }) {
  const { theme } = useTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      setError(e?.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ paddingTop: spacing['2xl'], gap: spacing.sm }}>
        <Text style={{ color: theme.primary, fontSize: fontSizes.sm, letterSpacing: 2, fontWeight: fontWeights.bold }}>
          MINGA
        </Text>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
          {mode === 'signin' ? 'Welcome back' : 'Join the expedition'}
        </Text>
        <Text style={{ color: theme.textMuted }}>
          Google & Meta sign-in coming soon — email + password for now.
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        {mode === 'signup' ? (
          <>
            <Input label="Display name" placeholder="Juliana Restrepo" value={displayName} onChangeText={setDisplayName} />
            <Input label="Username" placeholder="juli.trails" autoCapitalize="none" value={username} onChangeText={setUsername} />
          </>
        ) : null}
        <Input label="Email" placeholder="you@minga.co" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input label="Password" placeholder="At least 8 characters" secureTextEntry value={password} onChangeText={setPassword} />
        {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
        <Button
          label={mode === 'signin' ? 'Sign in' : 'Create account'}
          loading={busy}
          onPress={submit}
          fullWidth
        />
        <Pressable onPress={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}>
          <Text style={{ color: theme.primary, textAlign: 'center', fontWeight: fontWeights.semibold }}>
            {mode === 'signin' ? 'No account? Create one' : 'Already a member? Sign in'}
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
        <Text style={{ color: theme.text, fontWeight: fontWeights.semibold }}>Demo accounts</Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
          Create any email to try the app. The seed includes demo authors (juliana, andres, carolina, lucas) whose
          expeditions appear in the feed without needing to log in.
        </Text>
      </View>
    </Screen>
  );
}
