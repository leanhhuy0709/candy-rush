import { CONST, SCENE } from '../const/const'
import ParticleEmitterPool from '../objects/ParticleEmitterPool'
import ScoreBoard from '../objects/ScoreBoard'
import { Tile } from '../objects/Tile'
import TileManager from '../objects/TileManager'

export enum BOARD_STATE {
    IDLE = 'Idle',
    CHOOSING = 'Choosing',
    SWAPPING = 'Swapping',
    HANDLING = 'Handling',
    FALLING = 'Falling',
    MERGING = 'Merging',
}

const IS_DEBUG = false
const IS_AUTO_PLAY = true
const IDLE_TIME = 2000
export class GamePlayScene extends Phaser.Scene {
    public tileManager: TileManager

    private firstSelectedTile: Tile | null
    private secondSelectedTile: Tile | null

    public scoreBoard: ScoreBoard

    private idleTime: number
    private isIdleTweenPlaying: boolean

    private hintTile1: Tile | null
    private hintTile2: Tile | null

    public boardState: BOARD_STATE

    public constructor() {
        super({
            key: SCENE.GAMEPLAY,
        })
    }

    public create() {
        this.add.image(0, 0, 'bg').setOrigin(0, 0)
        ParticleEmitterPool.init(this)
        this.tileManager = new TileManager(this)
        this.boardState = BOARD_STATE.HANDLING
        this.shuffle()
        this.scoreBoard = new ScoreBoard(this)

        this.input.on('gameobjectdown', this.onTileClicked, this)
    }

    public update(_time: number, delta: number) {
        if (this.idleTime == 0) this.isIdleTweenPlaying = false
        this.idleTime += delta
        this.handleIdleTime()

        if (this.boardState != BOARD_STATE.IDLE) this.idleTime = 0

        switch (this.boardState) {
            case BOARD_STATE.IDLE:
                this.scoreBoard.handleGoToNextLevel()
                this.resetSelect()
                break
            case BOARD_STATE.CHOOSING:
            case BOARD_STATE.SWAPPING:
                if (this.firstSelectedTile) this.firstSelectedTile.selectEffect()
                if (this.secondSelectedTile) this.secondSelectedTile.selectEffect()
                break
            case BOARD_STATE.HANDLING:
            case BOARD_STATE.FALLING:
            case BOARD_STATE.MERGING:
                this.resetSelect()
                break
        }
        console.log(this.boardState)
    }

    private onTileClicked(pointer: Phaser.Input.Pointer | null, gameObject: Tile) {
        if (this.boardState != BOARD_STATE.IDLE && this.boardState != BOARD_STATE.CHOOSING) return
        if (!this.firstSelectedTile) {
            this.boardState = BOARD_STATE.CHOOSING
            this.firstSelectedTile = gameObject
        } else if (!this.secondSelectedTile) {
            this.secondSelectedTile = gameObject

            if (this.isValidSelect()) {
                this.swapTiles(() => {
                    if (this.firstSelectedTile && this.secondSelectedTile) {
                        this.handleMatch((isMatch = true) => {
                            if (IS_DEBUG) {
                                this.resetSelect()
                                return
                            }
                            if (!isMatch)
                                this.swapTiles(() => {
                                    this.resetSelect()
                                })
                            else this.resetSelect()
                        })
                    }
                })
            } else {
                this.resetSelect()
            }
        }
    }

    private resetSelect(): void {
        if (this.firstSelectedTile) this.firstSelectedTile.unSelectEffect()
        if (this.secondSelectedTile) this.secondSelectedTile.unSelectEffect()
        this.firstSelectedTile = null
        this.secondSelectedTile = null
    }

    private isValidSelect(): boolean {
        if (IS_DEBUG) return true
        if (this.firstSelectedTile && this.secondSelectedTile) {
            const temp1x = this.firstSelectedTile.gridX,
                temp1y = this.firstSelectedTile.gridY
            const temp2x = this.secondSelectedTile.gridX,
                temp2y = this.secondSelectedTile.gridY

            return Math.abs(temp1x - temp2x) + Math.abs(temp1y - temp2y) === 1
        }
        return false
    }

    private swapTiles(onComplete: Function): void {
        this.boardState = BOARD_STATE.SWAPPING
        if (this.firstSelectedTile && this.secondSelectedTile) {
            const x1 = this.firstSelectedTile.x,
                y1 = this.firstSelectedTile.y,
                x2 = this.secondSelectedTile.x,
                y2 = this.secondSelectedTile.y

            const time = 500

            this.firstSelectedTile.goToPosition(x2, y2, undefined, undefined, time, () => {
                if (this.firstSelectedTile && this.secondSelectedTile)
                    this.tileManager.swapTilesWithoutEffect(
                        this.firstSelectedTile.gridX,
                        this.firstSelectedTile.gridY,
                        this.secondSelectedTile.gridX,
                        this.secondSelectedTile.gridY
                    )
                onComplete()
            })

            this.secondSelectedTile.goToPosition(x1, y1, undefined, undefined, time, () => {
                if (this.firstSelectedTile && this.secondSelectedTile)
                    this.tileManager.swapTilesWithoutEffect(
                        this.firstSelectedTile.gridX,
                        this.firstSelectedTile.gridY,
                        this.secondSelectedTile.gridX,
                        this.secondSelectedTile.gridY
                    )
                onComplete()
            })
        }
    }

