import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Image, ScrollView, Text, View, Linking, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [data, setData] = useState(null);
  const [imageURI, setImageURI] = useState(null);

  useEffect(() => {
    fetch('https://www.racooni.com/api/trash')
      .then(response => response.json())
      .then(data => {
        setData(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  const openMap = (lat, long) => {
    const url = `https://www.google.com/maps/place/${lat},${long}`;
    Linking.openURL(url);
  };

// const uploadPhoto = async (selectedFile) => {
//   try {
//     const formData = new FormData();
//     formData.append('image', selectedFile);
//     const response = await fetch('https://whispering-tundra-60957-a9fec9593e7f.herokuapp.com/uploadImage', {
//       method: 'POST',
//       body: formData,
//     });
//     const responseData = await response.json();
//     if (response.ok) {
//       return responseData.imageUrl; // Adjust the property name based on your server response
//     } else {
//       const errorText = responseData.error;
//       console.error(`Failed to upload file: ${errorText}`);
//       throw new Error(errorText);
//     }
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     throw error;
//   }
// };

// const handleUpload = async (uri) => {
//   try {
//     const formData = new FormData();
//     formData.append('image', {
//       uri: uri,
//       name: 'photo.jpg',
//       type: 'image/jpeg',
//     });

//     // Call uploadPhoto function with the selected file
//     const imageURL = await uploadPhoto(formData);

//     console.log('Uploaded image URL:', imageURL);
//     // handle setting imageURL in state if needed
//   } catch (error) {
//     console.error('Error uploading file:', error);
//   }
// };




  const handleAddTrash = async () => {
    try {
      const cameraPermissionResult = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
      if (
        cameraPermissionResult.status !== 'granted' ||
        mediaLibraryPermissionResult.status !== 'granted'
      ) {
        console.log('Permissions not granted');
        return;
      }
    
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
    
      console.log('Capture result:', result);
    
      if (!result.cancelled && result.assets[0].uri) {
        console.log('Captured image URI:', result.assets[0].uri);
        setImageURI(result.assets[0].uri);
        // handleUpload(result.assets[0].uri);
      } else {
        console.log('Failed to capture image or user canceled.');
      }
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  };
  

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View>
          <ScrollView style={{ paddingLeft: 16, paddingRight: 16 }}>
            <Text style={{ fontSize: 32, fontWeight: '700' }}>Racooni</Text>
            <Text style={{ marginTop: 8, marginBottom: 16 }}>
              Racooni is a place where you can find trash in Burlington on the side of the street. Simply tap on any of the items you see here and you'll be given directions to go pick it up.
            </Text>
            {data?.map((trash) => (
              <TouchableOpacity
                onPress={() => openMap(trash.fields.lat, trash.fields.long)}
                key={trash.fields.imgURL}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: trash.fields.imgURL }}
                    style={styles.image}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ position: "absolute", bottom: 0, width: "100%", backgroundColor: "#fff", alignItems: "center", justifyContent: "center", display: "flex", padding: 16 }}>
            <TouchableOpacity
              style={{ padding: 16, backgroundColor: "#F75F52", marginLeft: 16, marginRight: 16, width: "100%", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              onPress={handleAddTrash}
            >
              <Text style={{ fontWeight: 700, fontSize: 18, color: "#fff", alignItems: "center", justifyContent: "center", display: "flex" }}>Add Trash</Text>
            </TouchableOpacity>
          </View>
        </View>
        {imageURI && (
          <Modal visible={!!imageURI} transparent={false}>
            <Image source={{ uri: imageURI }} style={{ flex: 1 }} />
            {/* <TouchableOpacity onPress={() => setImageURI(null)} style={{ position: 'absolute', bottom: 50, left: '50%', transform: [{ translateX: -50% }], backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 5 }}>
              <Text style={{ color: 'white', fontSize: 18 }}>Close</Text>
            </TouchableOpacity> */}
          </Modal>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  image: {
    aspectRatio: 3 / 4,
    borderRadius: 16,
    width: '100%',
  },
});
