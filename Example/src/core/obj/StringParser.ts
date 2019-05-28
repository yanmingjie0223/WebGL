/*
 * @Author: yanmingjie0223@qq.com
 * @Date: 2019-05-28 16:36:54
 * @Last Modified by:   yanmingjie0223@qq.com
 * @Last Modified time: 2019-05-28 16:36:54
 */
class StringParser {

    private str: string;
    private index: number;

    public constructor(str?: string) {
        if (str) {
            this.str = str;
        }
        else {
            this.str = '';
        }
        this.index = 0;
        this.init(this.str)
    }

    public init(s: string) {
        this.str = s;
        this.index = 0;
    }

    /**
     * 获取一个数据段
     */
    public getWord(): string {
        this.skipDelimiters();
        const wordLen: number = this.getWordLen(this.str, this.index);
        if (wordLen === 0) return '';
        const word: string = this.str.substr(this.index, wordLen);
        this.index += (wordLen + 1);
        return word;
    }

    /**
     * 跳过下个数据段
     */
    public skipNextWord(): void {
        this.skipDelimiters();
        const wordLen: number = this.getWordLen(this.str, this.index);
        this.index += (wordLen + 1);
    }

    /**
     * 跳过非数据部分
     */
    private skipDelimiters(): void {
        let s: string;
        let i: number = this.index;
        let len: number = this.str.length;
        for (; i < len; i++) {
            s = this.str.charAt(i);
            if (s === '\t'|| s === ' ' || s === '(' || s == ')' || s === '"') {
                continue;
            }
            break;
        }
        this.index = i;
    }

    /**
     * 获取下个数据段长度
     * @param str
     * @param start
     */
    private getWordLen(str: string, start: number): number {
        let s: string;
        let i: number = start;
        let len: number = str.length;
        for (; i < len; i++) {
            s = str.charAt(i);
            if (s === '\t'|| s === ' ' || s === '(' || s === ')' || s === '"') {
                break;
            }
        }
        return i - start;
    }

}