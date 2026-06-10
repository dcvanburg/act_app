import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import common from '@/content/nl/common.json';
import { BackButton } from '@/components/BackButton';
import { AppTextInput } from '@/components/AppTextInput';
import { useDeleteAccount, useProfile, useUpdateProfile } from '@/lib/profile-queries';
import { useAuth } from '@/providers/AuthProvider';

/**
 * /account — profile + GDPR controls (α6).
 *
 * Shows the user's email, name, phone, and member-since date. Lets the user
 * edit their name + phone inline. Provides a "Verwijder mijn account" button
 * that cascades-deletes profile, user_progress, journal_entries and signs the
 * user out (see useDeleteAccount).
 */
export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  function startEdit() {
    setFirstName(profile?.first_name ?? '');
    setLastName(profile?.last_name ?? '');
    setPhone(profile?.phone ?? '');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    updateProfile.mutate(
      { first_name: firstName, last_name: lastName, phone },
      { onSuccess: () => setEditing(false) },
    );
  }

  function confirmDelete() {
    Alert.alert(
      'Account verwijderen?',
      'Dit verwijdert je profiel, voortgang en dagboek-aantekeningen. Deze actie kan niet ongedaan worden gemaakt.',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijder',
          style: 'destructive',
          onPress: () =>
            deleteAccount.mutate(undefined, {
              onSuccess: () => router.replace('/login'),
              onError: () =>
                Alert.alert(
                  'Verwijderen mislukt',
                  'Er is iets misgegaan. Probeer het later opnieuw of neem contact op.',
                ),
            }),
        },
      ],
    );
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;
  const email = profile?.email ?? user?.email ?? '—';

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 112,
        paddingHorizontal: 16,
      }}
    >
      <View className="mx-auto w-full max-w-md gap-4">
        <View className="mb-2 flex-row items-center gap-2">
          <BackButton
            accessibilityLabel="Terug naar programma"
            onPress={() => router.back()}
          />
          <Text className="font-serif text-xl font-bold text-text">Mijn account</Text>
        </View>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#3B6D11" />
          </View>
        ) : (
          <>
            <ProfileSummary
              email={email}
              fullName={fullName}
              memberSince={memberSince}
              subscriptionTier={profile?.subscription_tier ?? 'free'}
            />

            {editing ? (
              <EditForm
                firstName={firstName}
                lastName={lastName}
                phone={phone}
                onChangeFirstName={setFirstName}
                onChangeLastName={setLastName}
                onChangePhone={setPhone}
                onCancel={cancelEdit}
                onSave={saveEdit}
                isSaving={updateProfile.isPending}
                error={updateProfile.isError ? 'Opslaan mislukt. Probeer het opnieuw.' : null}
              />
            ) : (
              <ReadView fullName={fullName} phone={profile?.phone ?? '—'} onEdit={startEdit} />
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => signOut()}
              className="mt-2 rounded-lg border border-border px-4 py-3 active:bg-surface-muted"
            >
              <Text className="text-center text-sm font-medium text-text-muted">Uitloggen</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={confirmDelete}
              disabled={deleteAccount.isPending}
              className="mt-2 rounded-lg border border-crisis-border px-4 py-3 active:bg-crisis-soft disabled:opacity-60"
            >
              {deleteAccount.isPending ? (
                <ActivityIndicator color="#D85A30" />
              ) : (
                <Text className="text-center text-sm font-medium text-crisis-dark">
                  Verwijder mijn account
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function ProfileSummary({
  email,
  fullName,
  memberSince,
  subscriptionTier,
}: {
  email: string;
  fullName: string;
  memberSince: string | null;
  subscriptionTier: string;
}) {
  const initial = (fullName === '—' ? email : fullName).charAt(0).toUpperCase();
  return (
    <View className="flex-row items-center gap-4 rounded-2xl bg-surface p-5 shadow-sm">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
        <Text className="font-serif text-2xl font-bold text-primary-dark">{initial}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-serif text-lg font-bold text-text">{fullName}</Text>
        <Text className="text-sm text-text-subtle" numberOfLines={1}>
          {email}
        </Text>
        {memberSince ? (
          <Text className="mt-1 text-xs text-text-muted">Lid sinds {memberSince}</Text>
        ) : null}
        <Text className="mt-1 text-xs text-text-muted">
          Abonnement: {subscriptionTier === 'free' ? 'Gratis pilot' : subscriptionTier}
        </Text>
      </View>
    </View>
  );
}

function ReadView({
  fullName,
  phone,
  onEdit,
}: {
  fullName: string;
  phone: string;
  onEdit: () => void;
}) {
  return (
    <View className="rounded-2xl bg-surface shadow-sm">
      <Row label="Volledige naam" value={fullName} />
      <View className="h-px bg-border" />
      <Row label="Telefoonnummer" value={phone} />
      <View className="h-px bg-border" />
      <View className="px-5 py-4">
        <Pressable accessibilityRole="button" onPress={onEdit}>
          <Text className="text-sm font-medium text-primary">Gegevens bewerken</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <Text className="text-sm text-text-muted">{label}</Text>
      <Text className="ml-3 max-w-[60%] text-right text-sm font-medium text-text" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function EditForm({
  firstName,
  lastName,
  phone,
  onChangeFirstName,
  onChangeLastName,
  onChangePhone,
  onCancel,
  onSave,
  isSaving,
  error,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  onChangeFirstName: (v: string) => void;
  onChangeLastName: (v: string) => void;
  onChangePhone: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  error: string | null;
}) {
  return (
    <View className="gap-4 rounded-2xl bg-surface p-5 shadow-sm">
      <Text className="text-sm font-semibold text-text">Gegevens bewerken</Text>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="mb-1 text-xs font-medium text-text-muted">Voornaam</Text>
          <AppTextInput
            value={firstName}
            onChangeText={onChangeFirstName}
            autoComplete="given-name"
            placeholder="Jan"
            editable={!isSaving}
          />
        </View>
        <View className="flex-1">
          <Text className="mb-1 text-xs font-medium text-text-muted">Achternaam</Text>
          <AppTextInput
            value={lastName}
            onChangeText={onChangeLastName}
            autoComplete="family-name"
            placeholder="de Vries"
            editable={!isSaving}
          />
        </View>
      </View>

      <View>
        <Text className="mb-1 text-xs font-medium text-text-muted">Telefoonnummer</Text>
        <AppTextInput
          value={phone}
          onChangeText={onChangePhone}
          autoComplete="tel"
          keyboardType="phone-pad"
          placeholder="06 12345678"
          editable={!isSaving}
        />
      </View>

      {error ? <Text className="text-sm text-crisis">{error}</Text> : null}

      <View className="flex-row gap-3 pt-1">
        <Pressable
          accessibilityRole="button"
          onPress={onSave}
          disabled={isSaving}
          className="flex-1 rounded-lg bg-primary px-4 py-3 active:bg-primary-dark disabled:opacity-60"
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-sm font-semibold text-white">
              {common.actions.save}
            </Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          disabled={isSaving}
          className="flex-1 rounded-lg border border-border px-4 py-3 active:bg-surface-muted disabled:opacity-60"
        >
          <Text className="text-center text-sm font-medium text-text-muted">Annuleren</Text>
        </Pressable>
      </View>
    </View>
  );
}
