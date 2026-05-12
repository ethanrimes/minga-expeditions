import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { useT } from '@minga/i18n';
import { Icon } from '../primitives/Icon';
import { Button } from '../primitives/Button';

export interface SignInRequiredModalProps {
  visible: boolean;
  message: string;
  onClose: () => void;
  onSignIn?: () => void;
}

export function SignInRequiredModal({ visible, message, onClose, onSignIn }: SignInRequiredModalProps) {
  const { theme } = useTheme();
  const { t } = useT();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Pressable
          onPress={() => undefined}
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: theme.background,
            borderRadius: radii.xl,
            padding: spacing.xl,
            gap: spacing.md,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: theme.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="user" size={22} color={theme.primary} strokeWidth={2.2} />
          </View>
          <Text style={{ color: theme.text, fontSize: fontSizes.xl, fontWeight: fontWeights.heavy }}>
            {t('auth.signInRequiredTitle')}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.md, lineHeight: 22 }}>{message}</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm }}>
            <Button label={t('auth.signInRequiredDismiss')} variant="secondary" onPress={onClose} />
            {onSignIn ? (
              <Button
                label={t('auth.signInRequiredCta')}
                onPress={() => {
                  onClose();
                  onSignIn();
                }}
              />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function isSignInRequiredError(e: unknown): boolean {
  const msg = (e instanceof Error ? e.message : String(e ?? '')).toLowerCase();
  return msg.includes('sign in');
}
