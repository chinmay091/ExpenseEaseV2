import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name ?? "User"}! 👋</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome to ExpenseEase</Text>
        <Text style={styles.cardText}>
          Track your expenses and stay on top of your finances.
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#11181C",
  },
  subtitle: {
    fontSize: 16,
    color: "#687076",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: "#687076",
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: "auto",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ff3b30",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "#ff3b30",
    fontSize: 16,
    fontWeight: "600",
  },
});