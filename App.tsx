/**
 * The Girlfriend Effect
 *
 * @format
 */

import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';

function App() {
  return (
    <SafeAreaProvider>
      {/* barStyle is all RN 0.87 still exposes — edge-to-edge made the bar
          permanently translucent, so it sits over Screen's own background. */}
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
