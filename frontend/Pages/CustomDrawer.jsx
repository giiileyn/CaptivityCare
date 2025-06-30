import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToast } from '../utils/toast';
import API_BASE_URL from '../utils/api';

const { height } = Dimensions.get('window');

const CustomDrawer = ({ navigation, onClose }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const menuItems = [
     { id: '1', title: 'View Assigned Tasks', icon: 'clipboard-outline', route: 'AssignedTasks' },
     { id: '2', title: 'Input Daily Animal Behavior', icon: 'create-outline', route: 'AnimalBehaviorInput' },
     { id: '3', title: 'View Animal', icon: 'paw-outline', route: 'AnimalView' },
  ];

  const bottomItems = [
    { id: '9', title: 'Settings', icon: 'settings-outline', route: 'Settings' },
    { id: '10', title: 'Help & Support', icon: 'help-circle-outline', route: 'Support' },
    { id: '11', title: 'About', icon: 'information-circle-outline', route: 'About' },
  ];

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Profile fetch failed');

      setProfileData(data.user);
    } catch (error) {
      console.error('Profile fetch error:', error);
      showToast('error', 'Profile Error', error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleNavigation = (route) => {
    onClose?.();
    navigation.navigate(route);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ],
      { cancelable: true }
    );
  };

  const performLogout = async () => {
    try {
      onClose?.();
      await AsyncStorage.multiRemove(['userToken', 'userData', 'isAuthenticated']);
      
      showToast('success', 'Logged Out', 'You have been successfully logged out');
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      showToast('error', 'Logout Failed', 'Something went wrong. Please try again.');
    }
  };

  const renderMenuItem = (item, isBottom = false) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, isBottom && styles.bottomMenuItem]}
      onPress={() => handleNavigation(item.route)}
      activeOpacity={0.7}
    >
      <Ionicons name={item.icon} size={24} color="#a4d9ab" />
      <Text style={styles.menuText}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#a4d9ab" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
      </SafeAreaView>
    );
  }

  const user = profileData || {
    name: 'User',
    email: 'user@example.com',
    profilePhoto: null,
    address: null
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient
          colors={['#315342', '#1e3a2a']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#a4d9ab" />
          </TouchableOpacity>

          <View style={styles.profileSection}>
            <Image
              source={user.profilePhoto 
                ? { uri: user.profilePhoto } 
                : require('../assets/default-profile.png')}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Animals</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10</Text>
              <Text style={styles.statLabel}>Vets</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Main Menu</Text>
            {menuItems.map(item => renderMenuItem(item))}
          </View>

          {/* Special Offer Banner */}
          <TouchableOpacity
            style={styles.offerBanner}
            onPress={() => handleNavigation('SpecialOffer')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(49, 83, 66, 0.1)', 'rgba(30, 58, 42, 0.1)']}
              style={styles.offerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.offerContent}>
                <Ionicons name="gift" size={32} color="#315342" />
                <View style={styles.offerText}>
                  <Text style={styles.offerTitle}>Premium Access</Text>
                  <Text style={styles.offerSubtitle}>Upgrade to unlock all features</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#315342" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Bottom Menu Items */}
          <View style={styles.bottomSection}>
            <View style={styles.divider} />
            {bottomItems.map(item => renderMenuItem(item, true))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color="#ff4757" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  header: {
    paddingBottom: 25,
    paddingTop: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginBottom: 20,
    padding: 5,
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
    borderRadius: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'rgba(164, 217, 171, 0.5)',
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(164, 217, 171, 0.5)',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#315342',
    marginBottom: 15,
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(164, 217, 171, 0.1)',
  },
  bottomMenuItem: {
    backgroundColor: 'transparent',
    paddingLeft: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#315342',
    marginLeft: 15,
    flex: 1,
    fontWeight: '500',
  },
  offerBanner: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(49, 83, 66, 0.2)',
  },
  offerGradient: {
    padding: 15,
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerText: {
    flex: 1,
    marginLeft: 15,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 2,
  },
  offerSubtitle: {
    fontSize: 12,
    color: '#315342',
    opacity: 0.8,
  },
  bottomSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(49, 83, 66, 0.1)',
    marginBottom: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.2)',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#ff4757',
    marginLeft: 15,
    fontWeight: '600',
  },
});

export default CustomDrawer;