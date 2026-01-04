import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams } from "expo-router";

import { createExpense, updateExpense } from "@/api/expense.api";
import { getCategories, Category } from "@/api/category.api";

export default function AddExpenseScreen() {
  const params = useLocalSearchParams();
  const isEdit = Boolean(params.expenseId);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  /**
   * Prefill form in edit mode
   */
  useEffect(() => {
    if (isEdit) {
      setAmount(String(params.amount ?? ""));
      setDescription(String(params.description ?? ""));
      setType(params.type as "debit" | "credit");
      setSelectedCategoryId(String(params.categoryId));
    }
  }, [isEdit]);

  /**
   * Fetch categories
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };

    fetchCategories();
  }, []);

  /**
   * Submit handler (Add or Edit)
   */
  const handleSubmit = async () => {
    if (!amount) {
      Alert.alert("Error", "Please enter an amount.");
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert("Error", "Please select a category.");
      return;
    }

    try {
      if (isEdit) {
        await updateExpense(params.expenseId as string, {
          amount: Number(amount),
          description,
          type,
          categoryId: selectedCategoryId,
        });

        Alert.alert("Success", "Expense updated successfully.");
      } else {
        await createExpense({
          amount: Number(amount),
          description,
          type,
          categoryId: selectedCategoryId,
        });

        Alert.alert("Success", "Expense added successfully.");

        // Reset only in add mode
        setAmount("");
        setDescription("");
        setSelectedCategoryId(null);
        setType("debit");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save expense.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isEdit ? "Edit Expense" : "Add Expense"}
      </Text>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        placeholder="Enter amount"
        placeholderTextColor="#999"
        keyboardType="numeric"
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        placeholder="Enter description"
        placeholderTextColor="#999"
        style={styles.input}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        <Text
          style={[styles.typeButton, type === "debit" && styles.activeDebit]}
          onPress={() => setType("debit")}
        >
          Debit
        </Text>

        <Text
          style={[styles.typeButton, type === "credit" && styles.activeCredit]}
          onPress={() => setType("credit")}
        >
          Credit
        </Text>
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedCategoryId}
          onValueChange={(value) => setSelectedCategoryId(value)}
        >
          <Picker.Item label="Select category" value={null} />
          {categories.map((category) => (
            <Picker.Item
              key={category.id}
              label={category.name}
              value={category.id}
            />
          ))}
        </Picker>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>
          {isEdit ? "Update Expense" : "Add Expense"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Styles
 */
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
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    color: "#000",
  },
  typeRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginRight: 8,
    color: "#000",
  },
  activeDebit: {
    backgroundColor: "#ffe5e5",
    borderColor: "#ff6b6b",
  },
  activeCredit: {
    backgroundColor: "#e5fff0",
    borderColor: "#2ecc71",
  },
  submitButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 20,
    overflow: "hidden",
  },
});
