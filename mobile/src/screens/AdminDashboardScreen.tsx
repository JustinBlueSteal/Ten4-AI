import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, FlatList, Switch, StyleSheet } from 'react-native';

interface User {
  id: string;
  email: string;
  role: 'Guest' | 'Free' | 'Subscriber' | 'Admin';
}

interface Feed {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState<'Users' | 'Feeds'>('Users');
  const [users, setUsers] = useState<User[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);

  useEffect(() => {
    // Fetch users and feeds from the new admin endpoints here
    setUsers([
      { id: '1', email: 'citizen@example.com', role: 'Free' },
      { id: '2', email: 'journalist@example.com', role: 'Subscriber' },
    ]);
    setFeeds([
      { id: 'f1', name: 'LAPD Dispatch', type: 'Police', is_active: true },
      { id: 'f2', name: 'LAFD Main', type: 'Fire/EMS', is_active: false },
    ]);
  }, []);

  const toggleFeedStatus = (feedId: string) => {
    setFeeds(prev => prev.map(f => f.id === feedId ? { ...f, is_active: !f.is_active } : f));
    // Emit PATCH request to backend here
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>COMMAND CENTER</Text>
        <Text style={styles.headerSubtitle}>SYSTEM ADMINISTRATION</Text>
      </View>

      {/* Admin Tabs */}
      <View style={styles.tabsContainer}>
        {(['Users', 'Feeds'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabButton,
              activeTab === tab ? styles.tabButtonActive : styles.tabButtonInactive,
            ]}
          >
            <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : styles.tabTextInactive]}>
              {tab} Management
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'Users' ? (
          <FlatList
            data={users}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <Text style={styles.userId}>ID: {item.id}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
                </View>
              </View>
            )}
          />
        ) : (
          <View style={styles.flexOne}>
            <TouchableOpacity style={styles.addFeedBtn}>
              <Text style={styles.addFeedBtnText}>+ ADD NEW FEED SOURCE</Text>
            </TouchableOpacity>

            <FlatList
              data={feeds}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View>
                    <Text style={styles.feedName}>{item.name}</Text>
                    <Text style={styles.feedType}>{item.type}</Text>
                  </View>
                  <View style={styles.feedRightGroup}>
                    <Text style={[styles.statusText, item.is_active ? styles.statusLive : styles.statusOffline]}>
                      {item.is_active ? 'LIVE' : 'OFFLINE'}
                    </Text>
                    <Switch
                      value={item.is_active}
                      onValueChange={() => toggleFeedStatus(item.id)}
                      trackColor={{ false: '#334155', true: '#3B82F6' }}
                      thumbColor="#FFF"
                    />
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  flexOne: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginVertical: 16,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#2563EB',
  },
  tabButtonInactive: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextInactive: {
    color: '#94A3B8',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userEmail: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  userId: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  addFeedBtn: {
    marginBottom: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addFeedBtnText: {
    color: '#34D399',
    fontWeight: '700',
  },
  feedName: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feedType: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  feedRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginRight: 8,
    fontWeight: '700',
  },
  statusLive: {
    color: '#34D399',
  },
  statusOffline: {
    color: '#F87171',
  },
});
