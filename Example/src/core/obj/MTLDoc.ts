/*
 * @Author: yanmingjie0223@qq.com
 * @Date: 2019-05-28 16:36:44
 * @Last Modified by:   yanmingjie0223@qq.com
 * @Last Modified time: 2019-05-28 16:36:44
 */
class MTLDoc {

    private materials: Array<Material>;

    public constructor() {
        this.materials = [];
    }

    public getMaterials(): Array<Material> {
        return this.materials;
    }

    public parser(mtlData: string): void {
        const lineDatas: Array<string> = mtlData.split('\n');
        const len: number = lineDatas.length;
        const stringParser: StringParser = new StringParser();
        let word: string, name: string = '', material: Material;
        for (let i = 0; i < len; i++) {
            stringParser.init(lineDatas[i]);
            word = stringParser.getWord();
            if (!word) continue;
            switch (word) {
                case '#':
                    continue;
                case 'newmtl':
                    name = stringParser.getWord();
                    break;
                case 'Kd':
                    if (!name) continue;
                    material = this.createMaterial(name, stringParser);
                    this.materials.push(material);
                    name = '';
                    break;
                case 'Ka':
                case 'Ks':
                case 'Ns':
                case 'Ni':
                case 'd':
                case 'illum':
                    break;
            }
        }
    }

    private createMaterial(name: string, stringPar: StringParser): Material {
        const material = new Material();
        material.setName(name);
        const r: number = parseFloat(stringPar.getWord());
        const g: number = parseFloat(stringPar.getWord());
        const b: number = parseFloat(stringPar.getWord());
        let a: number = 1.0;
        const aStr: string = stringPar.getWord();
        if (aStr) {
            a = parseFloat(aStr);
        }
        material.addColor(new Vector4([r, g, b, a]));
        return material;
    }

}