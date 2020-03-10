const path = require("path");
const multiparty = require("multiparty");

const UPLOAD_DIR = path.resolve(__dirname, "..", "target");

const resolvePost = req => {
    return new Promise(resolve => {
        let chunk = "";
        req.on("data", data => {
            console.log("data", data);
            chunk += data;
        });
        req.on("end", () => {
            resolve(JSON.parse(chunk));
        });
    });
};

module.export = class {
    async handleMerge(req) {
        let data = await resolvePost(req);
    }
};
