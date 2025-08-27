import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Button, FlatList, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from './supabaseClient';

const SyncScreen = () => {
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused(); // Para recarregar os dados quando o ecrã fica visível

  const loadPendingReports = async () => {
    setLoading(true);
    const reportsJSON = await AsyncStorage.getItem('form_responses');
    const allReports = reportsJSON ? JSON.parse(reportsJSON) : [];
    const pending = allReports.filter(report => report.status === 'draft');
    setPendingReports(pending);
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) {
      loadPendingReports();
    }
  }, [isFocused]);

  const sincronizarRelatorios = async () => {
    if (pendingReports.length === 0) {
      Alert.alert("Tudo em dia!", "Não há relatórios pendentes para sincronizar.");
      return;
    }

    setLoading(true);
    let successCount = 0;
    const reportsToSync = [...pendingReports]; // Cria uma cópia para trabalhar
    const allLocalReportsJSON = await AsyncStorage.getItem('form_responses');
    let allLocalReports = allLocalReportsJSON ? JSON.parse(allLocalReportsJSON) : [];

    for (const report of reportsToSync) {
      // Prepara os dados removendo o ID offline temporário
      const { id, ...reportData } = report;
      reportData.status = 'synced'; // Muda o status

      const { error } = await supabase.from('form_responses').insert([reportData]);

      if (!error) {
        // Se o envio deu certo, atualiza o status no armazenamento local
        const reportIndex = allLocalReports.findIndex(r => r.id === report.id);
        if (reportIndex > -1) {
          allLocalReports[reportIndex].status = 'synced';
        }
        successCount++;
      } else {
        console.error('Erro ao sincronizar relatório:', report.id, error.message);
      }
    }

    // Salva a lista inteira atualizada de volta no AsyncStorage
    await AsyncStorage.setItem('form_responses', JSON.stringify(allLocalReports));

    setLoading(false);
    Alert.alert(
      "Sincronização Concluída",
      `${successCount} de ${reportsToSync.length} relatórios foram enviados com sucesso.`
    );

    // Recarrega a lista de pendentes no ecrã
    loadPendingReports();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button 
          title="Sincronizar Todos os Pendentes" 
          onPress={sincronizarRelatorios} 
          disabled={loading || pendingReports.length === 0}
        />
      </View>
      {loading && <ActivityIndicator style={{marginTop: 20}} size="large" />}
      <FlatList
        data={pendingReports}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.reportItem}>
            <Text style={styles.reportTitle}>{item.formTitle || 'Relatório' } de {new Date(item.created_at).toLocaleString('pt-BR')}</Text>
            <Text style={styles.reportStatus}>{`Status: ${item.status}`}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum relatório pendente.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  reportItem: { backgroundColor: 'white', padding: 15, marginVertical: 8, marginHorizontal: 16, borderRadius: 8 },
  reportTitle: { fontSize: 16, fontWeight: 'bold' },
  reportStatus: { fontSize: 14, color: 'gray', marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});

export default SyncScreen;