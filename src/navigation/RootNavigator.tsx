import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BoardListScreen, CreateBoardScreen } from '../features/boards';
import { RoleSelectScreen } from '../features/role';
import { colors } from '../ui';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen
          name="RoleSelect"
          component={RoleSelectScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BoardList"
          component={BoardListScreen}
          options={{ title: 'Your boards' }}
        />
        <Stack.Screen
          name="CreateBoard"
          component={CreateBoardScreen}
          options={{ title: 'New board' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Keeps the container's own background from flashing white behind our
// off-white during screen transitions.
const navTheme = {
  dark: false,
  colors: {
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
} as const;
