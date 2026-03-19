const express = require('express');
const { Product, Order, Customer } = require("./models/model");
const connectDB = require("./config/db");
const app = express();

app.get('/', async (req, res) => {
    try {
        res.send({ message: 'Welcome to Practical Exam!' });
    } catch (error) {
        res.send({ error: error.message });
    }
});

app.get('/api/customers/:customerId/orders', async (req, res) => {
    try {
        const { customerId } = req.param;
        const customerFind = await Customer.findOne(customerId)
        const orders = await Order.find({ customer_id: customerFind._id })
            .select("_id order_date status items total_amount")
            .populate("items")
            .lean();
        if (!orders) {
            return res.status(404).json({ error: "No orders found for this customer" });
        }
        res.status(200).json(orders)

    } catch (error) {
        res.send({ error: error.message });
    }
});



connectDB();

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));