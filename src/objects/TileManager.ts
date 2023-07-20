import { CONST } from '../const/const'
import { BOARD_STATE, GamePlayScene } from '../scenes/GamePlayScene'
import ScoreBoard from './ScoreBoard'
import { Tile } from './Tile'

const SIMILAR_CANDY_CHANCE = 0.333

const GRID_HEIGHT_RELATIVE_TOP = 3

const NUM_CANDY = 5

export default class TileManager {
    private scene: GamePlayScene
    private tileMap: Map<string, Tile>

    private numCandy: number

    public constructor(scene: GamePlayScene) {
        this.scene = scene

        this.tileMap = new Map<string, Tile>()

        this.numCandy = NUM_CANDY

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
                            texture: 'candy',
                            frame: 0,
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

    public getTile2(key: string): Tile | undefined {
        return this.tileMap.get(key)
    }

    public setTile(i: number, j: number, tile: Tile): void {
        this.tileMap.set(i.toString() + j.toString(), tile)
    }

    public removeTile(i: number, j: number): void {
        this.tileMap.delete(i.toString() + j.toString())
    }

    public shuffleCandyList(): void {
        /*
        const randList = []
        for (let i = 0; i < CONST.candyTypes.length; i++) randList.push(i)
        randList.sort(() => Math.random() - 0.5)
        for (let i = 0; i < this.numCandy; i++) this.candyList[i] = CONST.candyTypes[randList[i]]*/
    }

    /*
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
    }*/

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

    public handleMatch(queue: Array<{ x: number; y: number }>, onComplete?: Function): void {
        this.scene.boardState = BOARD_STATE.HANDLING
        //DFS traverse
        let groupIndex = 1
        const numTileInGroup = [0]
        const group = new Map<string, number>()
        const firstTileInEveryGroup: Tile[] = []

        firstTileInEveryGroup.push(this.getTile(0, 0) as Tile) //skip index 0

        const visited = new Map<string, number>() //0 - undifined => not visit, 1 -> added, 2 -> traversed

        const directs = [
            { x: 0, y: 1 },
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: -1, y: 0 },
        ]

        const queueSuperMega: Array<{ x: number; y: number }> = []

        while (queue.length > 0) {
            const coord = queue.pop() as { x: number; y: number }
            const tile = this.getTile(coord.x, coord.y) as Tile
            const v1 = visited.get(this.convertToKey(coord.x, coord.y))

            if (v1 == 2) continue
            visited.set(this.convertToKey(coord.x, coord.y), 2)

            let g1 = group.get(this.convertToKey(coord.x, coord.y))

            let isBoom = false
            //check tile 'can' boom? -> Only group tile can boom!
            let canBoom = false
            for (const d of directs) {
                const tileNext = this.getTile(coord.x + d.x, coord.y + d.y)
                if (!tileNext || tileNext.getKey() !== tile.getKey()) continue

                const tileBehind = this.getTile(coord.x - d.x, coord.y - d.y)
                const tileNext2 = this.getTile(coord.x + 2 * d.x, coord.y + 2 * d.y)

                const isTileBehindSame = tileBehind && tileBehind.getKey() === tile.getKey()
                const isTileNext2Same = tileNext2 && tileNext2.getKey() === tile.getKey()

                if (isTileBehindSame || isTileNext2Same) canBoom = true
            }
            if (!canBoom) continue

            if (!g1) {
                g1 = groupIndex
                numTileInGroup.push(1)
                firstTileInEveryGroup.push(tile)
                groupIndex++
                group.set(this.convertToKey(coord.x, coord.y), g1)
            }

            for (const d of directs) {
                const tileNext = this.getTile(coord.x + d.x, coord.y + d.y)
                if (!tileNext || tileNext.getKey() !== tile.getKey()) continue

                const tileBehind = this.getTile(coord.x - d.x, coord.y - d.y)
                const tileNext2 = this.getTile(coord.x + 2 * d.x, coord.y + 2 * d.y)

                const isTileBehindSame = tileBehind && tileBehind.getKey() === tile.getKey()
                const isTileNext2Same = tileNext2 && tileNext2.getKey() === tile.getKey()

                if (isTileBehindSame || isTileNext2Same) {
                    let g2 = group.get(this.convertToKey(coord.x + d.x, coord.y + d.y))
                    if (!g2) {
                        g2 = g1
                        group.set(this.convertToKey(coord.x + d.x, coord.y + d.y), g1)
                        numTileInGroup[g1]++
                    }
                    const v2 = visited.get(this.convertToKey(coord.x + d.x, coord.y + d.y))

                    if (!v2) {
                        visited.set(this.convertToKey(coord.x + d.x, coord.y + d.y), 1)
                        queue.push({ x: coord.x + d.x, y: coord.y + d.y })
                    }
                    isBoom = true
                }

                if (isTileBehindSame) {
                    let g3 = group.get(this.convertToKey(coord.x - d.x, coord.y - d.y))
                    if (!g3) {
                        g3 = g1
                        group.set(this.convertToKey(coord.x - d.x, coord.y - d.y), g1)
                        numTileInGroup[g1]++
                    }
                    const v3 = visited.get(this.convertToKey(coord.x - d.x, coord.y - d.y))

                    if (!v3) {
                        visited.set(this.convertToKey(coord.x - d.x, coord.y - d.y), 1)
                        queue.push({ x: coord.x - d.x, y: coord.y - d.y })
                    }
                }

                if (isTileNext2Same) {
                    let g3 = group.get(this.convertToKey(coord.x + 2 * d.x, coord.y + 2 * d.y))
                    if (!g3) {
                        g3 = g1
                        group.set(this.convertToKey(coord.x + 2 * d.x, coord.y + 2 * d.y), g1)
                        numTileInGroup[g1]++
                    }
                    const v3 = visited.get(this.convertToKey(coord.x + 2 * d.x, coord.y + 2 * d.y))

                    if (!v3) {
                        visited.set(this.convertToKey(coord.x + 2 * d.x, coord.y + 2 * d.y), 1)
                        queue.push({ x: coord.x + 2 * d.x, y: coord.y + 2 * d.y })
                    }
                }
            }
            if (!isBoom) continue
            if (tile.isSuperTile() || tile.isMegaTile()) {
                queueSuperMega.push({ x: coord.x, y: coord.y })
            }
        }

        while (queueSuperMega.length > 0) {
            const coord = queueSuperMega.pop() as { x: number; y: number }
            const tile = this.getTile(coord.x, coord.y) as Tile
            if (tile.isSuperTile()) {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const nextTile = this.getTile(coord.x + i, coord.y + j)
                        if (nextTile) {
                            const nextGroup = group.get(this.convertToKey(coord.x + i, coord.y + j))
                            if (!nextGroup) {
                                group.set(this.convertToKey(coord.x + i, coord.y + j), 0)

                                if (nextTile.isSuperTile() || nextTile.isMegaTile()) {
                                    queueSuperMega.push({ x: coord.x + i, y: coord.y + j })
                                }
                            }
                        }
                    }
                }
                tile.setSuper(false)
            } else if (tile.isMegaTile()) {
                for (let i = 0; i <= CONST.gridWidth; i++) {
                    let nextTile = this.getTile(i, coord.y)
                    if (nextTile) {
                        const nextGroup = group.get(this.convertToKey(i, coord.y))
                        if (!nextGroup) {
                            group.set(this.convertToKey(i, coord.y), 0)
                            if (nextTile.isSuperTile() || nextTile.isMegaTile()) {
                                queueSuperMega.push({ x: i, y: coord.y })
                            }
                        }
                    }

                    nextTile = this.getTile(coord.x, i)
                    if (nextTile) {
                        const nextGroup = group.get(this.convertToKey(coord.x, i))
                        if (!nextGroup) {
                            group.set(this.convertToKey(coord.x, i), 0)
                            if (nextTile.isSuperTile() || nextTile.isMegaTile()) {
                                queueSuperMega.push({ x: coord.x, y: i })
                            }
                        }
                    }
                }
                tile.setMega(false)
            }
        }
        //handle Super/Mega Tile boomm

        this.handleMerge(group, numTileInGroup, firstTileInEveryGroup, onComplete)
    }

    private handleMerge(
        group: Map<string, number>,
        numTileInGroup: number[],
        firstTileInEveryGroup: Tile[],
        onComplete?: Function
    ): void {
        this.scene.boardState = BOARD_STATE.MERGING
        const cols: number[] = []
        for (let i = 0; i < CONST.gridWidth; i++) cols.push(GRID_HEIGHT_RELATIVE_TOP)

        let isGroup45Exist = false

        for (const [key, groupID] of group) {
            if (groupID > 0 && numTileInGroup[groupID] < 3) {
                continue
            }

            const index = this.getIndexFromKey(key)
            const tile = this.getTile(index.x, index.y)

            if (!tile) {
                console.log('Error index tile!')
                continue
            }

            cols[index.x]++
            const newY = -cols[index.x]

            const firstTile = firstTileInEveryGroup[groupID]

            if (firstTile.gridX == tile.gridX && firstTile.gridY == tile.gridY)
                this.scene.scoreBoard.emitterScoreEffect(firstTile.x, firstTile.y, () => {
                    this.scene.scoreBoard.addScore(
                        ScoreBoard.caculateScore(numTileInGroup[groupID])
                    )
                })
            else if (groupID == 0) this.scene.scoreBoard.addScore(15)
            // boommmm
            if (numTileInGroup[groupID] == 3 || groupID == 0) {
                tile.boom()
                tile.setGrid(this, undefined, newY)
                tile.gotoGrid({
                    isNotTween: true,
                })
                tile.setVisible(false)
                this.scene.scoreBoard.addScore(10)

                continue
            }
            isGroup45Exist = true

            if (firstTile.gridX == tile.gridX && firstTile.gridY == tile.gridY) {
                //super mega bufff

                if (numTileInGroup[groupID] == 4) {
                    if (!firstTile.isSuperTile()) firstTile.setSuper()
                } else if (numTileInGroup[groupID] >= 5) {
                    if (!firstTile.isMegaTile()) firstTile.setMega()
                }

                cols[index.x]--

                continue
            }

            tile.boom()

            tile.goto({
                x: firstTile.x,
                y: firstTile.y,
                duration: 300,
                ease: Phaser.Math.Easing.Linear,
                onComplete: () => {
                    tile.setVisible(false)
                    tile.setGrid(this, undefined, newY)
                    tile.gotoGrid({
                        isNotTween: true,
                    })
                },
                onCompleteAll: () => {
                    this.handleFall(cols, onComplete)
                },
            })
        }

        if (!isGroup45Exist) this.handleFall(cols, onComplete)
    }

    private handleFall(cols: number[], onComplete?: Function): void {
        if (Tile.boomFlag > 10) {
            //big boom
            Tile.bigBoom()
        }
        Tile.boomFlag = 0

        this.scene.boardState = BOARD_STATE.FALLING

        let isBoom = false

        for (let i = 0; i < cols.length; i++) if (cols[i] > GRID_HEIGHT_RELATIVE_TOP) isBoom = true

        if (!isBoom) {
            if (onComplete) onComplete(false)
            this.scene.boardState = BOARD_STATE.IDLE
            return
        }

        const maxColChanges: number[] = []
        for (let i = 0; i < CONST.gridWidth; i++) maxColChanges.push(-1)

        for (let i = 0; i < CONST.gridWidth; i++) {
            let num = 0
            for (let j = CONST.gridHeight - 1; j >= -cols[i]; j--) {
                const tile = this.getTile(i, j)

                if (tile) {
                    if (num > 0) {
                        if (j < 0)
                            tile.setTexture('candy', this.getRandomFrame())
                                .setVisible(true)
                                .setAngle(0)

                        tile.setGrid(this, undefined, j + num)

                        tile.gotoGrid({
                            duration: num * 100 + 200,
                            delay: 200,
                            ease: Phaser.Math.Easing.Bounce.Out,
                            onCompleteAll: () => {
                                if (onComplete) onComplete()

                                const queue: Array<{ x: number; y: number }> = []

                                for (let t = 0; t < CONST.gridWidth; t++) {
                                    for (let k = 0; k <= maxColChanges[t]; k++) {
                                        queue.push({ x: t, y: k })
                                    }
                                }

                                if (queue.length > 0) {
                                    this.handleMatch(queue, onComplete)
                                } else {
                                    if (onComplete) onComplete()
                                }
                            },
                        })
                    }
                } else {
                    if (num == 0) maxColChanges[i] = j
                    num++
                }
            }
        }
    }

    public getIndexFromKey(key: string): { x: number; y: number } {
        switch (key.length) {
            case 2:
                return { x: parseInt(key[0]), y: parseInt(key[1]) }
            case 3:
                if (key[0] == '-') return { x: parseInt(key[0] + key[1]), y: parseInt(key[2]) }
                else return { x: parseInt(key[0]), y: parseInt(key[1] + key[2]) }
            default:
                return { x: parseInt(key[0] + key[1]), y: parseInt(key[2] + key[3]) }
        }
    }

    public getRandomFrame(x?: number, y?: number): number {
        if (x == undefined || y == undefined) return Phaser.Math.Between(0, this.numCandy - 1)

        if (Math.random() < SIMILAR_CANDY_CHANCE) {
            const listCandyNextTo = []
            if (this.getTile(x - 1, y)) listCandyNextTo.push(this.getTile(x - 1, y))
            if (this.getTile(x + 1, y)) listCandyNextTo.push(this.getTile(x + 1, y))
            if (this.getTile(x, y - 1)) listCandyNextTo.push(this.getTile(x, y - 1))
            if (this.getTile(x, y + 1)) listCandyNextTo.push(this.getTile(x, y + 1))
            if (listCandyNextTo.length > 0)
                return Number(
                    (
                        listCandyNextTo[Phaser.Math.Between(0, listCandyNextTo.length - 1)] as Tile
                    ).getKey()
                )
        }
        return Phaser.Math.Between(0, this.numCandy - 1)
    }
}
