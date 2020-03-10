<template>
    <div id="app">
        <!-- <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
        <router-view />-->
        <input type="file" @change="handleChange" />
        <button @click="handleUpload">上传</button>
    </div>
</template>
<script>
const SIZE = 10 * 1024 * 1024;
import { request, formatFileName } from "./util/index";
export default {
    data() {
        return {
            file: null,
            data: [],
            fileHash: ""
        };
    },
    methods: {
        handleChange(e) {
            let [file] = e.target.files;
            this.file = file;
        },
        async handleUpload() {
            if (!this.file) return;
            const fileChunk = this.createFileChunk(this.file, SIZE);
            let fileNameHash = formatFileName(this.file.name).hash;
            this.fileHash = fileNameHash;

            this.data = fileChunk.map(({ file }, index) => {
                return {
                    chunk: file,
                    fileHash: fileNameHash + "-" + index,
                    hash: fileNameHash,
                    size: file.size,
                    index
                };
            });

            await this.uploadFileChunks();
        },

        createFileChunk(file, size = SIZE) {
            let fileChunkList = [];
            const count = Math.ceil(file.size / size);
            let cur = 0;
            if (count > 1) {
                while (cur < file.size) {
                    fileChunkList.push({
                        file: file.slice(cur, cur + size)
                    });
                    cur += size;
                }
            } else {
                fileChunkList.push({ file: file.slice(0) });
            }

            return fileChunkList;
        },

        async uploadFileChunks() {
            let requestList = this.data
                .map(item => {
                    let formData = new FormData();
                    formData.append("chunk", item.chunk);
                    formData.append("hash", item.hash);
                    formData.append("filename", this.file.name);
                    formData.append("fileHash", item.fileHash);
                    return { formData };
                })
                .map(async ({ formData }) => {
                    return request({
                        url: "http://localhost:3000/",
                        data: formData
                    });
                });


            await Promise.all(requestList);
            
            if (requestList.length == this.data.length) {
                await this.mergeRequest();
            }
        },

        async mergeRequest() {
            request({
                url: "http://localhost:3000/merge",
                headers: {
                    "content-type": "application/json"
                },
                data: JSON.stringify({
                    filename: this.file.name,
                    size: SIZE,
                    fileHash: this.fileHash
                })
            });
        }
    }
};
</script>
<style lang="scss">
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}

#nav {
    padding: 30px;

    a {
        font-weight: bold;
        color: #2c3e50;

        &.router-link-exact-active {
            color: #42b983;
        }
    }
}
</style>
