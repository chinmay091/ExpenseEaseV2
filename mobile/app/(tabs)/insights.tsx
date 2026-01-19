import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAnalytics, AnalyticsData } from "@/api/analytics.api";

type InsightsTab = "overview" | "budgets" | "goals";

export default function InsightsScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<InsightsTab>("overview");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const analytics = await getAnalytics();
      setData(analytics);
    } catch (error) {
      console.error("Failed to load insights:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
  const formatChange = (change: number) => {
    const prefix = change >= 0 ? "+" : "";
    return `${prefix}${change.toFixed(1)}%`;
  };

  const tabs: { key: InsightsTab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "chart.bar.fill" },
    { key: "budgets", label: "Budgets", icon: "creditcard.fill" },
    { key: "goals", label: "Goals", icon: "star.fill" },
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "success": return "checkmark.circle.fill";
      case "warning": return "exclamationmark.triangle.fill";
      default: return "lightbulb.fill";
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "success": return colors.success;
      case "warning": return colors.warning || "#F59E0B";
      default: return colors.primary;
    }
  };

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
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {activeTab === "overview" && (
          <View>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : data ? (
              <>
                {/* Quick Stats Cards */}
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Month</Text>
                    <Text style={[styles.statValue, { color: colors.error }]}>
                      {formatCurrency(data.currentMonth.totalSpending)}
                    </Text>
                    <View style={[
                      styles.changeBadge, 
                      { backgroundColor: data.comparison.spending.change > 0 ? colors.error + "20" : colors.success + "20" }
                    ]}>
                      <IconSymbol 
                        name={data.comparison.spending.change > 0 ? "arrow.up" : "arrow.down"} 
                        size={12} 
                        color={data.comparison.spending.change > 0 ? colors.error : colors.success} 
                      />
                      <Text style={[
                        styles.changeText, 
                        { color: data.comparison.spending.change > 0 ? colors.error : colors.success }
                      ]}>
                        {formatChange(Math.abs(data.comparison.spending.change))}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Savings</Text>
                    <Text style={[
                      styles.statValue, 
                      { color: data.currentMonth.netSavings >= 0 ? colors.success : colors.error }
                    ]}>
                      {formatCurrency(data.currentMonth.netSavings)}
                    </Text>
                    <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>
                      {data.currentMonth.transactionCount} transactions
                    </Text>
                  </View>
                </View>

                {/* Top Category */}
                {data.currentMonth.topCategory && (
                  <View style={[styles.topCategoryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={[styles.topCategoryIcon, { backgroundColor: colors.primary + "15" }]}>
                      <IconSymbol name="flame.fill" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.topCategoryContent}>
                      <Text style={[styles.topCategoryLabel, { color: colors.textSecondary }]}>Top Spending</Text>
                      <Text style={[styles.topCategoryName, { color: colors.text }]}>{data.currentMonth.topCategory}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.viewMoreBtn, { backgroundColor: colors.primary + "15" }]}
                      onPress={() => router.push("/analytics")}
                    >
                      <Text style={[styles.viewMoreText, { color: colors.primary }]}>Details</Text>
                      <IconSymbol name="chevron.right" size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* AI Insights */}
                {data.insights.length > 0 && (
                  <View style={styles.insightsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Insights</Text>
                    {data.insights.slice(0, 3).map((insight, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.insightCard, 
                          { backgroundColor: getInsightColor(insight.type) + "15", borderColor: getInsightColor(insight.type) + "30" }
                        ]}
                      >
                        <IconSymbol 
                          name={getInsightIcon(insight.type) as any} 
                          size={22} 
                          color={getInsightColor(insight.type)} 
                        />
                        <View style={styles.insightContent}>
                          <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title}</Text>
                          <Text style={[styles.insightText, { color: colors.textSecondary }]}>{insight.text}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Spending Trend Mini Chart */}
                {data.trend.length > 0 && (
                  <View style={[styles.trendSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.trendHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Trend</Text>
                      <TouchableOpacity onPress={() => router.push("/analytics")}>
                        <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.trendChart}>
                      {data.trend.slice(-6).map((point, index) => {
                        const maxTotal = Math.max(...data.trend.map(t => t.total));
                        const height = maxTotal > 0 ? (point.total / maxTotal) * 80 : 0;
                        return (
                          <View key={index} style={styles.trendBar}>
                            <View 
                              style={[
                                styles.trendBarFill, 
                                { 
                                  height, 
                                  backgroundColor: index === data.trend.slice(-6).length - 1 ? colors.primary : colors.primary + "60" 
                                }
                              ]} 
                            />
                            <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>
                              {point.month.slice(5)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <IconSymbol name="chart.bar.fill" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Data Yet</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Add some expenses to see your insights
                </Text>
              </View>
            )}
          </View>
        )}

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
              <IconSymbol name="star.fill" size={24} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Savings goals help you save for specific targets. Auto-contribute from your income to reach goals faster.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
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
    marginBottom: 20,
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
  loader: {
    marginTop: 40,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  statSubtext: {
    fontSize: 12,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  topCategoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  topCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  topCategoryContent: {
    flex: 1,
    marginLeft: 14,
  },
  topCategoryLabel: {
    fontSize: 12,
  },
  topCategoryName: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: "600",
  },
  insightsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  insightCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
  },
  trendSection: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  trendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  trendChart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 100,
  },
  trendBar: {
    alignItems: "center",
    flex: 1,
  },
  trendBarFill: {
    width: 28,
    borderRadius: 6,
    minHeight: 4,
  },
  trendLabel: {
    fontSize: 11,
    marginTop: 8,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
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
