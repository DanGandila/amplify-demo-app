import React, { useEffect, useState } from 'react';
import { StyleSheet, Button, Platform, Image, View } from 'react-native';

import Storage from '@aws-amplify/storage';
import * as ImagePicker from 'expo-image-picker';
import mime from 'mime-types';

export default function EditingScreenInfo({ path }: { path: string }) {
  const [pics, setPics] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraRollPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();


    (async () => {
      const filesInfo = await Storage.list('')
      const files = await Promise.all(
          filesInfo.map(async (info: any) => {
             return Storage.get(info.key);
          })
      );
      setPics( files )
    })();
  }, []);

  // event handler to pull up camera roll
  const pickImage = async () => {
    let image = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });
    console.log(image);

    if (!image.cancelled) {
      const imageName = image.uri.replace(/^.*[\\\/]/, '');
      const fileType = mime.lookup(image.uri);
      const access = { level: "public", contentType: fileType, };
      fetch(image.uri).then(response => {
        response.blob()
            .then(blob => {
              Storage.put(imageName, blob, access)
                  .then(succ => Storage.get(imageName).then((img) => {
                    [...pics, img];
                  }))
                  .catch(err => console.log(err));
            });
      });
    }
  };

  return (
    <View>
      <View style={styles.getStartedContainer}>
        <View style={styles.getImageContainer}>
          {pics.map((file, index) => (
              <Image style={styles.getImage} key={index} source={{ uri: file }} style={{ width: 150, height: 150 }} />
          ))}
      </View>
      <Button onPress={pickImage} title="Upload Images"/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  getImageContainer: {
    width: 400
  },
  getImage: {
    flex: 0.5
  },
  getStartedContainer: {
    marginHorizontal: 50,
  }
});
