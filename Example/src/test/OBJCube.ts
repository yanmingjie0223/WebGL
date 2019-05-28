/*
 * @Author: yanmingjie0223@qq.com
 * @Date: 2019-05-27 14:18:47
 * @Last Modified by: yanmingjie0223@qq.com
 * @Last Modified time: 2019-05-28 16:33:55
 */
let objDoc: OBJDoc;
let vertexData: VertexData;
let g_viewMatrix_o: Matrix4 = new Matrix4();
let g_NormalMatrix_o: Matrix4 = new Matrix4();
let currAngle_o: Array<number> = [0.0, 0.0];

function main_o(): void {
    const canvas = document.getElementById('webgl') as HTMLCanvasElement;
    const gl = Utils.getWebGLContext(canvas);
    if (!gl) {
        console.error("not found id context webgl!");
        return;
    }

    const vsFileName: string = 'res/shader/obj_vs.glsl';
    const fsFileName: string = 'res/shader/obj_fs.glsl';
    Utils.initShadersFile(gl, vsFileName, fsFileName, initShaderComplete_o, null, [gl, canvas]);
}

function initShaderComplete_o(program: WebGLProgram, gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
    const u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    const u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
    if (!u_MvpMatrix || !u_NormalMatrix || u_MvpMatrix < 0 || u_NormalMatrix < 0) {
        console.error("failed to get VSHADER_SOURCE attribute object!");
        return;
    }

    const eye = new Float32Array([-16, 8, 8, 0.0]);
    const modelMatrix = new Matrix4();
    const mvpMatrix = new Matrix4();
    const normalMatrix = new Matrix4();

    // 设置背景
    gl.clearColor(0.2, 0.2, 0.4, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    // 视图矩阵
    mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    mvpMatrix.lookAt(eye[0], eye[1], eye[2], 0, 0, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    // 法向量变化矩阵
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    Utils.loadFromFile('res/blender/cube.obj', onReadOBJ);

    initEventMouse_o(canvas);
    const tick = function(time: number) {
        initVerticeBuffer(gl, program);
        draw_o(gl, mvpMatrix, normalMatrix, u_MvpMatrix, u_NormalMatrix);
        requestAnimationFrame(tick);
    }
    tick(0);
}

function draw_o(gl: WebGLRenderingContext, viewMatrix: Matrix4, normalMatrix: Matrix4, u_MvpMatrix: WebGLUniformLocation, u_NormalMatrix: WebGLUniformLocation) {
    if (!vertexData) {
        return;
    }

    g_viewMatrix_o.set(viewMatrix);
    g_viewMatrix_o.rotate(currAngle_o[0], 1.0, 0.0, 0.0);
    g_viewMatrix_o.rotate(currAngle_o[1], 0.0, 1.0, 0.0);

    g_NormalMatrix_o.set(normalMatrix);
    g_NormalMatrix_o.rotate(currAngle_o[0], 1.0, 0.0, 0.0);
    g_NormalMatrix_o.rotate(currAngle_o[1], 0.0, 1.0, 0.0);

    gl.uniformMatrix4fv(u_MvpMatrix, false, g_viewMatrix_o.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_NormalMatrix_o.elements);

    // 初始化webgl渲染器
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, vertexData.numIndices, gl.UNSIGNED_SHORT, 0);
}

function onReadOBJ(objData: string, objPath: string): void {
    objDoc = new OBJDoc(objPath);
    objDoc.parser(objData);
}

function initEventMouse_o(canvas: HTMLCanvasElement) {
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
            currAngle_o[0] = currAngle_o[0] + dy > 360 ? currAngle_o[0] + dy - 360 : currAngle_o[0] + dy;
            currAngle_o[1] = currAngle_o[1] + dx > 360 ? currAngle_o[1] + dx - 360 : currAngle_o[1] + dx;
        }
        lastX = x;
        lastY = y;
    }
}

function initVerticeBuffer(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (vertexData) {
        return;
    }
    if (objDoc && objDoc.getIsComplete()) {
        vertexData = objDoc.getDrawInfo();
    }
    else {
        return;
    }

    if (!Utils.initArrayBuffer(gl, program, vertexData.vertices, 3, gl.FLOAT, 'a_Position')) {
        return -1;
    }
    if (!Utils.initArrayBuffer(gl, program, vertexData.normals, 3, gl.FLOAT, 'a_Normal')) {
        return -1;
    }
    if (!Utils.initArrayBuffer(gl, program, vertexData.colors, 4, gl.FLOAT, 'a_Color')) {
        return -1;
    }

    const indiceBuffer = gl.createBuffer();
    if (!indiceBuffer) {
        console.error("failed to create the indiceBuffer object!");
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexData.indices, gl.STATIC_DRAW);
}

main_o();