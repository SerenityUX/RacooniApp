import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TouchableOpacity, Button, Image, ScrollView, Text, View, Linking } from 'react-native';
import {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

export default function App() {
  const [data, setData] = useState(null);

  const openMap = (lat, long) => {
    const url = `https://www.google.com/maps/place/${lat},${long}`;
    Linking.openURL(url);
  };

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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View>
          <ScrollView style={{ paddingLeft: 16, paddingRight: 16 }}>
            <Text style={{ fontSize: 32, fontWeight: '700' }}>Racooni</Text>
            <Text style={{ marginTop: 8, marginBottom: 16 }}>
              Racooni is a place where you can find trash in Burlington on the side of the street. Simply tap on any of the items you see here and you'll be given directions to go pick it up
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
          <View style={{position: "absolute", bottom: 0, width: "100%", backgroundColor: "#fff", alignItems: "center", justifyContent: "center", display: "flex", padding: 16}}>
            <TouchableOpacity style={{padding: 16, backgroundColor: "#F75F52", marginLeft: 16, marginRight: 16, width: "100%", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center"}}>
              <Text style={{fontWeight: 700, fontSize: 18, color: "#fff", alignItems: "center", justifyContent: "center", display: "flex"}}>Add Trash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
