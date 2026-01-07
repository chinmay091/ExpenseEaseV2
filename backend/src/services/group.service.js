import { Group, GroupMember, GroupExpense, Split, User } from "../models/index.js";
import { sendPushNotification } from "./notification.service.js";
import { Op } from "sequelize";

export const createGroup = async ({ userId, name, description, icon }) => {
    const group = await Group.create({
        name,
        description: description || null,
        createdById: userId,
        icon: icon || "👥",
    });

    const user = await User.findByPk(userId);
    await GroupMember.create({
        groupId: group.id,
        userId,
        name: user.name || user.email,
        email: user.email,
        status: "joined",
    });

    return group;
};

export const getGroupsForUser = async (userId) => {
    const memberships = await GroupMember.findAll({
        where: { userId, status: "joined" },
        include: [
            {
                model: Group,
                where: { isActive: true },
                include: [
                    { model: GroupMember, as: "members", attributes: ["id", "name", "status", "balance"] },
                ],
            },
        ],
    });

    return memberships.map((m) => ({
        ...m.Group.toJSON(),
        myBalance: Number(m.balance),
    }));
};

export const getGroupById = async (groupId, userId) => {
    const group = await Group.findOne({
        where: { id: groupId, isActive: true },
        include: [
            {
                model: GroupMember,
                as: "members",
                include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
            },
            {
                model: GroupExpense,
                as: "expenses",
                include: [
                    { model: GroupMember, as: "paidBy", attributes: ["id", "name"] },
                    { model: Split, as: "splits" },
                ],
                order: [["createdAt", "DESC"]],
                limit: 50,
            },
        ],
    });

    if (!group) return null;

    const membership = await GroupMember.findOne({
        where: { groupId, userId },
    });

    if (!membership) return null;

    return {
        ...group.toJSON(),
        myMemberId: membership.id,
        myBalance: Number(membership.balance),
    };
};

export const addMember = async ({ groupId, userId, name, email, phone }) => {
    let member = await GroupMember.findOne({
        where: { groupId, [Op.or]: [{ email }, { phone }] },
    });

    if (member) {
        return { success: false, error: "MEMBER_EXISTS" };
    }

    let linkedUserId = null;
    if (email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            linkedUserId = existingUser.id;
        }
    }

    member = await GroupMember.create({
        groupId,
        userId: linkedUserId,
        name,
        email: email || null,
        phone: phone || null,
        status: linkedUserId ? "pending" : "joined",
    });

    if (linkedUserId) {
        const group = await Group.findByPk(groupId);
        await sendPushNotification(
            linkedUserId,
            "👥 Group Invite",
            `You've been invited to join "${group.name}"`,
            { type: "group_invite", groupId }
        );
    }

    return { success: true, member };
};

export const respondToInvite = async (userId, groupId, accept) => {
    const member = await GroupMember.findOne({
        where: { groupId, userId, status: "pending" },
    });

    if (!member) {
        return { success: false, error: "INVITE_NOT_FOUND" };
    }

    member.status = accept ? "joined" : "declined";
    await member.save();

    return { success: true, status: member.status };
};

export const addGroupExpense = async ({ groupId, paidById, amount, description, splitType, splits }) => {
    const members = await GroupMember.findAll({
        where: { groupId, status: "joined" },
    });

    if (members.length === 0) {
        return { success: false, error: "NO_MEMBERS" };
    }

    const expense = await GroupExpense.create({
        groupId,
        paidById,
        amount,
        description,
        splitType: splitType || "equal",
    });

    const splitRecords = [];

    if (splitType === "equal") {
        const splitAmount = amount / members.length;
        for (const member of members) {
            splitRecords.push(
                await Split.create({
                    groupExpenseId: expense.id,
                    memberId: member.id,
                    amount: splitAmount,
                    settled: member.id === paidById,
                })
            );
        }
    } else if (splits && splits.length > 0) {
        for (const s of splits) {
            splitRecords.push(
                await Split.create({
                    groupExpenseId: expense.id,
                    memberId: s.memberId,
                    amount: s.amount,
                    settled: s.memberId === paidById,
                })
            );
        }
    }

    await recalculateBalances(groupId, paidById, members, splitRecords);

    return { success: true, expense, splits: splitRecords };
};

const recalculateBalances = async (groupId, paidById, members, splits) => {
    for (const member of members) {
        const owed = splits
            .filter((s) => s.memberId === member.id && !s.settled)
            .reduce((sum, s) => sum + Number(s.amount), 0);

        const paid = splits
            .filter((s) => member.id === paidById)
            .reduce((sum, s) => sum + Number(s.amount), 0);

        member.balance = Number(member.balance) + paid - owed;
        await member.save();
    }
};

export const settleSplit = async (splitId, memberId) => {
    const split = await Split.findOne({
        where: { id: splitId, memberId, settled: false },
    });

    if (!split) {
        return { success: false, error: "SPLIT_NOT_FOUND" };
    }

    split.settled = true;
    split.settledAt = new Date();
    await split.save();

    const member = await GroupMember.findByPk(memberId);
    if (member) {
        member.balance = Number(member.balance) + Number(split.amount);
        await member.save();
    }

    return { success: true, split };
};

export const getBalances = async (groupId) => {
    const members = await GroupMember.findAll({
        where: { groupId, status: "joined" },
        attributes: ["id", "name", "balance"],
        order: [["balance", "DESC"]],
    });

    return members.map((m) => ({
        id: m.id,
        name: m.name,
        balance: Number(m.balance),
    }));
};

export const deleteGroup = async (groupId, userId) => {
    const group = await Group.findOne({
        where: { id: groupId, createdById: userId },
    });

    if (!group) {
        return { success: false, error: "NOT_OWNER" };
    }

    group.isActive = false;
    await group.save();

    return { success: true };
};
