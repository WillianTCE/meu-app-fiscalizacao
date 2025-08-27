import React, { useEffect, useState, useLayoutEffect } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from './supabaseClient';
import { Feather } from '@expo/vector-icons'; // Import para os ícones

const FormListScreen = ({ navigation }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchForms = async () => {
    const { data, error } = await supabase.from('forms').select('id, title');
    if (error) {
      Alert.alert('Erro', 'Não foi possível carregar os formulários.');
    } else {
      setForms(data);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchForms().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchForms();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {forms.map(form => (
          <TouchableOpacity
            key={form.id}
            style={styles.formButton}
            onPress={() => navigation.navigate('Preenchimento', { formId: form.id, formTitle: form.title })}
          >
            <Text style={styles.formButtonText}>{form.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { // Estilo ajustado
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    formButton: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    formButtonText: { fontSize: 16, fontWeight: '600' },
});


export default FormListScreen;