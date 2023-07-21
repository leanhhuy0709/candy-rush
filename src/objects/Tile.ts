import { CONST } from '../const/const'
import { IImageConstructor } from '../interfaces/image.interface'
import ParticleEmitterPool from './ParticleEmitterPool'
import TileManager from './TileManager'

const LIMIT_BOOM = 10
export class Tile extends Phaser.GameObjects.Image {
    private tween: Phaser.Tweens.Tween
    //private graphics: Phaser.GameObjects.Graphics
    public gridX: number
    public gridY: number

    public static numTweenRunning = 0

    public static boomFlag = 0
    private hintTween: Phaser.Tweens.Tween
    private isSuper = false
    private isMega = false

    private superEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null

    public constructor(aParams: IImageConstructor, gridX: number, gridY: number) {
        super(aParams.scene, aParams.x, aParams.y, aParams.texture, aParams.frame)

        this.setOrigin(0.5, 0.5).setInteractive().setDepth(1)

        this.gridX = gridX
        this.gridY = gridY

        /*this.graphics = this.scene.add
            .graphics()
            .lineStyle(2, 0xb9e6ff)
            .setVisible(false)
            .setDepth(4)
        this.graphics.strokeRoundedRect(0, 0, this.width + 2, this.height)
        this.setGraphifcs()*/

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
            scale: 0.5,
            duration: 500,
            ease: 'Linear',
            repeat: -1,
            yoyo: true,
        })
        this.hintTween.pause()
    }

    public spin(): void {
        if (this.tween.isPaused()) {
            this.tween.restart()
            this.tween.resume()
        }
    }

    public unSpin(): void {
        this.tween.pause()
        const tween = this.scene.tweens.add({
            targets: this,
            angle: 0,
            duration: Math.abs(this.angle) * 800/300,
            ease: 'Linear',
            onComplete: () => tween.destroy(),
        })
    }

    public showGraphics(): void {
        //this.setGraphics()
        //this.graphics.setVisible(true)
    }

    public hideGraphics(): void {
        //this.graphics.setVisible(false)
    }

    private setGraphics(): void {
        //const w = this.width + 2
        //const h = this.height
        //this.graphics.x = this.x - w / 2
        //this.graphics.y = this.y - h / 2
    }

    public getKey(): string {
        return this.frame.name
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
                ease: Phaser.Math.Easing.Bounce.Out,
                onComplete: () => {
                    if (onComplete) onComplete()
                    Tile.numTweenRunning--
                    if (onCompleteAll && Tile.numTweenRunning == 0) {
                        onCompleteAll()
                    }

                    tween.destroy()
                },
            })
            if (this.superEmitter) {
                const tween = this.scene.tweens.add({
                    targets: this.superEmitter,

                    x: newX,
                    y: newY + 10,
                    delay: delay,
                    duration: duration,
                    ease: Phaser.Math.Easing.Bounce.Out,
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
        if (!time) time = 500
        Tile.numTweenRunning++
        const tween = this.scene.tweens.add({
            targets: this,
            x: x,
            y: y,
            delay: delay,
            duration: time,
            ease: Phaser.Math.Easing.Quintic.Out,
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

        if (this.superEmitter) {
            const tween = this.scene.tweens.add({
                targets: this.superEmitter,
                x: x,
                y: y + 10,
                delay: delay,
                duration: time,
                ease: Phaser.Math.Easing.Bounce.Out,
                onComplete: () => tween.destroy(),
            })
        }
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
        if (Tile.boomFlag > LIMIT_BOOM) return
        Tile.boomFlag++
        if (this.isSuperTile() || this.isMegaTile()) {
            const emitter = ParticleEmitterPool.getExplodeEmitter(this.x, this.y, 'flares', {
                frame: ['red'],
                lifespan: 400,
                speed: { min: 150, max: 250 },
                scale: { start: 0.3, end: 0 },
                gravityY: 150,
                blendMode: 'ADD',
                emitting: false,
            }).setDepth(6)
            emitter.explode(16)

            setTimeout(() => {
                ParticleEmitterPool.removeExplodeEmitter(emitter)
            }, 500)
        } else {
            const emitter = ParticleEmitterPool.getExplodeEmitter(this.x, this.y, 'flares', {
                frame: ['blue'],
                lifespan: 400,
                speed: { min: 150, max: 250 },
                scale: { start: 0.3, end: 0 },
                gravityY: 150,
                blendMode: 'ADD',
                emitting: false,
            }).setDepth(6)
            emitter.explode(16)

            setTimeout(() => {
                ParticleEmitterPool.removeExplodeEmitter(emitter)
            }, 1000)
        }
    }

    public static bigBoom(): void {
        if (Tile.boomFlag <= LIMIT_BOOM) return

        const emitter = ParticleEmitterPool.getExplodeEmitter(300, 400, 'flares', {
            frame: ['red', 'blue'],
            lifespan: 1000,
            speed: { min: 350, max: 450 },
            scale: { start: 0.75, end: 0 },
            gravityY: 150,
            blendMode: 'ADD',
            emitting: false,
        }).setDepth(6)
        emitter.explode(50)

        setTimeout(() => {
            ParticleEmitterPool.removeExplodeEmitter(emitter)
        }, 2000)
    }

    public setSuper(value = true): void {
        this.isSuper = value
        if (this.superEmitter) {
            ParticleEmitterPool.removeParticleEmitter(this.superEmitter)
            this.superEmitter = null
        }
        if (value) {
            //
            this.superEmitter = ParticleEmitterPool.getParticleEmitter(
                this.x,
                this.y + 20,
                'flares',
                {
                    frame: 'blue',
                    color: [0x000f100],
                    colorEase: 'quart.out',
                    lifespan: 500,
                    angle: { min: -100, max: -80 },
                    scale: { start: 0.75, end: 0, ease: 'sine.out' },
                    speed: { min: 200, max: 300 },
                    advance: 2000,
                    blendMode: 'ADD',
                }
            )
                .setDepth(5)
                .start()
        }
    }

    public setMega(value = true): void {
        this.isMega = value
        if (this.superEmitter) {
            ParticleEmitterPool.removeParticleEmitter(this.superEmitter)
            this.superEmitter = null
        }
        if (value) {
            //
            this.superEmitter = ParticleEmitterPool.getParticleEmitter(
                this.x,
                this.y + 20,
                'flares',
                {
                    frame: ['red'],
                    color: [0xff0000],
                    lifespan: 500,
                    angle: { min: -100, max: -80 },
                    scale: { start: 0.75, end: 0, ease: 'sine.out' },
                    speed: { min: 200, max: 300 },
                    advance: 2000,
                    blendMode: 'ADD',
                }
            )
                .setDepth(5)
                .start()
        }
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
            this.superEmitter.y = this.y + 10
        }
    }

    public goto(data: {
        x: number
        y: number
        isNotTween?: boolean
        delay?: number
        duration?: number
        ease?: string | Function
        onComplete?: Function
        onCompleteAll?: Function
    }): void {
        if (data.isNotTween) {
            this.x = data.x
            this.y = data.y

            this.updateSuperEmitterPosition()

            return
        }

        Tile.numTweenRunning++
        const tween = this.scene.tweens.add({
            targets: this,
            x: data.x,
            y: data.y,
            delay: data.delay ? data.delay : 0,
            duration: data.duration ? data.duration : 500,
            ease: data.ease ? data.ease : Phaser.Math.Easing.Linear,
            onComplete: () => {
                Tile.numTweenRunning--
                if (data.onComplete) {
                    data.onComplete()
                }
                if (data.onCompleteAll && Tile.numTweenRunning == 0) {
                    data.onCompleteAll()
                }
                tween.destroy()
            },
            onUpdate: () => {
                this.updateSuperEmitterPosition()
            },
        })
    }

    public gotoGrid(data: {
        isNotTween?: boolean
        delay?: number
        duration?: number
        ease?: string | Function
        onComplete?: Function
        onCompleteAll?: Function
    }): void {
        //
        const newX =
            CONST.tileWidth / 2 +
            this.gridX * (CONST.tileWidth + CONST.margin) +
            (this.scene.cameras.main.width - (CONST.tileWidth + CONST.margin) * CONST.gridWidth)

        const newY = CONST.tileHeight / 2 + this.gridY * (CONST.tileHeight + CONST.margin) + 100

        this.goto({
            x: newX,
            y: newY,
            isNotTween: data.isNotTween,
            delay: data.delay,
            duration: data.duration,
            ease: data.ease,
            onComplete: data.onComplete,
            onCompleteAll: data.onCompleteAll,
        })
    }

    public setGrid(tileManager: TileManager, x?: number, y?: number): void {
        if (x == undefined) x = this.gridX
        if (y == undefined) y = this.gridY

        tileManager.removeTile(this.gridX, this.gridY)
        this.gridX = x
        this.gridY = y
        tileManager.setTile(this.gridX, this.gridY, this)
    }
}
