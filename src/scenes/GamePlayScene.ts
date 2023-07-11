import { CONST, SCENE } from '../const/const'
import { Tile } from '../objects/Tile'

export class GamePlayScene extends Phaser.Scene {
    private tileGrid: Tile[][]

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
        const w = this.cameras.main.width

        const randomTileType: string =
            CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]
        return new Tile(
            {
                scene: this,
                x:
                    CONST.tileWidth / 2 +
                    x * (CONST.tileWidth + CONST.margin) +
                    (w - (CONST.tileWidth + CONST.margin) * CONST.gridWidth),
                y: CONST.tileHeight / 2 + y * (CONST.tileHeight + CONST.margin),
                texture: randomTileType,
            },
            x,
            y
        )
    }

    private onTileClicked(pointer: Phaser.Input.Pointer, gameObject: Tile) {
        if (!this.firstSelectedTile) {
            this.firstSelectedTile = gameObject
            this.firstSelectedTile.spin()
            this.firstSelectedTile.showGraphics()
        } else if (!this.secondSelectedTile) {
            this.secondSelectedTile = gameObject
            this.secondSelectedTile.spin()
            this.secondSelectedTile.showGraphics()

            //Handle
            this.swapTiles(() => {
                if (this.firstSelectedTile && this.secondSelectedTile) {
                    this.firstSelectedTile.unSpin()
                    this.firstSelectedTile.hideGraphics()
                    this.secondSelectedTile.unSpin()
                    this.secondSelectedTile.hideGraphics()

                    const temp1 = this.firstSelectedTile.getGridPosition()
                    const temp2 = this.secondSelectedTile.getGridPosition()
                    this.firstSelectedTile.setGridPosition(temp2.x, temp2.y)
                    this.secondSelectedTile.setGridPosition(temp1.x, temp1.y)
                }
                this.checkMatch()

                this.firstSelectedTile = null
                this.secondSelectedTile = null
            })
        }
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

    private resetSelect(): void {
        this.firstSelectedTile = null
        this.secondSelectedTile = null
    }

    private checkMatch(): void {
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
                        }
                    }
                }
            }

            if (listTileBoom.length > 0) {
                for (let i = 0; i < listTileBoom.length; i++) {
                    const tile = listTileBoom[i]
                    tile.setVisible(false)
                }
            }
        }
    }

    private isValidGrid(x: number, y: number): boolean {
        return x >= 0 && x < CONST.gridWidth && y >= 0 && y < CONST.gridHeight
    }
}
