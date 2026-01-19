import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { setInitialBalance } from "@/api/user.api";

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetBalance = async () => {
    const numericBalance = parseFloat(balance.replace(/,/g, ""));
    
    if (isNaN(numericBalance) || numericBalance < 0) {
      Alert.alert("Invalid Amount", "Please enter a valid balance amount");
      return;
    }

    setLoading(true);
    try {
      await setInitialBalance(numericBalance);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Failed to set balance:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save balance. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (text: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = cleaned.split(".");
    if (parts.length > 2) return balance;
    setBalance(cleaned);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Welcome Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "15" }]}>
          <IconSymbol name="wallet.pass.fill" size={60} color={colors.primary} />
        </View>

        {/* Welcome Text */}
        <Text style={[styles.title, { color: colors.text }]}>Welcome to ExpenseEase!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Let's set up your starting balance to track your finances accurately
        </Text>

        {/* Balance Input Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Your Current Bank Balance
          </Text>
          
          <View style={styles.inputWrapper}>
            <Text style={[styles.currencySymbol, { color: colors.text }]}>₹</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={balance}
              onChangeText={formatBalance}
              autoFocus
            />
          </View>

          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Enter your total available balance across all accounts
          </Text>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + "10" }]}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            We'll use this as your starting point. Future transactions from SMS will be added to this balance.
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSetBalance}
          disabled={loading || !balance}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Set Balance & Continue</Text>
              <IconSymbol name="arrow.right" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    justifyContent: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "600",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 36,
    fontWeight: "700",
    paddingVertical: 8,
  },
  helperText: {
    fontSize: 12,
  },
  infoCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 32,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
