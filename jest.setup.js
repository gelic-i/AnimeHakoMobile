// jest.setup.js
// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
  Link: 'Link',
  Redirect: 'Redirect',
  Tabs: {
    Screen: 'Tabs.Screen',
  },
  Stack: {
    Screen: 'Stack.Screen',
  },
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: 'GestureHandlerRootView',
  GestureDetector: 'GestureDetector',
  Gesture: {
    Pinch: () => ({ onUpdate: () => ({ onEnd: () => ({}) }), Pan: () => ({ onUpdate: () => ({ onEnd: () => ({}) }), Tap: () => ({ onEnd: () => ({}) }) })}),
    Pan: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }),
    Tap: () => ({ numberOfTaps: () => ({ onEnd: () => ({}) }) }),
    Simultaneous: () => ({}),
  },
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};