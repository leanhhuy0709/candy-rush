import { CONST, SCENE } from '../const/const'
import { Tile } from '../objects/Tile'

export class GamePlayScene extends Phaser.Scene {
    private tileMap: Map<number[], Tile>

    private firstSelectedTile: Tile | null
    private secondSelectedTile: Tile | null

    constructor() {
        super({
            key: SCENE.GAMEPLAY,
        })
    }

    public create() {
        this.tileMap = new Map<number[], Tile>()

        this.firstSelectedTile = null
        this.secondSelectedTile = null

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                this.tileMap.set([i, j], this.getRandomTile(i, j))
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

                        //this.checkIsValidGrid()

                        if (!this.handleMatch()) {
                            this.swapTiles(() => {
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

            const grid1x = this.firstSelectedTile.gridX,
                grid1y = this.firstSelectedTile.gridY,
                grid2x = this.secondSelectedTile.gridX,
                grid2y = this.secondSelectedTile.gridY

            const time = 500

            const tween1 = this.tweens.add({
                targets: [this.firstSelectedTile],
                x: x2,
                y: y2,
                gridX: grid2x,
                gridY: grid2y,
                duration: time,
                ease: 'Linear',
                onComplete: () => {
                    if (!tween2.isActive()) {
                        onComplete()
                        this.swapTwoTiles(grid1x, grid1y, grid2x, grid2y)
                        tween1.destroy()
                        tween2.destroy()
                    }
                },
            })

            const tween2 = this.tweens.add({
                targets: [this.secondSelectedTile],
                x: x1,
                y: y1,
                gridX: grid1x,
                gridY: grid1y,
                duration: time,
                ease: 'Linear',
                onComplete: () => {
                    if (!tween1.isActive()) {
                        onComplete()
                        this.swapTwoTiles(grid1x, grid1y, grid2x, grid2y)
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

            const boomMap = new Map<string, boolean>()

            while (listSelect.length > 0) {
                const currentTile = listSelect.pop() as Tile
                const currentGridX = currentTile.gridX,
                    currentGridY = currentTile.gridY

                for (let i = 0; i < direction.length; i++) {
                    let j = 1
                    for (; ; j++) {
                        const x = currentGridX + direction[i].x * j
                        const y = currentGridY + direction[i].y * j
                        const tile = this.tileMap.get([x, y])
                        if (tile && tile.getKey() === currentTile.getKey()) {
                            //
                        } else break
                    }
                    if (j > 2) {
                        j -= 1
                        for (; j >= 0; j--) {
                            const x = currentGridX + direction[i].x * j
                            const y = currentGridY + direction[i].y * j
                            const tile = this.tileMap.get([x, y])
                            if (tile) listTileBoom.push(tile)
                            boomMap.set(x.toString() + y.toString(), true)
                        }
                    }
                }
                const x = currentGridX,
                    y = currentGridY
                const tile0 = this.tileMap.get([x, y])
                const tile1 = this.tileMap.get([x - 1, y])
                const tile2 = this.tileMap.get([x + 1, y])
                if (tile0 && tile1 && tile2) {
                    if (
                        tile1.getKey() === currentTile.getKey() &&
                        tile2.getKey() === currentTile.getKey()
                    ) {
                        if (!boomMap.has((x - 1).toString() + y.toString())) {
                            listTileBoom.push(tile1)
                            boomMap.set((x - 1).toString() + y.toString(), true)
                        }

                        if (!boomMap.has((x + 1).toString() + y.toString())) {
                            listTileBoom.push(tile2)
                            boomMap.set((x + 1).toString() + y.toString(), true)
                        }

                        if (!boomMap.has(x.toString() + y.toString())) {
                            listTileBoom.push(tile0)
                            boomMap.set(x.toString() + y.toString(), true)
                        }
                    }
                }
                const tile3 = this.tileMap.get([x, y - 1])
                const tile4 = this.tileMap.get([x, y + 1])
                if (tile0 && tile3 && tile4) {
                    if (
                        tile3.getKey() === currentTile.getKey() &&
                        tile4.getKey() === currentTile.getKey()
                    ) {
                        if (!boomMap.has(x.toString() + (y - 1).toString())) {
                            listTileBoom.push(tile3)
                            boomMap.set(x.toString() + (y - 1).toString(), true)
                        }

                        if (!boomMap.has(x.toString() + (y + 1).toString())) {
                            listTileBoom.push(tile4)
                            boomMap.set(x.toString() + (y + 1).toString(), true)
                        }

                        if (!boomMap.has(x.toString() + y.toString())) {
                            listTileBoom.push(tile0)
                            boomMap.set(x.toString() + y.toString(), true)
                        }
                    }
                }
            }

            if (listTileBoom.length > 0) {
                this.handleTileFall(listTileBoom)

                return true
            } else return false
        }

        return false
    }

    private handleTileFall(listTileBoom: Tile[]): void {
        const cols = []
        for (let i = 0; i < CONST.gridWidth; i++) {
            cols.push(0)
        }

        for (let i = 0; i < listTileBoom.length; i++) {
            const gridX = listTileBoom[i].gridX
            cols[gridX]++

            this.tileMap.delete([listTileBoom[i].gridX, listTileBoom[i].gridY])
            listTileBoom[i].gridY = -cols[gridX]
            this.tileMap.set([listTileBoom[i].gridX, listTileBoom[i].gridY], listTileBoom[i])

            listTileBoom[i].updatePositon(false)
            listTileBoom[i].setRandomTextures()
        }

        for (let i = 0; i < CONST.gridWidth; i++) {
            if (cols[i] > 0) {
                for (let j = CONST.gridHeight - 1; j >= 0; j--) {
                    const tile1 = this.tileMap.get([i, j]) as Tile
                    if (tile1.gridY != j) {
                        this.tileMap.delete([tile1.gridX, tile1.gridY])
                        tile1.gridY += cols[i]
                        this.tileMap.set([tile1.gridX, tile1.gridY], tile1)

                        tile1.updatePositon(true)
                        continue
                    }

                    if (j + cols[i] >= CONST.gridHeight) continue
                    const tile2 = this.tileMap.get([i, j + cols[i]]) as Tile

                    if (tile2.gridY != j + cols[i]) {
                        this.tileMap.delete([tile1.gridX, tile1.gridY])
                        tile1.gridY = j + cols[i]
                        this.tileMap.set([tile1.gridX, tile1.gridY], tile1)

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
        if (this.tileMap.has([x1, y1]) && this.tileMap.has([x2, y2])) {
            const temp = this.tileMap.get([x1, y1])
            this.tileMap.set([x1, y1], this.tileMap.get([x2, y2]) as Tile)
            this.tileMap.set([x2, y2], temp as Tile)
        } else console.log('Error swap!')
    }

    private checkIsValidGrid(): void {
        //Use for debugging.........

        for (let i = 0; i < CONST.gridWidth; i++) {
            for (let j = 0; j < CONST.gridHeight; j++) {
                const tile = this.tileMap.get([i, j]) as Tile

                if (tile.gridX != i || tile.gridY != j) {
                    console.log(i, j, tile.gridX, tile.gridY)
                    tile.selectEffect()
                }
            }
        }
    }
}
