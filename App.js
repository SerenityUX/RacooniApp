import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Text, View, Linking, Modal, Alert, Button, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function sendPushNotification(expoPushToken) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Original Title',
    body: 'And here is the body!',
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

function handleRegistrationError(errorMessage) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);

      // Add the push token to the server
      await fetch('https://www.racooni.com/api/addNotification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: pushTokenString }),
      });

      return pushTokenString;
    } catch (e) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
  }
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(undefined);
  const notificationListener = useRef();
  const responseListener = useRef();

  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const checkNotificationPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        setIsModalVisible(true); // Show modal if notifications are not enabled
      }
    };

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    checkNotificationPermissions(); // Check permissions on first load

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

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
  }, []);

  const openMap = (lat, long) => {
    const url = `https://www.google.com/maps/place/${lat},${long}`;
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
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

  const handleAllowNotifications = async () => {
    const token = await registerForPushNotificationsAsync();
    setExpoPushToken(token ?? '');
    setIsModalVisible(false);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View>
        <Modal visible={isModalVisible} transparent={false} animationType="slide">
            <View style={{display: "flex", height: "100%", alignItems: "center", justifyContent: "center"}}>
              <View style={{display: "flex", alignItems: "center"}}>
                <Text style={{fontSize: 24, fontWeight: 700}}>Enable Trash Notifications</Text>
                <Text style={{width: 200, marginTop: 24, textAlign: "center"}}>You'll get a push notification each time new trash comes in</Text>
                <Button title="Allow Notifications" onPress={handleAllowNotifications}/>
                <Button onPress={() => setIsModalVisible(false)} title="Not Right Now"/>
              </View>
            </View>
        </Modal>
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
          <Button
            title="Press to Send Notification"
            onPress={async () => {
              await sendPushNotification(expoPushToken);
            }}
          />
        </View>
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
