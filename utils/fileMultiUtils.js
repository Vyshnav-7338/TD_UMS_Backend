const sharp = require('sharp');
const randomstring = require('randomstring');
const config = require('../config');
const fs = require('fs');

let cdndir;
const cdndirConfig = config.live ? config.cdndir_live : config.cdndir_local;

async function getFileObject(files) {
    console.log(files);
    cdndir = cdndirConfig;

    const generatedFiles = await Promise.all(files.map(async (fileItem) => {
        const genName = randomstring.generate() + '_' + fileItem.name;

        // STORE FILE IN SERVER
        await fileItem.mv(cdndir + genName);

        const extension = fileItem.name.split('.')[fileItem.name.split('.').length - 1];

        // GENERATE IMAGE THUMBNAIL
        if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'mp4') {
            const thumbname = cdndir + 'thumb/' + 'thumb-' + genName;
            await sharp(fileItem.data)
                .rotate()
                .resize({ width: 200, height: 200 })
                .png({ quality: 50 })
                .toFile(thumbname)
                .catch((e) => {
                    console.log(e);
                });
        }

        // SAVE TO DATABASE
        const myobj = {
            name: genName,
            thumb: '/thumb/thumb-' + genName,
            size: fileItem.size,
            mime: fileItem.mimetype,
            md5: fileItem.md5,
            orgname: fileItem.originalname,
        };

        return myobj;
    }));

    return generatedFiles;
}

module.exports = { getFileObject };
