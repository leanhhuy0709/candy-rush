import { IImageConstructor } from '../interfaces/image.interface'

export class Tile extends Phaser.GameObjects.Image {
    private tween: Phaser.Tweens.Tween
    private graphics: Phaser.GameObjects.Graphics

    constructor(aParams: IImageConstructor) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        this.setOrigin(0.5, 0.5)
        .setInteractive()
        .setDepth(5)
        /*
        this.scene.add
            .rectangle(aParams.x, aParams.y, CONST.tileWidth, CONST.tileHeight)
            .setOrigin(0.5, 0.5)
            .setStrokeStyle(3, 0xB9E6FF)
        */

        this.graphics = this.scene.add.graphics().lineStyle(2, 0xb9e6ff).setVisible(false).setDepth(4)
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
}
