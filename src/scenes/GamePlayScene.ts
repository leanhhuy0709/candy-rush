import { CONST, SCENE } from '../const/const'
import ScoreBoard from '../objects/ScoreBoard'
import { Tile } from '../objects/Tile'

export enum BOARD_STATE {
    IDLE,
    HANDLING,
}

const COLOR_LIST = ['#ffffff', '#bcffe3', '#20b2aa', '#ff1919']

export class GamePlayScene extends Phaser.Scene {
    private tileMap: Map<string, Tile>

    private firstSelectedTile: Tile | null
    private secondSelectedTile: Tile | null

    private scoreBoard: ScoreBoard

    private idleTime: number
    private isIdleTweenPlaying: boolean

    private hintTile1: Tile | null
    private hintTile2: Tile | null

    private boardState: BOARD_STATE

    private emitter: Phaser.GameObjects.Particles.ParticleEmitter

    constructor() {
        super({
            key: SCENE.GAMEPLAY,
        })
    }

    public create() {
        this.add.image(0, 0, 'bg').setOrigin(0, 0)
        this.tileMap = new Map<string, Tile>()

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                this.setTile(i, j, this.getRandomTile(i, j))
            }
        }
        this.firstSelectedTile = this.getTile(0, 0) as Tile
        this.secondSelectedTile = this.getTile(0, 1) as Tile

        this.scoreBoard = new ScoreBoard(this)

        this.boardState = BOARD_STATE.HANDLING
        this.shuffle()

        this.input.on('gameobjectdown', this.onTileClicked, this)

        //-------------------------------------------------------------
        const shape1 = new Phaser.Geom.Circle(0, 0, 160)
        const shape4 = new Phaser.Geom.Line(400, 300, 30, 50)
        const emitter = this.add.particles(400, 300, 'flares', {
            frame: { frames: ['red', 'green', 'blue', 'white', 'yellow'], cycle: true },
            blendMode: 'ADD',
            lifespan: { min: 200, max: 500 },
            quantity: 4,
            scale: { start: 0.3, end: 0.1 },
            speed: { min: 50, max: 100 },
        })
        emitter.addEmitZone({ type: 'edge', source: shape4, quantity: 64, total: 1 })
    }

    public update(_time: number, delta: number) {
        if (this.idleTime == 0) this.isIdleTweenPlaying = false
        this.idleTime += delta
        this.handleIdleTime()

        if (this.boardState == BOARD_STATE.IDLE) {
            this.scoreBoard.handleGoToNextLevel()
        }
    }

    private getRandomTile(x: number, y: number): Tile {
        const randomTileType: string =
            CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]

        return new Tile(
            {
                scene: this,
                x: this.cameras.main.width / 2,
                y: this.cameras.main.height / 2,
                texture: randomTileType,
            },
            x,
            y
        )
    }

    private onTileClicked(pointer: Phaser.Input.Pointer | null, gameObject: Tile) {
        this.idleTime = 0
        if (!this.firstSelectedTile) {
            this.firstSelectedTile = gameObject
            this.firstSelectedTile.selectEffect()
        } else if (!this.secondSelectedTile) {
            this.secondSelectedTile = gameObject
            this.secondSelectedTile.selectEffect()

            if (this.isValidSelect()) {
                //Handle
                this.swapTiles(() => {
                    if (this.firstSelectedTile && this.secondSelectedTile) {
                        this.firstSelectedTile.unSelectEffect()
                        this.secondSelectedTile.unSelectEffect()
                        this.boardState = BOARD_STATE.HANDLING

                        this.handleMatch((isMatch = true) => {
                            /*if (!isMatch)
                                this.swapTiles(() => {
                                    this.resetSelect()
                                })
                            else debug*/ this.resetSelect()
                            this.boardState = BOARD_STATE.IDLE
                        })
                    }
                })
            } else {
                this.firstSelectedTile.unSelectEffect()
                this.secondSelectedTile.unSelectEffect()
                this.resetSelect()
            }
        }
    }

    private resetSelect(): void {
        this.firstSelectedTile = null
        this.secondSelectedTile = null
    }

    private isValidSelect(): boolean {
        return true
        /*
        if (this.firstSelectedTile && this.secondSelectedTile) {
            const temp1x = this.firstSelectedTile.gridX,
                temp1y = this.firstSelectedTile.gridY
            const temp2x = this.secondSelectedTile.gridX,
                temp2y = this.secondSelectedTile.gridY

            return Math.abs(temp1x - temp2x) + Math.abs(temp1y - temp2y) === 1
        }
        return false*/
    }

    private swapTiles(onComplete: Function): void {
        if (this.firstSelectedTile && this.secondSelectedTile) {
            const x1 = this.firstSelectedTile.x,
                y1 = this.firstSelectedTile.y,
                x2 = this.secondSelectedTile.x,
                y2 = this.secondSelectedTile.y

            const time = 500

            const tween1 = this.tweens.add({
                targets: [this.firstSelectedTile],
                x: x2,
                y: y2,
                duration: time,
                ease: 'Linear',
                onComplete: () => {
                    if (!tween2.isActive()) {
                        if (this.firstSelectedTile && this.secondSelectedTile)
                            this.swapTwoTiles(
                                this.firstSelectedTile.gridX,
                                this.firstSelectedTile.gridY,
                                this.secondSelectedTile.gridX,
                                this.secondSelectedTile.gridY
                            )
                        onComplete()
                        tween1.destroy()
                        tween2.destroy()
                    }
                },
            })

            const tween2 = this.tweens.add({
                targets: [this.secondSelectedTile],
                x: x1,
                y: y1,
                duration: time,
                ease: 'Linear',
                onComplete: () => {
                    if (!tween1.isActive()) {
                        if (this.firstSelectedTile && this.secondSelectedTile)
                            this.swapTwoTiles(
                                this.firstSelectedTile.gridX,
                                this.firstSelectedTile.gridY,
                                this.secondSelectedTile.gridX,
                                this.secondSelectedTile.gridY
                            )
                        onComplete()
                        tween1.destroy()
                        tween2.destroy()
                    }
                },
            })
        }
    }

    private swapTwoTiles(x1: number, y1: number, x2: number, y2: number): void {
        const tile1 = this.getTile(x1, y1)
        const tile2 = this.getTile(x2, y2)
        if (tile1 && tile2) {
            this.setTile(x1, y1, tile2)
            this.setTile(x2, y2, tile1)

            tile1.gridX = x2
            tile1.gridY = y2
            tile2.gridX = x1
            tile2.gridY = y1
        } else console.log('Error swap!')
    }

    public getTile(i: number, j: number): Tile | undefined {
        return this.tileMap.get(i.toString() + j.toString())
    }

    public setTile(i: number, j: number, tile: Tile): void {
        this.tileMap.set(i.toString() + j.toString(), tile)
    }

    private removeTile(i: number, j: number): void {
        this.tileMap.delete(i.toString() + j.toString())
    }

    private handleMatch(onComplete?: Function, combo = 0): void {
        //0 -> not visited
        //1 -> visited
        //2 -> boom
        this.idleTime = 0
        const directions = [
            { x: 0, y: 1 },
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: -1, y: 0 },
        ]

        const cols = []

        for (let i = 0; i < CONST.gridWidth; i++) cols.push(0)

        const listBoom = []

        const group = new Map<string, number>()
        let groupIndex = 1
        const listGroup = [0]

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const currentTile = this.getTile(i, j) as Tile

                if (!currentTile) console.log('Error index tile!')

                for (let k = 0; k < directions.length; k++) {
                    const tile = this.getTile(i + directions[k].x, j + directions[k].y)

                    if (tile && tile.getKey() === currentTile.getKey()) {
                        //-1 x x 2

                        const tileBehind = this.getTile(i - directions[k].x, j - directions[k].y)
                        const tileNext2 = this.getTile(
                            i + 2 * directions[k].x,
                            j + 2 * directions[k].y
                        )

                        let key = undefined
                        const g1 = group.get(this.convertToKey(i, j))
                        const g2 = group.get(
                            this.convertToKey(i + directions[k].x, j + directions[k].y)
                        )

                        if (g1) key = g1
                        if (g2) key = g2

                        if (tileBehind && tileBehind.getKey() === currentTile.getKey()) {
                            cols[currentTile.gridX]++

                            listBoom.push({ x: i, y: j, newY: -cols[currentTile.gridX] })

                            const g3 = group.get(
                                this.convertToKey(i - directions[k].x, j - directions[k].y)
                            )

                            if (g3) key = g3

                            if (key == undefined) {
                                key = groupIndex
                                listGroup.push(0)
                                groupIndex++
                            }

                            if (g1 != key) {
                                group.set(this.convertToKey(i, j), key)
                                listGroup[key]++
                            }
                            if (g2 != key) {
                                group.set(
                                    this.convertToKey(i + directions[k].x, j + directions[k].y),
                                    key
                                )
                                listGroup[key]++
                            }
                            if (g3 != key) {
                                group.set(
                                    this.convertToKey(i - directions[k].x, j - directions[k].y),
                                    key
                                )
                                listGroup[key]++
                            }

                            break
                        }

                        if (tileNext2 && tileNext2.getKey() === currentTile.getKey()) {
                            cols[currentTile.gridX]++

                            listBoom.push({ x: i, y: j, newY: -cols[currentTile.gridX] })

                            const g3 = group.get(
                                this.convertToKey(i + 2 * directions[k].x, j + 2 * directions[k].y)
                            )

                            if (g3) key = g3

                            if (key == undefined) {
                                key = groupIndex
                                listGroup.push(0)
                                groupIndex++
                            }

                            if (g1 != key) {
                                group.set(this.convertToKey(i, j), key)
                                listGroup[key]++
                            }
                            if (g2 != key) {
                                group.set(
                                    this.convertToKey(i + directions[k].x, j + directions[k].y),
                                    key
                                )
                                listGroup[key]++
                            }
                            if (g3 != key) {
                                group.set(
                                    this.convertToKey(
                                        i + 2 * directions[k].x,
                                        j + 2 * directions[k].y
                                    ),
                                    key
                                )
                                listGroup[key]++
                            }

                            break
                        }
                    }
                }
            }
        }

        const temp = []
        for (let i = 0; i < listGroup.length; i++) temp.push({ x: 0, y: 0, gridX: 0, gridY: 0 })

        for (let i = 0; i < listBoom.length; i++) {
            const data = listBoom[i]
            const tile = this.getTile(data.x, data.y)

            if (tile) {
                const groupID = group.get(this.convertToKey(data.x, data.y)) as number
                temp[groupID].x += tile.x
                temp[groupID].y += tile.y + 10
                temp[groupID].gridX += tile.gridX
                temp[groupID].gridY += tile.gridY

                //
                this.removeTile(data.x, data.y)
                tile.gridY = data.newY
                this.setTile(data.x, data.newY, tile)
                tile.updatePositon(false)
                tile.angle = 0
            }
        }

        for (let i = 1; i < listGroup.length; i++) {
            let scoreGot = 0
            switch (listGroup[i]) {
                case 0:
                case 1:
                case 2:
                    console.log('Error Group')
                    break
                case 3:
                    scoreGot = 30
                    break
                case 4:
                    scoreGot = 60
                    break
                case 5:
                    scoreGot = 100
                    break
                case 6:
                    scoreGot = 200
                    break
                case 7:
                    scoreGot = 400
                    break
                case 8:
                    scoreGot = 700
                    break
                default:
                    scoreGot = 1000
                    break
            }
            let idx = combo + i
            if (idx >= COLOR_LIST.length) idx = COLOR_LIST.length - 1
            scoreGot *= idx
            const gridX = Math.round(temp[i].gridX / listGroup[i])
            const gridY = Math.round(temp[i].gridY / listGroup[i])
            if (listGroup[i] == 4) {
                let x = undefined
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for (const [k, value] of group) {
                    const xKey = Number(k[0])

                    if (xKey == gridX) {
                        x = xKey
                        break
                    }
                }

                if (x) {
                    const y = -cols[x]

                    cols[x]--

                    const tile = this.getTile(x, y)

                    if (tile) {
                        this.removeTile(x, y)
                        tile.gridX = gridX
                        tile.gridY = gridY
                        this.setTile(gridX, gridY, tile)
                        tile.updatePositon(false)
                        tile.scale = 0

                        this.tweens.add({
                            targets: tile,
                            scale: 1,
                            duration: 2000,
                        })
                    } else console.log('Error Tile!')
                }
            } else if (listGroup[i] >= 5) {
                /*
                console.log(temp[i].gridX, temp[i].gridY, gridX, gridY)
                let x = undefined
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for (const [k, value] of group) {
                    const xKey = Number(k[0])

                    if (xKey == gridX) {
                        x = xKey
                        break
                    }
                }

                if (x) {
                    const y = -cols[x]

                    cols[x]--

                    const tile = this.getTile(x, y)

                    if (tile) {
                        this.removeTile(x, y)
                        tile.gridX = gridX
                        tile.gridY = gridY
                        this.setTile(gridX, gridY, tile)
                        tile.updatePositon(false)
                        tile.scale = 0

                        this.tweens.add({
                            targets: tile,
                            scale: 1,
                            duration: 2000,
                        })
                    } else console.log('Error Tile!')
                }
                */
            }

            this.scoreBoard.addScore(scoreGot)
            const text = this.add
                .text(temp[i].x / listGroup[i], temp[i].y / listGroup[i], scoreGot.toString(), {
                    fontFamily: 'Cambria',
                    fontSize: 25,
                    color: COLOR_LIST[idx],
                })
                .setDepth(6)
                .setOrigin(0.5, 0.5)
                .setAlpha(0)
                .setStroke('#000000', 2)

            const tween = this.tweens.add({
                targets: text,
                alpha: 1,
                duration: 700,
                y: temp[i].y / listGroup[i] - 10,
                onComplete: () => {
                    text.destroy()
                    tween.destroy()
                },
            })
        }

        if (listBoom.length) {
            for (let i = 0; i < CONST.gridWidth; i++) {
                let num = 0
                for (let j = CONST.gridHeight - 1; j >= -cols[i]; j--) {
                    const tile = this.getTile(i, j)

                    if (tile) {
                        if (num > 0) {
                            if (j < 0) tile.setRandomTextures()
                            this.removeTile(i, j)
                            tile.gridY = j + num
                            this.setTile(i, j + num, tile)
                            tile.updatePositon(
                                true,
                                () => {
                                    this.handleMatch(() => {
                                        if (onComplete) onComplete()
                                    }, combo + listGroup.length - 1)
                                },
                                undefined,
                                1300
                            )
                        }
                    } else num++
                }
            }
        } else if (onComplete) onComplete(false)
    }

    private idleEffect(): void {
        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile = this.getTile(i, j) as Tile
                if (!this.isIdleTweenPlaying) {
                    this.tweens.add({
                        targets: tile,
                        angle: 360,
                        delay: ((i * CONST.gridHeight + j) / 64) * 1000,
                        duration: 1000,
                        ease: 'Linear',
                        onComplete: () => {
                            //
                        },
                    })
                }
            }
        }
        this.isIdleTweenPlaying = true
    }

    private handleIdleTime(): void {
        if (this.idleTime > 5000) {
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
                const tile1 = this.getTile(i, j) as Tile
                const tile2 = this.getTile(i, j + 1)
                const tile3 = this.getTile(i, j + 2)

                if (!tile2) continue

                if (tile1.getKey() === tile2.getKey()) {
                    const listTile = [
                        { T1: this.getTile(i - 1, j - 1), T2: this.getTile(i, j - 1) },
                        { T1: this.getTile(i + 1, j - 1), T2: this.getTile(i, j - 1) },
                        { T1: this.getTile(i - 1, j + 2), T2: this.getTile(i, j + 2) },
                        { T1: this.getTile(i + 1, j + 2), T2: this.getTile(i, j + 2) },
                        { T1: this.getTile(i, j - 2), T2: this.getTile(i, j - 1) },
                        { T1: this.getTile(i, j + 3), T2: this.getTile(i, j + 2) },
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
                        { T1: this.getTile(i - 1, j + 1), T2: this.getTile(i, j + 1) },
                        { T1: this.getTile(i + 1, j + 1), T2: this.getTile(i, j + 1) },
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
                const tile1 = this.getTile(i, j) as Tile
                const tile2 = this.getTile(i + 1, j)
                const tile3 = this.getTile(i + 2, j)

                if (!tile2) continue

                if (tile1.getKey() === tile2.getKey()) {
                    const listTile = [
                        { T1: this.getTile(i - 1, j - 1), T2: this.getTile(i - 1, j) },
                        { T1: this.getTile(i - 1, j + 1), T2: this.getTile(i - 1, j) },
                        { T1: this.getTile(i + 2, j - 1), T2: this.getTile(i + 2, j) },
                        { T1: this.getTile(i + 2, j + 1), T2: this.getTile(i + 2, j) },
                        { T1: this.getTile(i - 2, j), T2: this.getTile(i - 1, j) },
                        { T1: this.getTile(i + 3, j), T2: this.getTile(i + 2, j) },
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
                        { T1: this.getTile(i + 1, j - 1), T2: this.getTile(i + 1, j) },
                        { T1: this.getTile(i + 1, j + 1), T2: this.getTile(i + 1, j) },
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
            this.firstSelectedTile = this.getTile(0, 0) as Tile
            this.secondSelectedTile = this.getTile(0, 1) as Tile
            this.shuffle()
            return
        }
        this.hintTile1 = listTile[0]
        this.hintTile2 = listTile[1]
        if (this.hintTile1 && this.hintTile2) {
            this.hintTile1.showHint()
            this.hintTile2.showHint()
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
        this.idleTime = 0
        const shape = this.getRandomShape()

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile = this.getTile(i, j) as Tile
                tile.setRandomTextures()

                const temp = {
                    value: (i * CONST.gridHeight + j) / (CONST.gridHeight * CONST.gridWidth),
                }

                const point = this.getPointFromShape(shape, temp.value)

                tile.goToPosition(point.x, point.y, () => {
                    this.tweens.add({
                        targets: temp,
                        value:
                            (i * CONST.gridHeight + j) / (CONST.gridHeight * CONST.gridWidth) + 1,
                        duration: 1000,
                        ease: 'Linear',
                        onComplete: () => {
                            this.getTile(i, j)?.updatePositon(
                                true,
                                () => {
                                    this.handleMatch(() => {
                                        this.idleTime = 0
                                        this.firstSelectedTile = null
                                        this.secondSelectedTile = null
                                        this.boardState = BOARD_STATE.IDLE
                                    })
                                },
                                Phaser.Math.Between(0, 500)
                            )
                        },
                        onUpdate: () => {
                            let val = temp.value
                            if (val > 1) val -= 1
                            const point = this.getPointFromShape(shape, val)
                            tile.x = point.x
                            tile.y = point.y
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
