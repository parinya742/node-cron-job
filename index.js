import express from "express";
import axios from "axios";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;
const API_URL = process.env.VITE_API_CHECK_ORDER;

// ฟังก์ชันตรวจสอบสถานะ Order
async function checkStatusOrder(orderId) {
    try {
        const order_id_remove_prefix = orderId.replace("ORDER-", "");
        const body = { jobno: order_id_remove_prefix };

        const response = await axios.post(API_URL, body);

        if (response.status === 200 && response.data) {
            const responseJson = response.data;
            if (responseJson.status) {
                console.log(`[SUCCESS] Order ${orderId} updated to status: ${responseJson.status}`);
                return responseJson;
            } else {
                throw new Error("API response ไม่ถูกต้อง");
            }
        } else {
            throw new Error("เชื่อมต่อ API ไม่สำเร็จ");
        }
    } catch (err) {
        console.error(`[ERROR] Order ${orderId} => ${err.message}`);
        return null;
    }
}

// === ตั้งเวลา Cron Jobs ===
cron.schedule("30 7 * * *", () => {
    console.log("⏰ Running cron job at 07:30");
    checkStatusOrder("ORDER-12345");
});

cron.schedule("0 12 * * *", () => {
    console.log("⏰ Running cron job at 12:00");
    checkStatusOrder("ORDER-12345");
});

cron.schedule("0 16 * * *", () => {
    console.log("⏰ Running cron job at 16:00");
    checkStatusOrder("ORDER-12345");
});

// ✅ Endpoint health check
app.get("/", (req, res) => {
    res.send("🚀 Node Cron Service is running...");
});

// ✅ Endpoint ให้ Laravel เรียกเช็คสถานะ
app.get("/check-status/:orderId", async (req, res) => {
    const { orderId } = req.params;
    console.log(`🔎 [Node] Laravel เรียก API => check status ${orderId}`);
    console.log(`🔎 API request => check status ${orderId}`);

    const result = await checkStatusOrder(orderId);

    if (result) {
        return res.json({
            status: "success",
            data: result,
        });
    } else {
        return res.status(400).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูลจาก API ได้",
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server started at http://127.0.0.1:${PORT}`);
});
