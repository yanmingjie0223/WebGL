/*
 * @Author: yanmingjie0223@qq.com
 * @Date: 2019-05-28 16:36:47
 * @Last Modified by: yanmingjie0223@qq.com
 * @Last Modified time: 2019-05-28 16:44:00
 */
class OBJDoc {

    private fileName: string;
    private mtlNum: number;
    private mtlLoadCompleteNum: number;
    private mtls: Array<MTLDoc>;
    private objects: Array<OBJobject>;
    private vertices: Array<Vector3>;
    private normals: Array<Vector3>;

    public constructor(fileName?: string) {
        if (fileName) {
            this.fileName = fileName;
        }
        else {
            this.fileName = '';
        }
        this.objects = [];
        this.vertices = [];
        this.normals = [];
        this.mtls = [];
        this.mtlNum = 0;
        this.mtlLoadCompleteNum = 0;
    }

    public setFileName(fileName: string): void {
        this.fileName = fileName;
    }

    public parser(objData: string): void {
        const lineDatas: Array<string> = objData.split('\n');
        const len: number = lineDatas.length;
        const stringParser: StringParser = new StringParser();
        let word: string;
        let currObj: OBJobject | null = null;
        let currMaterialName: string = '';
        for (let i = 0; i < len; i++) {
            stringParser.init(lineDatas[i])
            word = stringParser.getWord();
            if (!word) continue;
            switch (word) {
                case '#':
                    continue;
                case 'mtllib':
                    ++this.mtlNum;
                    const start: number = this.fileName.lastIndexOf('/');
                    const mtlPath: string = this.fileName.substr(0, start + 1) + stringParser.getWord();
                    Utils.loadFromFile(mtlPath, this.mtlParser, this);
                    break;
                case 'o':
                case 'g':
                    const obj: OBJobject = this.objectParser(stringParser);
                    this.objects.push(obj);
                    currObj = obj;
                    break;
                case 'v':
                    const vertex = this.vertexParser(stringParser);
                    this.vertices.push(vertex);
                    break;
                case 'vn':
                    const normal = this.normalParser(stringParser);
                    this.normals.push(normal);
                    break;
                case 'usemtl':
                    currMaterialName = this.usemtlParser(stringParser);
                    break;
                case 'f':
                    if (!currObj || !currMaterialName) continue;
                    const face = this.faceParser(stringParser, currMaterialName, this.vertices);
                    currObj.addFace(face);
                    break;
            }
        }
    }

    public getDrawInfo(): VertexData {
        let numIndices: number = 0;
        for (let i = 0, len = this.objects.length; i < len; i++) {
            numIndices += this.objects[i].getNumIndices();
        }
        const vertices: Float32Array = new Float32Array(numIndices * 3);
        const normals: Float32Array = new Float32Array(numIndices * 3);
        const colors: Float32Array = new Float32Array(numIndices * 4);
        const indices: Uint16Array = new Uint16Array(numIndices);

        let obj: OBJobject;
        let faces: Array<Face>;
        let face: Face;
        let faceNormal: Vector3;
        let color: Vector4;
        let indexV: number = 0;
        let vertice: Vector3;
        for (let i = 0, len = this.objects.length; i < len; i++) {
            obj = this.objects[i];
            faces = obj.getFaces();
            for (let k = 0, lenF = faces.length; k < lenF; k++) {
                face = faces[k];
                faceNormal = face.getNormal();
                color = this.getMaterialColor(face.getMaterialName());
                for (let h = 0; h < face.vIndices.length; h++) {
                    vertice = this.vertices[face.vIndices[h]];
                    // 顶点
                    vertices[indexV * 3 + 0] = vertice.elements[0];
                    vertices[indexV * 3 + 1] = vertice.elements[1];
                    vertices[indexV * 3 + 2] = vertice.elements[2];
                    // 顶点索引
                    indices[indexV] = indexV;
                    // 颜色
                    colors[indexV * 4 + 0] = color.elements[0];
                    colors[indexV * 4 + 1] = color.elements[1];
                    colors[indexV * 4 + 2] = color.elements[2];
                    colors[indexV * 4 + 3] = color.elements[3];
                    // 法向量
                    const currNormal = face.nIndices[h];
                    if (currNormal >= 0) {
                        normals[indexV * 3 + 0] = this.normals[currNormal].elements[0];
                        normals[indexV * 3 + 1] = this.normals[currNormal].elements[1];
                        normals[indexV * 3 + 2] = this.normals[currNormal].elements[2];
                    }
                    else {
                        normals[indexV * 3 + 0] = faceNormal.elements[0];
                        normals[indexV * 3 + 1] = faceNormal.elements[1];
                        normals[indexV * 3 + 2] = faceNormal.elements[2];
                    }
                    ++indexV;
                }
            }
        }

        const vertexData: VertexData = {} as VertexData;
        vertexData.vertices = vertices;
        vertexData.colors = colors;
        vertexData.indices = indices;
        vertexData.normals = normals;
        vertexData.numIndices = numIndices;

        return vertexData;
    }

    /**
     * 是否读取完成
     */
    public getIsComplete(): boolean {
        if (this.mtlNum === this.mtlLoadCompleteNum) {
            return true;
        }
        return false;
    }

