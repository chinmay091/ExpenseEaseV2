import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { getExpenses, deleteExpense, Expense } from "@/api/expense.api";
import { getCategories, Category } from "@/api/category.api";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@/hooks/use-theme";

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const categorymap = categories.reduce<Record<string, string>>((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {});

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [])
  );

  useEffect(() => {
    const fetchcategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchcategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpense(id);
              fetchExpenses();
            } catch (error) {
              Alert.alert("Error", "Failed to delete expense.");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (expense: Expense) => {
    router.push({
      pathname: "/(tabs)/add",
      params: {
        expenseId: expense.id,
        amount: expense.amount,
        description: expense.description ?? "",
        type: expense.type,
        categoryId: expense.categoryId ?? "",
      },
    });
  };

  const renderItem = ({ item }: { item: Expense }) => {
    const isCredit = item.type === "credit";
    return (
      <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.itemHeader}>
          <Text style={[styles.amount, { color: isCredit ? colors.success : colors.text }]}>
            {isCredit ? "+" : "-"}₹{item.amount}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: isCredit ? colors.success + "20" : colors.error + "20" }]}>
            <Text style={[styles.typeText, { color: isCredit ? colors.success : colors.error }]}>
              {item.type.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.description, { color: colors.text }]}>
          {item.description || "No description"}
        </Text>
        
        <Text style={[styles.category, { color: colors.textSecondary }]}>
          {categorymap[item.categoryId ?? ""] ?? "Uncategorized"}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
            <Text style={[styles.editText, { color: colors.tint }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
            <Text style={[styles.deleteText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Expenses</Text>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>No expenses found</Text>
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  item: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  amount: {
    fontSize: 20,
    fontWeight: "700",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  description: {
    fontSize: 15,
    marginBottom: 4,
  },
  category: {
    fontSize: 13,
    marginBottom: 10,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
  },
  actionBtn: {
    paddingVertical: 4,
  },
  editText: {
    fontSize: 14,
    fontWeight: "600",
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
  },
});
