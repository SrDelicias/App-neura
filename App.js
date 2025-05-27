import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const coloresDisponibles = ['#ffffff', '#ffeb3b', '#ffccbc', '#c8e6c9', '#bbdefb', '#f8bbd0', '#d1c4e9'];

export default function App() {
  const [nota, setNota] = useState('');
  const [notas, setNotas] = useState([]);
  const [colorSelectorVisible, setColorSelectorVisible] = useState(false);
  const [notaParaColor, setNotaParaColor] = useState(null); // id de la nota que está eligiendo color
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [notaEditando, setNotaEditando] = useState(null); // objeto nota que editamos
  const [textoEditado, setTextoEditado] = useState(''); // texto temporal del input

  useEffect(() => {
    const cargarNotas = async () => {
      const notasGuardadas = await AsyncStorage.getItem('notas');
      if (notasGuardadas) setNotas(JSON.parse(notasGuardadas));
    };
    cargarNotas();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('notas', JSON.stringify(notas));
  }, [notas]);

  const agregarNota = () => {
    if (nota.trim() === '') return;
    const fechaCreacion = new Date().toLocaleDateString(); // solo fecha, sin hora
    const nuevaNota = {
      id: Date.now().toString(),
      texto: nota,
      color: '#ffffff',
      fecha: fechaCreacion,
    };
    setNotas([...notas, nuevaNota]);
    setNota('');
  };


  const eliminarNota = (id) => {
    setNotas(notas.filter(n => n.id !== id));
  };

  const abrirSelectorColor = (id) => {
    setNotaParaColor(id);
    setColorSelectorVisible(true);
  };

  const elegirColor = (color) => {
    setNotas(notas.map(n => n.id === notaParaColor ? { ...n, color } : n));
    setColorSelectorVisible(false);
    setNotaParaColor(null);
  };
  const abrirEditarNota = (nota) => {
  setNotaEditando(nota);
  setTextoEditado(nota.texto);
  setModalEditarVisible(true);
  };

  const guardarEdicion = () => {
  if (textoEditado.trim() === '') return; // no dejar vacío
  setNotas(notas.map(n => 
    n.id === notaEditando.id ? { ...n, texto: textoEditado } : n
  ));
  setModalEditarVisible(false);
  setNotaEditando(null);
  setTextoEditado('');
  };



  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Bienvenido a Neura</Text>
      <TextInput
        style={styles.input}
        placeholder="Escribe una nota..."
        value={nota}
        onChangeText={setNota}
      />
      <TouchableOpacity style={styles.boton} onPress={agregarNota}>
        <Text style={styles.botonTexto}>Agregar nota</Text>
      </TouchableOpacity>

      <FlatList
        data={notas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.nota, { backgroundColor: item.color }]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => abrirEditarNota(item)}>
              <Text>{item.texto}</Text>
              <Text style={styles.fecha}>{item.fecha}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => abrirSelectorColor(item.id)}>
              <Text style={styles.icono}>➕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => eliminarNota(item.id)}>
              <Text style={styles.icono}>🗑️</Text>
            </TouchableOpacity>
          </View>

        )}
        style={{ marginTop: 20 }}
      />

      {/* Modal para seleccionar color */}
      <Modal
        visible={modalEditarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalEditarVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>Editar nota</Text>
            <TextInput
              style={styles.input}
              multiline
              value={textoEditado}
              onChangeText={setTextoEditado}
            />
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity style={[styles.boton, { marginRight: 10 }]} onPress={guardarEdicion}>
                <Text style={styles.botonTexto}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boton, { backgroundColor: '#ccc' }]} onPress={() => setModalEditarVisible(false)}>
                <Text style={[styles.botonTexto, { color: '#333' }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 20,
    paddingTop: 50,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  boton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 10,
  },
  botonTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  nota: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icono: {
    fontSize: 18,
    marginLeft: 10,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContenido: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitulo: {
    fontSize: 18,
    marginBottom: 15,
  },
  paleta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  colorCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  fecha: {
  fontSize: 12,
  color: '#999',  // color gris claro
  marginTop: 4,
  opacity: 0.6,   // hace que sea más tenue
  },
  input: {
  backgroundColor: 'white',
  padding: 10,
  borderRadius: 6,
  minHeight: 60,
  maxHeight: 150,
  textAlignVertical: 'top',
  },
});
