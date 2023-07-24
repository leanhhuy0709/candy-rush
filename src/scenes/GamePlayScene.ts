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
const IS_AUTO_PLAY = false
const IDLE_TIME = 5000

export class GamePlayScene extends Phaser.Scene {
    private firstSelectedTile: Tile | null
    private secondSelectedTile: Tile | null

    private idleTime: number
    private isIdleTweenPlaying: boolean

    private hintTile1: Tile | null
    private hintTile2: Tile | null

    public tileManager: TileManager
    public boardState: BOARD_STATE
    public scoreBoard: ScoreBoard

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats: any

    addStats() {
        this.stats = document.createElement('span')
        this.stats.style.position = 'fixed'
        this.stats.style.left = '0'
        this.stats.style.bottom = '0'
        this.stats.style.backgroundColor = 'black'
        this.stats.style.minWidth = '200px'
        this.stats.style.padding = '15px'

        this.stats.style.color = 'white'
        this.stats.style.fontFamily = 'Courier New'
        this.stats.style.textAlign = 'center'
        this.stats.innerText = 'Draw calls: ?'

        document.body.append(this.stats)
    }

    countDrawCalls() {
        const renderer = this.game.renderer
        if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
            let drawCalls = 0

            const pipelines = renderer.pipelines.pipelines.values()

            renderer.on(Phaser.Renderer.Events.PRE_RENDER, () => (drawCalls = 0))
            pipelines.forEach((p) =>
                p.on(Phaser.Renderer.WebGL.Pipelines.Events.AFTER_FLUSH, () => drawCalls++)
            )
            renderer.on(Phaser.Renderer.Events.POST_RENDER, () => this.redrawStats(drawCalls))
        } else {
            renderer.on(Phaser.Renderer.Events.POST_RENDER, () =>
                this.redrawStats(renderer.drawCount)
            )
        }
    }

    redrawStats(drawCalls = 0) {
        this.stats.innerText = `Draw calls: ${drawCalls}`
    }

    public debugConsole(): void {
        if (!IS_DEBUG) return
        //console something you want
        //console.log(this.children.list)
        this.countDrawCalls()
    }

    public constructor() {
        super({
            key: SCENE.GAMEPLAY,
        })
    }

    public create() {
        if (IS_DEBUG) this.addStats()

        this.add.image(0, 0, 'bg').setOrigin(0, 0)
        ParticleEmitterPool.init(this)
        this.tileManager = new TileManager(this)

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
        this.debugConsole()
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
                onComplete()
            })

            this.secondSelectedTile.goToPosition(x1, y1, undefined, undefined, time, () => {
                onComplete()
            })

            this.tileManager.swapTilesWithoutEffect(
                this.firstSelectedTile.gridX,
                this.firstSelectedTile.gridY,
                this.secondSelectedTile.gridX,
                this.secondSelectedTile.gridY
            )
        }
    }

    private handleMatch(onComplete?: Function): void {
        if (this.boardState == BOARD_STATE.IDLE || this.boardState == BOARD_STATE.SWAPPING) {
            this.boardState = BOARD_STATE.HANDLING

            if (this.firstSelectedTile && this.secondSelectedTile) {
                this.tileManager.handleMatch(
                    [
                        { x: this.secondSelectedTile.gridX, y: this.secondSelectedTile.gridY },
                        { x: this.firstSelectedTile.gridX, y: this.firstSelectedTile.gridY },
                    ],
                    (isMatch = true) => {
                        if (onComplete) onComplete(isMatch)
                        this.boardState = BOARD_STATE.IDLE
                    }
                )
            } else {
                const initQueue: Array<{ x: number; y: number }> = []
                for (let i = 0; i < CONST.gridWidth; i++)
                    for (let j = 0; j < CONST.gridHeight; j++) initQueue.push({ x: i, y: j })
                this.tileManager.handleMatch(initQueue, (isMatch = true) => {
                    if (onComplete) onComplete(isMatch)
                    this.boardState = BOARD_STATE.IDLE
                })
            }
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
        //const listTile = this.tileManager.findBestMove()

        /*if (listTile[0] === undefined || listTile[1] === undefined) {
            this.shuffle()
            return
        }*/

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

    public shuffle(): void {
        //console.log(this.game.loop.actualFps)
        const randomValue = Math.random()
        if (randomValue <= 0.33) this.shuffle3D_2()
        else if (randomValue <= 0.66) this.shuffle3D_3()
        else this.shuffle3D()
        /*
        this.boardState = BOARD_STATE.HANDLING

        const shape = this.getRandomShape()
        this.tileManager.shuffleCandyList()

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile = this.tileManager.getTile(i, j) as Tile
                tile.setTexture('candy', this.tileManager.getRandomFrame(tile.gridX, tile.gridY))

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
        }*/
    }

    private getRandomShape():
        | Phaser.Geom.Rectangle
        | Phaser.Geom.Circle
        | Phaser.Geom.Ellipse
        | Phaser.Geom.Triangle {
        const randomNumber = Phaser.Math.Between(0, 5)
        const centerX = this.cameras.main.width / 2
        const centerY = this.cameras.main.height / 2
        switch (randomNumber) {
            case 0:
                return new Phaser.Geom.Rectangle(centerX - 150, centerY - 150, 300, 300)
            case 1:
                return new Phaser.Geom.Circle(centerX, centerY, 200)
            case 2:
                return new Phaser.Geom.Ellipse(centerX, centerY, 300, 200)
            case 3:
                return new Phaser.Geom.Ellipse(centerX, centerY, 200, 300)
            case 4:
                return new Phaser.Geom.Triangle(
                    centerX,
                    centerY - 200,
                    centerX - 200,
                    centerY + 200,
                    centerX + 200,
                    centerY + 200
                )
            default:
                return new Phaser.Geom.Rectangle(centerX - 200, centerY - 100, 400, 200)
        }
    }

    private getPointFromShape(
        shape:
            | Phaser.Geom.Rectangle
            | Phaser.Geom.Circle
            | Phaser.Geom.Ellipse
            | Phaser.Geom.Triangle,
        value: number
    ): Phaser.Geom.Point {
        if (shape instanceof Phaser.Geom.Rectangle)
            return Phaser.Geom.Rectangle.GetPoint(shape, value)
        else if (shape instanceof Phaser.Geom.Circle)
            return Phaser.Geom.Circle.GetPoint(shape, value)
        else if (shape instanceof Phaser.Geom.Ellipse)
            return Phaser.Geom.Ellipse.GetPoint(shape, value)
        return Phaser.Geom.Triangle.GetPoint(shape, value)
    }

    public shuffle3D(): void {
        this.boardState = BOARD_STATE.HANDLING

        const centerX = this.cameras.main.width / 2
        const centerY = this.cameras.main.height / 2

        const width = 400
        const height = 400
        let step = -0.1
        let check = true

        const shape = new Phaser.Geom.Ellipse(centerX, centerY, width, height)

        this.tileManager.shuffleCandyList()

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile = this.tileManager.getTile(i, j) as Tile
                tile.setTexture('candy', this.tileManager.getRandomFrame(tile.gridX, tile.gridY))

                const temp = {
                    value: (i * CONST.gridHeight + j) / (CONST.gridHeight * CONST.gridWidth),
                    test: 5000,
                }

                const point = this.getPointFromShape(shape, temp.value)

                tile.goToPosition(point.x, point.y, () => {
                    const tween = this.tweens.add({
                        targets: temp,
                        test: 0,
                        duration: 3000,
                        ease: 'Linear',
                        onComplete: () => {
                            tile.setFlipX(false)
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
                            shape.width += step

                            let val = temp.value
                            if (val > 1) val -= 1

                            let tmp = 0
                            if (check) {
                                if (0 <= val && val < 0.25) tmp = 1 - val
                                else if (0.25 <= val && val < 0.5) tmp = val
                                else if (0.5 <= val && val < 0.75) tmp = val
                                else if (0.75 <= val && val <= 1) tmp = val
                                tile.setFlipX(true)
                            } else {
                                if (0 <= val && val < 0.25) tmp = val
                                else if (0.25 <= val && val < 0.5) tmp = 1 - val
                                else if (0.5 <= val && val < 0.75) tmp = 1 - val
                                else if (0.75 <= val && val <= 1) tmp = 1 - val
                                tile.setFlipX(false)
                            }
                            let val2 = (1 - Math.abs(shape.width) / width) * 1.5
                            if (val2 >= 1) val2 = 1
                            else if (val2 <= 0.1) val2 = 0.1
                            tile.scaleX = val2

                            tile.setDepth(1 + tmp)

                            if (shape.width <= -width) {
                                step = 0.1
                                check = !check
                            }
                            if (shape.width >= width) {
                                step = -0.1
                                check = !check
                            }

                            const point = this.getPointFromShape(shape, val)
                            tile.x = point.x
                            tile.y = point.y
                            tile.updateSuperEmitterPosition()
                        },
                        repeat: 3,
                    })
                })
            }
        }
    }

    public shuffle3D_2(): void {
        this.boardState = BOARD_STATE.HANDLING

        const centerX = this.cameras.main.width / 2
        const centerY = this.cameras.main.height / 2

        const point1 = { x: centerX, y: centerY - 200 }
        const point2 = { x: centerX - 200, y: centerY + 200 }
        const point3 = { x: centerX + 200, y: centerY + 200 }
        const point4 = { x: centerX, y: centerY + 100 }

        const line1 = new Phaser.Geom.Line(point2.x, point2.y, point4.x, point4.y)
        const line2 = new Phaser.Geom.Line(point4.x, point4.y, point3.x, point3.y)
        const line3 = new Phaser.Geom.Line(point3.x, point3.y, point2.x, point2.y)
        const line4 = new Phaser.Geom.Line(point2.x, point2.y, point1.x, point1.y)
        const line5 = new Phaser.Geom.Line(point1.x, point1.y, point3.x, point3.y)
        const line6 = new Phaser.Geom.Line(point1.x, point1.y, point4.x, point4.y)

        this.tileManager.shuffleCandyList()

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile = this.tileManager.getTile(i, j) as Tile
                tile.setTexture('candy', this.tileManager.getRandomFrame(tile.gridX, tile.gridY))

                const temp = {
                    value: (i * CONST.gridHeight + j) / (CONST.gridHeight * CONST.gridWidth),
                    test: 5000,
                }

                let point = { x: 0, y: 0 }

                if (temp.value <= 1.0 / 6) {
                    point = line1.getPoint(temp.value * 6)
                    tile.setDepth(1)
                } else if (temp.value <= 2.0 / 6) {
                    point = line2.getPoint((temp.value - 1 / 6) * 6)
                    tile.setDepth(1.2)
                } else if (temp.value <= 3.0 / 6) {
                    point = line3.getPoint((temp.value - 2 / 6) * 6)
                    tile.setDepth(1.4)
                } else if (temp.value <= 4.0 / 6) {
                    point = line4.getPoint((temp.value - 3 / 6) * 6)
                    tile.setDepth(1.5)
                } else if (temp.value <= 5.0 / 6) {
                    point = line5.getPoint((temp.value - 4 / 6) * 6)
                    tile.setDepth(1.6)
                } else {
                    point = line6.getPoint((temp.value - 5 / 6) * 6)
                    tile.setDepth(0.9)
                }

                tile.goToPosition(point.x, point.y, () => {
                    const tween = this.tweens.add({
                        targets: temp,
                        test: 0,
                        value:
                            (i * CONST.gridHeight + j) / (CONST.gridHeight * CONST.gridWidth) + 1,
                        duration: 2000,
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

                            let point = { x: 0, y: 0 }

                            if (val <= 1.0 / 6) {
                                point = line1.getPoint(val * 6)
                                tile.setDepth(1)
                            } else if (val <= 2.0 / 6) {
                                point = line2.getPoint((val - 1 / 6) * 6)
                                tile.setDepth(1.2)
                            } else if (val <= 3.0 / 6) {
                                point = line3.getPoint((val - 2 / 6) * 6)
                                tile.setDepth(1.4)
                            } else if (val <= 4.0 / 6) {
                                point = line4.getPoint((val - 3 / 6) * 6)
                                tile.setDepth(1.5)
                            } else if (val <= 5.0 / 6) {
                                point = line5.getPoint((val - 4 / 6) * 6)
                                tile.setDepth(1.6)
                            } else {
                                point = line6.getPoint((val - 5 / 6) * 6)
                                tile.setDepth(0.9)
                            }

                            tile.x = point.x
                            tile.y = point.y
                            tile.updateSuperEmitterPosition()
                        },
                        repeat: 1,
                    })
                })
            }
        }
    }

    public shuffle3D_3(): void {
        this.boardState = BOARD_STATE.HANDLING

        const centerX = this.cameras.main.width / 2
        const centerY = this.cameras.main.height / 2

        const point1 = { x: centerX, y: centerY }
        const point2 = { x: centerX - 200, y: centerY - 200 }
        const point3 = { x: centerX + 200, y: centerY - 200 }
        const point4 = { x: centerX + 200, y: centerY + 200 }
        const point5 = { x: centerX - 200, y: centerY + 200 }
        const R = Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2)

        const line1 = new Phaser.Geom.Line(point2.x, point2.y, point4.x, point4.y)
        const line2 = new Phaser.Geom.Line(point3.x, point3.y, point5.x, point5.y)
        const shape = new Phaser.Geom.Circle(point1.x, point1.y, R)

        const data = [R, (R / 2) * Math.PI, 2 * R, (R / 2) * Math.PI, R]
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        for (let i = 0; i < data.length; i++) {
            if (i > 0) data[i] = data[i] / sum + data[i - 1]
            else data[i] /= sum
        }

        this.tileManager.shuffleCandyList()

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile = this.tileManager.getTile(i, j) as Tile
                tile.setTexture('candy', this.tileManager.getRandomFrame(tile.gridX, tile.gridY))

                const temp = {
                    value: (i * CONST.gridHeight + j) / (CONST.gridHeight * CONST.gridWidth),
                    test: 5000,
                }
                let point = { x: 0, y: 0 }
                let k = 0,
                    prev = 0
                for (; k < data.length; k++) {
                    if (k > 0) prev = data[k - 1]
                    if (temp.value <= data[k]) {
                        break
                    }
                }
                switch (k) {
                    case 0:
                        point = line2.getPoint((1 - (temp.value - prev) / (data[k] - prev)) * 0.5)
                        tile.setDepth(temp.value)
                        break
                    case 1:
                        // 7/8 - 5/8
                        point = shape.getPoint(
                            ((1 - (temp.value - prev) / (data[k] - prev)) * 2) / 8 + 5 / 8
                        )
                        tile.setDepth(temp.value)
                        break
                    case 2:
                        point = line1.getPoint((temp.value - prev) / (data[k] - prev))
                        tile.setDepth(temp.value)
                        break
                    case 3:
                        // 1/8 - 3/8
                        point = shape.getPoint(
                            (((temp.value - prev) / (data[k] - prev)) * 2) / 8 + 1 / 8
                        )
                        tile.setDepth(temp.value)
                        break
                    default:
                        point = line2.getPoint(
                            (1 - (temp.value - prev) / (data[k] - prev)) * 0.5 + 0.5
                        )
                        tile.setDepth(temp.value)
                        break
                }

                tile.goToPosition(point.x, point.y, () => {
                    const tween = this.tweens.add({
                        targets: temp,
                        test: 0,
                        value:
                            (i * CONST.gridHeight + j) / (CONST.gridHeight * CONST.gridWidth) + 1,
                        duration: 4000,
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
                            let k = 0,
                                prev = 0
                            for (; k < data.length; k++) {
                                if (k > 0) prev = data[k - 1]
                                if (val <= data[k]) {
                                    break
                                }
                            }

                            let point = { x: 0, y: 0 }
                            switch (k) {
                                case 0:
                                    point = line2.getPoint(
                                        (1 - (val - prev) / (data[k] - prev)) * 0.5
                                    )
                                    tile.setDepth(val)
                                    break
                                case 1:
                                    // 7/8 - 5/8
                                    point = shape.getPoint(
                                        ((1 - (val - prev) / (data[k] - prev)) * 2) / 8 + 5 / 8
                                    )
                                    tile.setDepth(val)
                                    break
                                case 2:
                                    point = line1.getPoint((val - prev) / (data[k] - prev))
                                    tile.setDepth(val)
                                    break
                                case 3:
                                    // 1/8 - 3/8
                                    point = shape.getPoint(
                                        (((val - prev) / (data[k] - prev)) * 2) / 8 + 1 / 8
                                    )
                                    tile.setDepth(val)
                                    break
                                default:
                                    point = line2.getPoint(
                                        (1 - (val - prev) / (data[k] - prev)) * 0.5 + 0.5
                                    )
                                    tile.setDepth(val)
                                    break
                            }

                            tile.x = point.x
                            tile.y = point.y
                            tile.updateSuperEmitterPosition()
                        },
                        repeat: 1,
                    })
                })
            }
        }
    }
}
