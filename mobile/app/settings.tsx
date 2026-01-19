import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/AuthContext";

const NOTIFICATION_KEYS = {
  budgetWarnings: "@notifications_budget_warnings",
  billReminders: "@notifications_bill_reminders",
  weeklySummary: "@notifications_weekly_summary",
  anomalyAlerts: "@notifications_anomaly_alerts",
};

type NotificationSettings = {
  budgetWarnings: boolean;
  billReminders: boolean;
  weeklySummary: boolean;
  anomalyAlerts: boolean;
};

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    budgetWarnings: true,
    billReminders: true,
    weeklySummary: true,
    anomalyAlerts: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settings = await Promise.all([
        AsyncStorage.getItem(NOTIFICATION_KEYS.budgetWarnings),
        AsyncStorage.getItem(NOTIFICATION_KEYS.billReminders),
        AsyncStorage.getItem(NOTIFICATION_KEYS.weeklySummary),
        AsyncStorage.getItem(NOTIFICATION_KEYS.anomalyAlerts),
      ]);

      setNotifications({
        budgetWarnings: settings[0] !== "false",
        billReminders: settings[1] !== "false",
        weeklySummary: settings[2] !== "false",
        anomalyAlerts: settings[3] !== "false",
      });
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSetting = async (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    try {
      await AsyncStorage.setItem(NOTIFICATION_KEYS[key], String(value));
    } catch (error) {
      console.error("Failed to save notification setting:", error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear locally stored data. Your account data will remain safe.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              // Only clear non-essential keys
              const keysToKeep = ["@auth_token", "@user_data"];
              const allKeys = await AsyncStorage.getAllKeys();
              const keysToRemove = allKeys.filter(k => !keysToKeep.includes(k));
              await AsyncStorage.multiRemove(keysToRemove);
              Alert.alert("Success", "Cache cleared successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to clear cache");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              "Please contact support at support@expenseease.app to delete your account.",
              [{ text: "OK" }]
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    value,
    onToggle,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onToggle: (value: boolean) => void;
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.cardBorder }]}>
      <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
        <IconSymbol name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.inputBorder, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card }]} 
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Profile Section */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || "User"}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
      </View>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name={isDark ? "moon.fill" : "sun.max.fill"} size={20} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Theme</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              {isDark ? "Dark" : "Light"} (follows system)
            </Text>
          </View>
          <IconSymbol name="checkmark" size={20} color={colors.primary} />
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
      </View>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <SettingRow
          icon="creditcard.fill"
          title="Budget Warnings"
          subtitle="Alert when spending exceeds 90%"
          value={notifications.budgetWarnings}
          onToggle={(v) => updateNotificationSetting("budgetWarnings", v)}
        />
        <SettingRow
          icon="calendar"
          title="Bill Reminders"
          subtitle="Remind me before bills are due"
          value={notifications.billReminders}
          onToggle={(v) => updateNotificationSetting("billReminders", v)}
        />
        <SettingRow
          icon="chart.bar.fill"
          title="Weekly Summary"
          subtitle="Weekly spending digest every Sunday"
          value={notifications.weeklySummary}
          onToggle={(v) => updateNotificationSetting("weeklySummary", v)}
        />
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Unusual Activity</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              Alert on abnormally large transactions
            </Text>
          </View>
          <Switch
            value={notifications.anomalyAlerts}
            onValueChange={(v) => updateNotificationSetting("anomalyAlerts", v)}
            trackColor={{ false: colors.inputBorder, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Data & Privacy Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATA & PRIVACY</Text>
      </View>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TouchableOpacity 
          style={[styles.actionRow, { borderBottomColor: colors.cardBorder }]}
          onPress={handleClearCache}
        >
          <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="trash.fill" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.actionText, { color: colors.text }]}>Clear Cache</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionRow, { borderBottomWidth: 0 }]}
          onPress={handleDeleteAccount}
        >
          <View style={[styles.settingIcon, { backgroundColor: colors.error + "15" }]}>
            <IconSymbol name="person.crop.circle.badge.minus" size={20} color={colors.error} />
          </View>
          <Text style={[styles.actionText, { color: colors.error }]}>Delete Account</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
      </View>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.actionRow, { borderBottomColor: colors.cardBorder }]}>
          <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.actionText, { color: colors.text }]}>Version</Text>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>1.0.0</Text>
        </View>
        <TouchableOpacity 
          style={[styles.actionRow, { borderBottomWidth: 0 }]}
          onPress={() => Linking.openURL("mailto:support@expenseease.app")}
        >
          <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="envelope.fill" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.actionText, { color: colors.text }]}>Contact Support</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.error }]}
        onPress={handleLogout}
      >
        <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionHeader: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  profileInfo: {
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 12,
  },
  versionText: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
