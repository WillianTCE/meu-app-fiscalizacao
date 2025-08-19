import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
// Removendo imports que causam erro no Snack
 import * as ImagePicker from 'expo-image-picker';
 import AsyncStorage from '@react-native-async-storage/async-storage';

const FormularioFiscalizacaoApp = () => {
  const [respostas, setRespostas] = useState({});
  const [fotos, setFotos] = useState({});
  const [loading, setLoading] = useState(false);

  // Estrutura do formulário
  const questoes = [
    {
      id: 'identificacao',
      categoria: 'IDENTIFICAÇÃO',
      items: [
        {
          id: 'entrevistados',
          tipo: 'textarea',
          label: 'Nome, função e período no cargo dos entrevistados',
          obrigatorio: true,
        },
        {
          id: 'objeto',
          tipo: 'textarea',
          label: 'Objeto da fiscalização, nº do contrato, data de início e prazo',
          obrigatorio: true,
        },
        {
          id: 'empresa',
          tipo: 'text',
          label: 'Local de preenchimento/Empresa contratada',
          obrigatorio: true,
        },
        {
          id: 'contextualizacao',
          tipo: 'textarea',
          label: 'Contextualização da obra',
          permiteAnexo: true,
        },
      ],
    },
    {
      id: 'escopo',
      categoria: 'ESCOPO',
      items: [
        {
          id: 'escopo_elementos',
          tipo: 'radio',
          label: 'Os elementos técnicos disponíveis justificam a necessidade da solução?',
          opcoes: ['Sim', 'Não', 'Parcialmente'],
          permiteAnexo: true,
        },
        {
          id: 'ri_necessidade',
          tipo: 'textarea',
          label: 'RI - A obra é necessária e atende ao interesse público?',
        },
        {
          id: 'ri_projeto_completo',
          tipo: 'radio',
          label: 'RI - O projeto básico está completo?',
          opcoes: ['Sim', 'Não', 'Parcialmente'],
          permiteAnexo: true,
        },
      ],
    },
    {
      id: 'qualidade',
      categoria: 'QUALIDADE',
      items: [
        {
          id: 'qualidade_geral',
          tipo: 'radio',
          label: 'A qualidade da execução é adequada?',
          opcoes: ['Sim', 'Não', 'Parcialmente'],
          permiteAnexo: true,
        },
        {
          id: 'ri_canteiro_organizacao',
          tipo: 'textarea',
          label: 'RI - O canteiro está organizado?',
          permiteAnexo: true,
        },
      ],
    },
  ];

  // Carregar dados ao iniciar
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    // Simulando dados salvos (no Expo Snack não temos AsyncStorage)
    console.log('Dados carregados (simulação)');
  };

  const salvarDados = () => {
    // Simulando salvamento (no Expo Snack não temos AsyncStorage)
    Alert.alert('Sucesso', 'Formulário salvo com sucesso! (simulação)');
  };

  const atualizarResposta = (id, valor) => {
    setRespostas(prev => ({
      ...prev,
      [id]: valor,
    }));
  };

  const adicionarFoto = (questaoId) => {
    Alert.alert(
      'Adicionar Foto',
      'Funcionalidade simulada no Expo Snack!\n\nNa versão completa você pode tirar fotos ou escolher da galeria.',
      [
        {
          text: 'Simular Foto',
          onPress: () => {
            const novaFoto = {
              id: Date.now(),
              uri: 'https://via.placeholder.com/300x200/007AFF/FFFFFF?text=Foto+Exemplo',
              fileName: `foto_${Date.now()}.jpg`,
              type: 'image/jpeg',
              data: new Date().toISOString(),
            };

            setFotos(prev => ({
              ...prev,
              [questaoId]: [...(prev[questaoId] || []), novaFoto],
            }));
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const removerFoto = (questaoId, fotoId) => {
    Alert.alert(
      'Remover Foto',
      'Deseja realmente remover esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setFotos(prev => ({
              ...prev,
              [questaoId]: prev[questaoId]?.filter(foto => foto.id !== fotoId) || [],
            }));
          },
        },
      ]
    );
  };

  const gerarRelatorio = () => {
    setLoading(true);

    // Gerar relatório no formato TCE-PR
    setTimeout(() => {
      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString('pt-BR');
      const horaFormatada = agora.toLocaleTimeString('pt-BR');

      let relatorio = `TRIBUNAL DE CONTAS DO ESTADO DO PARANÁ
Coordenadoria de Obras Públicas

LO 2025 - ENTREVISTA E INSPEÇÃO


Executor: ${respostas.entrevistados || 'Não informado'} - Auditor TCE-PR

Parceiro: N/A

Local de preenchimento: ${respostas.empresa || 'Não informado'}

Coordenadas: N/A

Objeto: ${respostas.objeto || 'Não informado'}

Data: ${dataFormatada}, ${horaFormatada}


1 - INFORMAÇÕES GERAIS DA OBRA
────────────────────────────────────────────────────────────────────

Índice | Pergunta | Resposta
────────────────────────────────────────────────────────────────────`;

      let indice = 1.1;

      questoes.forEach((secao, secaoIndex) => {
        relatorio += `\n\n${secaoIndex + 1} - ${secao.categoria}
${'─'.repeat(68)}
`;

        secao.items.forEach((item) => {
          const resposta = respostas[item.id] || 'Não informado';
          const observacoes = respostas[`${item.id}_obs`];
          const fotosItem = fotos[item.id] || [];

          relatorio += `\n${indice.toFixed(1)} | ${item.label} | ${resposta}`;

          if (observacoes) {
            relatorio += `\n     Observações: ${observacoes}`;
          }

          if (fotosItem.length > 0) {
            relatorio += `\n     Anexos: ${fotosItem.length} foto(s) anexada(s)`;
            fotosItem.forEach((foto, index) => {
              relatorio += `\n     Foto ${index + 1}: ${foto.fileName}`;
              relatorio += `\n     Data: ${new Date(foto.data).toLocaleString('pt-BR')}`;
            });
          }

          indice += 0.1;
        });
      });

      relatorio += `\n\n
────────────────────────────────────────────────────────────────────
RESUMO DA FISCALIZAÇÃO:
• Total de questões: ${totalQuestoes}
• Questões respondidas: ${totalRespostas}
• Total de fotos anexadas: ${totalFotos}
• Data de preenchimento: ${dataFormatada} às ${horaFormatada}

TRIBUNAL DE CONTAS DO ESTADO DO PARANÁ
Coordenadoria de Obras Públicas`;

      setLoading(false);
      Alert.alert(
        'Relatório TCE-PR Gerado!', 
        'Relatório no formato oficial do Tribunal de Contas do Paraná criado com sucesso!',
        [
          { text: 'OK' },
          {
            text: 'Ver Relatório',
            onPress: () => {
              Alert.alert('RELATÓRIO TCE-PR', relatorio);
            }
          }
        ]
      );
    }, 2000);
  };

  const renderizarCampo = (item) => {
    const valor = respostas[item.id] || '';
    const fotosItem = fotos[item.id] || [];

    return (
      <View style={styles.campoContainer}>
        <Text style={styles.label}>
          {item.label}
          {item.obrigatorio && <Text style={styles.obrigatorio}> *</Text>}
        </Text>

        {/* Renderizar campo baseado no tipo */}
        {item.tipo === 'text' && (
          <TextInput
            style={styles.input}
            value={valor}
            onChangeText={(text) => atualizarResposta(item.id, text)}
            placeholder={item.obrigatorio ? 'Campo obrigatório...' : 'Digite sua resposta...'}
            multiline={false}
          />
        )}

        {item.tipo === 'textarea' && (
          <TextInput
            style={[styles.input, styles.textarea]}
            value={valor}
            onChangeText={(text) => atualizarResposta(item.id, text)}
            placeholder={item.obrigatorio ? 'Campo obrigatório...' : 'Digite sua resposta...'}
            multiline={true}
            numberOfLines={4}
          />
        )}

        {item.tipo === 'radio' && (
          <View>
            {item.opcoes?.map((opcao, index) => (
              <TouchableOpacity
                key={index}
                style={styles.radioOption}
                onPress={() => atualizarResposta(item.id, opcao)}
              >
                <View style={[
                  styles.radioCircle,
                  valor === opcao && styles.radioSelected
                ]} />
                <Text style={styles.radioText}>{opcao}</Text>
              </TouchableOpacity>
            ))}

            {/* Campo de observações para múltipla escolha */}
            <View style={styles.observacoesContainer}>
              <Text style={styles.observacoesLabel}>Observações Complementares:</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={respostas[`${item.id}_obs`] || ''}
                onChangeText={(text) => atualizarResposta(`${item.id}_obs`, text)}
                placeholder="Adicione observações, detalhes ou justificativas..."
                multiline={true}
                numberOfLines={3}
              />
            </View>
          </View>
        )}

        {/* Seção de fotos */}
        {item.permiteAnexo && (
          <View style={styles.fotosContainer}>
            <View style={styles.fotosHeader}>
              <Text style={styles.fotosTitle}>Anexos Fotográficos</Text>
              <TouchableOpacity
                style={styles.botaoFoto}
                onPress={() => adicionarFoto(item.id)}
              >
                <Text style={styles.botaoFotoText}>📷 Adicionar</Text>
              </TouchableOpacity>
            </View>

            {fotosItem.length > 0 && (
              <View style={styles.fotosGrid}>
                {fotosItem.map((foto) => (
                  <View key={foto.id} style={styles.fotoItem}>
                    <Image source={{ uri: foto.uri }} style={styles.foto} />
                    <TouchableOpacity
                      style={styles.botaoRemoverFoto}
                      onPress={() => removerFoto(item.id, foto.id)}
                    >
                      <Text style={styles.botaoRemoverText}>×</Text>
                    </TouchableOpacity>
                    <Text style={styles.fotoNome} numberOfLines={1}>
                      {foto.fileName}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const totalQuestoes = questoes.reduce((acc, secao) => acc + secao.items.length, 0);
  const totalRespostas = Object.keys(respostas).filter(key => 
    respostas[key]?.toString().trim() && !key.endsWith('_obs')
  ).length;
  const totalFotos = Object.values(fotos).flat().length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#007AFF" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fiscalização de Obras</Text>
        <Text style={styles.headerSubtitle}>
          {totalRespostas}/{totalQuestoes} campos preenchidos • {totalFotos} fotos
        </Text>
      </View>

      {/* Formulário em sequência única */}
      <ScrollView style={styles.conteudo}>
        {questoes.map((secao, secaoIndex) => (
          <View key={secao.id} style={styles.secaoContainer}>
            <Text style={styles.secaoTitulo}>{secao.categoria}</Text>

            {secao.items.map((item) => (
              <View key={item.id}>
                {renderizarCampo(item)}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Botões de ação */}
      <View style={styles.botoesContainer}>
        <TouchableOpacity style={styles.botaoSalvar} onPress={salvarDados}>
          <Text style={styles.botaoTexto}>💾 Salvar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.botaoPDF, loading && styles.botaoDesabilitado]} 
          onPress={gerarRelatorio}
          disabled={loading}
        >
          <Text style={styles.botaoTexto}>
            {loading ? '⏳ Gerando...' : '📄 Relatório'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#B3D9FF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  // Removendo estilos das abas que não precisamos mais
  conteudo: {
    flex: 1,
    padding: 15,
  },
  secaoContainer: {
    marginBottom: 30,
  },
  secaoTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 15,
    textAlign: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  campoContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  obrigatorio: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 10,
  },
  radioSelected: {
    backgroundColor: '#007AFF',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  observacoesContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  observacoesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  fotosContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  fotosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fotosTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  botaoFoto: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  botaoFotoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  fotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fotoItem: {
    width: '48%',
    marginBottom: 10,
    position: 'relative',
  },
  foto: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  botaoRemoverFoto: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoRemoverText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fotoNome: {
    fontSize: 10,
    color: '#666',
    marginTop: 3,
    textAlign: 'center',
  },
  botoesContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  botaoSalvar: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 10,
  },
  botaoPDF: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
  },
  botaoDesabilitado: {
    backgroundColor: '#ccc',
  },
  botaoTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default FormularioFiscalizacaoApp;