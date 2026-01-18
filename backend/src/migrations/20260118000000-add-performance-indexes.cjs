'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Index for expense date-range queries (most common query pattern)
        await queryInterface.addIndex('expenses', ['user_id', 'created_at'], {
            name: 'idx_expenses_user_date',
        });

        // Index for budget calculations (category spending queries)
        await queryInterface.addIndex('expenses', ['user_id', 'category_id', 'type'], {
            name: 'idx_expenses_user_category_type',
        });

        // Index for monthly expense aggregations
        await queryInterface.addIndex('expenses', ['user_id', 'type', 'created_at'], {
            name: 'idx_expenses_user_type_date',
        });

        // Index for job status lookups
        await queryInterface.addIndex('jobs', ['user_id', 'status'], {
            name: 'idx_jobs_user_status',
        });

        // Index for budget lookups by user and period
        await queryInterface.addIndex('budgets', ['user_id', 'period'], {
            name: 'idx_budgets_user_period',
        });

        // Index for goal queries
        await queryInterface.addIndex('goals', ['user_id', 'status'], {
            name: 'idx_goals_user_status',
        });

        // Index for bill reminders
        await queryInterface.addIndex('Bills', ['userId', 'isActive', 'isPaid'], {
            name: 'idx_bills_user_active_paid',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('expenses', 'idx_expenses_user_date');
        await queryInterface.removeIndex('expenses', 'idx_expenses_user_category_type');
        await queryInterface.removeIndex('expenses', 'idx_expenses_user_type_date');
        await queryInterface.removeIndex('jobs', 'idx_jobs_user_status');
        await queryInterface.removeIndex('budgets', 'idx_budgets_user_period');
        await queryInterface.removeIndex('goals', 'idx_goals_user_status');
        await queryInterface.removeIndex('Bills', 'idx_bills_user_active_paid');
    }
};
