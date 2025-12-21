export const healthCheck = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "ExpenseEase API is working"
    });
};
