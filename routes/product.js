const express = require("express");
const futils = require("../utils/fileutils");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
var auth = require("../auth/authenticate");
const moment = require("moment");
const router = express.Router();

router.post("/api/products", auth.verifyUser, async (req, res) => {
    try {
        const { name, price, stock } = req.body;
        const files = req.files || {};

        console.log("Received Data:", req.body);
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized: User ID is missing" });
        }
        const StoreAdmin = req.user.id;

        if (!name || typeof name !== "string") {
            return res.status(400).json({ message: "Invalid product name" });
        }

        const numericPrice = Number(price);
        const numericStock = Number(stock);

        if (isNaN(numericPrice) || numericPrice < 0) {
            return res.status(400).json({ message: "Invalid price value" });
        }
        if (isNaN(numericStock) || numericStock < 0) {
            return res.status(400).json({ message: "Invalid stock quantity" });
        }

        const image = await futils.getFileObject(files["image"]);

        let productId;
        let isUnique = false;

        while (!isUnique) {
            productId = Math.floor(100000 + Math.random() * 900000);

            const existingProduct = await Product.findOne({ productId });
            if (!existingProduct) {
                isUnique = true;
            }
        }

        const newProduct = new Product({
            productId,
            name,
            price: numericPrice,
            stock: numericStock,
            StoreAdmin,
            image
        });

        await newProduct.save();
        res.status(201).json({ message: "Product added successfully", productId });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


router.get("/api/products", auth.verifyUser, async (req, res) => {
    try {
        const StoreAdmin = req.user.id

        const products = await Product.find({ StoreAdmin });

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

router.get("/api/products/:id", auth.verifyUser, async (req, res) => {
    try {
        const id = req.params.id

        const products = await Product.findById(id);

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

router.put("/updateStock/admin/:productId", async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) return res.status(400).json({ message: "Invalid stock quantity" });

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        product.stock += quantity;
        await product.save();

        res.json({ message: "Stock updated by admin", product });
    } catch (error) {
        res.status(500).json({ message: "Error updating stock", error });
    }
});

router.put("/updateStock/user/:productId", async (req, res) => {
    const { productId } = req.params;
    const { quantity, userCode } = req.body;

    if (quantity <= 0) return res.status(400).json({ message: "Invalid stock quantity" });

    try {
        const product = await Product.findById(productId);
        const user = await User.findOne({ referenceCode: userCode });

        if (!product || !user) return res.status(404).json({ message: "Product or user not found" });

        product.userStock += quantity;
        product.stock += quantity;

        product.stockAddedByUsers.push({ userId: user._id, quantity });
        user.addedStocks.push({ productId, quantity });

        await product.save();
        await user.save();

        res.json({ message: "Stock added by user", product, user });
    } catch (error) {
        res.status(500).json({ message: "Error updating stock", error });
    }
});

router.get("/api/products/fetch/stats", auth.verifyUser, async (req, res) => {
    try {
        console.log("Fetching product stats for user:", req.user.id);

        const totalProducts = await Product.countDocuments({ StoreAdmin: req.user.id });
        const lowStock = await Product.countDocuments({ StoreAdmin: req.user.id, stock: { $lt: 10 } });
        console.log(totalProducts)
        res.json({ totalProducts, lowStock });
    } catch (error) {
        console.error("Error fetching product stats:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

router.get("/api/users/:userId/remain-stock", async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const products = await Product.find({
            "stockAddedByUsers.userId": userId,
        }).select("name productId price stockAddedByUsers");

        const userStock = products.map((product) => ({
            productId: product.productId,
            name: product.name,
            price: product.price,
            stockAddedByUsers: product.stockAddedByUsers.map((entry) => ({
                userId: entry.userId,
                quantity: entry.quantity,
                addedAt: entry.addedAt,
            })),
        }));

        res.json({ userStock });
    } catch (error) {
        console.error("Error fetching user stock:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.post("/create-order", auth.verifyUser, async (req, res) => {
    try {
        const { userId, referralUserName, items, paymentMethod, totalAmount } = req.body;

        const orderItems = [];
        for (const item of items) {
            const product = await Product.findOne({ _id: item.productId });

            if (!product) return res.status(404).json({ message: "Product not found" });

            let stockDeducted = false;

            if (referralUserName) {
                let remainingQuantity = item.quantity;
            
                const sortedStockUsers = product.stockAddedByUsers
                    .filter(entry => entry.userId.toString() === userId && entry.quantity > 0)
                    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
            
                for (const stockEntry of sortedStockUsers) {
                    if (remainingQuantity <= 0) break;
            
                    const availableStock = stockEntry.quantity;
                    const deduction = Math.min(availableStock, remainingQuantity);
            
                    stockEntry.quantity -= deduction;
                    product.stock -= deduction;
                    product.userStock -= deduction;
                    remainingQuantity -= deduction;
                }
            }
            

            if (!stockDeducted) {
                if (product.stock < item.quantity) {
                    return res.status(400).json({ message: `Not enough stock for ${product.name}` });
                }
                product.stock -= item.quantity;
            }

            await product.save();
            orderItems.push({ productId: item.productId, quantity: item.quantity, price: item.price });
        }

        const order = new Order({
            userId,
            StoreAdmin: req.user.id,
            orderId: generateOrderId(),
            referralUserName,
            products: orderItems,
            paymentMethod,
            totalAmount,
        });

        await order.save();
        res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

const generateOrderId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let orderId = "ORD-";
    for (let i = 0; i < 6; i++) {
        orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return orderId;
};


router.get("/daily-orders", async (req, res) => {
    try {
        const startDate = moment().subtract(7, "days").startOf("day");
        const orders = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate.toDate() },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const dailyOrdersData = orders.map((order) => ({
            date: order._id,
            orders: order.orders,
        }));
        res.json(dailyOrdersData);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error", error });
    }
});

router.get("/api/orders", async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("userId", "name email")
            .populate("products.productId", "name");

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/api/orders/:id", async (req, res) => {
    try {
        console.log(req.params.id)
        const order = await Order.findById(req.params.id)
            .populate("userId", "name email")
            .populate("products.productId", "name");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        console.log(order)
        res.json(order);
    } catch (error) {

        res.status(500).json({ message: "Server error" });
    }
});

router.get("/api/order/stats", auth.verifyUser, async (req, res) => {
    try {
        const storeAdminId = req.user.id;
        const totalOrders = await Order.countDocuments({ StoreAdmin: storeAdminId });
        const completedOrders = await Order.countDocuments({ status: "completed", StoreAdmin: storeAdminId });

        const orders = await Order.find({ StoreAdmin: storeAdminId });
        let totalRevenueAgg = 0;
        for (const order of orders) {
            totalRevenueAgg += order.totalAmount;
        }
        console.log(totalRevenueAgg)

        const totalRevenue = totalRevenueAgg ? totalRevenueAgg : 0;

        res.json({
            totalOrders,
            completedOrders,
            totalRevenue: `₹${totalRevenue.toLocaleString()}`,
        });
    } catch (error) {
        console.error("Error fetching order stats:", error);
        res.status(500).json({ message: "Server error" });
    }
});
const mongoose = require("mongoose");

router.get("/product-sales", auth.verifyUser, async (req, res) => {
    try {
        const StoreAdmin = new mongoose.Types.ObjectId(req.user.id);

        const productSales = await Order.aggregate([
            { 
                $match: { 
                    StoreAdmin, 
                    products: { $exists: true, $ne: [] } 
                } 
            },
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.productId",
                    totalQuantity: { $sum: "$products.quantity" },
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    name: { $ifNull: ["$productDetails.name", "Unknown Product"] },
                    value: "$totalQuantity",
                },
            },
        ]);

        console.log("Aggregated Product Sales:", productSales);
        res.json(productSales);
    } catch (error) {
        console.error("Error fetching product sales:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/api/stats/dashboard", auth.verifyUser, async (req, res) => {
    try {
        const storeAdminId = req.user.id;

        const orders = await Order.find({ StoreAdmin: storeAdminId });
        let totalSales = 0;
        for (const order of orders) {
            totalSales += order.totalAmount;
        }
        console.log(totalSales)


        const totalProducts = await Product.countDocuments({ StoreAdmin: storeAdminId });

        const totalOrders = await Order.countDocuments({ StoreAdmin: storeAdminId });

        const totalUsers = await User.countDocuments({ StoreAdmin: storeAdminId, role: 'user' });

        const conversionRate = totalUsers ? ((totalOrders / totalUsers) * 100).toFixed(2) : 0;

        res.json({
            totalSales: totalSales ? `₹${totalSales.toFixed(2)}` : "₹0",
            totalUsers,
            totalProducts,
            conversionRate: `${conversionRate}%`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/api/sales/monthly-sales", auth.verifyUser, async (req, res) => {
    try {
        const storeAdminId = req.user.id;

        if (!storeAdminId) {
            return res.status(400).json({ error: "StoreAdmin ID is required" });
        }

        const orders = await Order.find({ StoreAdmin: storeAdminId });

        const salesData = {
            Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
            Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
        };

        orders.forEach(order => {
            const month = new Date(order.createdAt).toLocaleString("en-US", { month: "short" });
            if (salesData[month] !== undefined) {
                salesData[month] += order.totalAmount;
            }
        });

        const formattedSalesData = Object.keys(salesData).map(month => ({
            name: month,
            sales: salesData[month]
        }));
        res.json(formattedSalesData);
    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.get("/api/orders/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
  
      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
  
      const orders = await Order.find({ userId })
        .populate("products.productId", "name price") 
        .populate("StoreAdmin", "name email") 
        .select("orderId products totalAmount paymentMethod referralUserName status createdAt");
  
      res.json({ orders });
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  

module.exports = router;
