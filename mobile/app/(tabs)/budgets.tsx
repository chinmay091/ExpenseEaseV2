import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getBudgets, generateBudgets, Budget } from "@/api/budget.api";
import { useTheme } from "@/hooks/use-theme";

export default function BudgetsScreen() {
  const { colors } = useTheme();
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
    if (percent >= 90) return colors.error;
    if (percent >= 60) return colors.warning;
    return colors.success;
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderBudgetCard = ({ item }: { item: Budget }) => {
    const progressColor = getProgressColor(item.usagePercent);
    const isExpanded = expandedId === item.budgetId;

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card }]} 
        onPress={() => item.explanation && toggleExpand(item.budgetId)}
        activeOpacity={item.explanation ? 0.7 : 1}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.category, { color: colors.text }]}>{item.category}</Text>
          <Text style={[styles.usagePercent, { color: colors.textSecondary }]}>{item.usagePercent}%</Text>
        </View>

        <View style={[styles.progressContainer, { backgroundColor: colors.progressBg }]}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${Math.min(item.usagePercent, 100)}%`, backgroundColor: progressColor }
            ]} 
          />
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.spent, { color: colors.text }]}>₹{item.spent.toLocaleString()}</Text>
          <Text style={[styles.limit, { color: colors.textSecondary }]}>/ ₹{item.monthlyLimit.toLocaleString()}</Text>
        </View>

        <Text style={[styles.remaining, { color: progressColor }]}>
          ₹{item.remaining.toLocaleString()} remaining
        </Text>

        {item.explanation && (
          <Text style={[styles.expandHint, { color: colors.tint }]}>
            {isExpanded ? "Tap to collapse" : "Tap for AI insights"}
          </Text>
        )}

        {isExpanded && item.explanation && (
          <View style={[styles.explanationContainer, { borderTopColor: colors.cardBorder }]}>
            <Text style={[styles.explanationTitle, { color: colors.text }]}>💡 AI Insights</Text>
            <Text style={[styles.explanation, { color: colors.textSecondary }]}>{item.explanation}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Budgets</Text>
        <TouchableOpacity 
          style={[styles.generateButton, { backgroundColor: colors.tint }, generating && styles.buttonDisabled]}
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
            <Text style={[styles.emptyText, { color: colors.text }]}>No budgets yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
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
  },
  generateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
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
  },
  usagePercent: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressContainer: {
    height: 8,
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
  },
  limit: {
    fontSize: 16,
    marginLeft: 4,
  },
  remaining: {
    fontSize: 14,
    fontWeight: "500",
  },
  expandHint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  explanationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  explanation: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
