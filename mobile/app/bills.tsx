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
import { useTheme } from '@/hooks/use-theme';
import { getBills, createBill, deleteBill, markBillPaid, Bill, CreateBillPayload } from '@/api/bill.api';
import { getCategories, Category } from '@/api/category.api';

export default function BillsScreen() {
  const { colors } = useTheme();
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateBillPayload>({
    name: '',
    amount: 0,
    dueDay: 1,
    frequency: 'monthly',
    reminderDays: 3,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billsData, categoriesData] = await Promise.all([getBills(), getCategories()]);
      setBills(billsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async () => {
    if (!form.name || !form.amount || !form.dueDay) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const newBill = await createBill(form);
      setBills([newBill, ...bills]);
      setShowModal(false);
      setForm({ name: '', amount: 0, dueDay: 1, frequency: 'monthly', reminderDays: 3 });
    } catch (error) {
      Alert.alert('Error', 'Failed to create bill');
    }
  };

  const handleMarkPaid = async (bill: Bill) => {
    Alert.alert(
      'Mark as Paid',
      `Mark ${bill.name} (₹${Number(bill.amount).toLocaleString()}) as paid? This will create an expense.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              await markBillPaid(bill.id);
              loadData();
              Alert.alert('Success', 'Bill marked as paid and expense created');
            } catch (error) {
              Alert.alert('Error', 'Failed to mark bill as paid');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (bill: Bill) => {
    Alert.alert('Delete Bill', `Delete ${bill.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill(bill.id);
            setBills(bills.filter((b) => b.id !== bill.id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete bill');
          }
        },
      },
    ]);
  };

  const getDaysUntilDue = (dueDay: number) => {
    const today = new Date().getDate();
    let diff = dueDay - today;
    if (diff < 0) diff += 30;
    return diff;
  };

  const renderBill = ({ item }: { item: Bill }) => {
    const daysUntil = getDaysUntilDue(item.dueDay);
    const isUrgent = daysUntil <= 3;
    const isDue = daysUntil === 0;

    return (
      <View style={[styles.billCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.billHeader}>
          <View style={styles.billInfo}>
            <Text style={[styles.billName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.billCategory, { color: colors.textSecondary }]}>
              {item.Category?.name || 'Uncategorized'}
            </Text>
          </View>
          <Text style={[styles.billAmount, { color: colors.expense }]}>
            ₹{Number(item.amount).toLocaleString()}
          </Text>
        </View>

        <View style={styles.billFooter}>
          <View
            style={[
              styles.dueBadge,
              { backgroundColor: isDue ? colors.expense : isUrgent ? '#FFA500' : colors.secondary },
            ]}
          >
            <Text style={styles.dueText}>
              {isDue ? 'Due Today' : `Due in ${daysUntil} days`}
            </Text>
          </View>

          <View style={styles.actions}>
            {!item.isPaid && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.income }]}
                onPress={() => handleMarkPaid(item)}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.expense }]}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
        <Text style={[styles.title, { color: colors.text }]}>Bill Reminders</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {bills.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No bills yet. Add your recurring bills to get reminders.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id}
          renderItem={renderBill}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Bill</Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="Bill name (e.g., Netflix)"
              placeholderTextColor={colors.textSecondary}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="Amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={form.amount ? String(form.amount) : ''}
              onChangeText={(text) => setForm({ ...form, amount: parseFloat(text) || 0 })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="Due day of month (1-31)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={form.dueDay ? String(form.dueDay) : ''}
              onChangeText={(text) => setForm({ ...form, dueDay: parseInt(text) || 1 })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.cardBorder }]}
              placeholder="Remind days before (default: 3)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={form.reminderDays ? String(form.reminderDays) : ''}
              onChangeText={(text) => setForm({ ...form, reminderDays: parseInt(text) || 3 })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.cardBorder }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateBill}
              >
                <Text style={{ color: '#fff' }}>Add Bill</Text>
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
  billCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  billInfo: { flex: 1 },
  billName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  billCategory: { fontSize: 12 },
  billAmount: { fontSize: 18, fontWeight: 'bold' },
  billFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  dueBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dueText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { textAlign: 'center', marginTop: 16, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
});
