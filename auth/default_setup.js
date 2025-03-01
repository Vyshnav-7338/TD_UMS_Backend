const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const User = require("../models/User");

const saltRounds = 10;
const myRouter = express.Router();

myRouter.use(bodyParser.json());

myRouter.route('/')
    .all((req, res, next) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        next();
    })
    .get((req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /auth/seed');
    })
    .post(async (req, res, next) => {
        try {
            await insertDefaultUsers();
            res.send("Success");
        } catch (err) {
            console.error(err);
            res.status(500).send("Internal Server Error");
        }
    });

async function hashPassword(password) {
    return await bcrypt.hash(password, saltRounds);
}

async function insertDefaultUsers() {
    const defaultUsers = [
        // {
        //     name: "Super User",
        //     phone: "+917012336011",
        //     email: "su@hibye.com",
        //     password: "8A9x3p@!Wd8wvU%",
        //     role: "su"
        // },
        // {
        //     name: "Default admin",
        //     phone: "+918547069906",
        //     email: "admin@hibye.com",
        //     password: "458GdQz!jnu2NPE",
        //     role: "admin"
        // },
        {
            name: 'Admin Point',
            phone: '+91854706999',
            email: 'admin@hibyepoints',
            password: "NcHBALdOrimphysEp",
            role: 'superCoinAdmin',
            corePoints: 1000000000 
        },
        {
            name: 'Referral Admin',
            phone: '+91854706990',
            email: 'refferadmin@hibye.com',
            password: "INAcReGrANvoUrEYE",
            role: 'refferAdmin',
            corePoints: 0
        },
        {
            name: 'Store Admin',
            phone: '+91854706991',
            email: 'storeadmin@hibye.com',
            password: "12345",
            role: 'partAdmin',
            corePoints: 0
        },
        {
            name: 'Hibye Admin',
            phone: '+91854706992',
            email: 'hibyeadmin@hibye.com',
            password: "12345",
            role: 'partAdmin',
            corePoints: 0
        },
        {
            name: 'Developer Admin',
            phone: '+91854706993',
            email: 'developeradmin@hibye.com',
            password: "12345",
            role: 'partAdmin',
            corePoints: 0
        },
        {
            name: 'Royalty Admin',
            phone: '+91854706994',
            email: 'royaltyadmin@hibye.com',
            password: "12345",
            role: 'partAdmin',
            corePoints: 0
        }
    ];

    for (const user of defaultUsers) {
        user.password = await hashPassword(user.password);
        const newUser = new User(user);
        await newUser.save();
    }
}

module.exports = myRouter;
