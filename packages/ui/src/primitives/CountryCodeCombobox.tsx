import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { useT } from '@minga/i18n';
import { COUNTRY_CODES, findCountry, searchCountries, type CountryCode } from '@minga/logic';
import { Icon } from './Icon';

export interface CountryCodeComboboxProps {
  value: string;
  onChange: (code: string, iso: string) => void;
  // Optional ISO hint — disambiguates between countries that share a dial
  // code (e.g. +1 → US / CA / DO / PR). Defaults to whichever entry the
  // shared list reports first.
  iso?: string;
  disabled?: boolean;
}

export function CountryCodeCombobox({ value, onChange, iso, disabled }: CountryCodeComboboxProps) {
  const { theme } = useTheme();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(() => findCountry(value, iso) ?? COUNTRY_CODES[0], [value, iso]);
  const results = useMemo(() => searchCountries(query), [query]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${selected.flag} ${selected.name} ${selected.code}`}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          backgroundColor: theme.surfaceAlt,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text style={{ fontSize: fontSizes.lg }}>{selected.flag}</Text>
        <Text style={{ color: theme.text, fontWeight: fontWeights.semibold, fontSize: fontSizes.md }}>
          {selected.code}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: theme.background,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              maxHeight: '85%',
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.text, fontSize: fontSizes.lg, fontWeight: fontWeights.bold }}>
                {t('profile.countryPickerTitle')}
              </Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={12} accessibilityLabel="Close">
                <Icon name="x" size={22} color={theme.textMuted} strokeWidth={2.2} />
              </Pressable>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: radii.md,
                paddingHorizontal: spacing.sm,
              }}
            >
              <Icon name="search" size={16} color={theme.textMuted} strokeWidth={2.2} />
              <TextInput
                placeholder={t('profile.countrySearchPlaceholder')}
                placeholderTextColor={theme.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingVertical: spacing.sm,
                  fontSize: fontSizes.md,
                }}
              />
            </View>
            <FlatList
              data={results}
              keyExtractor={(c) => `${c.iso}-${c.code}`}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: theme.border, opacity: 0.6 }} />
              )}
              renderItem={({ item }) => {
                const active = item.iso === selected.iso && item.code === selected.code;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.code, item.iso);
                      setOpen(false);
                      setQuery('');
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.xs,
                      backgroundColor: active ? theme.primaryMuted : 'transparent',
                      borderRadius: radii.sm,
                    }}
                  >
                    <Text style={{ fontSize: fontSizes.xl }}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: theme.text,
                          fontWeight: fontWeights.semibold,
                          fontSize: fontSizes.md,
                        }}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <Text style={{ color: theme.textMuted, fontWeight: fontWeights.semibold }}>{item.code}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// Re-export the same type for convenience.
export type { CountryCode };
