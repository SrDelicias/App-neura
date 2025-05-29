import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export default function App() {
  const [notas, setNotas] = useState([]);
  const [notaSeleccionadaParaColor, setNotaSeleccionadaParaColor] = useState(null);
  const [expandirNotaId, setExpandirNotaId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalTextoVisible, setModalTextoVisible] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [grabando, setGrabando] = useState(false);
  const [grabacion, setGrabacion] = useState(null);
  const [modalListaVisible, setModalListaVisible] = useState(false);
  const [nuevaLista, setNuevaLista] = useState('');
  const [tareasLista, setTareasLista] = useState([]);

  // NUEVO ESTADO para reproducir audio
  const [reproduciendoId, setReproduciendoId] = useState(null);
  const soundRef = useRef(null);

  useEffect(() => {
    cargarNotas();

    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
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

  const agregarNota = (texto) => {
    const fecha = new Date().toLocaleDateString();
    const nueva = {
      id: Date.now().toString(),
      texto,
      color: '#ffffff',
      fecha,
      tipo: 'texto',
    };
    const nuevasNotas = [nueva, ...notas];
    setNotas(nuevasNotas);
    guardarNotas(nuevasNotas);
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
            if (reproduciendoId === id) {
              pararAudio();
            }
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
    (nota.texto || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const empezarGrabacion = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setGrabando(true);
      setGrabacion(recording);
    } catch (error) {
      console.error('Error al empezar grabación:', error);
    }
  };

  const detenerGrabacion = async () => {
    try {
      setGrabando(false);
      await grabacion.stopAndUnloadAsync();
      const uri = grabacion.getURI();
      const fecha = new Date().toLocaleDateString();
      const nuevaNotaAudio = {
        id: Date.now().toString(),
        uri,
        color: '#ffffff',
        fecha,
        tipo: 'audio',
      };
      const nuevasNotas = [nuevaNotaAudio, ...notas];
      setNotas(nuevasNotas);
      guardarNotas(nuevasNotas);
      setGrabacion(null);
    } catch (error) {
      console.error('Error al detener grabación:', error);
    }
  };

  // NUEVAS FUNCIONES para reproducir audio

  const reproducirAudio = async (nota) => {
    try {
      if (reproduciendoId === nota.id) {
        // Ya está reproduciendo esta nota, la paramos
        await pararAudio();
        return;
      }
      // Si hay otro sonido reproduciéndose, lo paramos
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: nota.uri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setReproduciendoId(nota.id);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isPlaying) {
          // Cuando termina la reproducción
          setReproduciendoId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
      setReproduciendoId(null);
    }
  };

  const pararAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.error('Error parando audio:', error);
      }
      soundRef.current = null;
    }
    setReproduciendoId(null);
  };

  const agregarLista = () => {
    if (!tareasLista.length) return;
    const fecha = new Date().toLocaleDateString();
    const nuevaNotaLista = {
      id: Date.now().toString(),
      color: '#ffffff',
      fecha,
      tipo: 'lista',
      lista: tareasLista,
    };
    const nuevasNotas = [nuevaNotaLista, ...notas];
    setNotas(nuevasNotas);
    guardarNotas(nuevasNotas);
    setNuevaLista('');
    setTareasLista([]);
    setModalListaVisible(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => toggleExpandirNota(item.id)}
    >
      <View style={[styles.nota, { backgroundColor: item.color }]}>
        <View style={styles.notaFila}>
          <View style={{ flex: 1 }}>
            {item.tipo === 'audio' ? (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => reproducirAudio(item)}
              >
                <Ionicons
                  name={reproduciendoId === item.id ? 'pause-circle' : 'play-circle'}
                  size={40}
                  color="#555"
                />
                <Text style={{ marginLeft: 8, color: '#555' }}>
                  {reproduciendoId === item.id ? 'Reproduciendo...' : 'Reproducir audio'}
                </Text>
              </TouchableOpacity>
            ) : item.tipo === 'lista' ? (
              item.lista.map((tarea, index) => (
                <Text key={index} style={styles.textoNota}>• {tarea}</Text>
              ))
            ) : expandirNotaId === item.id ? (
              <TextInput
                style={[styles.textoNota, { minHeight: 60 }]}
                multiline
                value={item.texto}
                onChangeText={(texto) => editarTextoNota(item.id, texto)}
                autoFocus
              />
            ) : (
              <Text style={styles.textoNota} numberOfLines={3}>
                {item.texto}
              </Text>
            )}
          </View>

          <View style={styles.iconosDerecha}>
            <TouchableOpacity onPress={() => cambiarColorNota(item.id)}>
              <Ionicons name="color-palette" size={22} color="gray" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => eliminarNota(item.id)}>
              <MaterialIcons name="delete" size={24} color="gray" />
            </TouchableOpacity>
          </View>
        </View>

        {notaSeleccionadaParaColor === item.id && (
          <View style={styles.paletaColores}>
            {['#ffffff', '#ffebcd', '#ffc0cb', '#add8e6', '#90ee90', '#ffffe0'].map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorCirculo, { backgroundColor: color }]}
                onPress={() => seleccionarColor(item.id, color)}
              />
            ))}
          </View>
        )}

        <Text style={styles.fechaNota}>{item.fecha}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setNotaSeleccionadaParaColor(null); }}>
      <View style={styles.contenedor}>

        {/* Título fijo arriba */}
        <View style={styles.header}>
          <Text style={styles.titulo}>Neura</Text>
        </View>

        {/* Barra superior con búsqueda */}
        {mostrarBusqueda && (
          <View style={styles.barraBusqueda}>
            <TextInput
              style={styles.entradaBusqueda}
              placeholder="Buscar notas..."
              value={busqueda}
              onChangeText={setBusqueda}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setBusqueda(''); setMostrarBusqueda(false); }}>
              <Ionicons name="close-circle" size={24} color="gray" />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={notasFiltradas}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: mostrarBusqueda ? 0 : 10 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay notas.</Text>}
          style={{ marginTop: mostrarBusqueda ? 10 : 0 }}
        />

        {/* Menú flotante */}
        <View style={styles.menuFlotante}>
          <TouchableOpacity
            style={styles.botonFlotante}
            onPress={() => setMenuAbierto(!menuAbierto)}
          >
            <Ionicons name="add" size={36} color="#fff" />
          </TouchableOpacity>

          {menuAbierto && (
            <>
              <TouchableOpacity
                style={[styles.botonFlotantePequeño, { bottom: 80 }]}
                onPress={() => { setModalTextoVisible(true); setMenuAbierto(false); }}
              >
                <Ionicons name="document-text" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botonFlotantePequeño, { bottom: 140 }]}
                onPress={grabando ? detenerGrabacion : empezarGrabacion}
              >
                <Ionicons
                  name={grabando ? 'stop-circle' : 'mic'}
                  size={28}
                  color={grabando ? '#f00' : '#fff'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botonFlotantePequeño, { bottom: 200 }]}
                onPress={() => { setModalListaVisible(true); setMenuAbierto(false); }}
              >
                <Ionicons name="list" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botonFlotantePequeño, { bottom: 260 }]}
                onPress={() => { setMostrarBusqueda(true); setMenuAbierto(false); }}
              >
                <Ionicons name="search" size={28} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Modal para agregar nota de texto */}
        <Modal
          visible={modalTextoVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalTextoVisible(false)}
        >
          <View style={styles.modalFondo}>
            <View style={styles.modalContenido}>
              <Text style={styles.modalTitulo}>Nueva nota de texto</Text>
              <TextInput
                style={styles.inputModal}
                placeholder="Escribe tu nota aquí..."
                value={nuevaNota}
                onChangeText={setNuevaNota}
                multiline
              />
              <View style={styles.filaBotonesModal}>
                <TouchableOpacity
                  style={[styles.botonModal, { backgroundColor: '#ccc' }]}
                  onPress={() => { setNuevaNota(''); setModalTextoVisible(false); }}
                >
                  <Text>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.botonModal, { backgroundColor: '#4CAF50' }]}
                  onPress={() => {
                    if (nuevaNota.trim().length === 0) return;
                    agregarNota(nuevaNota.trim());
                    setNuevaNota('');
                    setModalTextoVisible(false);
                  }}
                >
                  <Text style={{ color: '#fff' }}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal para agregar lista */}
        <Modal
          visible={modalListaVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalListaVisible(false)}
        >
          <View style={styles.modalFondo}>
            <View style={styles.modalContenido}>
              <Text style={styles.modalTitulo}>Nueva lista</Text>
              <TextInput
                style={styles.inputModal}
                placeholder="Escribe tarea y presiona Enter"
                value={nuevaLista}
                onChangeText={setNuevaLista}
                onSubmitEditing={() => {
                  if (nuevaLista.trim().length === 0) return;
                  setTareasLista([...tareasLista, nuevaLista.trim()]);
                  setNuevaLista('');
                }}
                returnKeyType="done"
              />
              <FlatList
                data={tareasLista}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                  <Text style={styles.textoLista}>• {item}</Text>
                )}
                style={{ maxHeight: 150, marginVertical: 10 }}
              />
              <View style={styles.filaBotonesModal}>
                <TouchableOpacity
                  style={[styles.botonModal, { backgroundColor: '#ccc' }]}
                  onPress={() => {
                    setNuevaLista('');
                    setTareasLista([]);
                    setModalListaVisible(false);
                  }}
                >
                  <Text>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.botonModal, { backgroundColor: '#4CAF50' }]}
                  onPress={() => {
                    agregarLista();
                  }}
                >
                  <Text style={{ color: '#fff' }}>Agregar lista</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 100, // espacio para el header fijo
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90, // antes era 50
    backgroundColor: '#2196F3',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10, // para centrar el texto visualmente
    paddingTop: 20,    // extra espacio superior
    elevation: 5,
    zIndex: 10,
  },
  titulo: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    
  },
  nota: {
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notaFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textoNota: {
    fontSize: 16,
    color: '#333',
  },
  iconosDerecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paletaColores: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-start',
  },
  colorCirculo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  fechaNota: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  menuFlotante: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    alignItems: 'center',
  },
  botonFlotante: {
    backgroundColor: '#2196F3',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  botonFlotantePequeño: {
    backgroundColor: '#2196F3',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    elevation: 5,
  },
  barraBusqueda: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#e1e1e1',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
  },
  entradaBusqueda: {
    flex: 1,
    fontSize: 16,
    padding: 6,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContenido: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitulo: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  inputModal: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  filaBotonesModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  botonModal: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  textoLista: {
    fontSize: 16,
    color: '#333',
  },
});
