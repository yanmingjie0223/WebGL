/*
 * @Author: yanmingjie0223@qq.com
 * @Date: 2019-05-23 10:16:15
 * @Last Modified by: yanmingjie0223@qq.com
 * @Last Modified time: 2019-05-28 17:32:09
 */
const g_viewMatrix: Matrix4 = new Matrix4();
const g_NormalMatrix: Matrix4 = new Matrix4();
// x,y旋转角度
const currAngle: Array<number> = [0.0, 0.0];
let program: WebGLProgram;
let tick: FrameRequestCallback;

function main(): void {
    const canvas = document.getElementById('webgl') as HTMLCanvasElement;
    const gl = Utils.getWebGLContext(canvas);
    if (!gl) {
        console.error("not found id context webgl!");
        return;
    }

    const vsFileName: string = 'res/shader/texc_vs.glsl';
    const fsFileName: string = 'res/shader/texc_fs.glsl';
    Utils.initShadersFile(gl, vsFileName, fsFileName, initShaderComplete, null, [gl, canvas]);
}

function initShaderComplete(pgm: WebGLProgram, gl: WebGLRenderingContext, canvas: HTMLCanvasElement): void {
    program = pgm;

    const u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
    const u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    const u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
    const u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
    const u_LightDirection = gl.getUniformLocation(program, 'u_LightDirection');
    const u_AmbientLightColor = gl.getUniformLocation(program, 'u_AmbientLightColor');
    const u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
    const u_FogColor = gl.getUniformLocation(program, 'u_FogColor');
    const u_FogDist = gl.getUniformLocation(program, 'u_FogDist');
    const u_Eye = gl.getUniformLocation(program, 'u_Eye');
    if (!u_MvpMatrix || !u_NormalMatrix || !u_LightColor ||
        !u_LightDirection || !u_AmbientLightColor || !u_Sampler ||
        u_MvpMatrix < 0 || u_NormalMatrix < 0 ||
        u_LightColor < 0 || u_LightDirection < 0 ||
        u_AmbientLightColor < 0 || u_Sampler < 0) {
        console.error("failed to get VSHADER_SOURCE attribute object!");
        return;
    }

    const triangleLen = initVertexBuffers(gl);
    if (triangleLen < 0) {
        console.error("failed to init buffers!");
        return;
    }

    const eye = new Float32Array([-16, 8, 8, 0.0]);
    const modelMatrix = new Matrix4();
    const mvpMatrix = new Matrix4();
    const normalMatrix = new Matrix4();
    const lightDirection = new Vector3([0.5, 3.0, 4.0]);

    // 设置背景
    gl.clearColor(0.2, 0.2, 0.4, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    // 光源/环境光设置
    lightDirection.normalize();
    gl.uniform3fv(u_LightDirection, lightDirection.elements);
    gl.uniform3f(u_AmbientLightColor, 0.2, 0.2, 0.2);
    gl.uniform3f(u_LightColor, 1.0, 0.0, 0.0);
    // 雾化设置
    gl.uniform2f(u_FogDist, 20, 23);
    gl.uniform3f(u_FogColor, 0.137, 0.321, 0.213);
    gl.uniform4fv(u_Eye, eye);
    // 视图矩阵
    mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    mvpMatrix.lookAt(eye[0], eye[1], eye[2], 0, 0, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    // 法向量变化矩阵
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    // 纹理取样变量
    gl.uniform1i(u_Sampler, 0);
    // 初始化纹理，图片大小为2的次方
    const texture: WebGLTexture = initTexture(gl, 'res/sky.jpg');

    initEventMouse(canvas);
    tick = function(time: number) {
        draw(gl, triangleLen, mvpMatrix, normalMatrix, u_MvpMatrix, u_NormalMatrix, texture);
        requestAnimationFrame(tick);
    }
}

function initTexture(gl: WebGLRenderingContext, url: string): WebGLTexture {
    const texture = gl.createTexture() as WebGLTexture;
    const image = new Image();
    image.onload = function() {
        // 纹理st是在左上角，webgl中的纹理在左下角
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        tick(0);
    }
    image.src = url;
    return texture;
}

function draw(gl: WebGLRenderingContext, len: number, viewMatrix: Matrix4, normalMatrix: Matrix4, u_MvpMatrix: WebGLUniformLocation, u_NormalMatrix: WebGLUniformLocation, texture: WebGLTexture) {
    g_viewMatrix.set(viewMatrix);
    g_viewMatrix.rotate(currAngle[0], 1.0, 0.0, 0.0);
    g_viewMatrix.rotate(currAngle[1], 0.0, 1.0, 0.0);

    g_NormalMatrix.set(normalMatrix);
    g_NormalMatrix.rotate(currAngle[0], 1.0, 0.0, 0.0);
    g_NormalMatrix.rotate(currAngle[1], 0.0, 1.0, 0.0);

    gl.uniformMatrix4fv(u_MvpMatrix, false, g_viewMatrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_NormalMatrix.elements);

    // 激活纹理
    gl.activeTexture(gl.TEXTURE0);
    // 绑定纹理
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 初始化webgl渲染器
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, len, gl.UNSIGNED_BYTE, 0);
}

function initEventMouse(canvas: HTMLCanvasElement) {
    let dragging = false;
    let lastX = -1;
    let lastY = -1;

    canvas.onmousedown = function(event: MouseEvent) {
        let x = event.clientX;
        let y = event.clientY;
        if (!event.target) return;
        let rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
        if (rect.left <= x && rect.right >= x && rect.top <= y && rect.bottom >= y) {
            lastX = x;
            lastY = y;
            dragging = true;
        }
    }
    canvas.onmouseup = function(event: MouseEvent) {
        dragging = false;
    }
    canvas.onmousemove = function(event: MouseEvent) {
        let x = event.clientX;
        let y = event.clientY;
        if (dragging) {
            let foctor = 100/canvas.height;
            let dx = foctor * (x - lastX);
            let dy = foctor * (y - lastY);
            currAngle[0] = currAngle[0] + dy > 360 ? currAngle[0] + dy - 360 : currAngle[0] + dy;
            currAngle[1] = currAngle[1] + dx > 360 ? currAngle[1] + dx - 360 : currAngle[1] + dx;
        }
        lastX = x;
        lastY = y;
    }
}

function initVertexBuffers(gl: WebGLRenderingContext): number {
    const vertices = new Float32Array([
        // Front face
        -1.0, -1.0,  1.0,
        1.0,  -1.0,  1.0,
        1.0,   1.0,  1.0,
        -1.0,  1.0,  1.0,
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,   1.0, -1.0,
        1.0,  -1.0, -1.0,
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,   1.0,  1.0,
        1.0,   1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0,
        1.0,  -1.0, -1.0,
        1.0,  -1.0,  1.0,
        -1.0, -1.0,  1.0,
        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ]);
    const txtCoords = new Float32Array([
        // front
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Back
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Top
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Bottom
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Right
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Left
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ]);
    const indices = new Uint8Array([
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ]);
    const normals = new Float32Array([
        // Front
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        // Back
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        // Top
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        // Bottom
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        // Right
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        // Left
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
    ]);

    if (!Utils.initArrayBuffer(gl, program, vertices, 3, gl.FLOAT, 'a_Position')) {
        return -1;
    }
    if (!Utils.initArrayBuffer(gl, program, normals, 3, gl.FLOAT, 'a_Normal')) {
        return -1;
    }
    if (!Utils.initArrayBuffer(gl, program, txtCoords, 2, gl.FLOAT, 'a_TexCoord')) {
        return -1;
    }

    const indiceBuffer = gl.createBuffer();
    if (!indiceBuffer) {
        console.error("failed to create the indiceBuffer object!");
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

main();