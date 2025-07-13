import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AnimalDetailView = ({ route, navigation }) => {
  const { animal } = route.params;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2f4f4f" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconLeft} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#a4d9ab" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconRight}>
          <Ionicons name="search" size={28} color="#a4d9ab" />
        </TouchableOpacity>
        <View style={styles.profileContainer}>
          <Image source={{ uri: animal.photo }} style={styles.profileImage} />
        </View>
      </View>

      {/* Animal Info */}
      <View style={styles.infoSection}>
        <Text style={styles.animalName}>{animal.name}</Text>
        <Text style={styles.animalSpecies}>{animal.species}</Text>

        <View style={styles.tagContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{animal.age || 'Unknown'} yrs old</Text>
            <Text style={styles.tagLabel}>Age</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{animal.breed || 'Unknown'}</Text>
            <Text style={styles.tagLabel}>Breed</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{animal.status || 'Unknown'}</Text>
            <Text style={styles.tagLabel}>Status</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default AnimalDetailView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f5f1',
  },
  header: {
    backgroundColor: '#2f4f4f',
    paddingTop: 40,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    position: 'relative',
  },
  iconLeft: {
    position: 'absolute',
    left: 20,
    top: 45,
  },
  iconRight: {
    position: 'absolute',
    right: 20,
    top: 45,
  },
  profileContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#f2f5f1',
    marginTop: 10,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  animalName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2f4f4f',
  },
  animalSpecies: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '90%',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: '#c2e7c8',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 100,
    margin: 5,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2f4f4f',
  },
  tagLabel: {
    fontSize: 12,
    color: '#2f4f4f',
    opacity: 0.7,
  },
});

