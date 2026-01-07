import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Animated,
  Platform,
  RefreshControl,
} from "react-native";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { router } from "expo-router";
import { getExpenses, Expense } from "@/api/expense.api";
import { getCategories, Category } from "@/api/category.api";
import { useSmsReader } from "@/hooks/useSmsReader";
import { parseSmsMessages } from "@/api/sms.api";
import { createExpense } from "@/api/expense.api";

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  
  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [autoImportStatus, setAutoImportStatus] = useState<string | null>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const balanceScale = useRef(new Animated.Value(0.8)).current;
  
  // SMS reader for auto-import
  const smsReader = useSmsReader();

  // Calculate totals
  const totalIncome = expenses
    .filter(e => e.type === "credit")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpenses = expenses
    .filter(e => e.type === "debit")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = totalIncome - totalExpenses;

  // Recent transactions (last 5)
  const recentTransactions = expenses.slice(0, 5);

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(balanceScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [expensesData, categoriesData] = await Promise.all([
        getExpenses(),
        getCategories(),
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }, []);

  // Auto-import SMS transactions on mount (Android only)
  const autoImportSms = useCallback(async () => {
    if (!smsReader.isSupported || categories.length === 0) return;
    
    try {
      setAutoImportStatus("Checking for new transactions...");
      const messages = await smsReader.readMessages(50);
      
      if (messages.length > 0) {
        const result = await parseSmsMessages(messages);
        if (result.success && result.data && result.data.transactions.length > 0) {
          const defaultCategory = categories[0];
          let importedCount = 0;
          
          for (const tx of result.data.transactions) {
            const importResult = await createExpense({
              amount: tx.amount,
              description: tx.description || tx.merchant || "Auto-imported",
              type: tx.type,
              categoryId: defaultCategory.id,
              skipDuplicate: true,
            });
            
            if (!importResult.skipped) {
              importedCount++;
            }
          }
          
          if (importedCount > 0) {
            setAutoImportStatus(`✓ Auto-imported ${importedCount} new transaction(s)`);
            await fetchData(); // Refresh data
          } else {
            setAutoImportStatus(null);
          }
        } else {
          setAutoImportStatus(null);
        }
      } else {
        setAutoImportStatus(null);
      }
    } catch (error) {
      console.error("Auto-import error:", error);
      setAutoImportStatus(null);
    }
    
    // Clear status after 3 seconds
    setTimeout(() => setAutoImportStatus(null), 3000);
  }, [smsReader.isSupported, categories, fetchData]);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-import after categories are loaded
  useEffect(() => {
    if (categories.length > 0 && Platform.OS === "android") {
      autoImportSms();
    }
  }, [categories.length]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    if (Platform.OS === "android") {
      await autoImportSms();
    }
    setRefreshing(false);
  }, [fetchData, autoImportSms]);

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown";
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name || "User"} 👋
          </Text>
        </Animated.View>

        {/* Auto-import status */}
        {autoImportStatus && (
          <View style={[styles.autoImportBanner, { backgroundColor: colors.primary + '15' }]}>
            <IconSymbol name="arrow.triangle.2.circlepath" size={16} color={colors.primary} />
            <Text style={[styles.autoImportText, { color: colors.primary }]}>
              {autoImportStatus}
            </Text>
          </View>
        )}

        {/* Balance Card */}
        <Animated.View 
          style={[
            styles.balanceCard, 
            { 
              backgroundColor: colors.primary,
              transform: [{ scale: balanceScale }, { translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <View style={styles.balanceStats}>
            <View style={styles.statItem}>
              <IconSymbol name="arrow.up.circle.fill" size={18} color="#4ADE80" />
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statValue}>₹{totalIncome.toLocaleString()}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <IconSymbol name="arrow.down.circle.fill" size={18} color="#F87171" />
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={styles.statValue}>₹{totalExpenses.toLocaleString()}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View 
          style={[
            styles.quickActions, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push("/(tabs)/add")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol name="plus" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push("/(tabs)/scan")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.secondary + '30' }]}>
              <IconSymbol name="camera.fill" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push("/import")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.income + '15' }]}>
              <IconSymbol name="arrow.down.circle.fill" size={22} color={colors.income} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Import</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push("/reports")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.expense + '15' }]}>
              <IconSymbol name="chart.bar.fill" size={22} color={colors.expense} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Reports</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View 
          style={[
            styles.section, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/expenses")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <IconSymbol name="tray" size={32} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions yet
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {recentTransactions.map((tx, index) => (
                <Animated.View
                  key={tx.id}
                  style={[
                    styles.transactionItem,
                    { 
                      backgroundColor: colors.card, 
                      borderColor: colors.cardBorder,
                      opacity: fadeAnim,
                    }
                  ]}
                >
                  <View style={[
                    styles.txIcon, 
                    { backgroundColor: tx.type === 'credit' ? colors.income + '15' : colors.expense + '15' }
                  ]}>
                    <IconSymbol 
                      name={tx.type === 'credit' ? 'arrow.up' : 'arrow.down'} 
                      size={16} 
                      color={tx.type === 'credit' ? colors.income : colors.expense} 
                    />
                  </View>
                  <View style={styles.txDetails}>
                    <Text style={[styles.txDesc, { color: colors.text }]} numberOfLines={1}>
                      {tx.description || "Transaction"}
                    </Text>
                    <Text style={[styles.txCategory, { color: colors.textSecondary }]}>
                      {getCategoryName(tx.categoryId)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.txAmount, 
                    { color: tx.type === 'credit' ? colors.income : colors.expense }
                  ]}>
                    {tx.type === 'credit' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                  </Text>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating AI Chat Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/(tabs)/chat")}
      >
        <IconSymbol name="bubble.left.fill" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
  },
  userName: {
    fontSize: 26,
    fontWeight: "700",
  },
  autoImportBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 8,
  },
  autoImportText: {
    fontSize: 13,
    fontWeight: "500",
  },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 4,
  },
  statValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  transactionsList: {
    gap: 10,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  txDetails: {
    flex: 1,
    marginLeft: 12,
  },
  txDesc: {
    fontSize: 15,
    fontWeight: "500",
  },
  txCategory: {
    fontSize: 13,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});