import React, { useState, useCallback } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

// Definir a interface do Medicamento
interface Medicamento {
  id: string;
  nome: string;
  intervalo: number; // Intervalo em minutos
}

export default function HomeScreen() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const router = useRouter();

  // Carregar medicamentos sempre que a tela ganhar o foco
  useFocusEffect(
    useCallback(() => {
      carregarMedicamentos();
    }, [])
  );

  // Função para carregar os medicamentos do AsyncStorage
  const carregarMedicamentos = async () => {
    try {
      const data = await AsyncStorage.getItem('@medicamentos');
      if (data !== null) {
        setMedicamentos(JSON.parse(data)); // Carregar os medicamentos
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Função para remover um medicamento
  const removerMedicamento = async (id: string) => {
    try {
      const data = await AsyncStorage.getItem('@medicamentos');
      const medicamentos: Medicamento[] = data ? JSON.parse(data) : [];

      // Filtrar o medicamento que deve ser removido
      const novaLista = medicamentos.filter(medicamento => medicamento.id !== id);

      // Atualizar o AsyncStorage com a nova lista
      await AsyncStorage.setItem('@medicamentos', JSON.stringify(novaLista));

      // Atualizar o estado local
      setMedicamentos(novaLista);

      Alert.alert('Sucesso', 'Medicamento removido com sucesso!');
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível remover o medicamento.');
    }
  };

  // Função de renderização de cada item
  const renderItem = ({ item }: { item: Medicamento }) => {
    const horas = Math.floor(item.intervalo / 60); // Converter minutos para horas
    const minutos = item.intervalo % 60; // Restante em minutos

    return (
      <View style={styles.item}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.nome}</Text>
          {horas > 0 ? (
            <Text>Intervalo: a cada {horas} horas e {minutos} minutos</Text>
          ) : (
            <Text>Intervalo: a cada {minutos} minutos</Text>
          )}
        </View>
        {/* Botão para remover o medicamento */}
        <TouchableOpacity
          onPress={() => removerMedicamento(item.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={medicamentos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>Nenhum medicamento adicionado ainda.</Text>} // Mostrar algo se a lista estiver vazia
      />
      <Button
        title="Adicionar Medicamento"
        onPress={() => router.push('/adicionar')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  textContainer: {
    flexDirection: 'column',
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  deleteButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
