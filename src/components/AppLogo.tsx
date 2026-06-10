import { Image, View } from 'react-native';

const icon = require('../../assets/icon.png');

interface Props {
  size?: number;
}

export function AppLogo({ size = 32 }: Props) {
  return (
    <View className="items-center">
      <Image
        source={icon}
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}
