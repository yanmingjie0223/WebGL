/*
 * @Author: yanmingjie0223@qq.com
 * @Date: 2019-05-27 14:26:13
 * @Last Modified by:   yanmingjie0223@qq.com
 * @Last Modified time: 2019-05-27 14:26:13
 */
const OFFSCREEN_WIDTH: number = 800;
const OFFSCREEN_HEIGHT: number = 600;
const SCREEN_WIDTH: number = 800;
const SCREEN_HEIGHT: number = 600;
const g_vpCubeMatrix: Matrix4 = new Matrix4();
const g_vpPlaneMatrix: Matrix4 = new Matrix4();
const g_normalMatrix: Matrix4 = new Matrix4();
const currAngle_f: Array<number> = [0.0, 0.0];
let tick_f: FrameRequestCallback;

function main_f(): void {
    const canvas = document.getElementById('webgl') as HTMLCanvasElement;
    const gl = Utils.getWebGLContext(canvas);
    if (!gl) {
        console.error("not found id context webgl!");
        return;
    }

    const vsFileName: string = 'res/shader/fbo_vs.glsl';
    const fsFileName: string = 'res/shader/fbo_fs.glsl';
    Utils.initShadersFile(gl, vsFileName, fsFileName, initShaderComplete_f, null, [gl, canvas]);
}

function initShaderComplete_f(program: WebGLProgram, gl: WebGLRenderingContext, canvas: HTMLCanvasElement): void {
    const u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    const u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
    const u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
    const u_LightDirection = gl.getUniformLocation(program, 'u_LightDirection');
    const u_AmbientLightColor = gl.getUniformLocation(program, 'u_AmbientLightColor');
    const u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
    if (!u_MvpMatrix || !u_NormalMatrix ||
        !u_LightColor || !u_LightDirection || !u_AmbientLightColor ||
        u_MvpMatrix < 0 || u_NormalMatrix < 0 ||
        u_LightColor < 0 || u_LightDirection < 0 ||
        u_AmbientLightColor < 0) {
        console.error("failed to get VSHADER_SOURCE attribute object!");
        return;
    }

    const cube: VertexBuffer = initVertexBuffersForCube(gl);
    const plane: VertexBuffer = initVertexBuffersForPlane(gl);
    const eye = new Float32Array([-16, 8, 8, 0.0]);
    const modelMatrix = new Matrix4();
    const normalMatrix = new Matrix4();
    const lightDirection = new Vector3([0.5, 3.0, 4.0]);

    // 设置背景
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    // 光设置
    lightDirection.normalize();
    gl.uniform3fv(u_LightDirection, lightDirection.elements);
    gl.uniform3f(u_AmbientLightColor, 0.2, 0.2, 0.2);
    gl.uniform3f(u_LightColor, 1.0, 0.0, 0.0);
    // 法向量变化矩阵
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    // 纹理使用
    gl.uniform1i(u_Sampler, 0);

    const vpPlaneMatrix = new Matrix4();
    const vpCubeMatrix = new Matrix4();
    vpPlaneMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
    vpPlaneMatrix.lookAt(0.0, 0.0, 6.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    vpCubeMatrix.setPerspective(30.0, SCREEN_WIDTH / SCREEN_HEIGHT, 1.0, 100.0);
    vpCubeMatrix.lookAt(eye[0], eye[1], eye[2], 0, 0, 0, 0, 1, 0);

    initEventMouse_f(canvas);
    // 初始化纹理，图片大小为2的次方
    initTexture_f(gl, 'res/sky.jpg', function(cubeTexture: WebGLTexture) {
        const fbo: FrameBufferData = initFramebufferObject(gl) as FrameBufferData;
        if (!fbo) {
            console.error("failed to initFramebufferObject!");
            return;
        }
        tick_f = function(time: number) {
            draw_f(gl, program, cubeTexture, cube, plane, vpCubeMatrix, vpPlaneMatrix, normalMatrix, fbo);
            requestAnimationFrame(tick_f);
        }
        tick_f(0);
    });

}

function initEventMouse_f(canvas: HTMLCanvasElement) {
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
            currAngle_f[0] = currAngle_f[0] + dy > 360 ? currAngle_f[0] + dy - 360 : currAngle_f[0] + dy;
            currAngle_f[1] = currAngle_f[1] + dx > 360 ? currAngle_f[1] + dx - 360 : currAngle_f[1] + dx;
        }
        lastX = x;
        lastY = y;
    }
}

