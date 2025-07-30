import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { useNavigation } from '@react-navigation/native';
import CustomDrawer from '../CustomDrawer'; // Import your CustomDrawer component
import API_BASE_URL from '../../utils/api';

const { width } = Dimensions.get('window');

const UserManagement = ({ setShowUserModal }) => {
  const navigation = useNavigation();
  
  // Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Data state
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    userType: [],
    status: []
  });

  // Drawer animations
  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 300,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      })
    ]).start(() => setDrawerVisible(false));
  };

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/user/getAll`);
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        Alert.alert('Error', 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      userType: [],
      status: []
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUserType = selectedFilters.userType.length === 0 || 
      selectedFilters.userType.includes(user.userType);
    
    const matchesStatus = selectedFilters.status.length === 0 || 
      selectedFilters.status.includes(user.status || 'active');
    
    return matchesSearch && matchesUserType && matchesStatus;
  });

  const hasActiveFilters = selectedFilters.userType.length > 0 || selectedFilters.status.length > 0;

  const getBadgeStyle = (type, value) => {
    const baseStyle = styles.badge;
    
    if (type === 'userType') {
      switch (value) {
        case 'admin':
          return [baseStyle, styles.badgePurple];
        case 'vet':
          return [baseStyle, styles.badgeBlue];
        default:
          return [baseStyle, styles.badgeGray];
      }
    } else if (type === 'status') {
      return value === 'active' 
        ? [baseStyle, styles.badgeGreen]
        : [baseStyle, styles.badgeOrange];
    }
    
    return baseStyle;
  };

  const getBadgeTextStyle = (type, value) => {
    if (type === 'userType') {
      switch (value) {
        case 'admin':
          return styles.badgePurpleText;
        case 'vet':
          return styles.badgeBlueText;
        default:
          return styles.badgeGrayText;
      }
    } else if (type === 'status') {
      return value === 'active' 
        ? styles.badgeGreenText
        : styles.badgeOrangeText;
    }
    
    return styles.badgeGrayText;
  };

  const FilterOption = ({ label, isSelected, onPress }) => (
    <TouchableOpacity style={styles.filterOption} onPress={onPress}>
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>
      <Text style={styles.filterLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const FilterModal = () => (
    <Modal
      visible={showFilterDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFilterDropdown(false)}
    >
      <TouchableOpacity 
        style={styles.filterOverlay}
        activeOpacity={1}
        onPress={() => setShowFilterDropdown(false)}
      >
        <View style={styles.filterDropdown}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>User Type</Text>
              {['user', 'admin', 'vet'].map(type => (
                <FilterOption
                  key={type}
                  label={type}
                  isSelected={selectedFilters.userType.includes(type)}
                  onPress={() => handleFilterChange('userType', type)}
                />
              ))}
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              {['active', 'inactive'].map(status => (
                <FilterOption
                  key={status}
                  label={status}
                  isSelected={selectedFilters.status.includes(status)}
                  onPress={() => handleFilterChange('status', status)}
                />
              ))}
            </View>
            
            <View style={styles.filterActions}>
              <TouchableOpacity 
                style={styles.btnText}
                onPress={clearFilters}
              >
                <Text style={styles.btnTextLabel}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnPrimary}
                onPress={() => setShowFilterDropdown(false)}
              >
                <Text style={styles.btnPrimaryLabel}>Apply</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderActiveFilters = () => {
    if (!hasActiveFilters) return null;
    
    const allFilters = [
      ...selectedFilters.userType.map(type => ({ type: 'userType', value: type, label: `User Type: ${type}` })),
      ...selectedFilters.status.map(status => ({ type: 'status', value: status, label: `Status: ${status}` }))
    ];

    return (
      <View style={styles.activeFiltersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.activeFilters}>
            {allFilters.map((filter, index) => (
              <View key={index} style={styles.filterTag}>
                <Text style={styles.filterTagText}>{filter.label}</Text>
                <TouchableOpacity 
                  onPress={() => handleFilterChange(filter.type, filter.value)}
                  style={styles.filterTagRemove}
                >
                  <Ionicons name="close" size={14} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userRow}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={styles.userMeta}>
        <View style={getBadgeStyle('userType', item.userType)}>
          <Text style={[styles.badgeText, getBadgeTextStyle('userType', item.userType)]}>
            {item.userType}
          </Text>
        </View>
        <View style={getBadgeStyle('status', item.status || 'active')}>
          <Text style={[styles.badgeText, getBadgeTextStyle('status', item.status || 'active')]}>
            {item.status || 'active'}
          </Text>
        </View>
        <Text style={styles.joinDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {users.length === 0 ? 'No users found' : 'No users found matching your criteria'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={openDrawer} style={styles.headerButton}>
              <Ionicons name="menu" size={28} color="#a4d9ab" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>User Management</Text>
              <Text style={styles.headerSubtitle}>Manage your users and roles</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.dashboardContainer}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#6b7280"
              />
            </View>
            <TouchableOpacity 
              style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
              onPress={() => setShowFilterDropdown(true)}
            >
              <Ionicons name="filter" size={16} color={hasActiveFilters ? "#fff" : "#315342"} />
              <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
                Filter
              </Text>
              {hasActiveFilters && (
                <View style={styles.filterCount}>
                  <Text style={styles.filterCountText}>
                    {selectedFilters.userType.length + selectedFilters.status.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {renderActiveFilters()}

          <View style={styles.usersList}>
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={filteredUsers.length === 0 ? styles.emptyListContainer : null}
            />
          </View>
        </View>
      </View>

      <FilterModal />

      {/* Custom Drawer */}
      <Modal visible={drawerVisible} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#315342',
  },
  header: {
    paddingBottom: 30,
    paddingTop: getStatusBarHeight(),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#315342',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dashboardContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#315342',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButtonActive: {
    backgroundColor: '#315342',
    borderColor: '#315342',
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#315342',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterCount: {
    backgroundColor: 'rgba(164, 217, 171, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  activeFiltersContainer: {
    marginBottom: 16,
  },
  activeFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#315342',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterTagText: {
    fontSize: 12,
    color: '#315342',
    fontWeight: '500',
  },
  filterTagRemove: {
    marginLeft: 8,
    padding: 2,
  },
  usersList: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: width * 0.8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 20,
    maxHeight: 400,
    minWidth: 250,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#315342',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#315342',
    borderRadius: 3,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: '#315342',
    borderColor: '#315342',
  },
  filterLabel: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  btnText: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnTextLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  btnPrimary: {
    backgroundColor: '#315342',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  btnPrimaryLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#315342',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  userMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  badgePurple: {
    backgroundColor: '#e9d5ff',
  },
  badgePurpleText: {
    color: '#7c3aed',
  },
  badgeBlue: {
    backgroundColor: '#dbeafe',
  },
  badgeBlueText: {
    color: '#3b82f6',
  },
  badgeGray: {
    backgroundColor: '#f3f4f6',
  },
  badgeGrayText: {
    color: '#6b7280',
  },
  badgeGreen: {
    backgroundColor: '#d1fae5',
  },
  badgeGreenText: {
    color: '#065f46',
  },
  badgeOrange: {
    backgroundColor: '#fed7aa',
  },
  badgeOrangeText: {
    color: '#9a3412',
  },
  joinDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyListContainer: {
    flex: 1,
  },
});

export default UserManagement;