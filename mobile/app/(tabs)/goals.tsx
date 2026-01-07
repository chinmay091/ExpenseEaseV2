import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  getGoals,
  createGoal,
  contributeToGoal,
  deleteGoal,
  Goal,
  CreateGoalPayload,
} from "@/api/goal.api";
import { useTheme } from "@/hooks/use-theme";

const GOAL_COLORS = [
  "#4F46E5", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
];

const GOAL_ICONS = ["🎯", "✈️", "🏠", "🚗", "💍", "🎓", "💻", "🏖️", "💰", "🎁"];

export default function GoalsScreen() {
  const { colors, isDark } = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Create goal modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGoal, setNewGoal] = useState<CreateGoalPayload>({
    name: "",
    targetAmount: 0,
    autoSavePercent: undefined,
    deadline: "",
    icon: "🎯",
    color: "#4F46E5",
  });

  // Contribute modal
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributeNote, setContributeNote] = useState("");

  const fetchGoals = async () => {
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (error) {
      console.error("Failed to fetch goals", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.name.trim()) {
      Alert.alert("Error", "Please enter a goal name");
      return;
    }
    if (!newGoal.targetAmount || newGoal.targetAmount <= 0) {
      Alert.alert("Error", "Please enter a valid target amount");
      return;
    }

    // Validate deadline format if provided
    let validDeadline: string | undefined = undefined;
    if (newGoal.deadline && newGoal.deadline.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(newGoal.deadline.trim())) {
        Alert.alert("Error", "Please enter deadline in YYYY-MM-DD format (e.g., 2025-12-31)");
        return;
      }
      const date = new Date(newGoal.deadline);
      if (isNaN(date.getTime())) {
        Alert.alert("Error", "Please enter a valid date");
        return;
      }
      validDeadline = newGoal.deadline.trim();
    }

    setCreating(true);
    try {
      await createGoal({
        name: newGoal.name.trim(),
        targetAmount: newGoal.targetAmount,
        autoSavePercent: newGoal.autoSavePercent || undefined,
        deadline: validDeadline,
        icon: newGoal.icon,
        color: newGoal.color,
      });
      setShowCreateModal(false);
      setNewGoal({
        name: "",
        targetAmount: 0,
        autoSavePercent: undefined,
        deadline: "",
        icon: "🎯",
        color: "#4F46E5",
      });
      await fetchGoals();
      Alert.alert("Success", "Goal created successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to create goal");
    } finally {
      setCreating(false);
    }
  };

  const handleContribute = async () => {
    const amount = parseFloat(contributeAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setContributing(true);
    try {
      await contributeToGoal(selectedGoal!.id, {
        amount,
        note: contributeNote || undefined,
      });
      setShowContributeModal(false);
      setContributeAmount("");
      setContributeNote("");
      setSelectedGoal(null);
      await fetchGoals();
      Alert.alert("Success", "Contribution added!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add contribution");
    } finally {
      setContributing(false);
    }
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      "Delete Goal",
      `Are you sure you want to delete "${goal.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
              await fetchGoals();
            } catch (error) {
              Alert.alert("Error", "Failed to delete goal");
            }
          },
        },
      ]
    );
  };

  const openContributeModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowContributeModal(true);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "#10B981";
    if (progress >= 75) return "#34D399";
    if (progress >= 50) return "#FBBF24";
    return "#3B82F6";
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const renderGoalCard = ({ item }: { item: Goal }) => {
    const progressColor = getProgressColor(item.progress);
    const isCompleted = item.status === "completed";

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderLeftColor: item.color, borderLeftWidth: 4 }]}
        onLongPress={() => handleDeleteGoal(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.goalTitleRow}>
            <Text style={styles.goalIcon}>{item.icon}</Text>
            <View style={styles.goalTitleContainer}>
              <Text style={[styles.goalName, { color: colors.text }]}>{item.name}</Text>
              {item.autoSavePercent && (
                <Text style={[styles.autoSaveTag, { color: colors.success }]}>
                  🔄 {item.autoSavePercent}% auto-save
                </Text>
              )}
            </View>
          </View>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓</Text>
            </View>
          )}
        </View>

        <View style={[styles.progressSection, { backgroundColor: colors.progressBg }]}>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(item.progress, 100)}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.text }]}>{item.progress.toFixed(1)}%</Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.currentAmount, { color: colors.text }]}>
            {formatCurrency(item.currentAmount)}
          </Text>
          <Text style={[styles.targetAmount, { color: colors.textSecondary }]}>
            / {formatCurrency(item.targetAmount)}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(item.remaining)}</Text>
          </View>
          {item.daysRemaining !== null && (
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Days Left</Text>
              <Text style={[styles.statValue, { color: colors.text }, item.daysRemaining < 30 && { color: colors.warning }]}>
                {item.daysRemaining}
              </Text>
            </View>
          )}
          {item.monthlyRequired && (
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Monthly Need</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(item.monthlyRequired)}
              </Text>
            </View>
          )}
        </View>

        {!isCompleted && (
          <TouchableOpacity
            style={[styles.contributeButton, { backgroundColor: item.color }]}
            onPress={() => openContributeModal(item)}
          >
            <Text style={styles.contributeButtonText}>+ Add Money</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Goals</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.tint }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={renderGoalCard}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>No goals yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Create your first savings goal and start tracking your progress
            </Text>
          </View>
        }
      />

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Goal</Text>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Goal Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
                placeholder="e.g., Goa Trip 2025"
                value={newGoal.name}
                onChangeText={(text) => setNewGoal({ ...newGoal, name: text })}
              />

              <Text style={styles.inputLabel}>Target Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="50000"
                keyboardType="numeric"
                value={newGoal.targetAmount ? String(newGoal.targetAmount) : ""}
                onChangeText={(text) =>
                  setNewGoal({ ...newGoal, targetAmount: parseFloat(text) || 0 })
                }
              />

              <Text style={styles.inputLabel}>Auto-Save % of Income (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                keyboardType="numeric"
                value={newGoal.autoSavePercent ? String(newGoal.autoSavePercent) : ""}
                onChangeText={(text) =>
                  setNewGoal({
                    ...newGoal,
                    autoSavePercent: parseFloat(text) || undefined,
                  })
                }
              />
              <Text style={styles.helperText}>
                When you add income, this % will be auto-saved to this goal
              </Text>

              <Text style={styles.inputLabel}>Deadline (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={newGoal.deadline}
                onChangeText={(text) => setNewGoal({ ...newGoal, deadline: text })}
              />

              <Text style={styles.inputLabel}>Icon</Text>
              <View style={styles.iconRow}>
                {GOAL_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      newGoal.icon === icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setNewGoal({ ...newGoal, icon })}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorRow}>
                {GOAL_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newGoal.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewGoal({ ...newGoal, color })}
                  />
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, creating && styles.buttonDisabled]}
                  onPress={handleCreateGoal}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Goal</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        visible={showContributeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContributeModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add to {selectedGoal?.icon} {selectedGoal?.name}
            </Text>

            <Text style={styles.inputLabel}>Amount (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="5000"
              keyboardType="numeric"
              value={contributeAmount}
              onChangeText={setContributeAmount}
            />

            <Text style={styles.inputLabel}>Note (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Birthday gift money"
              value={contributeNote}
              onChangeText={setContributeNote}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowContributeModal(false);
                  setContributeAmount("");
                  setContributeNote("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, contributing && styles.buttonDisabled]}
                onPress={handleContribute}
                disabled={contributing}
              >
                {contributing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Money</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
    color: "#11181C",
  },
  createButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  goalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  goalIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#11181C",
  },
  autoSaveTag: {
    fontSize: 12,
    color: "#10B981",
    marginTop: 2,
  },
  completedBadge: {
    backgroundColor: "#10B981",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  completedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  progressContainer: {
    flex: 1,
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    overflow: "hidden",
    marginRight: 12,
  },
  progressBar: {
    height: "100%",
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#687076",
    width: 50,
    textAlign: "right",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#11181C",
  },
  targetAmount: {
    fontSize: 16,
    color: "#687076",
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#687076",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#11181C",
  },
  urgent: {
    color: "#EF4444",
  },
  contributeButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  contributeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#687076",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#11181C",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#11181C",
  },
  helperText: {
    fontSize: 12,
    color: "#687076",
    marginTop: 4,
  },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  iconOptionSelected: {
    backgroundColor: "#E0E7FF",
    borderWidth: 2,
    borderColor: "#4F46E5",
  },
  iconText: {
    fontSize: 24,
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#11181C",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#687076",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    backgroundColor: "#888",
  },
});
