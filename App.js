import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Text, View, Linking, Modal, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import OneSignal from 'onesignal-expo-plugin';

export default function App() {

  const uploadPhoto = async (selectedFile) => {
    try {
      console.log('Starting uploadPhoto function...');
      const formData = new FormData();
      formData.append('image', {
        uri: selectedFile,
        type: 'image/jpeg', // or your file's type
        name: 'photo.jpg', // or your file's name
      });
      const response = await fetch('https://whispering-tundra-60957-a9fec9593e7f.herokuapp.com/uploadImage', {
        method: 'POST',
        body: formData,
      });
      const responseData = await response.json();
      if (response.ok) {
        console.log('Upload successful:', responseData.ImageURL);
        return responseData.ImageURL;
      } else {
        const errorText = responseData.error;
        console.error(`Failed to upload file: ${errorText}`);
        throw new Error(errorText);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (long, lat, imageURLToSend) => {
    try {
      console.log('Starting handleSubmit function...');
      const body = JSON.stringify({
        long: `${long}`,
        lat: `${lat}`,
        imgURL: imageURLToSend,
      });
      console.log('Submitting data:', body);
      const response = await fetch('https://www.racooni.com/api/addTrash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: body
      });

      const responseText = await response.text(); // Get the raw response text
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      if (response.ok) {
        const responseData = JSON.parse(responseText); // Parse the response text as JSON
        console.log('Submission successful:', responseData);

        setData((oldData) => [{fields: {long: long, lat: lat, imgURL: imageURLToSend}}, ...oldData])

        alert('Trash item added successfully!');
        setImageURI(null)
      } else {
        console.error('Failed to add trash item:', responseText);
        alert(`Failed to add trash item: ${responseText}`);
        setImageURI(null)
      }
    } catch (error) {
      console.error('Error uploading trash item:', error);
      alert('Error uploading trash item.');
    }
  };

  const [data, setData] = useState(null);
  const [imageURI, setImageURI] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    fetch('https://www.racooni.com/api/trash')
      .then(response => response.json())
      .then(data => {
        setData(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });

    // OneSignal initialization
    OneSignal.setAppId('YOUR_ONESIGNAL_APP_ID');

    // Optional: Log events to the console for debugging
    OneSignal.setLogLevel(6, 0);

    // Prompt for push notifications
    OneSignal.promptForPushNotificationsWithUserResponse(response => {
      console.log('Prompt response:', response);
    });

    // Handle notification received
    OneSignal.setNotificationWillShowInForegroundHandler(notificationReceivedEvent => {
      let notification = notificationReceivedEvent.getNotification();
      console.log('Notification received in foreground:', notification);
      notificationReceivedEvent.complete(notification);
    });

    // Handle notification opened
    OneSignal.setNotificationOpenedHandler(notification => {
      console.log('Notification opened:', notification);
    });

  }, []);

  const openMap = (lat, long) => {
    const url = `https://www.google.com/maps/place/${lat},${long}`;
    Linking.openURL(url);
  };

  const handleAddTrash = async () => {
    try {
      console.log('Requesting permissions...');
      const cameraPermissionResult = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const locationPermissionResult = await Location.requestForegroundPermissionsAsync();

      if (
        cameraPermissionResult.status !== 'granted' ||
        mediaLibraryPermissionResult.status !== 'granted' ||
        locationPermissionResult.status !== 'granted'
      ) {
        console.log('Permissions not granted');
        return;
      }

      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.cancelled && result.assets[0].uri) {
        console.log('Captured image URI:', result.assets[0].uri);
        setImageURI(result.assets[0].uri);

        console.log('Fetching location...');
        const locationResult = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = locationResult.coords;
        setLocation({ latitude, longitude });
        console.log('Location fetched:', { latitude, longitude });

        console.log('Uploading photo...');
        const uploadedImageURL = await uploadPhoto(result.assets[0].uri);
        console.log('Photo uploaded:', uploadedImageURL);

        console.log('Submitting data...');
        await handleSubmit(longitude, latitude, uploadedImageURL);
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
      <View style={{ flex: 1 }}>
        <Image
          source={{ uri: imageURI }}
          style={{ flex: 1 }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </View>
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
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  }
});
