const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerSchema = new Schema(
    {
        name: {
            type: String
        },
        phone: {
            type: String
        },
        email: {
            type: String
        },
        address: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

const productSchema = new Schema(
    {
        name: {
            type: String
        },
        price: {
            type: Number
        },
        category: {
            type: String
        },
        stock: {
            type: Number
        }
    },
    {
        timestamps: true
    }
)

const orderSchema = new Schema(
    {
        customer_id: {
            type: Schema.Types.ObjectId,
            ref: "Customer"
        },
        items: [
            {
                type: {
                    product_id : Schema.Types.ObjectId,
                    quantity : Number,
                    price_at_order: Number,
                    total: Number
                },
                ref: "Product"
            }
        ],
        total_amount: {
            type: Number
        },
        payment_method: {
            type: String
        },
        status: {
            type: String
        },
        order_date: {
            type: Date
        }
    },
    {
        timestamps: true
    }
)

const Customer = mongoose.model("Customer", customerSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);

module.exports = {
    Customer,
    Product,
    Order
};