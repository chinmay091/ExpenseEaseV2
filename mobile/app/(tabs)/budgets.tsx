import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getBudgets, generateBudgets, Budget } from "@/api/budget.api";

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchBudgets = async () => {
    try {
      const data = await getBudgets();
      setBudgets(data);
    } catch (error) {
      console.error("Failed to fetch budgets", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBudgets();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBudgets();
    setRefreshing(false);
  };

  const handleGenerateBudgets = async () => {
    Alert.alert(
      "Generate Budgets",
      "This will analyze your spending from the last 3 months and create smart budgets for each category.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: async () => {
            setGenerating(true);
            try {
              await generateBudgets({ months: 3, bufferPercent: 10 });
              await fetchBudgets();
              Alert.alert("Success", "Budgets generated successfully!");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to generate budgets. Make sure you have expense history.");
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "#ff3b30";
    if (percent >= 60) return "#ff9500";
    return "#34c759";
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderBudgetCard = ({ item }: { item: Budget }) => {
    const progressColor = getProgressColor(item.usagePercent);
    const isExpanded = expandedId === item.budgetId;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => item.explanation && toggleExpand(item.budgetId)}
        activeOpacity={item.explanation ? 0.7 : 1}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.usagePercent}>{item.usagePercent}%</Text>
        </View>

        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${Math.min(item.usagePercent, 100)}%`, backgroundColor: progressColor }
            ]} 
          />
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.spent}>₹{item.spent.toLocaleString()}</Text>
          <Text style={styles.limit}>/ ₹{item.monthlyLimit.toLocaleString()}</Text>
        </View>

        <Text style={[styles.remaining, { color: progressColor }]}>
          ₹{item.remaining.toLocaleString()} remaining
        </Text>

        {item.explanation && (
          <Text style={styles.expandHint}>
            {isExpanded ? "Tap to collapse" : "Tap for AI insights"}
          </Text>
        )}

        {isExpanded && item.explanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>💡 AI Insights</Text>
            <Text style={styles.explanation}>{item.explanation}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budgets</Text>
        <TouchableOpacity 
          style={[styles.generateButton, generating && styles.buttonDisabled]}
          onPress={handleGenerateBudgets}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>✨ Generate</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.budgetId}
        renderItem={renderBudgetCard}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No budgets yet</Text>
            <Text style={styles.emptySubtext}>
              Tap "Generate" to create smart budgets based on your spending
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#11181C",
  },
  generateButton: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonDisabled: {
    backgroundColor: "#888",
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  category: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
  },
  usagePercent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#687076",
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  spent: {
    fontSize: 20,
    fontWeight: "700",
    color: "#11181C",
  },
  limit: {
    fontSize: 16,
    color: "#687076",
    marginLeft: 4,
  },
  remaining: {
    fontSize: 14,
    fontWeight: "500",
  },
  expandHint: {
    fontSize: 12,
    color: "#0a7ea4",
    marginTop: 8,
    textAlign: "center",
  },
  explanationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 6,
  },
  explanation: {
    fontSize: 13,
    color: "#687076",
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#687076",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
