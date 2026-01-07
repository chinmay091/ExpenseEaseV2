import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from "react-native";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useSmsReader, SmsMessage } from "@/hooks/useSmsReader";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { parseSmsMessages, ParsedTransaction } from "@/api/sms.api";
import { fetchGmailTransactions, GmailTransaction } from "@/api/gmail.api";
import { createExpense, getExpenses, Expense } from "@/api/expense.api";
import { getCategories, Category } from "@/api/category.api";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";

type Transaction = ParsedTransaction | GmailTransaction;

export default function ImportScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  // SMS state
  const smsReader = useSmsReader();
  const [smsTransactions, setSmsTransactions] = useState<ParsedTransaction[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  
  // Gmail state
  const googleAuth = useGoogleAuth();
  const [gmailTransactions, setGmailTransactions] = useState<GmailTransaction[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | null>(null);
  
  // Current view - sms or gmail
  const [activeTab, setActiveTab] = useState<"sms" | "gmail">("sms");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
        if (data.length > 0) {
          setDefaultCategoryId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
    
    // Configure Google Auth on mount
    googleAuth.configure();
  }, []);

  // SMS Functions
  const handleReadSms = async () => {
    if (!smsReader.isSupported) {
      Alert.alert("Not Supported", "SMS reading is only available on Android devices.");
      return;
    }

    setSmsLoading(true);
    try {
      const messages = await smsReader.readMessages(100);
      if (messages.length > 0) {
        // Send to backend for parsing
        const result = await parseSmsMessages(messages);
        if (result.success && result.data) {
          setSmsTransactions(result.data.transactions);
          if (result.data.transactions.length === 0) {
            Alert.alert("No Transactions", "No transaction messages found in your SMS.");
          }
        }
      } else {
        Alert.alert("No Messages", "No SMS messages found.");
      }
    } catch (error) {
      console.error("SMS read error:", error);
      Alert.alert("Error", "Failed to read SMS messages.");
    } finally {
      setSmsLoading(false);
    }
  };

  // Gmail Functions
  const handleGmailConnect = async () => {
    const result = await googleAuth.signIn();
    if (result?.accessToken) {
      await fetchGmailData(result.accessToken);
    }
  };

  const fetchGmailData = async (accessToken: string) => {
    setGmailLoading(true);
    try {
      const result = await fetchGmailTransactions(accessToken);
      if (result.success && result.data) {
        setGmailTransactions(result.data.transactions);
        if (result.data.transactions.length === 0) {
          Alert.alert("No Transactions", "No transaction emails found.");
        }
      }
    } catch (error) {
      console.error("Gmail fetch error:", error);
      Alert.alert("Error", "Failed to fetch emails. Please try again.");
    } finally {
      setGmailLoading(false);
    }
  };

  // Selection helpers
  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedItems(newSet);
  };

  const selectAll = () => {
    const transactions = activeTab === "sms" ? smsTransactions : gmailTransactions;
    setSelectedItems(new Set(transactions.map((_, i) => i)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Import selected transactions with confirmation and duplicate check
  const handleImport = async () => {
    if (!defaultCategoryId) {
      Alert.alert("Error", "Please select a category.");
      return;
    }

    const transactions = activeTab === "sms" ? smsTransactions : gmailTransactions;
    const selected = Array.from(selectedItems).map(i => transactions[i]);

    if (selected.length === 0) {
      Alert.alert("No Selection", "Please select transactions to import.");
      return;
    }

    // Calculate totals for confirmation
    const totalDebit = selected
      .filter(tx => tx.type === "debit")
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalCredit = selected
      .filter(tx => tx.type === "credit")
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Show confirmation dialog
    Alert.alert(
      "Confirm Import",
      `You are about to import ${selected.length} transaction(s):\n\n` +
      `📤 Debits: ₹${totalDebit.toLocaleString()}\n` +
      `📥 Credits: ₹${totalCredit.toLocaleString()}\n\n` +
      `Category: ${categories.find(c => c.id === defaultCategoryId)?.name || "Unknown"}\n\n` +
      `Duplicates will be automatically skipped.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          style: "default",
          onPress: () => performImport(selected),
        },
      ]
    );
  };

  // Perform the actual import with duplicate checking
  const performImport = async (selected: Transaction[]) => {
    try {
      let successCount = 0;
      let skippedCount = 0;
      const importedIndices: number[] = [];

      for (let i = 0; i < selected.length; i++) {
        const tx = selected[i];
        
        // Use backend duplicate detection
        const result = await createExpense({
          amount: tx.amount,
          description: tx.description || tx.merchant || "Imported transaction",
          type: tx.type,
          categoryId: defaultCategoryId!,
          skipDuplicate: true, // Let backend check for duplicates
        });
        
        // Check if backend skipped as duplicate
        if (result.skipped) {
          skippedCount++;
          continue;
        }
        
        successCount++;
        // Find the original index in transactions array
        const originalIndex = (activeTab === "sms" ? smsTransactions : gmailTransactions)
          .findIndex(t => t === tx);
        if (originalIndex !== -1) {
          importedIndices.push(originalIndex);
        }
      }

      // Show result
      let message = `✅ Imported ${successCount} transaction(s).`;
      if (skippedCount > 0) {
        message += `\n⚠️ Skipped ${skippedCount} duplicate(s).`;
      }
      Alert.alert("Import Complete", message);
      
      // Clear imported items from list
      const importedSet = new Set(importedIndices);
      if (activeTab === "sms") {
        setSmsTransactions(prev => prev.filter((_, i) => !importedSet.has(i)));
      } else {
        setGmailTransactions(prev => prev.filter((_, i) => !importedSet.has(i)));
      }
      setSelectedItems(new Set());
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert("Error", "Failed to import some transactions.");
    }
  };

  const transactions = activeTab === "sms" ? smsTransactions : gmailTransactions;
  const isLoading = activeTab === "sms" ? smsLoading : gmailLoading;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Import Expenses</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Import transactions from SMS or Gmail
      </Text>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "sms" && { backgroundColor: colors.tint },
            { borderColor: colors.cardBorder }
          ]}
          onPress={() => setActiveTab("sms")}
        >
          <IconSymbol name="message.fill" size={20} color={activeTab === "sms" ? "#fff" : colors.text} />
          <Text style={[styles.tabText, { color: activeTab === "sms" ? "#fff" : colors.text }]}>SMS</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "gmail" && { backgroundColor: colors.tint },
            { borderColor: colors.cardBorder }
          ]}
          onPress={() => setActiveTab("gmail")}
        >
          <IconSymbol name="envelope.fill" size={20} color={activeTab === "gmail" ? "#fff" : colors.text} />
          <Text style={[styles.tabText, { color: activeTab === "gmail" ? "#fff" : colors.text }]}>Gmail</Text>
        </TouchableOpacity>
      </View>

      {/* SMS Tab Content */}
      {activeTab === "sms" && (
        <View style={styles.section}>
          {Platform.OS !== "android" ? (
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.warning} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                SMS reading is only available on Android devices.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
              onPress={handleReadSms}
              disabled={smsLoading}
            >
              {smsLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol name="message.fill" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Read SMS Messages</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Gmail Tab Content */}
      {activeTab === "gmail" && (
        <View style={styles.section}>
          {googleAuth.isSignedIn ? (
            <View>
              <View style={[styles.connectedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
                <Text style={[styles.connectedText, { color: colors.text }]}>
                  Connected as {googleAuth.user?.email}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.tint }]}
                onPress={() => googleAuth.accessToken && fetchGmailData(googleAuth.accessToken)}
                disabled={gmailLoading}
              >
                {gmailLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="arrow.down.circle.fill" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Fetch Transaction Emails</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.signOutButton, { borderColor: colors.cardBorder }]}
                onPress={googleAuth.signOut}
              >
                <Text style={[styles.signOutText, { color: colors.textSecondary }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#4285F4" }]}
              onPress={handleGmailConnect}
              disabled={googleAuth.loading}
            >
              {googleAuth.loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol name="envelope.fill" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Connect Gmail</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Category Selector */}
      {transactions.length > 0 && (
        <View style={styles.categorySection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Default Category</Text>
          <View style={[styles.pickerWrapper, { backgroundColor: colors.input, borderColor: colors.cardBorder }]}>
            <Picker
              selectedValue={defaultCategoryId}
              onValueChange={setDefaultCategoryId}
              style={{ color: colors.text }}
              dropdownIconColor={colors.textSecondary}
            >
              {categories.map((category) => (
                <Picker.Item
                  key={category.id}
                  label={category.name}
                  value={category.id}
                  color={isDark ? "#fff" : "#000"}
                />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Transactions List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      ) : transactions.length > 0 ? (
        <View style={styles.transactionsSection}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.text }]}>
              Found {transactions.length} Transaction(s)
            </Text>
            <View style={styles.selectButtons}>
              <TouchableOpacity onPress={selectAll}>
                <Text style={[styles.selectButtonText, { color: colors.tint }]}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearSelection}>
                <Text style={[styles.selectButtonText, { color: colors.textSecondary }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {transactions.map((tx, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.transactionCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                selectedItems.has(index) && { borderColor: colors.tint, borderWidth: 2 }
              ]}
              onPress={() => toggleSelection(index)}
            >
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.cardBorder },
                  selectedItems.has(index) && { backgroundColor: colors.tint, borderColor: colors.tint }
                ]}>
                  {selectedItems.has(index) && (
                    <IconSymbol name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={[styles.transactionAmount, { color: tx.type === "credit" ? colors.success : colors.error }]}>
                    {tx.type === "credit" ? "+" : "-"}₹{tx.amount?.toLocaleString()}
                  </Text>
                  <Text style={[styles.transactionDesc, { color: colors.text }]} numberOfLines={1}>
                    {tx.description || tx.merchant || "Unknown"}
                  </Text>
                  <Text style={[styles.transactionMeta, { color: colors.textSecondary }]}>
                    {tx.source} • {tx.confidence}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Import Button - Always visible when transactions exist */}
          <TouchableOpacity
            style={[
              styles.importButton,
              { 
                backgroundColor: selectedItems.size > 0 ? '#22c55e' : '#6b7280',
                marginTop: 20,
                marginBottom: 20,
              }
            ]}
            onPress={handleImport}
            disabled={selectedItems.size === 0}
          >
            <Text style={[styles.importButtonText, { color: '#fff', fontWeight: '700' }]}>
              {selectedItems.size > 0 
                ? `✓ Import ${selectedItems.size} Selected` 
                : '— Select transactions to import —'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  connectedCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  connectedText: {
    fontSize: 14,
  },
  signOutButton: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 14,
  },
  categorySection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  transactionsSection: {
    marginBottom: 120,
    paddingBottom: 40,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectButtons: {
    flexDirection: "row",
    gap: 16,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  transactionDesc: {
    fontSize: 14,
    marginTop: 2,
  },
  transactionMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  importButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