function draw_f(gl: WebGLRenderingContext, program: WebGLProgram, cubeTexture: WebGLTexture, cube: VertexBuffer, plane: VertexBuffer, vpCubeMatrix: Matrix4, vpPlaneMatrix: Matrix4, normalMatrix: Matrix4, fbo: FrameBufferData): void {
    const u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    const u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');

    // 在帧缓冲区的颜色关联对象即纹理对象中绘制立方体，纹理使用图片
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buffer); // 绑定帧缓冲区对象后绘制就会在绑定帧缓冲区中进行绘制
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    gl.clearColor(0.2, 0.2, 0.4, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    g_vpCubeMatrix.set(vpCubeMatrix);
    g_vpCubeMatrix.rotate(currAngle_f[0], 1, 0, 0);
    g_vpCubeMatrix.rotate(currAngle_f[1], 0, 1, 0);
    g_normalMatrix.set(normalMatrix);
    g_normalMatrix.rotate(currAngle_f[0], 1.0, 0.0, 0.0);
    g_normalMatrix.rotate(currAngle_f[1], 0.0, 1.0, 0.0);
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_vpCubeMatrix.elements);

    drawTexture(gl, program, cube, cubeTexture);// 使用图片纹理绘制立方体

    // 在canvas上绘制矩形，纹理使用上一步在纹理对象中绘制的图像
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // 接触绑定之后，会在默认的颜色缓冲区中绘制
    gl.viewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /*
    * 默认绘制图形的正反两个面，所以可以看到平面的正反两个面都贴的有纹理
    * 使用下面代码可以开启消隐功能，不再绘制背面
    * */
    // gl.enable(gl.CULL_FACE);
    // gl.uniformMatrix4fv(u_MvpMatrix, false, vpPlaneMatrix.elements);

    g_vpPlaneMatrix.set(vpPlaneMatrix);
    g_vpPlaneMatrix.rotate(currAngle_f[0], 1, 0, 0);
    g_vpPlaneMatrix.rotate(currAngle_f[1], 0, 1, 0);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_vpPlaneMatrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    drawTexture(gl, program, plane, fbo.texture);// 使用在帧缓冲绘制的纹理绘制矩形
}

function initTexture_f(gl: WebGLRenderingContext, url: string, callback: Function): WebGLTexture {
    const texture = gl.createTexture() as WebGLTexture;
    const image = new Image();
    image.onload = function() {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
        callback(texture);
    }
    image.src = url;
    return texture;
}

function initVertexBuffersForCube(gl: WebGLRenderingContext): VertexBuffer {
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
    const texCoords = new Float32Array([
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

    const cube: VertexBuffer = {} as VertexBuffer;
    cube.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    cube.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    cube.normalBuffer = initArrayBufferForLaterUse(gl, normals, 3, gl.FLOAT);
    cube.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    cube.numIndices = indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return cube;
}

function initVertexBuffersForPlane(gl: WebGLRenderingContext): VertexBuffer {
    const vertices = new Float32Array([
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        -1.0,-1.0, 0.0,
        1.0,-1.0, 0.0
    ]);
    const texCoords = new Float32Array([
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0
    ]);
    const indices = new Uint8Array([
        0, 1, 2,
        0, 2, 3
    ]);

    const plane: VertexBuffer = {} as VertexBuffer;
    plane.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    plane.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    plane.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    plane.numIndices = indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return plane;
}

function initFramebufferObject(gl: WebGLRenderingContext): FrameBufferData | null {
    const frameBufferData: FrameBufferData = {} as FrameBufferData;
    const framebuffer = gl.createFramebuffer() as WebGLBuffer;

    // 新建纹理对象作为帧缓冲区的颜色缓冲区对象
    const texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    frameBufferData.buffer = framebuffer;
    frameBufferData.texture = texture;

    // 新建渲染缓冲区对象作为帧缓冲区的深度缓冲区对象
    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    // 检测帧缓冲区对象的配置状态是否成功
    const e: number = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (gl.FRAMEBUFFER_COMPLETE !== e) {
        console.error('Frame buffer object is incomplete: ' + e.toString());
        return null;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return frameBufferData;
}

function initArrayBufferForLaterUse(gl: WebGLRenderingContext, data: ArrayBuffer, num: number, type: number): BufferData {
    const bufferData = {} as BufferData;
    const buffer = gl.createBuffer() as WebGLBuffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    bufferData.buffer = buffer;
    bufferData.lenght = num;
    bufferData.type = type;

    return bufferData;
}

function initElementArrayBufferForLaterUse(gl: WebGLRenderingContext, data: ArrayBuffer, type: number): BufferData {
    const bufferData = {} as BufferData;
    const buffer = gl.createBuffer() as WebGLBuffer;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    bufferData.buffer = buffer;
    bufferData.type = type;

    return bufferData;
}

function drawTexture(gl: WebGLRenderingContext, program: WebGLProgram, o: VertexBuffer, texture: WebGLTexture) {
    o.vertexBuffer && initAttributeVariable(gl, program, 'a_Position', o.vertexBuffer);
    o.texCoordBuffer && initAttributeVariable(gl, program, 'a_TexCoord', o.texCoordBuffer);
    o.normalBuffer && initAttributeVariable(gl, program, 'a_Normal', o.normalBuffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer.buffer);
    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);
}

function initAttributeVariable(gl: WebGLRenderingContext, program: WebGLProgram, attributeName: string, buffer: BufferData) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);

    var attribute = gl.getAttribLocation(program, attributeName);
    gl.vertexAttribPointer(attribute, buffer.lenght, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
}

main_f();