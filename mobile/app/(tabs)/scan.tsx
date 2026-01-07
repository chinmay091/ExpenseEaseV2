import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/hooks/use-theme";
import { extractFromReceipt, ExtractedExpense } from "@/api/ocr.api";
import { createExpense } from "@/api/expense.api";
import { getCategories, Category } from "@/api/category.api";
import { Picker } from "@react-native-picker/picker";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ScanScreen() {
  const { colors, isDark } = useTheme();
  
  const [mode, setMode] = useState<"select" | "preview" | "result">("select");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedExpense | null>(null);
  
  // Form state for extracted data
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      processImage(result.assets[0].base64!);
    }
  };

  const takePhoto = async () => {
    // Request camera permission first
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera permission is required to scan receipts.");
      return;
    }

    // Launch native camera directly
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      processImage(result.assets[0].base64!);
    }
  };

  const processImage = async (base64: string) => {
    setLoading(true);
    setMode("preview");
    
    try {
      const result = await extractFromReceipt(base64);
      
      if (result.success && result.data) {
        const expense = result.data.expense;
        setExtractedData(expense);
        setAmount(expense.amount?.toString() || "");
        setDescription(expense.description || expense.merchant || "");
        setMode("result");
      } else {
        Alert.alert("Extraction Failed", result.error || "Could not extract data from image");
        setMode("select");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      Alert.alert("Error", "Failed to process the image. Please try again.");
      setMode("select");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!amount || !selectedCategoryId) {
      Alert.alert("Error", "Please enter amount and select a category.");
      return;
    }

    try {
      await createExpense({
        amount: Number(amount),
        description,
        type: "debit",
        categoryId: selectedCategoryId,
      });
      Alert.alert("Success", "Expense added successfully!");
      resetState();
    } catch (error) {
      Alert.alert("Error", "Failed to save expense.");
    }
  };

  const resetState = () => {
    setMode("select");
    setImageUri(null);
    setExtractedData(null);
    setAmount("");
    setDescription("");
    setSelectedCategoryId(null);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Scan Receipt</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Take a photo or select an image to extract expense details
      </Text>

      {mode === "select" && (
        <View style={styles.selectContainer}>
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: colors.tint }]}
            onPress={takePhoto}
          >
            <IconSymbol name="camera.fill" size={32} color="#fff" />
            <Text style={styles.selectButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }]}
            onPress={pickImage}
          >
            <IconSymbol name="photo.fill" size={32} color={colors.tint} />
            <Text style={[styles.selectButtonText, { color: colors.text }]}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === "preview" && loading && (
        <View style={styles.loadingContainer}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="contain" />
          )}
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Extracting data...</Text>
          </View>
        </View>
      )}

      {mode === "result" && (
        <View style={styles.resultContainer}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.thumbnailImage} contentFit="cover" />
          )}

          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Extracted Details</Text>
            
            {extractedData?.confidence && (
              <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
                Confidence: {extractedData.confidence}
              </Text>
            )}

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

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }]}
                onPress={resetState}
              >
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.tint, flex: 2 }]}
                onPress={handleSaveExpense}
              >
                <Text style={[styles.actionButtonText, { color: "#fff" }]}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  selectContainer: {
    gap: 16,
    marginTop: 20,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 16,
    gap: 12,
  },
  selectButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  previewImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  resultContainer: {
    gap: 16,
  },
  thumbnailImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
