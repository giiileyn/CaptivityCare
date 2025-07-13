import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useNavigation } from '@react-navigation/native';
import CustomDrawer from '../CustomDrawer'; // adjust path if needed

const { width } = Dimensions.get('window');

const ViewAssignedTasks = () => {
  const [userName, setUserName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const confettiRef = useRef(null);
  const navigation = useNavigation();

  // Drawer animation states
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerVisible(false));
  };

  useEffect(() => {
    const loadUserData = async () => {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || 'Farmer');
      }
    };

    const fetchTasks = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const res = await axios.get(`${API_BASE_URL}/tasks/user/${userId}`);
        setTasks(res.data);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    fetchTasks();
  }, []);

  const updateTaskStatus = async (newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/tasks/status/${selectedTaskId}`, {
        status: newStatus,
      });

      setTasks((prev) =>
        prev.map((task) =>
          task._id === selectedTaskId ? { ...task, status: newStatus } : task
        )
      );

      setShowSuccess(true);
      confettiRef.current && confettiRef.current.start();

      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setShowStatusModal(false);
      setSelectedTaskId(null);
    }
  };

  const renderTask = ({ item }) => {
    const cardStyle = [
      styles.taskCard,
      item.status === 'Completed'
        ? { backgroundColor: '#A4D9AB' }
        : { backgroundColor: '#e0e0e0' },
    ];

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ViewDetailedTask', { task: item })}
      >
        <View style={cardStyle}>
          <Ionicons name="clipboard-outline" size={24} color="#2f4f4f" />
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle}>{item.type}</Text>
            <Text style={styles.taskTime}>
              {new Date(item.scheduleDate).toLocaleDateString()} –{' '}
              {item.scheduleTimes?.join(', ') || 'No time set'}
            </Text>
            <Text style={styles.taskTime}>
              Animal: {item.animalId?.name || 'N/A'}
            </Text>
            <Text style={styles.taskTime}>Status: {item.status}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setSelectedTaskId(item._id);
              setShowStatusModal(true);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#2f4f4f" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2f4f4f" />
        <Text>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2f4f4f" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={openDrawer}>
            <Ionicons name="menu" size={28} color="#a4d9ab" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="search" size={28} color="#a4d9ab" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerGreeting}>Hello, Farmer {userName}!</Text>
        <Text style={styles.headerSub}>
          Are you going to complete all the task today?
        </Text>
      </View>

      {/* Task List */}
      <Text style={styles.sectionTitle}>My Tasks</Text>
      {tasks.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          No tasks assigned.
        </Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTask}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* Status Modal */}
      <Modal transparent visible={showStatusModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Task Status</Text>
            {(() => {
              const selectedTask = tasks.find(
                (task) => task._id === selectedTaskId
              );
              const isCompleted = selectedTask?.status === 'Completed';

              return (
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: isCompleted ? '#cccccc' : '#28a745',
                    },
                  ]}
                  onPress={() => {
                    if (!isCompleted) updateTaskStatus('Completed');
                  }}
                  disabled={isCompleted}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      { color: isCompleted ? '#888888' : '#fff' },
                    ]}
                  >
                    Completed
                  </Text>
                </TouchableOpacity>
              );
            })()}
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <Text style={{ color: '#2f4f4f', marginTop: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showSuccess && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✅ Task status updated!</Text>
        </View>
      )}
      <ConfettiCannon
        count={100}
        origin={{ x: 200, y: 0 }}
        fadeOut
        autoStart={false}
        ref={confettiRef}
      />

      {/* Calendar Button */}
      <TouchableOpacity
        style={styles.calendarButton}
        onPress={() => navigation.navigate('CalendarTask')}
      >
        <Ionicons name="calendar-outline" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Drawer */}
      <Modal visible={drawerVisible} transparent animationType="none">
        <View style={styles.modalContainer}>
          <Animated.View
            style={[styles.overlay, { opacity: overlayOpacity }]}
          >
            <TouchableOpacity style={{ flex: 1 }} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View
            style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}
          >
            <CustomDrawer navigation={navigation} onClose={closeDrawer} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f7',
  },
  header: {
    backgroundColor: '#2f4f4f',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  headerGreeting: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSub: {
    color: '#cccccc',
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 20,
    color: '#2f4f4f',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f4f4f',
  },
  taskTime: {
    fontSize: 13,
    color: '#555',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f4f4f',
    marginBottom: 15,
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  statusButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  successContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  successText: {
    backgroundColor: '#a4d9ab',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    color: '#2f4f4f',
    fontWeight: 'bold',
  },
  calendarButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#2f4f4f',
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000088',
  },
  drawerContainer: {
    width: width * 0.8,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 40,
    elevation: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


export default ViewAssignedTasks;
