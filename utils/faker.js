const express = require('express');
const bodyParser = require('body-parser');
const myRouter = express.Router();
var auth = require('../auth/authenticate');
const Pro = require("../models/Product");
//
var faker = require('faker');
const { ObjectId } = require('bson');
//
myRouter.use(bodyParser.json());
//
myRouter.post("/product", auth.verifyUser, async (req, res) => {
    var params = req.body;

    //
    var myarr = [];
    for (var i = 1; i <= params.count; i++) {
        myobj = {
            active: faker.random.arrayElement([true, false]),
            free_delivery: faker.random.arrayElement([true, false]),
            fast_delivery: faker.random.arrayElement([true, false]),
            parent_id: null,
            name: faker.commerce.productName(),
            product_id: faker.random.alphaNumeric(10),
            stock: 100,
            weight: 1,
            price: faker.datatype.float(),
            offer_price: faker.datatype.float(),
            description: faker.lorem.paragraph(50),
            short_description: faker.lorem.paragraph(20),
            "category_id": ObjectId(params.category_id),
        }
        if (params.sub_category_id != null) myobj["sub_category_id"] = ObjectId(params.sub_category_id)
        myarr.push(myobj)
    }
    //
    const pro = new Pro();
    await pro.collection.insertMany(myarr).catch((err) => {
        console.log(err)
        res.status(500).send(err); return;
    }).then(async (val) => {
        res.send(val);
    });
    /*
    await pro.save().catch((err)=>{
        console.log(err)
        res.status(500).send(err);return;
    }).then(async (val)=>{
        res.send(val);
    })*/
})
//
module.exports = myRouter