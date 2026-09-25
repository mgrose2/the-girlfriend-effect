import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  BoardEditorScreen,
  BoardListScreen,
  CreateBoardScreen,
  PinDetailsScreen,
} from '../features/boards';
import { SizingIntakeScreen } from '../features/intake';
import { RoleSelectScreen } from '../features/role';
import {
  BoardReceivedScreen,
  JoinBoardScreen,
  ShareBoardScreen,
} from '../features/share';
import { CuratedShopScreen, ItemDetailScreen } from '../features/shop';
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
        <Stack.Screen
          name="BoardEditor"
          component={BoardEditorScreen}
          // Title is replaced with the board's own name once it loads.
          options={{ title: 'Board' }}
        />
        <Stack.Screen
          name="PinDetails"
          component={PinDetailsScreen}
          options={{ title: 'Add a pin', presentation: 'modal' }}
        />
        <Stack.Screen
          name="ShareBoard"
          component={ShareBoardScreen}
          options={{ title: 'Send board' }}
        />
        <Stack.Screen
          name="JoinBoard"
          component={JoinBoardScreen}
          options={{ title: 'Enter your code' }}
        />
        <Stack.Screen
          name="SizingIntake"
          component={SizingIntakeScreen}
          // No back arrow: intake is the price of entry, and reversing out of
          // it would land on the code screen for a board already claimed.
          options={{ title: 'Your sizes', headerBackVisible: false }}
        />
        <Stack.Screen
          name="BoardReceived"
          component={BoardReceivedScreen}
          options={{ title: 'For you' }}
        />
        <Stack.Screen
          name="CuratedShop"
          component={CuratedShopScreen}
          // Replaced with the board's own name once it loads.
          options={{ title: 'Your picks' }}
        />
        <Stack.Screen
          name="ItemDetail"
          component={ItemDetailScreen}
          options={{ title: '', presentation: 'modal' }}
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
