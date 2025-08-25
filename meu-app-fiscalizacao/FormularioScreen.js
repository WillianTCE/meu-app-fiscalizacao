          import React, { useState, useEffect } from 'react';
          import { 
            View, 
            Text, 
            SafeAreaView, 
            StyleSheet, 
            ActivityIndicator, 
            ScrollView, 
            TextInput,
            TouchableOpacity, 
            Alert 
          } from 'react-native';
          import { supabase } from './supabaseClient';
          import AsyncStorage from '@react--native-async-storage/async-storage';
          import * as ImagePicker from 'expo-image-picker';

          const FormularioScreen = ({ route, navigation }) => {
            const { formId, formTitle } = route.params;

            const [respostas, setRespostas] = useState({});
            const [fotos, setFotos] = useState({});
            const [loading, setLoading] = useState(true);
            const [questoes, setQuestoes] = useState([]);

            useEffect(() => {
              navigation.setOptions({ title: formTitle });

              const buscarFormulario = async () => {
                setLoading(true);
                const { data, error } = await supabase.from('forms').select(`*, sections (*, questions (*))`).eq('id', formId).single();

                if (error) {
                  Alert.alert("Erro", "Não foi possível carregar este formulário.");
                } else {
                  const questoesFormatadas = data.sections.map(section => ({
                    id: section.id.toString(),
                    categoria: section.title,
                    items: section.questions.map(q => ({
                      id: q.id.toString(),
                      tipo: q.type,
                      label: q.text,
                      obrigatorio: q.required,
                      opcoes: q.options || [],
                      permiteAnexo: true,
                      showObservations: q.show_additional_observations,
                      observationsLabel: q.additional_observations,
                    }))
                  }));
                  setQuestoes(questoesFormatadas);
                }
                setLoading(false);
              };

              if (formId) {
                buscarFormulario();
              }
            }, [formId]);

            const salvarDados = async () => {
              try {
                setLoading(true);
                const questoesObrigatorias = questoes.flatMap(s => s.items).filter(i => i.obrigatorio);
                for (const questao of questoesObrigatorias) {
                  if (!respostas[questao.id]) {
                    Alert.alert("Atenção", `A pergunta "${questao.label}" é obrigatória.`);
                    setLoading(false);
                    return;
                  }
                }
                const newResponse = {
                  id: `offline_${new Date().toISOString()}`,
                  form_id: formId,
                  answers: respostas,
                  photos: fotos,
                  status: 'draft',
                  created_at: new Date().toISOString(),
                  formTitle: formTitle
                };
                const existingResponsesJSON = await AsyncStorage.getItem('form_responses');
                const existingResponses = existingResponsesJSON ? JSON.parse(existingResponsesJSON) : [];
                existingResponses.push(newResponse);
                await AsyncStorage.setItem('form_responses', JSON.stringify(existingResponses));
                Alert.alert("Salvo no Dispositivo!", "O seu relatório foi salvo localmente e está pronto para ser sincronizado.");
                navigation.goBack();
              } catch (error) {
                console.error('Erro ao salvar localmente:', error);
                Alert.alert("Erro", "Não foi possível salvar o relatório no dispositivo.");
              } finally {
                setLoading(false);
              }
            };

            const atualizarResposta = (id, valor) => {
              setRespostas(prev => ({ ...prev, [id]: valor }));
            };

            const adicionarFoto = async (questaoId) => {
              const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
              if (permissionResult.granted === false) {
                Alert.alert("Permissão necessária", "É preciso dar permissão para aceder à câmera!");
                return;
              }
              const pickerResult = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.5,
                exif: true,
              });
              if (pickerResult.canceled === true) return;
              setLoading(true);
              try {
                const image = pickerResult.assets[0];
                const response = await fetch(image.uri);
                const blob = await response.blob();
                const fileExt = image.uri.split('.').pop();
                const fileName = `${new Date().toISOString()}.${fileExt}`;
                const filePath = `${formId}/${questaoId}/${fileName}`;
                const { data, error: uploadError } = await supabase.storage.from('inspection-photos').upload(filePath, blob, { contentType: `image/${fileExt}` });
                if (uploadError) throw uploadError;
                const newPhoto = {
                  path: data.path,
                  coordinates: image.exif?.GPSLatitude ? `${image.exif.GPSLatitude}, ${image.exif.GPSLongitude}` : null,
                };
                const newFotos = { ...fotos, [questaoId]: [...(fotos[questaoId] || []), newPhoto] };
                setFotos(newFotos);
                const newRespostas = { ...respostas, [`${questaoId}_photos`]: newFotos[questaoId].map(p => p.path) };
                setRespostas(newRespostas);
                Alert.alert('Sucesso', 'Foto enviada com sucesso!');
              } catch (error) {
                console.error('Erro no processo de adicionar foto:', error);
                Alert.alert('Erro', 'Não foi possível enviar a sua foto.');
              } finally {
                setLoading(false);
              }
            };

            const renderizarCampo = (item) => {
              const valor = respostas[item.id] || '';
              return (
                <View style={styles.campoContainer} key={item.id}>
                  <Text style={styles.label}>{item.label}{item.obrigatorio && <Text style={styles.obrigatorio}> *</Text>}</Text>
                  {item.tipo === 'text' && (
                    <TextInput style={styles.input} value={valor} onChangeText={(text) => atualizarResposta(item.id, text)} placeholder="Digite sua resposta..." />
                  )}
                  {item.tipo === 'textarea' && (
                    <TextInput style={[styles.input, styles.textarea]} value={valor} onChangeText={(text) => atualizarResposta(item.id, text)} placeholder="Digite sua resposta..." multiline />
                  )}
                  {item.tipo === 'multiple_choice' && (
                    <View>
                      {item.opcoes?.map((opcao, index) => (
                        <TouchableOpacity key={index} style={styles.radioOption} onPress={() => atualizarResposta(item.id, opcao)}>
                          <View style={[ styles.radioCircle, valor === opcao && styles.radioSelected ]} />
                          <Text style={styles.radioText}>{opcao}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {item.showObservations && (
                    <View style={styles.observacoesContainer}>
                      <Text style={styles.observacoesLabel}>{item.observationsLabel || 'Observações Adicionais:'}</Text>
                      <TextInput style={[styles.input, styles.textarea]} value={respostas[`${item.id}_obs`] || ''} onChangeText={(text) => atualizarResposta(`${item.id}_obs`, text)} placeholder="Adicione detalhes..." multiline />
                    </View>
                  )}
                  {item.permiteAnexo && (
                    <View style={styles.fotosContainer}>
                      <Text style={styles.observacoesLabel}>Evidências Fotográficas</Text>
                      <TouchableOpacity style={styles.botaoFoto} onPress={() => adicionarFoto(item.id)}>
                        <Text style={styles.botaoFotoText}>📷 Tirar Foto</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            };

            if (loading) {
              return (
                <SafeAreaView style={styles.container}>
                  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size="large" color="#007AFF" />
                  </View>
                </SafeAreaView>
              );
            }

            return (
              <SafeAreaView style={styles.container}>
                <ScrollView style={styles.conteudo}>
                  {questoes.map((secao) => (
                    <View key={secao.id} style={styles.secaoContainer}>
                      <Text style={styles.secaoTitulo}>{secao.categoria}</Text>
                      {secao.items.map((item) => renderizarCampo(item))}
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.botoesContainer}>
                  <TouchableOpacity style={styles.botaoSalvar} onPress={salvarDados} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>💾 Salvar</Text>}
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            );
          };

          const styles = StyleSheet.create({
            container: { flex: 1, backgroundColor: '#f5f5f5' },
            conteudo: { flex: 1, padding: 15 },
            secaoContainer: { marginBottom: 30 },
            secaoTitulo: { fontSize: 20, fontWeight: 'bold', color: '#007AFF', marginBottom: 15, textAlign: 'center', backgroundColor: '#E3F2FD', padding: 12, borderRadius: 8 },
            campoContainer: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
            label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
            obrigatorio: { color: '#FF3B30' },
            input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
            textarea: { minHeight: 80, textAlignVertical: 'top' },
            radioOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
            radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#007AFF', marginRight: 10 },
            radioSelected: { backgroundColor: '#007AFF' },
            radioText: { fontSize: 16, color: '#333' },
            botoesContainer: { flexDirection: 'row', padding: 15, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee' },
            botaoSalvar: { flex: 1, backgroundColor: '#34C759', paddingVertical: 15, borderRadius: 10 },
            botaoTexto: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
            observacoesContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
            observacoesLabel: { fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 8 },
            fotosContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
            botaoFoto: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
            botaoFotoText: { color: 'white', fontWeight: 'bold' },
          });

          export default FormularioScreen;