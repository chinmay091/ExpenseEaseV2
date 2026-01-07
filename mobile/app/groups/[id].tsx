import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { 
  getGroup, addMember, addGroupExpense, getBalances,
  Group, GroupMember, AddMemberPayload, AddExpensePayload 
} from '@/api/group.api';

export default function GroupDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [balances, setBalances] = useState<{ id: string; name: string; balance: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [memberForm, setMemberForm] = useState<AddMemberPayload>({ name: '', email: '', phone: '' });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '' });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      const [groupData, balanceData] = await Promise.all([
        getGroup(id),
        getBalances(id),
      ]);
      setGroup(groupData);
      setBalances(balanceData);
    } catch (error) {
      console.error('Failed to load group:', error);
      Alert.alert('Error', 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberForm.name || (!memberForm.email && !memberForm.phone)) {
      Alert.alert('Error', 'Name and email or phone required');
      return;
    }
    try {
      await addMember(id!, memberForm);
      setShowMemberModal(false);
      setMemberForm({ name: '', email: '', phone: '' });
      loadData();
      Alert.alert('Success', 'Member added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add member');
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount || !group?.myMemberId) {
      Alert.alert('Error', 'Description and amount required');
      return;
    }
    try {
      const payload: AddExpensePayload = {
        paidById: group.myMemberId,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        splitType: 'equal',
      };
      await addGroupExpense(id!, payload);
      setShowExpenseModal(false);
      setExpenseForm({ description: '', amount: '' });
      loadData();
      Alert.alert('Success', 'Expense added and split equally');
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Group not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{group.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Balances</Text>
          {balances.map((member) => (
            <View key={member.id} style={styles.balanceRow}>
              <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
              <Text style={[styles.balanceAmount, { 
                color: member.balance > 0 ? colors.income : member.balance < 0 ? colors.expense : colors.textSecondary 
              }]}>
                {member.balance > 0 ? `gets back ₹${member.balance.toLocaleString()}` : 
                 member.balance < 0 ? `owes ₹${Math.abs(member.balance).toLocaleString()}` : 'settled'}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Members ({group.members?.length || 0})</Text>
            <TouchableOpacity onPress={() => setShowMemberModal(true)}>
              <Ionicons name="person-add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {group.members?.map((member: GroupMember) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '30' }]}>
                <Text style={{ color: colors.primary }}>{member.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                <Text style={[styles.memberContact, { color: colors.textSecondary }]}>
                  {member.email || member.phone || 'No contact'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { 
                backgroundColor: member.status === 'joined' ? colors.income + '30' : colors.expense + '30' 
              }]}>
                <Text style={{ 
                  color: member.status === 'joined' ? colors.income : colors.expense, fontSize: 10 
                }}>
                  {member.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowExpenseModal(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showMemberModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Member</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.inputBorder }]}
              placeholder="Name"
              placeholderTextColor={colors.textSecondary}
              value={memberForm.name}
              onChangeText={(t) => setMemberForm({ ...memberForm, name: t })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.inputBorder }]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              value={memberForm.email}
              onChangeText={(t) => setMemberForm({ ...memberForm, email: t })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.inputBorder }]}
              placeholder="Phone"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={memberForm.phone}
              onChangeText={(t) => setMemberForm({ ...memberForm, phone: t })}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.inputBorder }]} onPress={() => setShowMemberModal(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleAddMember}>
                <Text style={{ color: '#fff' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showExpenseModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Expense</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.inputBorder }]}
              placeholder="Description (e.g., Dinner)"
              placeholderTextColor={colors.textSecondary}
              value={expenseForm.description}
              onChangeText={(t) => setExpenseForm({ ...expenseForm, description: t })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.inputBorder }]}
              placeholder="Amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={expenseForm.amount}
              onChangeText={(t) => setExpenseForm({ ...expenseForm, amount: t })}
            />
            <Text style={[styles.splitNote, { color: colors.textSecondary }]}>
              Will be split equally among all members
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.inputBorder }]} onPress={() => setShowExpenseModal(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleAddExpense}>
                <Text style={{ color: '#fff' }}>Add</Text>
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
  title: { fontSize: 18, fontWeight: 'bold' },
  balanceCard: { margin: 16, borderRadius: 16, padding: 16 },
  section: { margin: 16, marginTop: 0, borderRadius: 16, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 14, fontWeight: '500' },
  memberContact: { fontSize: 12 },
  balanceAmount: { fontSize: 13 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  splitNote: { fontSize: 12, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
});
