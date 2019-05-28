/*
 * @Author: yanmingjie0223@qq.com
 * @Date: 2019-05-28 16:36:41
 * @Last Modified by:   yanmingjie0223@qq.com
 * @Last Modified time: 2019-05-28 16:36:41
 */
class Material {

    private name: string;
    private color: Vector4 | null;

    public constructor() {
        this.name = '';
        this.color = null;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }

    public addColor(color: Vector4): void {
        this.color = color;
    }

    public getColor(): Vector4 | null {
        return this.color;
    }

}