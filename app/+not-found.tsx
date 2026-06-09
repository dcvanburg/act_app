import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import common from '@/content/nl/common.json';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Niet gevonden' }} />
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="mb-2 font-serif text-2xl font-bold text-text">Niet gevonden</Text>
        <Text className="mb-6 text-center text-text-muted">
          Deze pagina bestaat niet. Ga terug naar de startpagina.
        </Text>
        <Link href="/" className="text-primary underline">
          {common.actions.back}
        </Link>
      </View>
    </>
  );
}
