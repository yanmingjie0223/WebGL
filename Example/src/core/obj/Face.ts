/*
 * @Author: yanmingjie0223@qq.com
 * @Date: 2019-05-28 16:36:38
 * @Last Modified by:   yanmingjie0223@qq.com
 * @Last Modified time: 2019-05-28 16:36:38
 */
class Face {

    public nIndices: Array<number>;
    public vIndices: Array<number>;
    private materialName: string;
    public numIndices: number;
    private normal: Vector3 | null;

    public constructor(materialName?: string) {
        if (materialName) {
            this.materialName = materialName;
        }
        else {
            this.materialName = '';
        }
        this.nIndices = [];
        this.vIndices = [];
        this.numIndices = 0;
        this.normal = null;
    }

    public setNormal(n: Vector3): void {
        this.normal = n;
    }

    public getNormal(): Vector3 {
        return this.normal as Vector3;
    }

    public getMaterialName(): string {
        return this.materialName;
    }

    public addVIndice(v: number): void {
        this.vIndices.push(v);
        ++this.numIndices
    }

    public addNIndice(n: number): void {
        this.nIndices.push(n);
    }

    public getNum(): number {
        return this.numIndices;
    }

}