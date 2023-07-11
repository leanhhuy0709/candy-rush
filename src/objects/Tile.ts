import { CONST } from '../const/const'
import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Image {
    private tween: Phaser.Tweens.Tween
    private graphics: Phaser.GameObjects.Graphics
    private gridX: number
    private gridY: number

    constructor(aParams: IImageConstructor, gridX: number, gridY: number) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        this.setOrigin(0.5, 0.5).setInteractive().setDepth(5)

        this.gridX = gridX
        this.gridY = gridY

        this.updatePositon()

        this.graphics = this.scene.add
            .graphics()
            .lineStyle(2, 0xb9e6ff)
            .setVisible(false)
            .setDepth(4)
        this.graphics.strokeRoundedRect(0, 0, this.width + 2, this.height)
        this.setGraphics()

        this.scene.add.existing(this)

        this.tween = this.scene.tweens.add({
            targets: this,
            angle: 360,
            duration: 1500,
            ease: 'Linear',
            repeat: -1,
        })
        this.tween.pause()
    }

    public spin(): void {
        this.tween.resume()
    }

    public unSpin(): void {
        this.tween.pause()
        this.scene.tweens.add({
            targets: this,
            angle: 0,
            duration: 500,
            ease: 'Power2',
        })
    }

    public showGraphics(): void {
        this.setGraphics()
        this.graphics.setVisible(true)
    }

    public hideGraphics(): void {
        this.graphics.setVisible(false)
    }

    private setGraphics(): void {
        const w = this.width + 2
        const h = this.height
        this.graphics.x = this.x - w / 2
        this.graphics.y = this.y - h / 2
    }

    public getKey(): string {
        return this.texture.key
    }

    public getGridPosition(): { x: number; y: number } {
        return { x: this.gridX, y: this.gridY }
    }

    public setGridPosition(x: number, y: number): void {
        this.gridX = x
        this.gridY = y
    }

    public selectEffect(): void {
        this.spin()
        this.showGraphics()
    }

    public unSelectEffect(): void {
        this.unSpin()
        this.hideGraphics()
    }

    public updatePositon(isHaveEffect = true): void {
        //this function update x, y from GridX, GridY
        const w = this.scene.cameras.main.width

        const newX =
            CONST.tileWidth / 2 +
            this.gridX * (CONST.tileWidth + CONST.margin) +
            (w - (CONST.tileWidth + CONST.margin) * CONST.gridWidth)

        const newY = CONST.tileHeight / 2 + this.gridY * (CONST.tileHeight + CONST.margin)

        if (isHaveEffect) {
            this.scene.tweens.add({
                targets: this,
                x: newX,
                y: newY,
                duration: 1500,
                ease: 'Power3',
            })
        } else {
            this.x = newX
            this.y = newY
        }
    }

    public setRandomTextures(): void {
        this.setTexture(CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)])
    }
}
