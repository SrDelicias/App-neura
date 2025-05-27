import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList } from 'react-native';

export default function App() {
  const [nota, setNota] = useState('');
  const [notas, setNotas] = useState([]);

  const agregarNota = () => {
    if (nota.trim().length === 0) return; // No agregar si está vacío
    setNotas(currentNotas => [
      ...currentNotas,
      { id: Math.random().toString(), value: nota }
    ]);
    setNota('');
  };

  return (
  <View style={styles.container}>
    <Text style={styles.titulo}>Bienvenido a Neura — tu cerebro externo personal.</Text>
    <Text style={{ marginBottom: 20 }}>
      Aquí guardarás todas tus ideas, tareas y recuerdos.
    </Text>

    <TextInput
      placeholder="Escribe tu nota aquí"
      style={styles.input}
      onChangeText={text => setNota(text)}
      value={nota}
    />

    <Button title="Agregar Nota" onPress={agregarNota} />

    <FlatList
      data={notas}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Text style={styles.nota}>{item.value}</Text>}
    />
  </View>
  );

}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    flex: 1,
    backgroundColor: '#fff'
  },
  titulo: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    borderColor: '#999',
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  nota: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#eee',
    borderColor: '#ccc',
    borderWidth: 1,
  }
});
