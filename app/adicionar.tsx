import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import MaskInput from 'react-native-mask-input';

// Define a interface do medicamento
interface Medicamento {
  id: string;
  nome: string;
  intervalo: number; // Intervalo em minutos
}

export default function AdicionarMedicamentoScreen() {
  const [nome, setNome] = useState<string>(''); // Nome do medicamento
  const [intervalo, setIntervalo] = useState<string>(''); // Intervalo no formato HH:MM
  const router = useRouter();

  useEffect(() => {
    // Verificar e solicitar permissões de notificação
    const verificarPermissoes = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: novoStatus } = await Notifications.requestPermissionsAsync();
        if (novoStatus !== 'granted') {
          Alert.alert('Permissões de Notificação', 'Você precisa conceder permissão para notificações.');
        }
      }
    };
    verificarPermissoes();
  }, []);

  const agendarNotificacao = async (medicamento: Medicamento) => {
    const minutos = medicamento.intervalo;

    const trigger = new Date(Date.now() + minutos * 60 * 1000); // Minutos para milissegundos

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora do Remédio',
        body: `Está na hora de tomar ${medicamento.nome}`,
      },
      trigger: {
        date: trigger, // Data de disparo da notificação
      },
    });
  };

  const salvarMedicamento = async () => {
    if (!nome || !intervalo) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    // Separar horas e minutos do campo de entrada (HH:MM)
    const [horas, minutos] = intervalo.split(':').map(Number);

    if (isNaN(horas) || isNaN(minutos)) {
      Alert.alert('Erro', 'Por favor, insira um intervalo válido no formato HH:MM.');
      return;
    }

    // Converter para minutos totais
    const intervaloEmMinutos = (horas * 60) + minutos;

    const novoMedicamento: Medicamento = {
      id: uuid.v4().toString(),
      nome,
      intervalo: intervaloEmMinutos, // Salva o intervalo em minutos
    };

    try {
      // Recupera os medicamentos salvos no AsyncStorage
      const data = await AsyncStorage.getItem('@medicamentos');
      const medicamentos: Medicamento[] = data ? JSON.parse(data) : [];
      medicamentos.push(novoMedicamento);

      // Salva a lista atualizada
      await AsyncStorage.setItem('@medicamentos', JSON.stringify(medicamentos));

      // Agendar a notificação
      await agendarNotificacao(novoMedicamento);

      Alert.alert('Sucesso', 'Medicamento adicionado e notificação agendada!');
      router.back(); // Volta para a tela anterior
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível salvar o medicamento.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Nome do Medicamento"
        value={nome}
        onChangeText={setNome}
        style={styles.input}
      />
      <MaskInput
        value={intervalo}
        onChangeText={(masked) => setIntervalo(masked)} // "masked" retorna o valor formatado no campo
        mask={[/\d/, /\d/, ':', /\d/, /\d/]} // Aplica a máscara HH:MM manualmente
        placeholder="Intervalo (HH:MM)"
        keyboardType="numeric" // Garante que o teclado numérico seja exibido
        style={styles.input}
      />
      <Button title="Salvar" onPress={salvarMedicamento} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 },
});
