import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { supabase } from './supabaseClient';
import LoginScreen from './LoginScreen';
import FormListScreen from './FormListScreen';
import FormularioScreen from './FormularioScreen';
import SyncScreen from './SyncScreen';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

// Uma pilha só para o fluxo de formulários
function FormularioStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Lista" 
        component={FormListScreen} 
        options={{ title: 'Meus Formulários' }} 
      />
      <Stack.Screen 
        name="Preenchimento" 
        component={FormularioScreen} 
        options={({ route }) => ({ title: route.params.formTitle || 'Preencher' })} 
      />
    </Stack.Navigator>
  );
}

// O nosso novo ecrã principal com as abas no topo
function MainTabs() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
      <Tab.Navigator>
        <Tab.Screen 
          name="Formularios" 
          component={FormularioStack} 
          options={{ headerShown: false }} 
        />
        <Tab.Screen 
          name="Relatorios" 
          component={SyncScreen} 
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

// O controlador principal
const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>A verificar autenticação...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {!session ? (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
