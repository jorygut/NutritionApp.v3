import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    console.log('Scanned')
    setScanned(true);
    Alert.alert('Barcode scanned!', `Type: ${type}\nData: ${data}`);
    
    // Send barcode data to Python backend
    fetch('http://localhost:5000/api/analyzeBarcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcodeData: data }),
    })
      .then((response) => response.json())
      .then((result) => {
        Alert.alert('Server Response', result.message);
      })
      .catch((error) => {
        console.error('Error sending barcode to backend:', error);
        Alert.alert('Error', 'Failed to send barcode to backend.');
      });
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} onBarcodeScanned={handleBarCodeScanned}   
      barcodeScannerSettings={{
            barcodeTypes: ["qr"],
        }}/>
        
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
