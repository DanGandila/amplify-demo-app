import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, Button } from 'react-native';

import API, { graphqlOperation } from '@aws-amplify/api'

import Storage from '@aws-amplify/storage';
// import { ImagePicker, Permissions } from 'expo';
import ImagePicker from 'expo-image-picker';
import mime from 'mime-types';

import { Text, View } from './Themed';

const listPets = `
    query {
      listPet {
        items {
          id
          name
          description
        }
      }
    }
  `
const createPet = `
    mutation($name: String!, $description: String) {
      createPet(input: {
        name: $name
        description: $description
    }) {
      id
      name
      description
    }
  }`

export default function EditingScreenInfo({ path }: { path: string }) {
  const [pets, setPets] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function initPets() {
      try {
        const graphqldata: any = await API.graphql(graphqlOperation(listPets));
        console.log('graphqldata:', graphqldata);
        setPets(graphqldata.data.listPet.items);
      } catch (err) {
        console.log('error: ', err)
      }
    }
    initPets();
  }, []);

  // event handler to pull up camera roll
  const _pickImage = async () => {
    // const {
    //   status: cameraRollPerm
    // } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    // if (cameraRollPerm === 'granted') {
      let pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
      });
      _handleImagePicked(pickerResult);
    // }
  };
// this handles the image upload to S3
  const _handleImagePicked = async (pickerResult) => {
    const imageName = pickerResult.uri.replace(/^.*[\\\/]/, '');
    const fileType = mime.lookup(pickerResult.uri);
    const access = { level: "public", contentType: 'image/jpeg' };
    const imageData = await fetch(pickerResult.uri)
    const blobData = await imageData.blob()

    try {
      await Storage.put(imageName, blobData, access)
    } catch (err) {
      console.log('error: ', err)
    }
  }

  const createPet = async () => {
    if (name === '' || description === '') return
    const newPet = { name, description };
    setPets([...pets, newPet]);
    setName('');
    setDescription('');
    try {
      await API.graphql(graphqlOperation(createPet, newPet))
      console.log('pet successfully created.')
    } catch (err) {
      console.log('error creating pet...', err)
    }
  }

  return (
    <View>
      <View style={styles.getStartedContainer}>
      <TextInput
          style={styles.input}
          onChangeText={val => setName(val)}
          placeholder="Pet Name"
          value={name}
      />
      <TextInput
          style={styles.input}
          onChangeText={val => setDescription(val)}
          placeholder="Pet Description"
          value={description}
      />
      <Button onPress={createPet} title="Add Pet"/>
      {
        pets.map((pet, index) => (
            <View key={index} style={styles.item}>
              <Text style={styles.name}>{pet.name}</Text>
              <Text style={styles.description}>{pet.description}</Text>
            </View>
        ))
      }
      <Button onPress={_pickImage} title="Upload"/>
      </View>
    </View>
  );
}

function handleHelpPress() {
  WebBrowser.openBrowserAsync(
    'https://www.facebook.com/'
  );
}

const styles = StyleSheet.create({
  input: {
    height: 45, borderBottomWidth: 2, borderBottomColor: 'black', marginVertical: 10, width: 200
  },
  button: {
      width: 200
  },
  item: {
    borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 10
  },
  name: { fontSize: 16 },
  description: { color: 'rgba(0, 0, 0, .5)' },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingTop: 50
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  }
});
