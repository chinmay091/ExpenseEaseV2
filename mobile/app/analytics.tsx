import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { getAnalytics, AnalyticsData } from '@/api/analytics.api';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const analytics = await getAnalytics();
      setData(analytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const formatChange = (change: number) => {
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Failed to load analytics</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[styles.title, { color: colors.text }]}>Analytics</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>This Month vs Last Month</Text>
          
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>Spending</Text>
              <Text style={[styles.comparisonValue, { color: colors.expense }]}>
                {formatCurrency(data.comparison.spending.current)}
              </Text>
              <View style={[
                styles.changeBadge,
                { backgroundColor: data.comparison.spending.change > 0 ? colors.expense : colors.income }
              ]}>
                <Ionicons 
                  name={data.comparison.spending.change > 0 ? 'arrow-up' : 'arrow-down'} 
                  size={12} 
                  color="#fff" 
                />
                <Text style={styles.changeText}>{formatChange(data.comparison.spending.change)}</Text>
              </View>
            </View>
            
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>Income</Text>
              <Text style={[styles.comparisonValue, { color: colors.income }]}>
                {formatCurrency(data.comparison.income.current)}
              </Text>
              <View style={[
                styles.changeBadge,
                { backgroundColor: data.comparison.income.change > 0 ? colors.income : colors.expense }
              ]}>
                <Ionicons 
                  name={data.comparison.income.change > 0 ? 'arrow-up' : 'arrow-down'} 
                  size={12} 
                  color="#fff" 
                />
                <Text style={styles.changeText}>{formatChange(data.comparison.income.change)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Category Breakdown</Text>
          {data.currentMonth.categories.slice(0, 5).map((category, index) => (
            <View key={index} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>
                  {category.percent}%
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.inputBorder }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: colors.primary, 
                      width: `${Math.min(parseFloat(category.percent), 100)}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.categoryAmount, { color: colors.text }]}>
                {formatCurrency(category.amount)}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Spending Trend</Text>
          <View style={styles.trendContainer}>
            {data.trend.map((point, index) => {
              const maxTotal = Math.max(...data.trend.map(t => t.total));
              const height = maxTotal > 0 ? (point.total / maxTotal) * 100 : 0;
              return (
                <View key={index} style={styles.trendBar}>
                  <View style={[styles.trendBarFill, { backgroundColor: colors.primary, height: `${height}%` }]} />
                  <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>
                    {point.month.slice(5)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {data.insights.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Insights</Text>
            {data.insights.map((insight, index) => (
              <View 
                key={index} 
                style={[
                  styles.insightCard, 
                  { 
                    backgroundColor: 
                      insight.type === 'success' ? colors.income + '20' :
                      insight.type === 'warning' ? colors.expense + '20' :
                      colors.primary + '20'
                  }
                ]}
              >
                <Ionicons 
                  name={
                    insight.type === 'success' ? 'checkmark-circle' :
                    insight.type === 'warning' ? 'warning' : 'information-circle'
                  } 
                  size={20} 
                  color={
                    insight.type === 'success' ? colors.income :
                    insight.type === 'warning' ? colors.expense : colors.primary
                  } 
                />
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title}</Text>
                  <Text style={[styles.insightText, { color: colors.textSecondary }]}>{insight.text}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 16, paddingBottom: 8 },
  card: { margin: 16, marginTop: 8, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  comparisonRow: { flexDirection: 'row', justifyContent: 'space-around' },
  comparisonItem: { alignItems: 'center' },
  comparisonLabel: { fontSize: 12, marginBottom: 4 },
  comparisonValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  changeText: { color: '#fff', fontSize: 12, fontWeight: '500', marginLeft: 2 },
  categoryRow: { marginBottom: 12 },
  categoryInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryName: { fontSize: 14 },
  categoryPercent: { fontSize: 12 },
  progressBar: { height: 6, borderRadius: 3, marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 3 },
  categoryAmount: { fontSize: 12, textAlign: 'right' },
  trendContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 },
  trendBar: { alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  trendBarFill: { width: 24, borderRadius: 4 },
  trendLabel: { fontSize: 10, marginTop: 4 },
  insightCard: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 8 },
  insightContent: { marginLeft: 12, flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '600' },
  insightText: { fontSize: 12, marginTop: 2 },
});
