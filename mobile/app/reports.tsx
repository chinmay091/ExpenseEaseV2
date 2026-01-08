import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FileSystem = require("expo-file-system");
const Sharing = require("expo-sharing");
import {
  getReportPeriods,
  getReportData,
  ReportPeriod,
  ReportData,
} from "@/api/report.api";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/api/axios";

export default function ReportsScreen() {
  const { colors } = useTheme();
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPeriods();
    }, [])
  );

  const loadPeriods = async () => {
    try {
      const data = await getReportPeriods();
      setPeriods(data);
      if (data.length > 0) {
        setSelectedPeriod(data[0]);
        loadReport(data[0]);
      }
    } catch (error) {
      console.error("Failed to load periods:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (period: ReportPeriod) => {
    setLoadingReport(true);
    try {
      const data = await getReportData(period.year, period.month);
      setReport(data);
    } catch (error) {
      console.error("Failed to load report:", error);
      Alert.alert("Error", "Failed to load report");
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePeriodChange = (period: ReportPeriod) => {
    setSelectedPeriod(period);
    loadReport(period);
  };

  const handleExportCSV = async () => {
    if (!selectedPeriod) return;
    
    Alert.alert(
      "Export Report",
      `Download CSV report for ${selectedPeriod.label}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Download", 
          onPress: async () => {
            try {
              const response = await api.get(
                `/reports/csv?year=${selectedPeriod.year}&month=${selectedPeriod.month}`,
                { responseType: 'text' }
              );
              
              const fileName = `ExpenseEase_Report_${selectedPeriod.year}_${selectedPeriod.month}.csv`;
              // @ts-ignore - cacheDirectory exists at runtime
              const fileUri = (FileSystem.cacheDirectory || '') + fileName;
              
              // @ts-ignore - writeAsStringAsync exists at runtime
              await FileSystem.writeAsStringAsync(fileUri, response.data);
              
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(fileUri, {
                  mimeType: 'text/csv',
                  dialogTitle: 'Save Report',
                });
              } else {
                Alert.alert("Success", `Report saved to: ${fileUri}`);
              }
            } catch (error: any) {
              console.error("CSV export error:", error);
              Alert.alert("Error", error.response?.data?.message || "Failed to export report");
            }
          }
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Reports</Text>
        {selectedPeriod && (
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.tint }]}
            onPress={handleExportCSV}
          >
            <Text style={styles.exportButtonText}>📊 Export CSV</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Period Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.periodScroll}
        contentContainerStyle={styles.periodScrollContent}
      >
        {periods.map((period) => (
          <TouchableOpacity
            key={`${period.year}-${period.month}`}
            style={[
              styles.periodChip,
              { borderColor: colors.cardBorder },
              selectedPeriod?.year === period.year && 
              selectedPeriod?.month === period.month && {
                backgroundColor: colors.tint,
                borderColor: colors.tint,
              },
            ]}
            onPress={() => handlePeriodChange(period)}
          >
            <Text
              style={[
                styles.periodText,
                { color: colors.text },
                selectedPeriod?.year === period.year && 
                selectedPeriod?.month === period.month && { color: "#fff" },
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loadingReport ? (
        <ActivityIndicator style={styles.reportLoading} size="large" color={colors.tint} />
      ) : report ? (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Income</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {formatCurrency(report.summary.totalIncome)}
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Spending</Text>
              <Text style={[styles.summaryValue, { color: colors.error }]}>
                {formatCurrency(report.summary.totalSpending)}
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Savings</Text>
              <Text 
                style={[
                  styles.summaryValue, 
                  { color: report.summary.netSavings >= 0 ? colors.success : colors.error }
                ]}
              >
                {formatCurrency(report.summary.netSavings)}
              </Text>
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending by Category</Text>
            {report.categoryBreakdown.map((cat, index) => (
              <View key={cat.name} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                  <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>
                    {cat.percent}%
                  </Text>
                </View>
                <Text style={[styles.categoryAmount, { color: colors.text }]}>
                  {formatCurrency(cat.amount)}
                </Text>
              </View>
            ))}
          </View>

          {/* Budget Comparison */}
          {report.budgetComparison.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Budget vs Actual</Text>
              {report.budgetComparison.map((budget) => (
                <View key={budget.category} style={styles.budgetRow}>
                  <View style={styles.budgetInfo}>
                    <Text style={[styles.budgetCategory, { color: colors.text }]}>
                      {budget.category}
                    </Text>
                    <View style={[styles.progressBg, { backgroundColor: colors.progressBg }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min((budget.spent / budget.budgeted) * 100, 100)}%`,
                            backgroundColor: budget.overBudget ? colors.error : colors.success,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.budgetStatus,
                      { color: budget.overBudget ? colors.error : colors.success },
                    ]}
                  >
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.budgeted)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>No data available</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Add some expenses to see your report
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  exportButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  periodScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  periodScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "500",
  },
  reportLoading: {
    marginTop: 40,
  },
  summaryGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryName: {
    fontSize: 14,
  },
  categoryPercent: {
    fontSize: 12,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  budgetRow: {
    paddingVertical: 10,
  },
  budgetInfo: {
    marginBottom: 6,
  },
  budgetCategory: {
    fontSize: 14,
    marginBottom: 6,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  budgetStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});
