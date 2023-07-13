import { CONST } from '../const/const'
import { IImageConstructor } from '../interfaces/image.interface'
import { GamePlayScene } from '../scenes/GamePlayScene'

const CHANCE = 0.9
export class Tile extends Phaser.GameObjects.Image {
    private tween: Phaser.Tweens.Tween
    private graphics: Phaser.GameObjects.Graphics
    public gridX: number
    public gridY: number

    public static numTweenRunning = 0
    private hintTween: Phaser.Tweens.Tween
    private isSuper = false
    private isMega = false

    private superEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null

    public constructor(aParams: IImageConstructor, gridX: number, gridY: number) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        this.setOrigin(0.5, 0.5).setInteractive().setDepth(5)

        this.gridX = gridX
        this.gridY = gridY

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

        this.hintTween = this.scene.tweens.add({
            targets: this,
            scale: 0.8,
            duration: 500,
            ease: 'Linear',
            repeat: -1,
            yoyo: true,
        })
        this.hintTween.pause()
    }

    public spin(): void {
        this.tween.resume()
    }

    public unSpin(): void {
        this.tween.pause()
        const tween = this.scene.tweens.add({
            targets: this,
            angle: 0,
            duration: 800,
            ease: 'Linear',
            onComplete: () => tween.destroy(),
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

    public selectEffect(): void {
        this.spin()
        this.showGraphics()
    }

    public unSelectEffect(): void {
        this.unSpin()
        this.hideGraphics()
    }

    public updatePositon(
        isHaveEffect = true,
        onCompleteAll?: Function,
        delay?: number,
        time?: number,
        onComplete?: Function
    ): void {
        //this function update x, y from GridX, GridY
        const w = this.scene.cameras.main.width

        let duration = 500
        if (time) duration = time

        if (!delay) delay = 0

        const newX =
            CONST.tileWidth / 2 +
            this.gridX * (CONST.tileWidth + CONST.margin) +
            (w - (CONST.tileWidth + CONST.margin) * CONST.gridWidth)

        const newY = CONST.tileHeight / 2 + this.gridY * (CONST.tileHeight + CONST.margin) + 100

        if (isHaveEffect) {
            Tile.numTweenRunning++
            const tween = this.scene.tweens.add({
                targets: this,
                x: newX,
                y: newY,
                delay: delay,
                duration: duration,
                ease: 'Power2',
                onComplete: () => {
                    if (onComplete) onComplete()
                    Tile.numTweenRunning--
                    if (onCompleteAll && Tile.numTweenRunning == 0) {
                        onCompleteAll()
                    }

                    tween.destroy()
                },
            })
            if (this.isSuper) {
                const tween = this.scene.tweens.add({
                    targets: this.superEmitter,
                    x: newX,
                    y: newY,
                    delay: delay,
                    duration: duration,
                    ease: 'Power2',
                    onComplete: () => tween.destroy(),
                })
            }
        } else {
            this.x = newX
            this.y = newY
        }
    }

    public goToPosition(
        x: number,
        y: number,
        onComplete?: Function,
        delay?: number,
        time?: number,
        onCompleteAll?: Function
    ): void {
        Tile.numTweenRunning++
        const tween = this.scene.tweens.add({
            targets: this,
            x: x,
            y: y,
            delay: delay,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                Tile.numTweenRunning--
                if (onComplete) {
                    onComplete()
                }
                if (onCompleteAll && Tile.numTweenRunning == 0) {
                    onCompleteAll()
                }
                tween.destroy()
            },
        })

        if (this.isSuper) {
            const tween = this.scene.tweens.add({
                targets: this.superEmitter,
                x: x,
                y: y,
                delay: delay,
                duration: 500,
                ease: 'Power2',
                onComplete: () => tween.destroy(),
            })
        }
    }

    public setRandomTextures(coeffX?: number, coeffY?: number): void {
        let randomTileType: string =
            CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]

        //Increase Chance
        const chance = Math.random()
        if (chance < CHANCE) {
            let x = this.gridX
            let y = this.gridY

            if (coeffX) x = coeffX
            if (coeffY) y = coeffY

            if (y < 0) y = 1
            const scene = this.scene as GamePlayScene
            const listCandyNextTo = []
            if (scene.getTile(x - 1, y)) listCandyNextTo.push(scene.getTile(x - 1, y))
            if (scene.getTile(x + 1, y)) listCandyNextTo.push(scene.getTile(x + 1, y))
            if (scene.getTile(x, y - 1)) listCandyNextTo.push(scene.getTile(x, y - 1))
            if (scene.getTile(x, y + 1)) listCandyNextTo.push(scene.getTile(x, y + 1))

            if (listCandyNextTo.length > 0) {
                randomTileType = (
                    listCandyNextTo[Phaser.Math.Between(0, listCandyNextTo.length - 1)] as Tile
                ).getKey()
            }
        }
        this.setTexture(randomTileType)
    }

    public showHint(): void {
        this.hintTween.resume()
        this.showGraphics()
    }

    public hideHint(): void {
        this.hintTween.pause()
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 1000,
            ease: 'Linear',
        })
        this.hideGraphics()
    }

    public boom(): void {
        if (this.isSuperTile()) {
            const emitter = this.scene.add.particles(this.x, this.y, 'flares', {
                frame: ['red'],
                lifespan: 400,
                speed: { min: 150, max: 250 },
                scale: { start: 0.3, end: 0 },
                gravityY: 150,
                blendMode: 'ADD',
                emitting: false,
            })
            emitter.explode(16)

            setTimeout(() => {
                emitter.destroy()
            }, 1500)
        } else {
            const emitter = this.scene.add.particles(this.x, this.y, 'flares', {
                frame: [],
                lifespan: 400,
                speed: { min: 150, max: 250 },
                scale: { start: 0.3, end: 0 },
                gravityY: 150,
                blendMode: 'ADD',
                emitting: false,
            })
            emitter.explode(16)

            setTimeout(() => {
                emitter.destroy()
            }, 1500)
        }
    }

    public setSuper(value = true): void {
        this.isSuper = value
        if (value) {
            //
            this.superEmitter = this.scene.add
                .particles(this.x, this.y + 20, 'flares', {
                    frame: 'red',
                    color: [
                        0xf40d61, 0xfacc22, 0xf89800, 0xf83600, 0x9f0404, 0x4b4a4f, 0x353438,
                        0x040404,
                    ],
                    lifespan: 500,
                    angle: { min: -100, max: -80 },
                    scale: { start: 0.75, end: 0, ease: 'sine.out' },
                    speed: { min: 200, max: 300 },
                    advance: 2000,
                    blendMode: 'ADD',
                })
                .setDepth(6)
        } else {
            if (this.superEmitter) {
                this.superEmitter.destroy()
                this.superEmitter = null
            }
        }
    }

    public setMega(value = true): void {
        this.isMega = value
    }

    public isSuperTile(): boolean {
        return this.isSuper
    }

    public isMegaTile(): boolean {
        return this.isMega
    }

    public updateSuperEmitterPosition(): void {
        if (this.superEmitter) {
            this.superEmitter.x = this.x
            this.superEmitter.y = this.y + 20
        }
    }
}
