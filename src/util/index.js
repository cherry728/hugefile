import md5 from 'md5'
export const request = options => {
    let _options = Object.assign({
        url: "",
        method: "post",
        data: null,
        headers: {}
    }, options);
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open(_options.method, _options.url, true);
        Object.keys(_options.headers).forEach(key => {
            xhr.setRequestHeader(key, _options.headers[key]);
        });
        xhr.onreadystatechange = () => {
            console.log("state change", xhr.readyState);
            // if (xhr.readyState == 4) {
            //     if (/^2|3\d{2}$/.test(xhr.status)) {
            //         console.log(xhr.responseText);
            //         console.log(3);
            //         resolve(xhr.responseText);
            //         return;
            //     }
            //     reject(xhr);
            //     // cb && cb();
            // }
        };
        xhr.send(_options.data);
        xhr.onload = (e) => {
            console.log('onload', e);
            
            resolve({
                data: e.target.response
            });
        };
    });
};


export const formatFileName = filename => {
    let dotIndex = filename.lastIndexOf(".");
    let name = filename.slice(0, dotIndex);
    let extension = filename.slice(dotIndex + 1);
    name = md5(name) + new Date().getTime();
    return {
        hash: name,
        suffix: extension,
        filename: `${name}.${extension}`
    }
};
