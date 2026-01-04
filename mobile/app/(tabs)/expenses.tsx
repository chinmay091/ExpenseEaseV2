import { View, Text, StyleSheet, FlatList } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { getExpenses, deleteExpense, Expense } from "@/api/expense.api";
import { Alert, TouchableOpacity } from "react-native";
import { getCategories, Category } from "@/api/category.api";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

export default function ExpensesScreen() {
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
      console.log("Fetched expenses: ", data);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    }
  };

  // Refetch expenses when screen comes into focus
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
        console.log("Fetched categories: ", data);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };

    fetchcategories();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchExpenses();
      setRefreshing(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpense(id);
              fetchExpenses();
            } catch (error) {
              console.error(error);
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
    return (
      <View style={styles.item}>
        <View style={styles.row}>
          <Text style={styles.amount}>₹{item.amount}</Text>
          <Text style={styles.description}>
            {item.description || "No description"}
          </Text>
          <Text style={styles.meta}>{item.type.toUpperCase()}</Text>
          <Text style={styles.meta}>
            {categorymap[item.categoryId ?? ""] ?? "Uncategorized"} -{" "}
            {item.type.toUpperCase()}
          </Text>
          <TouchableOpacity onPress={() => handleEdit(item)}>
            <Text style={styles.edit}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Text style={styles.delete}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expense Screen</Text>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.empty}>No expenses found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
  },
  item: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  amount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  delete: {
    color: "#ff3b30",
    fontSize: 14,
    fontWeight: "600",
  },
  edit: {
  color: "#007AFF",
  fontSize: 14,
  fontWeight: "600",
  marginRight: 12,
},
});
