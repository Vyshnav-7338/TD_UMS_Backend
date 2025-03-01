//SortUtils - v0.1a
/*
	Utility file for implementing user defined sorting in mongodb collection
	Developed by CleanKod
//=========== proprietary lisence ===========
	This file is a part of a software purchased from Cleankod
	Once purchased, you can use it any projects you owned.
	Selling and redistribution of this item in any market place
	is prohibited
//===========================================
*/
const SortOrder = require("../models/SortOrder")

module.exports.postItem = async function (collname, key, docid, filter) {
	const doc = await SortOrder.findOne({ name: key });
	if (doc == null) {
		var dec = new SortOrder({ name: key, vals: ["default", docid.toString()] })
		await dec.save();
		await updateMainCollSortPos(collname, key, filter)
	}
	else {
		doc.vals.push(docid.toString());
		await doc.save();
		await updateMainCollSortPos(collname, key, filter)
	}
}
module.exports.deleteItem = async function (collname, key, docid, filter) {
	const doc = await SortOrder.findOne({ name: key });
	await doc.vals.pull(docid);
	await doc.save();
	await updateMainCollSortPos(collname, key, filter)
}
//Change order of single item to another postion
module.exports.changeOrder = async function (collname, key, docid, pos, filter) {
	const doc = await SortOrder.findOne({ name: key });
	await doc.vals.pull(docid); //removes element 
	//reinsert to required position
	await doc.vals.push({ $each: [docid], $position: pos });
	//
	var result = await doc.save().catch((err) => {
		console.log(err)
		res.status(500).send(err); return;
	})
	if (result != null) {
		await updateMainCollSortPos(collname, key, filter)
		return true;
	}
	else return false;
}
/*
//This resets the array with new values provided by user
//Useful for drag and rearrange many items in frontend, then save at the end
//Already implemented in this project (See flutter code)
CAUTION: Since it resets all values, you should first fetch the array of ids from main collection
then make changes then call this api
*/
module.exports.changeOrderAll = async function (collname, key, vals, filter) {
	var ivals = []; ivals = vals;
	ivals.unshift("default")
	//check length first before modify (to ensure all ids are included in input array)
	const doc = await SortOrder.findOne({ name: key });
	var currlen = doc.vals.length;
	if (ivals.length == currlen) {
		await doc.updateOne({ "vals": ivals });
		await updateMainCollSortPos(collname, key, filter)
		return true
	}
	else {
		return false
	}
}

/*
	This function changes value of sortpos in all documents
	based on index of document id in sorting array(Inside sort_orders collection)
*/
async function updateMainCollSortPos(collname, key, filter) {
	if (filter == null) filter = {}
	//console.log(`========== upo called =============`)
	//console.log("filter:"+JSON.stringify(filter))
	//console.log("collanme:"+collname)
	//console.log("key:"+key)
	const sdoc = await SortOrder.findOne({ name: key });//document contains sort array of specified key
	const post = await SortOrder.db.collection(collname).find(filter).toArray();
	//console.log(post)
	post.forEach(async (val) => {
		//
		var indo = await sdoc.vals.indexOf(val._id);
		//console.log(indo)
		//
		SortOrder.db.collection(collname).updateOne(
			{ _id: val._id },
			{ $set: { sortpos: indo } },
			function (err, numberAffected) {
				//console.log(err)
				//console.log(numberAffected)
			});
	})
}