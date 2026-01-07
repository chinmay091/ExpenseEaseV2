import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams } from "expo-router";
import { createExpense, updateExpense } from "@/api/expense.api";
import { getCategories, Category } from "@/api/category.api";
import { useTheme } from "@/hooks/use-theme";

export default function AddExpenseScreen() {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams();
  const isEdit = Boolean(params.expenseId);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      setAmount(String(params.amount ?? ""));
      setDescription(String(params.description ?? ""));
      setType(params.type as "debit" | "credit");
      setSelectedCategoryId(String(params.categoryId));
    }
  }, [isEdit]);

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
        setAmount("");
        setDescription("");
        setSelectedCategoryId(null);
        setType("debit");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save expense.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {isEdit ? "Edit Expense" : "Add Expense"}
      </Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
      <TextInput
        placeholder="Enter amount"
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
        style={[styles.input, { backgroundColor: colors.input, borderColor: colors.cardBorder, color: colors.text }]}
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
      <TextInput
        placeholder="Enter description"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { backgroundColor: colors.input, borderColor: colors.cardBorder, color: colors.text }]}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[
            styles.typeButton, 
            { borderColor: colors.cardBorder },
            type === "debit" && { backgroundColor: colors.error + "20", borderColor: colors.error }
          ]}
          onPress={() => setType("debit")}
        >
          <Text style={[styles.typeText, { color: type === "debit" ? colors.error : colors.text }]}>
            Debit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton, 
            { borderColor: colors.cardBorder },
            type === "credit" && { backgroundColor: colors.success + "20", borderColor: colors.success }
          ]}
          onPress={() => setType("credit")}
        >
          <Text style={[styles.typeText, { color: type === "credit" ? colors.success : colors.text }]}>
            Credit
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
      <View style={[styles.pickerWrapper, { backgroundColor: colors.input, borderColor: colors.cardBorder }]}>
        <Picker
          selectedValue={selectedCategoryId}
          onValueChange={(value) => setSelectedCategoryId(value)}
          style={{ color: colors.text }}
          dropdownIconColor={colors.textSecondary}
        >
          <Picker.Item label="Select category" value={null} color={isDark ? "#888" : "#999"} />
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

      <TouchableOpacity 
        style={[styles.submitButton, { backgroundColor: colors.tint }]} 
        onPress={handleSubmit}
      >
        <Text style={styles.submitText}>
          {isEdit ? "Update Expense" : "Add Expense"}
        </Text>
      </TouchableOpacity>
    </View>
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
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
  },
  typeRow: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
  },
  typeText: {
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    overflow: "hidden",
  },
});
