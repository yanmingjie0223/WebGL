/*
 * @Author: yanmingjie0223@qq.com
 * @Date: 2019-05-28 16:37:08
 * @Last Modified by:   yanmingjie0223@qq.com
 * @Last Modified time: 2019-05-28 16:37:08
 */
class Utils {

    /**
     * canvas to webgl
     * @param canvas canvas context
     * @return webgl
     */
    public static getWebGLContext(canvas: HTMLCanvasElement) {
        return canvas.getContext('webgl');
    }

    /**
     * 根据shader文件初始化渲染器
     * @param gl
     * @param vsFileName
     * @param fsFileName
     * @param compileFn
     */
    public static initShadersFile(gl: WebGLRenderingContext, vsFileName: string, fsFileName: string, compileFn: Function, thisObj: any, args: any[]): void {
        let vs: string, fs: string;
        const onShader: Function = function() {
            if (vs && fs) {
                const program = Utils.initShaders(gl, vs, fs);
                if (!args) {
                    args = [];
                }
                args.splice(0, 0, program);
                if (program && compileFn) {
                    compileFn.apply(thisObj, args);
                }
            }
        }
        this.loadFromFile(vsFileName, (_vs: string) => {
            vs = _vs;
            onShader();
        });
        this.loadFromFile(fsFileName, (_fs: string) => {
            fs = _fs;
            onShader();
        });
    }

    /**
     * 初始化缓冲buffer数据，并绑定attribute变量
     * @param gl
     * @param program
     * @param data
     * @param num
     * @param type
     * @param attribute
     */
    public static initArrayBuffer(gl: WebGLRenderingContext, program: WebGLProgram, data: any, num: number, type: number, attribute: string): boolean {
        const buffer = gl.createBuffer();
        if (!buffer) {
            console.error("failed to create the buffer object!");
            return false;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        const a_attribute = gl.getAttribLocation(program, attribute);
        if (a_attribute < 0) {
            console.error("failed to get VSHADER_SOURCE attribute object!");
            return false;
        }

        gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
        gl.enableVertexAttribArray(a_attribute);

        return true;
    }

    /**
     * Create a program object and make current
     * @param gl GL context
     * @param vshader a vertex shader program (string)
     * @param fshader a fragment shader program (string)
     * @return WebGLProgram if the program object was created and successfully made current
     */
    public static initShaders(gl: WebGLRenderingContext, vshader: string, fshader: string): WebGLProgram {
        var program = this.createProgram(gl, vshader, fshader);
        if (!program) {
            console.error('无法创建程序对象');
            return false;
        }

        gl.useProgram(program);

        return program;
    }

    /**
     * Create the linked program object
     * @param gl GL context
     * @param vshader a vertex shader program (string)
     * @param fshader a fragment shader program (string)
     * @return created program object, or null if the creation has failed
     */
    public static createProgram(gl: WebGLRenderingContext, vshader: string, fshader: string) {
        // 创建着色器对象
        var vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vshader);
        var fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fshader);
        if (!vertexShader || !fragmentShader) {
            return null;
        }

        // 创建程序对象
        var program = gl.createProgram();
        if (!program) {
            return null;
        }

        // 为程序对象分配顶点着色器和片元着色器
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // 连接着色器
        gl.linkProgram(program);

        // 检查连接
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            var error = gl.getProgramInfoLog(program);
            console.error('无法连接程序对象: ' + error);
            gl.deleteProgram(program);
            gl.deleteShader(fragmentShader);
            gl.deleteShader(vertexShader);
            return null;
        }
        return program;
    }

    /**
     * 创建着色器对象
     * @param gl GL context
     * @param type the type of the shader object to be created
     * @param source shader program (string)
     * @return created shader object, or null if the creation has failed.
     */
    public static loadShader(gl: WebGLRenderingContext, type: number, source: string) {
        // 创建着色器对象
        var shader = gl.createShader(type);
        if (shader == null) {
            console.error('无法创建着色器');
            return null;
        }

        // 设置着色器源代码
        gl.shaderSource(shader, source);

        // 编译着色器
        gl.compileShader(shader);

        // 检查着色器的编译状态
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            var error = gl.getShaderInfoLog(shader);
            console.error('Failed to compile shader: ' + error);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    /**
     * 加载shader文件
     * @param fileName 文件名字
     * @param compileFn 完成加载回调函数
     */
    public static loadFromFile(fileName: string, compileFn: Function, thisObj?: any): void {
        const request: XMLHttpRequest = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState === 4 && request.status === 200) {
                compileFn && compileFn.apply(thisObj, [request.responseText, fileName]);
            }
            else if (request.status === 404) {
                compileFn && compileFn.apply(thisObj, [null, fileName]);
            }
        }
        request.open('GET', fileName);
        request.send();
    }

}
