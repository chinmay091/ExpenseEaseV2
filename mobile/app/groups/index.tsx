import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { getGroups, createGroup, Group, CreateGroupPayload } from '@/api/group.api';

export default function GroupsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateGroupPayload>({ name: '', description: '', icon: '👥' });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    try {
      const newGroup = await createGroup(form);
      setGroups([newGroup, ...groups]);
      setShowModal(false);
      setForm({ name: '', description: '', icon: '👥' });
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const balanceColor = item.myBalance && item.myBalance > 0 ? colors.income : 
                         item.myBalance && item.myBalance < 0 ? colors.expense : colors.textSecondary;
    const balanceText = item.myBalance && item.myBalance > 0 ? `+₹${item.myBalance.toLocaleString()}` :
                        item.myBalance && item.myBalance < 0 ? `-₹${Math.abs(item.myBalance).toLocaleString()}` :
                        'Settled';

    return (
      <TouchableOpacity
        style={[styles.groupCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/groups/${item.id}` as never)}
      >
        <View style={styles.groupIcon}>
          <Text style={styles.groupEmoji}>{item.icon}</Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
            {item.members?.length || 0} members
          </Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceText, { color: balanceColor }]}>{balanceText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Split Expenses</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Create a group to start splitting expenses with friends.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Group</Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.inputBorder }]}
              placeholder="Group name (e.g., Goa Trip)"
              placeholderTextColor={colors.textSecondary}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.inputBorder }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
            />

            <View style={styles.iconSelector}>
              <Text style={[styles.iconLabel, { color: colors.textSecondary }]}>Icon:</Text>
              {['👥', '✈️', '🏠', '🍽️', '🎉', '💼'].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.iconOption, form.icon === emoji && { backgroundColor: colors.primary + '30' }]}
                  onPress={() => setForm({ ...form, icon: emoji })}
                >
                  <Text style={styles.iconEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.inputBorder }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreate}
              >
                <Text style={{ color: '#fff' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  groupCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12 },
  groupIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  groupEmoji: { fontSize: 24 },
  groupInfo: { flex: 1, marginLeft: 12 },
  groupName: { fontSize: 16, fontWeight: '600' },
  memberCount: { fontSize: 12, marginTop: 2 },
  balanceContainer: { alignItems: 'flex-end' },
  balanceText: { fontSize: 14, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { textAlign: 'center', marginTop: 16, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  iconSelector: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconLabel: { marginRight: 12, fontSize: 14 },
  iconOption: { padding: 8, borderRadius: 8, marginRight: 8 },
  iconEmoji: { fontSize: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
});
