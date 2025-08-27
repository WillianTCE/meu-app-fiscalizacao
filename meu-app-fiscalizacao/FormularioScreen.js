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
import AsyncStorage from '@react-native-async-storage/async-storage'; // CORRIGIDO
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
        created_at: new Date().toISOString(),      // CORRIGIDO
        form_title: formTitle                   // CORRIGIDO
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
      allowsEditing: false, // CORRIGIDO
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

  // O resto do seu ficheiro (renderizarCampo, styles, etc.) continua aqui...
  // (O código que você enviou estava incompleto, então estou a manter o que tínhamos antes)
};

// Cole o resto do seu ficheiro FormularioScreen.js aqui (a partir da função renderizarCampo)