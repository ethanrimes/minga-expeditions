import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { useT } from '@minga/i18n';
import { Icon } from '../primitives/Icon';
import { Button } from '../primitives/Button';

export interface PaymentCelebrationModalProps {
  visible: boolean;
  // When true, the modal shows the "create an account to save your trip" CTA
  // in addition to dismissing. Hosts pass this for anonymous viewers so the
  // post-payment flow always asks guests to sign up before walking away.
  isGuest: boolean;
  expeditionTitle?: string | null;
  onClose: () => void;
  onSignIn?: () => void;
}

export function PaymentCelebrationModal({
  visible,
  isGuest,
  expeditionTitle,
  onClose,
  onSignIn,
}: PaymentCelebrationModalProps) {
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
        testID="payment-celebration-backdrop"
      >
        <Pressable
          onPress={() => undefined}
          style={{
            width: '100%',
            maxWidth: 460,
            backgroundColor: theme.background,
            borderRadius: radii.xl,
            padding: spacing.xl,
            gap: spacing.md,
          }}
          testID="payment-celebration-modal"
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              backgroundColor: theme.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="mountain" size={28} color={theme.primary} strokeWidth={2.4} />
          </View>
          <Text
            style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}
            testID="payment-celebration-title"
          >
            {t('order.celebrateTitle')}
          </Text>
          {expeditionTitle ? (
            <Text
              style={{
                color: theme.primary,
                fontSize: fontSizes.md,
                fontWeight: fontWeights.semibold,
              }}
            >
              {expeditionTitle}
            </Text>
          ) : null}
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.md, lineHeight: 22 }}>
            {isGuest ? t('order.celebrateBodyGuest') : t('order.celebrateBody')}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: spacing.sm,
              marginTop: spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            <Button
              label={t('order.celebrateDismiss')}
              variant="secondary"
              onPress={onClose}
            />
            {isGuest && onSignIn ? (
              <Button
                label={t('order.celebrateCta')}
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
