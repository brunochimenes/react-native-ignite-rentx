import React from 'react';
import { ThemeProvider } from 'styled-components';
import {useFonts, Inter_400Regular, Inter_500Medium} from '@expo-google-fonts/inter';
import {Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold} from '@expo-google-fonts/archivo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from './src/hooks';

import theme from './src/styles/theme';
import { Routes } from './src/routes';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold
  });

  if(!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <Routes />
        </AppProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
