const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
var auth = require("../auth/authenticate");
const moment = require("moment");
const router = express.Router();

router.get("/create-default-admin", async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      return res.status(400).json({ message: "Admin user already exists" });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const defaultAdmin = new User({
      email: "admin@example.com",
      name: "Admin User",
      phone: "1234567890",
      address: "Admin Address",
      password: 'admin123',
      role: "admin",
      status: "active",
    });

    await defaultAdmin.save();

    res.status(201).json({ message: "Default admin user created successfully" });
  } catch (error) {
    console.error("Error creating default admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/get-userList", auth.verifyUser, async (req, res) => {
  try {
    const storeAdmin = req.user.id;
    const userList = await User.find({ StoreAdmin: storeAdmin });

    res.status(200).json({ success: true, data: userList });
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.get("/api/users/stats", auth.verifyUser, async (req, res) => {
  try {
   
    const storeAdmin = req.user.id;

    const users = await User.find({ StoreAdmin: storeAdmin }, "createdAt status");

    const totalUsers = users.length;
    const today = new Date().setHours(0, 0, 0, 0);

    const newUsersToday = users.filter(user => new Date(user.createdAt).setHours(0, 0, 0, 0) === today).length;
    const activeUsers = users.filter(user => user.status === "active").length;

    res.json({ totalUsers, newUsersToday, activeUsers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user stats", error });
  }
});


router.get("/api/users/growth", auth.verifyUser, async (req, res) => {
  try {
    const storeAdmin = req.user.id;

    if (!storeAdmin) {
      return res.status(400).json({ message: "storeAdmin is required" });
    }

    const users = await User.find({ StoreAdmin: storeAdmin });


    if (users.length === 0) {
      return res.status(200).json([]); 
    }
    const userGrowth = await User.aggregate([
      {
        $match: { StoreAdmin: storeAdmin } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 } 
      },
      {
        $project: {
          _id: 0,
          month: {
            $dateToString: { format: "%Y-%m", date: { $dateFromParts: { year: "$_id.year", month: "$_id.month", day: 1 } } }
          }, 
          users: "$count"
        }
      }
    ]);

    if (userGrowth.length === 0) {

      const userGrowthFallback = users.reduce((acc, user) => {
        const month = moment(user.createdAt).format("MMM");
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const formattedData = Object.keys(userGrowthFallback).map((month) => ({
        month,
        users: userGrowthFallback[month]
      }));

      return res.status(200).json(formattedData);
    }

    const formattedData = userGrowth.map((item) => ({
      month: moment(item.month, "YYYY-MM").format("MMM"), 
      users: item.users
    }));
    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error fetching user growth:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/api/users/:id", auth.verifyUser, async (req, res) => {
  try {
    const id = req.params.id;
    const userList = await User.findById(id);

    res.status(200).json({ success: true, data: userList });
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.delete("/api/users/:id", auth.verifyUser, async (req, res) => {
  try {
    const id = req.params.id;
     await User.findByIdAndDelete(id);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.get("/api/user/profile", auth.verifyUser, async (req, res) => {
  try {
    console.log(req.user.id)
    const user = await User.findById(req.user.id); 
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


//EDIT PROFILE
router.put(
  '/api/user/profile/:id',
  auth.verifyUser,
  async (req, res, next) => {
    console.log('EDIT PROFILE CALLED');
    console.log(req.params.id);

    try {
      let body = req.body;
      let files = req.files;

      console.log(files)

      if (files != null) {
        if (files['photo'] != null) {
          body['photo'] = await futils.getFileObject(files['photo']);
        }
      }

      const user = await User.findOne({ _id: req.params.id });
      console.log(req.params.id);

      if (user) {
        const updatedUser = await user.updateOne(body);
        res.send(updatedUser);
      } else {
        res.status(404).send('User not found');
      }
    } catch (err) {
      console.error('Error in edit profile route:', err);
      res.status(500).send('Internal server error');
    }
  }
);

router.get("/api/users/stocks",auth.verifyUser, async (req, res) => {
  try {
    const { userId } = req.user.id;
    const user = await User.findById(userId)
      .populate("addedStocks.productId", "name price description")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ addedStocks: user.addedStocks });
  } catch (error) {
    console.error("Error fetching added stocks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
