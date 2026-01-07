import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/AuthContext";

type MenuItem = {
  icon: string;
  label: string;
  description: string;
  route: string;
  color?: string;
};

export default function MoreScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  const menuItems: MenuItem[] = [
    {
      icon: "doc.text.fill",
      label: "Bills & Reminders",
      description: "Manage recurring bills and payments",
      route: "/bills",
    },
    {
      icon: "chart.line.uptrend.xyaxis",
      label: "Analytics",
      description: "Trends, insights & spending analysis",
      route: "/analytics",
    },
    {
      icon: "person.3.fill",
      label: "Split Expenses",
      description: "Share expenses with friends & groups",
      route: "/groups",
    },
    {
      icon: "camera.fill",
      label: "Scan Receipt",
      description: "Use camera to scan and import receipts",
      route: "/(tabs)/scan",
    },
    {
      icon: "arrow.down.circle.fill",
      label: "Import Transactions",
      description: "Import from SMS or Gmail",
      route: "/import",
    },
    {
      icon: "bubble.left.fill",
      label: "AI Assistant",
      description: "Chat with AI about your finances",
      route: "/(tabs)/chat",
    },
    {
      icon: "chart.bar.fill",
      label: "Reports",
      description: "View detailed monthly reports",
      route: "/reports",
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>More</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Additional features & settings
      </Text>

      <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "User"}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol name={item.icon as any} size={22} color={colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.menuDescription, { color: colors.textSecondary }]}>
                {item.description}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, { borderColor: colors.error }]} 
        onPress={handleLogout}
      >
        <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          ExpenseEase v1.0.0
        </Text>
      </View>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  userInfo: {
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  menuSection: {
    gap: 12,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: {
    flex: 1,
    marginLeft: 14,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  menuDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
  },
});
