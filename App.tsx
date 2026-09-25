/**
 * The Girlfriend Effect
 *
 * @format
 */

import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RepositoryProvider } from './src/data';
import { CartProvider } from './src/features/cart';
import { SessionProvider } from './src/features/session';
import { RootNavigator } from './src/navigation';

function App() {
  return (
    <RepositoryProvider>
      <SessionProvider>
        <CartProvider>
          <SafeAreaProvider>
            {/* barStyle is all RN 0.87 still exposes — edge-to-edge made the
                bar permanently translucent, so it sits over Screen's own
                background. */}
            <StatusBar barStyle="dark-content" />
            <RootNavigator />
          </SafeAreaProvider>
        </CartProvider>
      </SessionProvider>
    </RepositoryProvider>
  );
}

export default App;
