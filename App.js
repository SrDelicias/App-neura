import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function App() {
  const [notas, setNotas] = useState([]);
  const [nuevaNota, setNuevaNota] = useState('');
  const [notaSeleccionadaParaColor, setNotaSeleccionadaParaColor] = useState(null);
  const [expandirNotaId, setExpandirNotaId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    cargarNotas();
  }, []);

  const guardarNotas = async (nuevasNotas) => {
    try {
      await AsyncStorage.setItem('notas', JSON.stringify(nuevasNotas));
    } catch (error) {
      console.error('Error guardando notas:', error);
    }
  };

  const cargarNotas = async () => {
    try {
      const notasGuardadas = await AsyncStorage.getItem('notas');
      if (notasGuardadas) {
        setNotas(JSON.parse(notasGuardadas));
      }
    } catch (error) {
      console.error('Error cargando notas:', error);
    }
  };

  const agregarNota = () => {
    if (nuevaNota.trim() === '') return;
    const fecha = new Date().toLocaleDateString();
    const nueva = {
      id: Date.now().toString(),
      texto: nuevaNota,
      color: '#ffffff',
      fecha,
    };
    const nuevasNotas = [nueva, ...notas];
    setNotas(nuevasNotas);
    guardarNotas(nuevasNotas);
    setNuevaNota('');
  };

  const eliminarNota = (id) => {
    Alert.alert(
      'Eliminar nota',
      '¿Estás seguro de que quieres eliminar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const nuevasNotas = notas.filter(nota => nota.id !== id);
            setNotas(nuevasNotas);
            guardarNotas(nuevasNotas);
          }
        }
      ]
    );
  };

  const cambiarColorNota = (id) => {
    if (notaSeleccionadaParaColor === id) {
      setNotaSeleccionadaParaColor(null);
    } else {
      setNotaSeleccionadaParaColor(id);
    }
  };

  const seleccionarColor = (id, color) => {
    const nuevasNotas = notas.map((nota) =>
      nota.id === id ? { ...nota, color } : nota
    );
    setNotas(nuevasNotas);
    guardarNotas(nuevasNotas);
    setNotaSeleccionadaParaColor(null);
  };

  const toggleExpandirNota = (id) => {
    setExpandirNotaId(expandirNotaId === id ? null : id);
  };

  const editarTextoNota = (id, nuevoTexto) => {
    const nuevasNotas = notas.map((nota) =>
      nota.id === id ? { ...nota, texto: nuevoTexto } : nota
    );
    setNotas(nuevasNotas);
    guardarNotas(nuevasNotas);
  };

  const notasFiltradas = notas.filter(nota =>
    nota.texto.toLowerCase().includes(busqueda.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => toggleExpandirNota(item.id)}
    >
      <View style={[styles.nota, { backgroundColor: item.color }]}>
        <View style={styles.notaFila}>
          <View style={{ flex: 1 }}>
            {expandirNotaId === item.id ? (
              <TextInput
                value={item.texto}
                onChangeText={(text) => editarTextoNota(item.id, text)}
                multiline
                style={styles.textoNotaEditable}
              />
            ) : (
              <Text style={styles.textoNota}>{item.texto}</Text>
            )}
            <Text style={styles.fecha}>{item.fecha}</Text>
          </View>
          <View style={styles.iconos}>
            <TouchableOpacity onPress={() => cambiarColorNota(item.id)} style={styles.iconoBtn}>
              <Ionicons name="color-palette-outline" size={20} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => eliminarNota(item.id)} style={styles.iconoBtn}>
              <Ionicons name="trash-outline" size={20} color="#c00" />
            </TouchableOpacity>
          </View>
        </View>
        {notaSeleccionadaParaColor === item.id && (
          <View style={styles.paleta}>
            {['#ffffff', '#ffeb3b', '#ff8a65', '#81c784', '#64b5f6', '#ba68c8'].map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => seleccionarColor(item.id, color)}
                style={[styles.colorBoton, { backgroundColor: color }]}
              />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={() => {
      if (mostrarBusqueda) setMostrarBusqueda(false);
      Keyboard.dismiss();
    }}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Neura</Text>

        <View style={styles.buscadorWrapper}>
          {mostrarBusqueda ? (
            <TextInput
              placeholder="Buscar..."
              value={busqueda}
              onChangeText={setBusqueda}
              style={styles.buscador}
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setMostrarBusqueda(true)}>
              <Ionicons name="search-outline" size={24} color="#555" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.entrada}>
          <TextInput
            placeholder="Escribe una nota..."
            value={nuevaNota}
            onChangeText={setNuevaNota}
            style={styles.input}
            multiline
          />
          <TouchableOpacity onPress={agregarNota} style={styles.boton}>
            <Text style={styles.botonTexto}>Agregar</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={notasFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 150 }}
        />

        {/* FAB: Menú flotante */}
        <View style={styles.fabContainer}>
          {menuAbierto && (
            <>
              <TouchableOpacity style={styles.fabOption} onPress={() => {}}>
                <Ionicons name="text" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.fabOption} onPress={() => {}}>
                <MaterialCommunityIcons name="microphone" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.fabOption} onPress={() => {}}>
                <FontAwesome5 name="list" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.fabPrincipal}
            onPress={() => setMenuAbierto(!menuAbierto)}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffdf',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  buscadorWrapper: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  buscador: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    width: '100%',
  },
  entrada: {
    flexDirection: 'column',
    marginBottom: 20,
    gap: 10,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  boton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  botonTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  nota: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textoNota: {
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
  },
  textoNotaEditable: {
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 6,
  },
  fecha: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  notaFila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconos: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoBtn: {
    marginLeft: 10,
  },
  paleta: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  colorBoton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    alignItems: 'flex-end',
    gap: 12,
  },
  fabPrincipal: {
    backgroundColor: '#ff00aa',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabOption: {
    backgroundColor: '#6200ee',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  }
});
