import {
    getMonthlyReportData,
    generateCSV,
    getAvailablePeriods,
} from "../services/report.service.js";

/**
 * Get monthly report data as JSON
 */
export const getReportHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: "Year and month are required",
            });
        }

        const reportData = await getMonthlyReportData(
            userId,
            parseInt(year),
            parseInt(month)
        );

        return res.status(200).json({
            success: true,
            data: reportData,
        });
    } catch (error) {
        console.error("Report error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate report",
        });
    }
};

/**
 * Download report as CSV
 */
export const downloadCSVHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: "Year and month are required",
            });
        }

        const reportData = await getMonthlyReportData(
            userId,
            parseInt(year),
            parseInt(month)
        );
        const csv = generateCSV(reportData);

        const filename = `expense-report-${year}-${String(month).padStart(2, "0")}.csv`;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.send(csv);
    } catch (error) {
        console.error("CSV download error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to download report",
        });
    }
};

/**
 * Get available periods for reports
 */
export const getPeriodsHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const periods = await getAvailablePeriods(userId);

        return res.status(200).json({
            success: true,
            data: periods,
        });
    } catch (error) {
        console.error("Periods error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get available periods",
        });
    }
};
