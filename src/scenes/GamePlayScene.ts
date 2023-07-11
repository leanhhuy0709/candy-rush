import { CONST, SCENE } from '../const/const'
import { Tile } from '../objects/Tile'

export class GamePlayScene extends Phaser.Scene {
    private tileGrid: Tile[][]

    private tileMap: Map<string, Tile>

    private firstSelectedTile: Tile | null
    private secondSelectedTile: Tile | null

    constructor() {
        super({
            key: SCENE.GAMEPLAY,
        })
    }

    public create() {
        this.firstSelectedTile = null
        this.secondSelectedTile = null

        this.tileGrid = []
        for (let i = 0; i < CONST.gridHeight; i++) {
            this.tileGrid[i] = []
            for (let j = 0; j < CONST.gridWidth; j++) {
                this.tileGrid[i].push(this.getRandomTile(i, j))
            }
        }

        this.input.on('gameobjectdown', this.onTileClicked, this)
    }

    public update() {
        //
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

    private onTileClicked(pointer: Phaser.Input.Pointer, gameObject: Tile) {
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

                        this.checkIsValidGrid()

                        if (!this.handleMatch()) {
                            this.firstSelectedTile.selectEffect()
                            this.secondSelectedTile.selectEffect()
                            this.swapTiles(() => {
                                if (this.firstSelectedTile && this.secondSelectedTile) {
                                    this.firstSelectedTile.unSelectEffect()
                                    this.secondSelectedTile.unSelectEffect()
                                }
                                this.resetSelect()
                            })
                        } else {
                            this.resetSelect()
                        }
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
        /*if (this.firstSelectedTile && this.secondSelectedTile) {
            const temp1 = this.firstSelectedTile.getGridPosition()
            const temp2 = this.secondSelectedTile.getGridPosition()

            return Math.abs(temp1.x - temp2.x) + Math.abs(temp1.y - temp2.y) === 1
        }
        return false*/
        return true
    }

    private swapTiles(onComplete: Function): void {
        if (this.firstSelectedTile && this.secondSelectedTile) {
            const x1 = this.firstSelectedTile.x,
                y1 = this.firstSelectedTile.y,
                x2 = this.secondSelectedTile.x,
                y2 = this.secondSelectedTile.y

            const time = 500

            const grid1 = this.firstSelectedTile.getGridPosition()
            const grid2 = this.secondSelectedTile.getGridPosition()

            this.tileGrid[grid1.x][grid1.y] = this.secondSelectedTile
            this.tileGrid[grid2.x][grid2.y] = this.firstSelectedTile

            const temp1 = this.firstSelectedTile.getGridPosition()
            const temp2 = this.secondSelectedTile.getGridPosition()
            this.firstSelectedTile.setGridPosition(temp2.x, temp2.y)
            this.secondSelectedTile.setGridPosition(temp1.x, temp1.y)

            const tween1 = this.tweens.add({
                targets: [this.firstSelectedTile],
                x: x2,
                y: y2,
                duration: time,
                ease: 'Linear',
                onComplete: () => {
                    if (!tween2.isActive()) {
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
                        onComplete()
                        tween1.destroy()
                        tween2.destroy()
                    }
                },
            })
        }
    }

    private handleMatch(): boolean {
        if (this.firstSelectedTile && this.secondSelectedTile) {
            const listTileBoom: Tile[] = []

            const direction = [
                { x: 0, y: 1 },
                { x: 0, y: -1 },
                { x: 1, y: 0 },
                { x: -1, y: 0 },
            ]

            const listSelect: Tile[] = []
            listSelect.push(this.firstSelectedTile)
            listSelect.push(this.secondSelectedTile)

            const myMap = new Map<string, boolean>()

            while (listSelect.length > 0) {
                const currentTile = listSelect.pop() as Tile
                const currentGrid = currentTile.getGridPosition()

                for (let i = 0; i < direction.length; i++) {
                    let j = 1
                    for (; ; j++) {
                        const x = currentGrid.x + direction[i].x * j
                        const y = currentGrid.y + direction[i].y * j

                        if (
                            this.isValidGrid(x, y) &&
                            this.tileGrid[x][y].getKey() === currentTile.getKey()
                        ) {
                            //
                        } else break
                    }
                    if (j > 2) {
                        j -= 1
                        for (; j >= 0; j--) {
                            const x = currentGrid.x + direction[i].x * j
                            const y = currentGrid.y + direction[i].y * j
                            listTileBoom.push(this.tileGrid[x][y])
                            myMap.set(x.toString() + y.toString(), true)
                        }
                    }
                }
                const x = currentGrid.x,
                    y = currentGrid.y

                if (this.isValidGrid(x - 1, y) && this.isValidGrid(x + 1, y)) {
                    if (
                        this.tileGrid[x - 1][y].getKey() === currentTile.getKey() &&
                        this.tileGrid[x + 1][y].getKey() === currentTile.getKey()
                    ) {
                        if (!myMap.has((x - 1).toString() + y.toString())) {
                            listTileBoom.push(this.tileGrid[x - 1][y])
                            myMap.set((x - 1).toString() + y.toString(), true)
                        }

                        if (!myMap.has((x + 1).toString() + y.toString())) {
                            listTileBoom.push(this.tileGrid[x + 1][y])
                            myMap.set((x + 1).toString() + y.toString(), true)
                        }

                        if (!myMap.has(x.toString() + y.toString())) {
                            listTileBoom.push(this.tileGrid[x][y])
                            myMap.set(x.toString() + y.toString(), true)
                        }
                    }
                }
                if (this.isValidGrid(x, y - 1) && this.isValidGrid(x, y + 1)) {
                    if (
                        this.tileGrid[x][y - 1].getKey() === currentTile.getKey() &&
                        this.tileGrid[x][y + 1].getKey() === currentTile.getKey()
                    ) {
                        if (!myMap.has(x.toString() + (y - 1).toString())) {
                            listTileBoom.push(this.tileGrid[x][y - 1])
                            myMap.set(x.toString() + (y - 1).toString(), true)
                        }

                        if (!myMap.has(x.toString() + (y + 1).toString())) {
                            listTileBoom.push(this.tileGrid[x][y + 1])
                            myMap.set(x.toString() + (y + 1).toString(), true)
                        }

                        if (!myMap.has(x.toString() + y.toString())) {
                            listTileBoom.push(this.tileGrid[x][y])
                            myMap.set(x.toString() + y.toString(), true)
                        }
                    }
                }
            }

            if (listTileBoom.length > 0) {
                this.handleTileFall(listTileBoom)

                return true
            } else return true //debug
        }

        return false
    }

    private handleTileFall(listTileBoom: Tile[]): void {
        const cols = []
        for (let i = 0; i < CONST.gridWidth; i++) {
            cols.push(0)
        }

        for (let i = 0; i < listTileBoom.length; i++) {
            const grid = listTileBoom[i].getGridPosition()
            cols[grid.x]++
            listTileBoom[i].setGridPosition(grid.x, -cols[grid.x])
            listTileBoom[i].updatePositon(false)
            listTileBoom[i].setRandomTextures()
        }

        for (let i = 0; i < CONST.gridWidth; i++) {
            if (cols[i] > 0) {
                for (let j = CONST.gridHeight - 1; j >= 0; j--) {
                    const tile1 = this.tileGrid[i][j]
                    if (tile1.getGridPosition().y != j) {
                        tile1.setGridPosition(
                            tile1.getGridPosition().x,
                            cols[i] + tile1.getGridPosition().y
                        )
                        tile1.updatePositon(true)
                        continue
                    }

                    if (j + cols[i] >= CONST.gridHeight) continue
                    const tile2 = this.tileGrid[i][j + cols[i]]

                    if (tile2.getGridPosition().y != j + cols[i]) {
                        tile1.setGridPosition(tile2.getGridPosition().x, j + cols[i])
                        tile1.updatePositon(true)
                    }
                }
            }
        }
    }

    private isValidGrid(x: number, y: number): boolean {
        return x >= 0 && x < CONST.gridWidth && y >= 0 && y < CONST.gridHeight
    }

    private swapTwoTiles(x1: number, y1: number, x2: number, y2: number): void {
        const temp = this.tileGrid[x1][y1]
        this.tileGrid[x1][y1] = this.tileGrid[x2][y2]
        this.tileGrid[x2][y2] = temp
    }

    private checkIsValidGrid(): void {
        //Use for debugging.........

        for (let i = 0; i < CONST.gridWidth; i++) {
            for (let j = 0; j < CONST.gridHeight; j++) {
                const tile = this.tileGrid[i][j].getGridPosition()

                if (tile.x != i || tile.y != j) {
                    console.log(i, j, tile.x, tile.y)
                    this.tileGrid[i][j].selectEffect()
                }
            }
        }
    }
}
