const http = require("http");
const path = require("path");
const multiparty = require("multiparty");
const fs = require("fs-extra");

const server = http.createServer();
const UPLOAD_DIR = path.resolve(__dirname, "..", "target");

const extractExt = filename =>
    filename.slice(filename.lastIndexOf("."), filename.length);

const resolvePost = req => {
    return new Promise(resolve => {
        let chunk = "";
        req.on("data", data => {
            chunk += data;
        });
        req.on("end", () => {
            console.log("chunk", chunk);
            resolve(JSON.parse(chunk));
        });
    });
};

const pipeStream = (path, writeStream) => {
    new Promise((resolve, reject) => {
        let frs = fs.createReadStream(path);
        frs.on("end", () => {
            resolve();
        });
        frs.pipe(writeStream);
    });
};
const mergePipe = async (finalPath, fileHash, size) => {
    // 文件切片存放的目录名
    let chunkDir = path.resolve(UPLOAD_DIR, fileHash);
    console.log("chunkDir", chunkDir);

    // 文件切片
    let chunkPaths = await fs.readdir(chunkDir);
    console.log("chunkPaths", chunkPaths);
    // 切片排序
    chunkPaths.sort((a, b) => {
        return a.split("-")[1] - b.split("-")[1];
    });
    console.log("chunkPaths", chunkPaths);

    await Promise.all(
        chunkPaths.map((_path, index) => {
            return pipeStream(
                path.resolve(chunkDir, _path),
                fs.createWriteStream(finalPath, {
                    start: index * size,
                    end: (index + 1) * size
                })
            );
        })
    );
};
server.on("request", async (req, res) => {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
        res.status = 200;
        res.end();
        return;
    }
    if (req.url == "/") {
        
        var form = new multiparty.Form({
            // uploadDir: UPLOAD_DIR // 指定文件存储目录
        });
        form.parse(req, async (err, fields, file) => {
            if (err) {
                console.log(err);

                res.status = 500;
                res.end({ msg: "process file chunk failed" });
                return;
            }
            console.log(fields);

            let [chunk] = file.chunk;
            let [filename] = fields.filename;
            let [hash] = fields.hash;
            let [fileHash] = fields.fileHash;

            // 各切片的名字xxxxx.png
            let filePath = path.resolve(
                UPLOAD_DIR,
                `${fileHash}${extractExt(filename)}`
            );
            console.log("filePath", filePath);

            // 存放各切片的目录
            const chunkDir = path.resolve(UPLOAD_DIR, hash);
            console.log("chunkDir", chunkDir);

            if (fs.existsSync(filePath)) {
                res.end({ msg: "file exist" });
                return;
            }

            // 切片目录不存在，创建切片目录
            if (!fs.existsSync(chunkDir)) {
                await fs.mkdir(chunkDir);
            }
            // chunk.path是临时文件切片
            await fs.move(chunk.path, path.resolve(chunkDir, fileHash));
            res.end(
                JSON.stringify({
                code: 1001,
                message: "received file chunk"
            }));
            console.log(file);
        });
    }
    if (req.url == "/merge") {
        let data = await resolvePost(req);

        let { filename, size, fileHash } = data;
        // 文件后缀
        let ext = extractExt(filename);
        let finalPath = path.resolve(UPLOAD_DIR, `${filename}`);
        await mergePipe(finalPath, fileHash, size);
        res.end(
            JSON.stringify({
                code: 1001,
                message: "file merged success"
            })
        );
    }
});

server.listen(3000, () => console.log("正在监听 3000 端口"));
