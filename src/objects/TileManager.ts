import { CONST } from '../const/const'
import { BOARD_STATE, GamePlayScene } from '../scenes/GamePlayScene'
import ParticleEmitterPool from './ParticleEmitterPool'
import { Tile } from './Tile'

const COLOR_LIST = ['#ffffff', '#bcffe3', '#20b2aa', '#ffd966']
const SIMILAR_CANDY_CHANCE = 0

export default class TileManager {
    private scene: GamePlayScene
    private tileMap: Map<string, Tile>

    private numCandy: number
    private candyList: string[] = []

    public constructor(scene: GamePlayScene) {
        this.scene = scene

        this.tileMap = new Map<string, Tile>()

        this.numCandy = 1
        for (let i = 0; i < this.numCandy; i++) {
            this.candyList.push(CONST.candyTypes[i])
        }
        this.shuffleCandyList()

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                this.setTile(
                    i,
                    j,
                    new Tile(
                        {
                            scene: this.scene,
                            x: this.scene.cameras.main.width / 2,
                            y: this.scene.cameras.main.height / 2,
                            texture: this.getRandomCandyKey(),
                        },
                        i,
                        j
                    )
                )
            }
        }
    }

    public getTile(i: number, j: number): Tile | undefined {
        return this.tileMap.get(i.toString() + j.toString())
    }

    public setTile(i: number, j: number, tile: Tile): void {
        this.tileMap.set(i.toString() + j.toString(), tile)
    }

    public removeTile(i: number, j: number): void {
        this.tileMap.delete(i.toString() + j.toString())
    }

    public shuffleCandyList(): void {
        const randList = []
        for (let i = 0; i < CONST.candyTypes.length; i++) randList.push(i)
        randList.sort(() => Math.random() - 0.5)
        for (let i = 0; i < this.numCandy; i++) this.candyList[i] = CONST.candyTypes[randList[i]]
    }

    public getRandomCandyKey(x?: number, y?: number): string {
        if (x && y) {
            if (Math.random() < SIMILAR_CANDY_CHANCE) return this.getSimilarCandyKey(x, y)
        }
        return this.candyList[Phaser.Math.Between(0, this.candyList.length - 1)]
    }

    public getSimilarCandyKey(x: number, y: number): string {
        const listCandyNextTo = []
        if (this.getTile(x - 1, y)) listCandyNextTo.push(this.getTile(x - 1, y))
        if (this.getTile(x + 1, y)) listCandyNextTo.push(this.getTile(x + 1, y))
        if (this.getTile(x, y - 1)) listCandyNextTo.push(this.getTile(x, y - 1))
        if (this.getTile(x, y + 1)) listCandyNextTo.push(this.getTile(x, y + 1))
        if (listCandyNextTo.length > 0)
            return (
                listCandyNextTo[Phaser.Math.Between(0, listCandyNextTo.length - 1)] as Tile
            ).getKey()
        return this.getRandomCandyKey()
    }

    public getTileMap(): Map<string, Tile> {
        return this.tileMap
    }

    public swapTilesWithoutEffect(x1: number, y1: number, x2: number, y2: number): void {
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

    public convertToKey(i: number, j: number): string {
        /*convert tuple number to string key*/
        return i.toString() + j.toString()
    }

    public handleMatch(onComplete?: Function, combo = 1): void {
        const directs = [
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

        //traverse all tile, check tile boom - O(n^2)
        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const currentTile = this.getTile(i, j) as Tile
                if (!currentTile) console.log('Error index tile!')
                let g1 = group.get(this.convertToKey(i, j))

                let isBoom = false
                //find group for g1
                if (g1 == undefined) {
                    for (let k = 0; k < directs.length; k++) {
                        const tile = this.getTile(i + directs[k].x, j + directs[k].y)
                        const tileBehind = this.getTile(i - directs[k].x, j - directs[k].y)
                        const tileNext2 = this.getTile(i + 2 * directs[k].x, j + 2 * directs[k].y)

                        const isTileSame = tile && tile.getKey() === currentTile.getKey()
                        const isTileBehindSame =
                            tileBehind && tileBehind.getKey() === currentTile.getKey()
                        const isTileNext2Same =
                            tileNext2 && tileNext2.getKey() === currentTile.getKey()

                        if (!isTileSame) continue
                        if (isTileBehindSame) {
                            const gTemp = group.get(
                                this.convertToKey(i - directs[k].x, j - directs[k].y)
                            )
                            if (gTemp) {
                                g1 = gTemp
                                break
                            }
                        }
                        if (isTileNext2Same) {
                            const gTemp = group.get(
                                this.convertToKey(i + 2 * directs[k].x, j + 2 * directs[k].y)
                            )
                            if (gTemp) {
                                g1 = gTemp
                                break
                            }
                        }
                    }
                    if (g1) group.set(this.convertToKey(i, j), g1)
                }

                for (let k = 0; k < directs.length; k++) {
                    const tile = this.getTile(i + directs[k].x, j + directs[k].y)
                    const tileBehind = this.getTile(i - directs[k].x, j - directs[k].y)
                    const tileNext2 = this.getTile(i + 2 * directs[k].x, j + 2 * directs[k].y)

                    const isTileSame = tile && tile.getKey() === currentTile.getKey()
                    const isTileBehindSame =
                        tileBehind && tileBehind.getKey() === currentTile.getKey()
                    const isTileNext2Same = tileNext2 && tileNext2.getKey() === currentTile.getKey()

                    if (!isTileSame) continue
                    let g2 = group.get(this.convertToKey(i + directs[k].x, j + directs[k].y))

                    //-1 x x 2

                    let key = undefined

                    if (g1) key = g1
                    if (g2) key = g2

                    if (!isTileBehindSame && !isTileNext2Same) continue
                    if (!isBoom) {
                        cols[currentTile.gridX]++
                        currentTile.boom()
                        listBoom.push({ x: i, y: j, newY: -cols[currentTile.gridX] })
                    }

                    if (key == undefined) {
                        key = groupIndex
                        listGroup.push(0)
                        groupIndex++
                    }

                    if (g1 != key) {
                        g1 = key
                        group.set(this.convertToKey(i, j), key)
                        listGroup[key]++
                    }
                    if (g2 != key) {
                        g2 = key
                        group.set(this.convertToKey(i + directs[k].x, j + directs[k].y), key)
                        listGroup[key]++
                    }

                    if (isTileBehindSame) {
                        const g3 = group.get(this.convertToKey(i - directs[k].x, j - directs[k].y))

                        if (g3 != key) {
                            group.set(this.convertToKey(i - directs[k].x, j - directs[k].y), key)
                            listGroup[key]++
                        }
                    }

                    if (isTileNext2Same) {
                        const g3 = group.get(
                            this.convertToKey(i + 2 * directs[k].x, j + 2 * directs[k].y)
                        )

                        if (g3 != key) {
                            group.set(
                                this.convertToKey(i + 2 * directs[k].x, j + 2 * directs[k].y),
                                key
                            )
                            listGroup[key]++
                        }
                    }

                    isBoom = true

                    this.addTileBoomBySuperMegaToGroup(
                        currentTile,
                        i,
                        j,
                        group,
                        groupZeroBoom,
                        combo
                    )
                }
            }
        }

        //Boom all tile boom by super, mega - Wrost case O(n^2)
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
                this.addTileBoomBySuperMegaToGroup(tile, obj.x, obj.y, group, groupZeroBoom, combo)
            }
        }

        //traverse tileBoom to remove Tile and group tile to listTileFromGroup - O(n)
        const temp = []
        for (let i = 0; i < listGroup.length; i++) temp.push({ x: 0, y: 0 })

        const listTileFromGroup: Array<Array<{ x: number; y: number; tile: Tile }>> = []
        for (let i = 0; i < listGroup.length; i++) listTileFromGroup.push([])
        //Wrost case O(n^2)
        for (let i = 0; i < listBoom.length; i++) {
            const data = listBoom[i]
            const tile = this.getTile(data.x, data.y)

            if (tile) {
                const groupID = group.get(this.convertToKey(data.x, data.y)) as number
                if (groupID) {
                    temp[groupID].x += tile.x
                    temp[groupID].y += tile.y + 10
                    listTileFromGroup[groupID].push({ x: tile.gridX, y: tile.gridY, tile: tile })
                }
                this.removeTile(data.x, data.y)
                tile.gridY = data.newY
                this.setTile(data.x, data.newY, tile)
                tile.updatePositon(false)
                tile.angle = 0
            }
        }

        //Handle Big Boom when to more particle
        if (Tile.boomFlag > 10) {
            const emitter = ParticleEmitterPool.getParticleEmitter(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2,
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
        //calculate score, handle match 4, match 5 - Wrost case O(n^2/3)
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

            let gridX = -2
            let gridY = -2

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
                } else console.log('Error Tile!', gridX, listGroup)
            }

            const gamePlayScene = this.scene as GamePlayScene

            gamePlayScene.scoreBoard.emitterScoreEffect(
                temp[i].x / listGroup[i],
                temp[i].y / listGroup[i],
                () => gamePlayScene.scoreBoard.addScore(scoreGot)
            )

            const text = this.scene.add
                .text(temp[i].x / listGroup[i], temp[i].y / listGroup[i], scoreGot.toString(), {
                    fontFamily: 'Cambria',
                    fontSize: 25 + ((scoreGot <= 10000 ? scoreGot : 10000) / 10000) * (40 - 25),
                    color: color,
                })
                .setDepth(6)
                .setOrigin(0.5, 0.5)
                .setAlpha(0)
                .setStroke('#000000', 2)

            const tween = this.scene.tweens.add({
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

        this.scene.boardState = BOARD_STATE.MERGING
        //Before handle Fall, hide all tile have grid -1 - O(n^2)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, value] of this.getTileMap()) {
            if (value.gridY < 0) value.setVisible(false)
        }

        let fallFlag = 0
        for (let i = 0; i < queueMatch4Tween.length; i++)
            fallFlag += listTileFromGroup[queueMatch4Tween[i].groupIdx].length
        if (fallFlag == 0) {
            this.handleFall(listBoom, groupZeroBoom, listGroup, cols, combo, onComplete)
        } else {
            //Handle tween merge - Wrost case O(n^2/4)
            for (let i = 0; i < queueMatch4Tween.length; i++) {
                const tile = queueMatch4Tween[i].tile
                const groupIdx = queueMatch4Tween[i].groupIdx
                for (let j = 0; j < listTileFromGroup[groupIdx].length; j++) {
                    const obj = listTileFromGroup[groupIdx][j]
                    const image = new Tile(
                        {
                            scene: this.scene,
                            x: this.scene.cameras.main.width / 2,
                            y: this.scene.cameras.main.height / 2,
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
            }
        }
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
        this.scene.boardState = BOARD_STATE.FALLING
        if (listBoom.length) {
            // Average: O(n) - Wrost Case: O(n^2)
            for (let i = 0; i < CONST.gridWidth; i++) {
                let num = 0
                for (let j = CONST.gridHeight - 1; j >= -cols[i]; j--) {
                    const tile = this.getTile(i, j)

                    if (tile) {
                        if (num > 0) {
                            if (j < 0) {
                                tile.setTexture(this.getRandomCandyKey(tile.gridX, tile.gridY))
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
        }
    }

    private addTileBoomBySuperMegaToGroup(
        tile: Tile,
        x: number,
        y: number,
        group: Map<string, number>,
        groupZeroBoom: Array<{ x: number; y: number }>,
        combo = 1
    ): void {
        if (tile.isSuperTile()) {
            for (let m = -1; m <= 1; m++) {
                for (let n = -1; n <= 1; n++) {
                    if (!group.has(this.convertToKey(x + m, y + n)) && this.getTile(x + m, y + n)) {
                        group.set(this.convertToKey(x + m, y + n), 0)
                        groupZeroBoom.push({ x: x + m, y: y + n })
                    }
                }
            }
            //effect big 4
            this.scene.scoreBoard.emitterScoreEffect(tile.x, tile.y, () =>
                this.scene.scoreBoard.addScore(250 * (combo < 4 ? combo : 4))
            )

            const text = this.scene.add
                .text(tile.x, tile.y + 10, (250 * (combo < 4 ? combo : 4)).toString(), {
                    fontFamily: 'Cambria',
                    fontSize: 32,
                    color: COLOR_LIST[1],
                })
                .setDepth(6)
                .setOrigin(0.5, 0.5)
                .setAlpha(0)
                .setStroke('#000000', 2)

            const tween = this.scene.tweens.add({
                targets: text,
                alpha: 1,
                duration: 700,
                y: tile.y,
                onComplete: () => {
                    text.destroy()
                    tween.destroy()
                },
            })
            tile.setSuper(false)
        } else if (tile.isMegaTile()) {
            for (let m = 0; m <= CONST.gridWidth; m++) {
                if (!group.has(this.convertToKey(m, y)) && this.getTile(m, y)) {
                    group.set(this.convertToKey(m, y), 0)
                    groupZeroBoom.push({ x: m, y: y })
                }
            }
            for (let m = 0; m <= CONST.gridHeight; m++) {
                if (!group.has(this.convertToKey(x, m)) && this.getTile(x, m)) {
                    group.set(this.convertToKey(x, m), 0)
                    groupZeroBoom.push({ x: x, y: m })
                }
            }

            //effect big 5
            this.scene.scoreBoard.emitterScoreEffect(tile.x, tile.y, () =>
                this.scene.scoreBoard.addScore(800 * (combo < 4 ? combo : 4))
            )

            const text = this.scene.add
                .text(tile.x, tile.y + 10, (800 * (combo < 4 ? combo : 4)).toString(), {
                    fontFamily: 'Cambria',
                    fontSize: 32,
                    color: COLOR_LIST[1],
                })
                .setDepth(6)
                .setOrigin(0.5, 0.5)
                .setAlpha(0)
                .setStroke('#000000', 2)

            const tween = this.scene.tweens.add({
                targets: text,
                alpha: 1,
                duration: 700,
                y: tile.y,
                onComplete: () => {
                    text.destroy()
                    tween.destroy()
                },
            })

            tile.setMega(false)
        }
    }
}
