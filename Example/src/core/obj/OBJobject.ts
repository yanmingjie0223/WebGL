/*
 * @Author: yanmingjie0223@qq.com
 * @Date: 2019-05-28 16:36:51
 * @Last Modified by:   yanmingjie0223@qq.com
 * @Last Modified time: 2019-05-28 16:36:51
 */
class OBJobject {

    private name: string;
    private faces: Array<Face>;
    private numIndices: number;

    public constructor(name?: string) {
        if (name) {
            this.name = name;
        }
        else {
            this.name = '';
        }
        this.numIndices = 0;
        this.faces = [];
    }

    public addFace(face: Face): void {
        this.faces.push(face);
        this.numIndices += face.getNum();
    }

    public getFaces(): Array<Face> {
        return this.faces;
    }

    public setName(name: string): void {
        this.name = name;
    }
    public getName(): string {
        return this.name;
    }

    public getNumIndices(): number {
        return this.numIndices;
    }

}