import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const tasksData = [
  { id: '1', title: 'Feeding', time: '20 mins ago' },
  { id: '2', title: 'Watering', time: '1 hour ago' },
  { id: '3', title: 'Harvesting', time: '2 hours ago' },
  { id: '4', title: 'Cleaning', time: '3 hours ago' },
];

const ViewAssignedTasks = ({ navigation }) => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const loadUserName = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || 'Farmer');
      }
    };
    loadUserName();
  }, []);

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <Ionicons name="clipboard-outline" size={24} color="#2f4f4f" />
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskTime}>{item.time}</Text>
      </View>
      <Ionicons name="ellipsis-vertical" size={20} color="#2f4f4f" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2f4f4f" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity>
            <Ionicons name="menu" size={28} color="#a4d9ab" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="search" size={28} color="#a4d9ab" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerGreeting}>Hello, Farmer {userName}!</Text>
        <Text style={styles.headerSub}>Are you going to complete all the task today?</Text>
      </View>

      {/* Task Filters */}
      <View style={styles.filters}>
        <TouchableOpacity style={styles.chip}><Text style={styles.chipText}>Tasks</Text></TouchableOpacity>
        <TouchableOpacity style={styles.chip}><Text style={styles.chipText}>In-Progress</Text></TouchableOpacity>
        <TouchableOpacity style={styles.chip}><Text style={styles.chipText}>Completed</Text></TouchableOpacity>
        <TouchableOpacity style={styles.seeAll}><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
      </View>

      {/* Task List */}
      <Text style={styles.sectionTitle}>My Tasks</Text>
      <FlatList
        data={tasksData}
        keyExtractor={item => item.id}
        renderItem={renderTask}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: StatusBar.currentHeight || 20,
  },
  header: {
    backgroundColor: '#2f4f4f',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerGreeting: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  headerSub: {
    fontSize: 14,
    color: '#d0f0c0',
    marginTop: 5,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#c6f0d6',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  chipText: {
    color: '#2f4f4f',
    fontWeight: '600',
  },
  seeAll: {
    marginLeft: 'auto',
  },
  seeAllText: {
    color: '#333',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 10,
    color: '#2f4f4f',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f5e9',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 10,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 15,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2f4f4f',
  },
  taskTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default ViewAssignedTasks;