    private getMaterialColor(materialName: string): Vector4 {
        let materials: Array<Material>;
        let material: Material;
        for (let i = 0, len = this.mtls.length; i < len; i++) {
            materials = this.mtls[i].getMaterials();
            for (let k = 0, lenM = materials.length; k < lenM; k++) {
                material = materials[k];
                if (material.getName() === materialName) {
                    return material.getColor() as Vector4;
                }
            }
        }
        return new Vector4([0.8, 0.8, 0.8, 1]);
    }

    private mtlParser(mtlData: string, fileName: string): void {
        if (mtlData === null) {
            console.error(`${fileName} load fail!`);
            return;
        }
        const mtlDoc = new MTLDoc();
        mtlDoc.parser(mtlData);
        this.mtls.push(mtlDoc);
        ++this.mtlLoadCompleteNum;
    }

    private objectParser(stringPar: StringParser): OBJobject {
        const name: string = stringPar.getWord();
        const obj: OBJobject = new OBJobject(name);
        return obj;
    }

    private vertexParser(stringPar: StringParser): Vector3 {
        const x: number = parseFloat(stringPar.getWord());
        const y: number = parseFloat(stringPar.getWord());
        const z: number = parseFloat(stringPar.getWord());
        const vec3: Vector3 = new Vector3([x, y, z]);
        return vec3;
    }

    private normalParser(stringPar: StringParser): Vector3 {
        const x: number = parseFloat(stringPar.getWord());
        const y: number = parseFloat(stringPar.getWord());
        const z: number = parseFloat(stringPar.getWord());
        const vec3: Vector3 = new Vector3([x, y, z]);
        return vec3;
    }

    private usemtlParser(stringPar: StringParser): string {
        return stringPar.getWord();
    }

    private faceParser(stringPar: StringParser, currMaterialName: string, vertexs: Array<Vector3>): Face {
        const face = new Face(currMaterialName);
        let word: string;
        let faceDatas: Array<string>;
        for (;;) {
            word = stringPar.getWord();
            if (!word) break;
            faceDatas = word.split('/');
            if (faceDatas.length >= 1) {
                const v: number = parseInt(faceDatas[0]) - 1;
                face.addVIndice(v);
            }
            if (faceDatas.length >= 3) {
                const n: number = parseInt(faceDatas[2]) - 1;
                face.addNIndice(n);
            }
            else {
                face.addNIndice(-1);
            }
        }

        const v0 = [
            vertexs[face.vIndices[0]].elements[0],
            vertexs[face.vIndices[0]].elements[1],
            vertexs[face.vIndices[0]].elements[2],
        ];
        const v1 = [
            vertexs[face.vIndices[1]].elements[0],
            vertexs[face.vIndices[1]].elements[1],
            vertexs[face.vIndices[1]].elements[2],
        ];
        const v2 = [
            vertexs[face.vIndices[2]].elements[0],
            vertexs[face.vIndices[2]].elements[1],
            vertexs[face.vIndices[2]].elements[2],
        ];
        let normal = this.calcNormal(v0, v1, v2);
        if (normal === null) {
            if (face.vIndices.length >= 4) {
                const v3 = [
                    vertexs[face.vIndices[3]].elements[0],
                    vertexs[face.vIndices[3]].elements[1],
                    vertexs[face.vIndices[3]].elements[2],
                ];
                normal = this.calcNormal(v1, v2, v3);
                if (normal === null) {
                    normal = new Float32Array(3);
                    normal[0] = 0.0; normal[1] = 1.0; normal[2] = 0.0;
                }
            }
        }
        face.setNormal(new Vector3([normal[0], normal[1], normal[2]]));

        if (face.vIndices.length >= 4) {
            const n = face.vIndices.length - 2;
            const newVIndices: Array<number> = [];
            const newNIndices: Array<number> = [];
            for (let i = 0; i < n; i++) {
                newVIndices[i * 3 + 0] = face.vIndices[0];
                newVIndices[i * 3 + 1] = face.vIndices[i + 1];
                newVIndices[i * 3 + 2] = face.vIndices[i + 2];
                newNIndices[i * 3 + 0] = face.nIndices[0];
                newNIndices[i * 3 + 1] = face.nIndices[i + 1];
                newNIndices[i * 3 + 2] = face.nIndices[i + 2];
            }

            face.nIndices = newNIndices;
            face.vIndices = newVIndices;
        }
        face.numIndices = face.vIndices.length;

        return face;
    }

    private calcNormal(p0: Array<number>, p1: Array<number>, p2: Array<number>): Float32Array {
        const v0 = new Float32Array(3);
        const v1 = new Float32Array(3);
        for (let i = 0; i < 3; i++){
            v0[i] = p0[i] - p1[i];
            v1[i] = p2[i] - p1[i];
        }
        // 差乘求法向量
        const c = new Float32Array(3);
        c[0] = v0[1] * v1[2] - v0[2] * v1[1];
        c[1] = v0[2] * v1[0] - v0[0] * v1[2];
        c[2] = v0[0] * v1[1] - v0[1] * v1[0];

        const v = new Vector3([c[0], c[1], c[2]]);
        v.normalize();
        return v.elements;
    }

}