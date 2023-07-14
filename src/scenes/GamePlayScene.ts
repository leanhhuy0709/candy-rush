import { CONST, SCENE } from '../const/const'
import ParticleEmitterPool from '../objects/ParticleEmitterPool'
import ScoreBoard from '../objects/ScoreBoard'
import { Tile } from '../objects/Tile'

export enum BOARD_STATE {
    IDLE,
    HANDLING,
}

const COLOR_LIST = ['#ffffff', '#bcffe3', '#20b2aa', '#ffd966']

const IS_DEBUG = false
const IS_AUTO_PLAY = true
const IDLE_TIME = 2000
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

    public constructor() {
        super({
            key: SCENE.GAMEPLAY,
        })
    }

    public create() {
        this.add.image(0, 0, 'bg').setOrigin(0, 0)
        ParticleEmitterPool.init(this)
        this.tileMap = new Map<string, Tile>()

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                this.setTile(
                    i,
                    j,
                    new Tile(
                        {
                            scene: this,
                            x: this.cameras.main.width / 2,
                            y: this.cameras.main.height / 2,
                            texture:
                                CONST.candyTypes[
                                    Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)
                                ],
                        },
                        i,
                        j
                    )
                )
            }
        }

        this.scoreBoard = new ScoreBoard(this)

        this.boardState = BOARD_STATE.HANDLING
        this.shuffle()

        this.input.on('gameobjectdown', this.onTileClicked, this)
    }

    public update(_time: number, delta: number) {
        if (this.idleTime == 0) this.isIdleTweenPlaying = false
        this.idleTime += delta
        this.handleIdleTime()

        if (this.boardState == BOARD_STATE.IDLE) {
            this.scoreBoard.handleGoToNextLevel()
        }
    }

    private onTileClicked(pointer: Phaser.Input.Pointer | null, gameObject: Tile) {
        if (this.boardState != BOARD_STATE.IDLE) return
        this.idleTime = 0
        if (!this.firstSelectedTile) {
            this.firstSelectedTile = gameObject
            this.firstSelectedTile.selectEffect()
        } else if (!this.secondSelectedTile) {
            this.secondSelectedTile = gameObject
            this.secondSelectedTile.selectEffect()

            if (this.isValidSelect()) {
                this.swapTiles(() => {
                    if (this.firstSelectedTile && this.secondSelectedTile) {
                        this.firstSelectedTile.unSelectEffect()
                        this.secondSelectedTile.unSelectEffect()

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
                this.firstSelectedTile.unSelectEffect()
                this.secondSelectedTile.unSelectEffect()
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
        if (this.firstSelectedTile && this.secondSelectedTile) {
            const x1 = this.firstSelectedTile.x,
                y1 = this.firstSelectedTile.y,
                x2 = this.secondSelectedTile.x,
                y2 = this.secondSelectedTile.y

            const time = 500

            this.firstSelectedTile.goToPosition(x2, y2, undefined, undefined, time, () => {
                if (this.firstSelectedTile && this.secondSelectedTile)
                    this.swapTilesWithoutEffect(
                        this.firstSelectedTile.gridX,
                        this.firstSelectedTile.gridY,
                        this.secondSelectedTile.gridX,
                        this.secondSelectedTile.gridY
                    )
                onComplete()
            })

            this.secondSelectedTile.goToPosition(x1, y1, undefined, undefined, time, () => {
                if (this.firstSelectedTile && this.secondSelectedTile)
                    this.swapTilesWithoutEffect(
                        this.firstSelectedTile.gridX,
                        this.firstSelectedTile.gridY,
                        this.secondSelectedTile.gridX,
                        this.secondSelectedTile.gridY
                    )
                onComplete()
            })
        }
    }

    private swapTilesWithoutEffect(x1: number, y1: number, x2: number, y2: number): void {
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

    private handleMatch(onComplete?: Function, combo = 1): void {
        this.idleTime = 0
        this.boardState = BOARD_STATE.HANDLING
        const directions = [
            { x: 0, y: 1 },
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: -1, y: 0 },
        ]

        Tile.boomFlag = 0

        const cols: number[] = []
        for (let i = 0; i < CONST.gridWidth; i++) cols.push(0)

        const listBoom: Array<{ x: number; y: number; newY: number }> = []

        const group = new Map<string, number>()
        let groupIndex = 1
        const listGroup = [0]

        const groupZeroBoom: Array<{ x: number; y: number }> = []

        //traverse all tile, check tile boom
        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const currentTile = this.getTile(i, j) as Tile
                if (!currentTile) console.log('Error index tile!', this.tileMap)
                const g1 = group.get(this.convertToKey(i, j))

                let k = 0
                let isBoom = false
                for (; k < directions.length; k++) {
                    const tile = this.getTile(i + directions[k].x, j + directions[k].y)

                    if (tile && tile.getKey() === currentTile.getKey()) {
                        const g2 = group.get(
                            this.convertToKey(i + directions[k].x, j + directions[k].y)
                        )
                        //-1 x x 2
                        const tileBehind = this.getTile(i - directions[k].x, j - directions[k].y)
                        const tileNext2 = this.getTile(
                            i + 2 * directions[k].x,
                            j + 2 * directions[k].y
                        )
                        let key = undefined

                        if (g1) key = g1
                        if (g2) key = g2

                        if (tileBehind && tileBehind.getKey() === currentTile.getKey()) {
                            if (!isBoom) {
                                cols[currentTile.gridX]++
                                currentTile.boom()
                                listBoom.push({ x: i, y: j, newY: -cols[currentTile.gridX] })
                            }

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

                            isBoom = true
                        }

                        if (!isBoom && tileNext2 && tileNext2.getKey() === currentTile.getKey()) {
                            if (!isBoom) {
                                cols[currentTile.gridX]++
                                currentTile.boom()
                                listBoom.push({ x: i, y: j, newY: -cols[currentTile.gridX] })
                            }
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

                            isBoom = true
                        }

                        if (isBoom) {
                            if (currentTile.isSuperTile()) {
                                for (let m = -1; m <= 1; m++) {
                                    for (let n = -1; n <= 1; n++) {
                                        if (
                                            !group.has(this.convertToKey(i + m, j + n)) &&
                                            this.getTile(i + m, j + n)
                                        ) {
                                            group.set(this.convertToKey(i + m, j + n), 0)
                                            groupZeroBoom.push({ x: i + m, y: j + n })
                                        }
                                    }
                                }

                                //effect big 4
                                this.scoreBoard.emitterScoreEffect(
                                    currentTile.x,
                                    currentTile.y,
                                    () => this.scoreBoard.addScore(250 * (combo < 4 ? combo : 4))
                                )

                                const text = this.add
                                    .text(
                                        currentTile.x,
                                        currentTile.y + 10,
                                        (250 * (combo < 4 ? combo : 4)).toString(),
                                        {
                                            fontFamily: 'Cambria',
                                            fontSize: 32,
                                            color: COLOR_LIST[1],
                                        }
                                    )
                                    .setDepth(6)
                                    .setOrigin(0.5, 0.5)
                                    .setAlpha(0)
                                    .setStroke('#000000', 2)

                                const tween = this.tweens.add({
                                    targets: text,
                                    alpha: 1,
                                    duration: 700,
                                    y: currentTile.y,
                                    onComplete: () => {
                                        text.destroy()
                                        tween.destroy()
                                    },
                                })

                                currentTile.setSuper(false)
                            } else if (currentTile.isMegaTile()) {
                                for (let m = 0; m <= CONST.gridWidth; m++) {
                                    if (!group.has(this.convertToKey(m, j)) && this.getTile(m, j)) {
                                        group.set(this.convertToKey(m, j), 0)
                                        groupZeroBoom.push({ x: m, y: j })
                                    }
                                }
                                for (let m = 0; m <= CONST.gridHeight; m++) {
                                    if (!group.has(this.convertToKey(i, m)) && this.getTile(i, m)) {
                                        group.set(this.convertToKey(i, m), 0)
                                        groupZeroBoom.push({ x: i, y: m })
                                    }
                                }

                                //effect big 5
                                this.scoreBoard.emitterScoreEffect(
                                    currentTile.x,
                                    currentTile.y,
                                    () => this.scoreBoard.addScore(600 * (combo < 4 ? combo : 4))
                                )

                                const text = this.add
                                    .text(
                                        currentTile.x,
                                        currentTile.y + 10,
                                        (600 * (combo < 4 ? combo : 4)).toString(),
                                        {
                                            fontFamily: 'Cambria',
                                            fontSize: 32,
                                            color: COLOR_LIST[1],
                                        }
                                    )
                                    .setDepth(6)
                                    .setOrigin(0.5, 0.5)
                                    .setAlpha(0)
                                    .setStroke('#000000', 2)

                                const tween = this.tweens.add({
                                    targets: text,
                                    alpha: 1,
                                    duration: 700,
                                    y: currentTile.y,
                                    onComplete: () => {
                                        text.destroy()
                                        tween.destroy()
                                    },
                                })

                                currentTile.setMega(false)
                            }
                        }
                    }
                }
            }
        }

        while (groupZeroBoom.length > 0) {
            const obj = groupZeroBoom.pop() as { x: number; y: number }
            const g = group.get(this.convertToKey(obj.x, obj.y))

            if (g != 0) continue

            if (obj.x < 0) console.log(obj.x)
            const tile = this.getTile(obj.x, obj.y)

            if (tile) {
                cols[obj.x]++
                tile.boom()

                listBoom.push({ x: obj.x, y: obj.y, newY: -cols[obj.x] })

                if (tile.isSuperTile()) {
                    for (let m = -1; m <= 1; m++) {
                        for (let n = -1; n <= 1; n++) {
                            if (
                                !group.has(this.convertToKey(obj.x + m, obj.y + n)) &&
                                this.getTile(obj.x + m, obj.y + n)
                            ) {
                                group.set(this.convertToKey(obj.x + m, obj.y + n), 0)
                                groupZeroBoom.push({ x: obj.x + m, y: obj.y + n })
                            }
                        }
                    }
                    tile.setSuper(false)
                } else if (tile.isMegaTile()) {
                    for (let m = 0; m <= CONST.gridWidth; m++) {
                        if (!group.has(this.convertToKey(m, obj.y)) && this.getTile(m, obj.y)) {
                            group.set(this.convertToKey(m, obj.y), 0)
                            groupZeroBoom.push({ x: m, y: obj.y })
                        }
                    }
                    for (let m = 0; m <= CONST.gridHeight; m++) {
                        if (!group.has(this.convertToKey(obj.x, m)) && this.getTile(obj.x, m)) {
                            group.set(this.convertToKey(obj.x, m), 0)
                            groupZeroBoom.push({ x: obj.x, y: m })
                        }
                    }

                    tile.setMega(false)
                }
            }
        }

        //traverse tileBoom to remove Tile and group tile to listTileFromGroup
        const temp = []
        for (let i = 0; i < listGroup.length; i++) temp.push({ x: 0, y: 0, gridX: 0, gridY: 0 })

        const listTileFromGroup: Array<Array<{ x: number; y: number; tile: Tile }>> = []
        for (let i = 0; i < listGroup.length; i++) listTileFromGroup.push([])

        for (let i = 0; i < listBoom.length; i++) {
            const data = listBoom[i]
            const tile = this.getTile(data.x, data.y)

            if (tile) {
                const groupID = group.get(this.convertToKey(data.x, data.y)) as number
                if (groupID) {
                    temp[groupID].x += tile.x
                    temp[groupID].y += tile.y + 10
                    temp[groupID].gridX = tile.gridX
                    temp[groupID].gridY = tile.gridY
                    listTileFromGroup[groupID].push({ x: tile.gridX, y: tile.gridY, tile: tile })
                }
                this.removeTile(data.x, data.y)
                tile.gridY = data.newY
                this.setTile(data.x, data.newY, tile)
                tile.updatePositon(false)
                tile.angle = 0
            }
        }

        if (Tile.boomFlag > 10) {
            const emitter = ParticleEmitterPool.getParticleEmitter(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                'flares',
                {
                    frame: ['red', 'blue', 'green'],
                    lifespan: 4000,
                    speed: { min: 300, max: 500 },
                    scale: 1,
                    gravityY: 150,
                    blendMode: 'ADD',
                    emitting: false,
                }
            ).setDepth(6)
            emitter.explode(50)

            setTimeout(() => {
                ParticleEmitterPool.removeParticleEmitter(emitter)
            }, 2000)

            Tile.boomFlag = 0
        }

        const queueMatch4Tween = []

        let color = ''
        //calculate score, handle match 4, match 5
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
                    color = COLOR_LIST[0]
                    break
                case 4:
                    scoreGot = 60
                    color = COLOR_LIST[0]
                    break
                case 5:
                    scoreGot = 100
                    color = COLOR_LIST[0]
                    break
                case 6:
                    scoreGot = 200
                    color = COLOR_LIST[1]
                    break
                case 7:
                    scoreGot = 400
                    color = COLOR_LIST[1]
                    break
                case 8:
                    scoreGot = 700
                    color = COLOR_LIST[2]
                    break
                case 9:
                    scoreGot = 1000
                    color = COLOR_LIST[2]
                    break
                default:
                    scoreGot = listGroup[i] * 40 + 1000
                    color = COLOR_LIST[3]
                    break
            }
            let idx = combo - 1
            if (idx >= COLOR_LIST.length) idx = COLOR_LIST.length - 1
            scoreGot *= idx + 1

            //handle location of super/mega tile in match >= 4

            let gridX = -1
            let gridY = -1

            const checkMapX = new Map<number, number>()
            const checkMapY = new Map<number, number>()
            for (let j = 0; j < listTileFromGroup[i].length; j++) {
                const obj = listTileFromGroup[i][j]
                if (!checkMapX.has(obj.x)) checkMapX.set(obj.x, 0)
                if (!checkMapY.has(obj.y)) checkMapY.set(obj.y, 0)

                checkMapX.set(obj.x, (checkMapX.get(obj.x) as number) + 1)
                checkMapY.set(obj.y, (checkMapY.get(obj.y) as number) + 1)
            }
            let maxValueX = -1,
                maxValueY = -1
            for (const [key, value] of checkMapX) {
                if (maxValueX < value) {
                    maxValueX = value
                    gridX = key
                }
            }
            for (const [key, value] of checkMapY) {
                if (maxValueY < value) {
                    maxValueY = value
                    gridY = key
                }
            }
            let j = 0
            for (; j < listTileFromGroup[i].length; j++) {
                const obj = listTileFromGroup[i][j]
                if (obj.x == gridX && obj.y == gridY) break
            }
            if (j == listTileFromGroup[i].length) {
                let j = 0
                for (; j < listTileFromGroup[i].length; j++) {
                    const obj = listTileFromGroup[i][j]
                    if (obj.x == gridX) {
                        gridY = obj.y
                        break
                    }
                }
            }

            if (listGroup[i] >= 4) {
                const tile = this.getTile(gridX, -cols[gridX])
                if (tile) {
                    tile.setTexture(listTileFromGroup[i][0].tile.getKey())

                    cols[tile.gridX]--
                    this.removeTile(tile.gridX, tile.gridY)
                    tile.gridX = gridX
                    tile.gridY = gridY
                    this.setTile(tile.gridX, tile.gridY, tile)

                    tile.updatePositon(false)

                    //tween match 4
                    queueMatch4Tween.push({ groupIdx: i, tile: tile })
                    if (listGroup[i] == 4) tile.setSuper()
                    else tile.setMega()
                } else console.log('Error Tile!', cols)
            }

            this.scoreBoard.emitterScoreEffect(
                temp[i].x / listGroup[i],
                temp[i].y / listGroup[i],
                () => this.scoreBoard.addScore(scoreGot)
            )

            const text = this.add
                .text(temp[i].x / listGroup[i], temp[i].y / listGroup[i], scoreGot.toString(), {
                    fontFamily: 'Cambria',
                    fontSize: 25 + ((scoreGot <= 10000 ? scoreGot : 10000) / 10000) * (40 - 25),
                    color: color,
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

        //Before handle Fall, hide all tile have grid -1
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, value] of this.tileMap) {
            if (value.gridY < 0) value.setVisible(false)
        }

        let fallFlag = 0

        for (let i = 0; i < queueMatch4Tween.length; i++)
            fallFlag += listTileFromGroup[queueMatch4Tween[i].groupIdx].length

        if (fallFlag == 0)
            this.handleFall(listBoom, groupZeroBoom, listGroup, cols, combo, onComplete)
        else {
            for (let i = 0; i < queueMatch4Tween.length; i++) {
                const tile = queueMatch4Tween[i].tile
                const groupIdx = queueMatch4Tween[i].groupIdx
                for (let j = 0; j < listTileFromGroup[groupIdx].length; j++) {
                    const obj = listTileFromGroup[groupIdx][j]
                    const image = new Tile(
                        {
                            scene: this,
                            x: this.cameras.main.width / 2,
                            y: this.cameras.main.height / 2,
                            texture: tile.getKey(),
                        },
                        obj.x,
                        obj.y
                    )
                    image.updatePositon(false)

                    image.gridX = tile.gridX
                    image.gridY = tile.gridY

                    image.updatePositon(true, undefined, undefined, 500, () => {
                        image.destroy()
                        //if (!tile.isSuperTile()) tile.setSuper()
                        fallFlag--
                        if (fallFlag == 0) {
                            this.handleFall(
                                listBoom,
                                groupZeroBoom,
                                listGroup,
                                cols,
                                combo + 1,
                                onComplete
                            )
                        }
                    })
                }
            } //
        }
        //this.handleFall(listBoom, groupZeroBoom, listGroup, cols, combo, onComplete)
    }

    private handleFall(
        listBoom: Array<{ x: number; y: number; newY: number }>,
        groupZeroBoom: Array<{ x: number; y: number }>,
        listGroup: number[],
        cols: number[],
        combo: number,
        onComplete?: Function
    ): void {
        //handle fall tile
        if (listBoom.length) {
            for (let i = 0; i < CONST.gridWidth; i++) {
                let num = 0
                for (let j = CONST.gridHeight - 1; j >= -cols[i]; j--) {
                    const tile = this.getTile(i, j)

                    if (tile) {
                        if (num > 0) {
                            if (j < 0) {
                                tile.setRandomTextures(undefined, CONST.gridWidth - cols[i] + j)
                                tile.setVisible(true)
                            }
                            this.removeTile(i, j)
                            tile.gridY = j + num
                            this.setTile(i, j + num, tile)

                            tile.updatePositon(
                                true,
                                () => {
                                    this.handleMatch(() => {
                                        if (onComplete) onComplete()
                                        this.boardState = BOARD_STATE.IDLE
                                    }, combo + listGroup.length - 1)
                                },
                                undefined,
                                (1500 / 8) * cols[i]
                            )
                        }
                    } else num++
                }
            }
        } else {
            if (onComplete) onComplete(false)
            this.boardState = BOARD_STATE.IDLE
        }
    }

    private idleEffect(): void {
        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile = this.getTile(i, j) as Tile
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
        if (this.idleTime > IDLE_TIME) {
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
                const tile = this.getTile(i, j) as Tile
                tile.setRandomTextures()

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
                            this.getTile(i, j)?.updatePositon(
                                true,
                                () => {
                                    this.handleMatch(() => {
                                        this.idleTime = 0
                                        this.resetSelect()
                                        this.boardState = BOARD_STATE.IDLE
                                    })
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

    public getKeyFromString(key: string): { x: number; y: number } | undefined {
        switch (key.length) {
            case 2:
                return { x: parseInt(key[0]), y: parseInt(key[1]) }
            case 3:
                if (key[0] == '-')
                    return { x: parseInt(key.substring(0, 2)), y: parseInt(key.substring(2, 1)) }
                else return { x: parseInt(key.substring(0, 1)), y: parseInt(key.substring(1, 2)) }
            case 4:
                return { x: parseInt(key.substring(0, 2)), y: parseInt(key.substring(2, 2)) }
        }
        return undefined
    }
}