    private handleMatch(onComplete?: Function): void {
        if (this.boardState == BOARD_STATE.IDLE || this.boardState == BOARD_STATE.SWAPPING) {
            this.boardState = BOARD_STATE.HANDLING
            this.tileManager.handleMatch(() => {
                if (onComplete) onComplete()
                this.boardState = BOARD_STATE.IDLE
            })
        }
    }

    private idleEffect(): void {
        if (this.boardState != BOARD_STATE.IDLE) return
        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile = this.tileManager.getTile(i, j) as Tile
                if (!this.isIdleTweenPlaying) {
                    const tween = this.tweens.add({
                        targets: tile,
                        angle: 360,
                        delay: ((i * CONST.gridHeight + j) / 64) * 1000,
                        duration: 1000,
                        ease: 'Linear',
                        onComplete: () => {
                            tween.destroy()
                        },
                    })
                }
            }
        }
        this.isIdleTweenPlaying = true
    }

    private handleIdleTime(): void {
        if (this.idleTime > IDLE_TIME && this.boardState == BOARD_STATE.IDLE) {
            if (this.firstSelectedTile) {
                this.firstSelectedTile.unSelectEffect()
                this.firstSelectedTile = null
            }

            this.idleEffect()
            this.showHint()
        } else {
            this.hideHint()
        }
    }

    private handleHint(): Tile[] {
        const answer: Tile[] = []
        //Check col
        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile1 = this.tileManager.getTile(i, j) as Tile
                const tile2 = this.tileManager.getTile(i, j + 1)
                const tile3 = this.tileManager.getTile(i, j + 2)

                if (!tile2) continue

                if (tile1.getKey() === tile2.getKey()) {
                    const listTile = [
                        {
                            T1: this.tileManager.getTile(i - 1, j - 1),
                            T2: this.tileManager.getTile(i, j - 1),
                        },
                        {
                            T1: this.tileManager.getTile(i + 1, j - 1),
                            T2: this.tileManager.getTile(i, j - 1),
                        },
                        {
                            T1: this.tileManager.getTile(i - 1, j + 2),
                            T2: this.tileManager.getTile(i, j + 2),
                        },
                        {
                            T1: this.tileManager.getTile(i + 1, j + 2),
                            T2: this.tileManager.getTile(i, j + 2),
                        },
                        {
                            T1: this.tileManager.getTile(i, j - 2),
                            T2: this.tileManager.getTile(i, j - 1),
                        },
                        {
                            T1: this.tileManager.getTile(i, j + 3),
                            T2: this.tileManager.getTile(i, j + 2),
                        },
                    ]

                    for (let i = 0; i < listTile.length; i++) {
                        const tileT1 = listTile[i].T1
                        const tileT2 = listTile[i].T2

                        if (tileT1 && tileT2 && tile1.getKey() === tileT1.getKey()) {
                            answer.push(tileT1)
                            answer.push(tileT2)
                            return answer
                        }
                    }
                }
                if (!tile3) continue
                if (tile1.getKey() === tile3.getKey()) {
                    const listTile = [
                        {
                            T1: this.tileManager.getTile(i - 1, j + 1),
                            T2: this.tileManager.getTile(i, j + 1),
                        },
                        {
                            T1: this.tileManager.getTile(i + 1, j + 1),
                            T2: this.tileManager.getTile(i, j + 1),
                        },
                    ]

                    for (let i = 0; i < listTile.length; i++) {
                        const tileT1 = listTile[i].T1
                        const tileT2 = listTile[i].T2

                        if (tileT1 && tileT2 && tile1.getKey() === tileT1.getKey()) {
                            answer.push(tileT1)
                            answer.push(tileT2)
                            return answer
                        }
                    }
                }
            }
        }

        //Check row
        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile1 = this.tileManager.getTile(i, j) as Tile
                const tile2 = this.tileManager.getTile(i + 1, j)
                const tile3 = this.tileManager.getTile(i + 2, j)

                if (!tile2) continue

                if (tile1.getKey() === tile2.getKey()) {
                    const listTile = [
                        {
                            T1: this.tileManager.getTile(i - 1, j - 1),
                            T2: this.tileManager.getTile(i - 1, j),
                        },
                        {
                            T1: this.tileManager.getTile(i - 1, j + 1),
                            T2: this.tileManager.getTile(i - 1, j),
                        },
                        {
                            T1: this.tileManager.getTile(i + 2, j - 1),
                            T2: this.tileManager.getTile(i + 2, j),
                        },
                        {
                            T1: this.tileManager.getTile(i + 2, j + 1),
                            T2: this.tileManager.getTile(i + 2, j),
                        },
                        {
                            T1: this.tileManager.getTile(i - 2, j),
                            T2: this.tileManager.getTile(i - 1, j),
                        },
                        {
                            T1: this.tileManager.getTile(i + 3, j),
                            T2: this.tileManager.getTile(i + 2, j),
                        },
                    ]

                    for (let i = 0; i < listTile.length; i++) {
                        const tileT1 = listTile[i].T1
                        const tileT2 = listTile[i].T2

                        if (tileT1 && tileT2 && tile1.getKey() === tileT1.getKey()) {
                            answer.push(tileT1)
                            answer.push(tileT2)
                            return answer
                        }
                    }
                }
                if (!tile3) continue
                if (tile1.getKey() === tile3.getKey()) {
                    const listTile = [
                        {
                            T1: this.tileManager.getTile(i + 1, j - 1),
                            T2: this.tileManager.getTile(i + 1, j),
                        },
                        {
                            T1: this.tileManager.getTile(i + 1, j + 1),
                            T2: this.tileManager.getTile(i + 1, j),
                        },
                    ]

                    for (let i = 0; i < listTile.length; i++) {
                        const tileT1 = listTile[i].T1
                        const tileT2 = listTile[i].T2

                        if (tileT1 && tileT2 && tile1.getKey() === tileT1.getKey()) {
                            answer.push(tileT1)
                            answer.push(tileT2)
                            return answer
                        }
                    }
                }
            }
        }
        return answer
    }

    private showHint(): void {
        const listTile = this.handleHint()
        if (listTile.length == 0) {
            this.shuffle()
            return
        }
        this.hintTile1 = listTile[0]
        this.hintTile2 = listTile[1]
        if (this.hintTile1 && this.hintTile2) {
            if (IS_AUTO_PLAY) {
                this.onTileClicked(null, this.hintTile1)
                this.onTileClicked(null, this.hintTile2)
            } else {
                this.hintTile1.showHint()
                this.hintTile2.showHint()
            }
        }
    }

    private hideHint(): void {
        if (this.hintTile1 && this.hintTile2) {
            this.hintTile1.hideHint()
            this.hintTile2.hideHint()

            if (this.firstSelectedTile) this.firstSelectedTile.showGraphics()

            this.hintTile1 = this.hintTile2 = null
        }
    }

    private convertToKey(i: number, j: number): string {
        return i.toString() + j.toString()
    }

    public shuffle(): void {
        this.boardState = BOARD_STATE.HANDLING
        this.idleTime = 0
        const shape = this.getRandomShape()

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile = this.tileManager.getTile(i, j) as Tile
                tile.setTexture(this.tileManager.getRandomCandyKey(tile.gridX, tile.gridY))

                const temp = {
                    value: (i * CONST.gridHeight + j) / (CONST.gridHeight * CONST.gridWidth),
                }

                const point = this.getPointFromShape(shape, temp.value)

                tile.goToPosition(point.x, point.y, () => {
                    const tween = this.tweens.add({
                        targets: temp,
                        value:
                            (i * CONST.gridHeight + j) / (CONST.gridHeight * CONST.gridWidth) + 1,
                        duration: 1000,
                        ease: 'Linear',
                        onComplete: () => {
                            this.tileManager.getTile(i, j)?.updatePositon(
                                true,
                                () => {
                                    this.tileManager.shuffleCandyList()
                                    this.boardState = BOARD_STATE.IDLE
                                    this.handleMatch()
                                },
                                Phaser.Math.Between(0, 500)
                            )
                            tween.destroy()
                        },
                        onUpdate: () => {
                            let val = temp.value
                            if (val > 1) val -= 1
                            const point = this.getPointFromShape(shape, val)
                            tile.x = point.x
                            tile.y = point.y
                            tile.updateSuperEmitterPosition()
                        },
                    })
                })
            }
        }
    }

    private getRandomShape(): Phaser.Geom.Rectangle | Phaser.Geom.Circle | Phaser.Geom.Ellipse {
        const randomNumber = Phaser.Math.Between(0, 2)
        const centerX = this.cameras.main.width / 2
        const centerY = this.cameras.main.height / 2
        switch (randomNumber) {
            case 0:
                return new Phaser.Geom.Rectangle(centerX - 150, centerY - 150, 300, 300)
            case 1:
                return new Phaser.Geom.Circle(centerX, centerY, 200)
            default:
                return new Phaser.Geom.Ellipse(centerX, centerY, 200, 300)
        }
    }

    private getPointFromShape(
        shape: Phaser.Geom.Rectangle | Phaser.Geom.Circle | Phaser.Geom.Ellipse,
        value: number
    ): Phaser.Geom.Point {
        if (shape instanceof Phaser.Geom.Rectangle)
            return Phaser.Geom.Rectangle.GetPoint(shape, value)
        else if (shape instanceof Phaser.Geom.Circle)
            return Phaser.Geom.Circle.GetPoint(shape, value)
        return Phaser.Geom.Ellipse.GetPoint(shape, value)
    }
}
