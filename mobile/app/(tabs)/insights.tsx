import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";

type InsightsTab = "budgets" | "goals" | "charts";

export default function InsightsScreen() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<InsightsTab>("budgets");

  const tabs: { key: InsightsTab; label: string; icon: string }[] = [
    { key: "budgets", label: "Budgets", icon: "creditcard.fill" },
    { key: "goals", label: "Goals", icon: "star.fill" },
    { key: "charts", label: "Charts", icon: "chart.pie.fill" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Insights</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Track your financial progress
      </Text>

      {/* Tab Pills */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabPill,
              { 
                backgroundColor: activeTab === tab.key ? colors.primary : colors.card,
                borderColor: colors.cardBorder,
              }
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <IconSymbol 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.key ? "#fff" : colors.text} 
            />
            <Text style={[
              styles.tabLabel, 
              { color: activeTab === tab.key ? "#fff" : colors.text }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content based on tab */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "budgets" && (
          <View>
            <TouchableOpacity 
              style={[styles.viewButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/budgets")}
            >
              <Text style={styles.viewButtonText}>View All Budgets</Text>
              <IconSymbol name="chevron.right" size={16} color="#fff" />
            </TouchableOpacity>
            
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <IconSymbol name="lightbulb.fill" size={24} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Budgets help you limit spending in specific categories. Set monthly limits and track your progress.
              </Text>
            </View>
          </View>
        )}

        {activeTab === "goals" && (
          <View>
            <TouchableOpacity 
              style={[styles.viewButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/goals")}
            >
              <Text style={styles.viewButtonText}>View All Goals</Text>
              <IconSymbol name="chevron.right" size={16} color="#fff" />
            </TouchableOpacity>
            
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <IconSymbol name="target" size={24} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Savings goals help you save for specific targets. Auto-contribute from your income to reach goals faster.
              </Text>
            </View>
          </View>
        )}

        {activeTab === "charts" && (
          <View>
            <TouchableOpacity 
              style={[styles.viewButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/reports")}
            >
              <Text style={styles.viewButtonText}>View Full Reports</Text>
              <IconSymbol name="chevron.right" size={16} color="#fff" />
            </TouchableOpacity>
            
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <IconSymbol name="chart.bar.fill" size={24} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                View detailed charts and analytics of your spending patterns, category breakdowns, and trends over time.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  tabPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
