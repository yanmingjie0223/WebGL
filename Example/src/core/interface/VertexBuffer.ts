/*
 * @Author: yanmingjie0223@qq.com
 * @Date: 2019-05-28 16:36:15
 * @Last Modified by:   yanmingjie0223@qq.com
 * @Last Modified time: 2019-05-28 16:36:15
 */
interface VertexBuffer {
    vertexBuffer: BufferData;
    texCoordBuffer: BufferData;
    normalBuffer: BufferData;
    indexBuffer: BufferData;
    numIndices: number;
}

interface VertexData {
    vertices: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
    indices: Uint16Array;
    numIndices: number;
}