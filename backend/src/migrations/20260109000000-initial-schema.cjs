'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Users table
        await queryInterface.createTable('Users', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Categories table
        await queryInterface.createTable('Categories', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            icon: {
                type: Sequelize.STRING,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Expenses table
        await queryInterface.createTable('Expenses', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            description: {
                type: Sequelize.STRING,
            },
            merchant: {
                type: Sequelize.STRING,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            type: {
                type: Sequelize.ENUM('expense', 'income'),
                allowNull: false,
                defaultValue: 'expense',
            },
            isDeleted: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            categoryId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Categories',
                    key: 'id',
                },
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Budgets table
        await queryInterface.createTable('Budgets', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            spent: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
            },
            month: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            year: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            explanation: {
                type: Sequelize.TEXT,
            },
            isAIGenerated: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            categoryId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Categories',
                    key: 'id',
                },
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // RefreshTokens table
        await queryInterface.createTable('RefreshTokens', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            token: {
                type: Sequelize.STRING(500),
                allowNull: false,
            },
            expiresAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Goals table
        await queryInterface.createTable('Goals', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            targetAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            currentAmount: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
            },
            deadline: {
                type: Sequelize.DATEONLY,
            },
            autoContribute: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            autoContributePercent: {
                type: Sequelize.DECIMAL(5, 2),
                defaultValue: 0,
            },
            status: {
                type: Sequelize.ENUM('active', 'completed', 'cancelled'),
                defaultValue: 'active',
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // GoalContributions table
        await queryInterface.createTable('GoalContributions', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            source: {
                type: Sequelize.ENUM('manual', 'auto'),
                defaultValue: 'manual',
            },
            goalId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Goals',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            expenseId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Expenses',
                    key: 'id',
                },
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Devices table
        await queryInterface.createTable('Devices', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            token: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            platform: {
                type: Sequelize.STRING,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Bills table
        await queryInterface.createTable('Bills', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            dueDay: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            isRecurring: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            reminderDays: {
                type: Sequelize.INTEGER,
                defaultValue: 3,
            },
            isPaid: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            lastPaidDate: {
                type: Sequelize.DATEONLY,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            categoryId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Categories',
                    key: 'id',
                },
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Groups table
        await queryInterface.createTable('Groups', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.STRING,
            },
            createdById: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // GroupMembers table
        await queryInterface.createTable('GroupMembers', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            groupId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Groups',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Users',
                    key: 'id',
                },
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
            },
            balance: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // GroupExpenses table
        await queryInterface.createTable('GroupExpenses', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            description: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            paidById: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'GroupMembers',
                    key: 'id',
                },
            },
            groupId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Groups',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Splits table
        await queryInterface.createTable('Splits', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            memberId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'GroupMembers',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            expenseId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'GroupExpenses',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Add indexes
        await queryInterface.addIndex('Expenses', ['userId']);
        await queryInterface.addIndex('Expenses', ['date']);
        await queryInterface.addIndex('Expenses', ['categoryId']);
        await queryInterface.addIndex('Budgets', ['userId', 'month', 'year']);
        await queryInterface.addIndex('RefreshTokens', ['token']);
        await queryInterface.addIndex('RefreshTokens', ['userId']);
        await queryInterface.addIndex('Goals', ['userId']);
        await queryInterface.addIndex('Devices', ['userId']);
        await queryInterface.addIndex('Bills', ['userId']);
        await queryInterface.addIndex('GroupMembers', ['groupId']);
    },

    async down(queryInterface, Sequelize) {
        // Drop tables in reverse order (respecting foreign key constraints)
        await queryInterface.dropTable('Splits');
        await queryInterface.dropTable('GroupExpenses');
        await queryInterface.dropTable('GroupMembers');
        await queryInterface.dropTable('Groups');
        await queryInterface.dropTable('Bills');
        await queryInterface.dropTable('Devices');
        await queryInterface.dropTable('GoalContributions');
        await queryInterface.dropTable('Goals');
        await queryInterface.dropTable('RefreshTokens');
        await queryInterface.dropTable('Budgets');
        await queryInterface.dropTable('Expenses');
        await queryInterface.dropTable('Categories');
        await queryInterface.dropTable('Users');
    },
};
