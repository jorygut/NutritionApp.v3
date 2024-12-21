import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackButton from '../backButton';
import { useRouter } from 'expo-router';
import axios from 'axios';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const cameraRef = useRef<Camera | null>(null);

  const router = useRouter();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async () => {
    if (cameraRef.current) { 
      try {
        const photoData = await cameraRef.current.takePictureAsync();
        setPhoto(photoData.uri);
        console.log('Picture taken:', photoData.uri);
      } catch (error) {
        console.error('Error taking picture:', error); 
      }
    } else {
      console.warn('Camera reference is not available.');
    }
  };

  const AnalyzeImage = async () => {
    if (!photo) {
      console.error('No photo taken yet.');
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: photo,
        type: 'image/jpeg', // Assuming the photo is a JPEG
        name: 'photo.jpg', // Optional filename
      });
  
      const response = await axios.post('https://nutritionapi-zivc.onrender.com/manageLabel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', 
        },
      });
  
      console.log('API response:', response.data); 
    } catch (error) {
      console.error('Error analyzing image:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Scan Barcode" onPress={() => router.push('/tools/barcode')}/>
        <Button title='test' onPress={() => AnalyzeImage()}/>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} >
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => takePicture()}>
            <Text style={styles.button}>Scan Label</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
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
