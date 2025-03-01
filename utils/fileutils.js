const sharp = require('sharp');
var randomstring = require("randomstring");
var config = require("../config")
var fs = require('fs');


var cdnurl;
async function getFileObject(file) {
    //
    cdndir = config.live ? config.cdndir_live : config.cdndir_local
    //
    var genName = randomstring.generate() + "_" + file.name;
    //STORE FILE IN SERVER
    await file.mv(cdndir + genName);
    //
    var extension = file.name.split('.')[file.name.split('.').length - 1]
    //GENERATE IMAGE THUMBNAIL
    if (extension == "jpg" || extension == "jpeg" || extension == "png" || extension == "mp4"|| extension == "mp3" || extension == "pdf"|| extension == "doc"|| extension == "docx") {
        var thumbname = cdndir + "thumb/" + "thumb-" + genName;
        await sharp(file.data).rotate().resize({ width: 200, height: 200 }).
            png({ quality: 50 }).toFile(thumbname).catch((e) => {
                console.log(e)
            })
    }

    //SAVE TO DATABASE
    var myobj = {
        name: genName,
        thumb: "/thumb/thumb-" + genName, size: file.size,
        mime: file.mimetype,
        md5: file.md5,
        orgname: file.originalname
    };
    return myobj;
}

module.exports = { getFileObject };
