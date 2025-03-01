const express = require("express");
const myRouter = express.Router();
const bodyParser = require("body-parser");
const App = require("../models/App_Version");
myRouter.use(bodyParser.json());

myRouter.post(`/app-version`, async (req, res) => {
    try {
        const app_version = req.body.app_version;
        console.log(req.body.app_version)
        const app = await App.findOneAndUpdate({}, { app_version }, { new: true, upsert: true });
        res.json(app);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
myRouter.get(`/app-version`, async (req, res) => {
    try {
        const app = await App.findOne();
        if (!app) {
            return res.status(404).json({ error: "App version not found" });
        }
        res.json({ app_version: app.app_version });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
module.exports = myRouter;