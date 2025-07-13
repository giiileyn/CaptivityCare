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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useNavigation } from '@react-navigation/native';
import CustomDrawer from '../CustomDrawer';

const { width } = Dimensions.get('window');

const ViewAssignedTasks = () => {
  const [userName, setUserName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today ?? new Date());
  const confettiRef = useRef(null);
  const navigation = useNavigation();

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
    setCurrentDate(new Date());
  }, []);

  const formattedMonth = currentDate.toLocaleString('default', { month: 'long' });
  const formattedYear = currentDate.getFullYear();
 const timeZone = 'Asia/Manila';

const getPhilippineDate = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  const parts = formatter.formatToParts(new Date());

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;

  // Build Date object manually
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
};

const today = getPhilippineDate();


  // Generate 7 days: 3 before, today, 3 after
  const getWeekDates = () => {
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  console.log('Selected Date:', selectedDate.toISOString());

  const filteredTasks = tasks.filter((task) => {
  const selectedDateISO = new Date(selectedDate).toISOString().slice(0, 10);
  const taskDateISO = new Date(task.scheduleDate).toISOString().slice(0, 10);

  console.log(`Checking task ${task._id}:`, taskDateISO, 'vs selected', selectedDateISO);

  const isSameDay = taskDateISO === selectedDateISO;
  const isRecurring = task.isRecurring;

  const isRecurringAndValid =
    isRecurring && new Date(selectedDate) >= new Date(task.scheduleDate);

  return isSameDay || isRecurringAndValid;

});


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
          <Image
            source={{ uri: item.animalId?.photo || 'https://via.placeholder.com/50' }}
            style={styles.animalImage}
          />
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* New Header Style */}
      <View style={styles.headerWrapper}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#3e6652" />
        </TouchableOpacity>

        <View style={styles.headerTextWrapper}>
          <Text style={styles.monthYear}>{formattedMonth}, {formattedYear}</Text>
          <View style={styles.daysRow}>
          {weekDates.map((date, index) => {
          const dayLabel = date.toLocaleString('en-US', {
            weekday: 'short',
            timeZone,
          });
          const dayNum = date.getDate();
          const isSelected =
            date.toDateString() === selectedDate.toDateString();

          return (
            <TouchableOpacity
              key={index}
              style={styles.dayItem}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={styles.dayLabel}>{dayLabel}</Text>
              <View style={[styles.dayCircle, isSelected && styles.activeDayCircle]}>
                <Text style={[styles.dayNumber, isSelected && styles.activeDayNumber]}>
                  {dayNum}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}


          </View>
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="search" size={20} color="#3e6652" />
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <Text style={styles.sectionTitle}>My Tasks</Text>
      {tasks.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          No tasks assigned.
        </Text>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTask}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* Modals */}
      {showStatusModal && (
        <Modal transparent animationType="fade" visible={showStatusModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Set Task Status</Text>
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => updateTaskStatus('Completed')}
              >
                <Text style={styles.statusButtonText}>Mark as Completed</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Text style={{ color: '#2f4f4f', marginTop: 10 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {showSuccess && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✅ Task status updated!</Text>
        </View>
      )}
      <ConfettiCannon count={100} origin={{ x: 200, y: 0 }} fadeOut autoStart={false} ref={confettiRef} />
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f7',
  },
   headerWrapper: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerIcon: {
    backgroundColor: '#d8f5dc',
    padding: 8,
    borderRadius: 12,
  },
  headerTextWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3e6652',
    marginBottom: 6,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 5,
  },
  dayItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  dayLabel: {
    color: '#3e6652',
    fontSize: 13,
    marginBottom: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  activeDayCircle: {
    backgroundColor: '#3e6652',
  },
  dayNumber: {
    color: '#3e6652',
    fontSize: 14,
  },
  activeDayNumber: {
    color: '#fff',
    fontWeight: 'bold',
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
  animalImage: {
  width: 50,
  height: 50,
  borderRadius: 25,
  marginRight: 10,
  backgroundColor: '#ccc',
},

});


export default ViewAssignedTasks;
