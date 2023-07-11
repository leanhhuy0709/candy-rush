import { CONST, SCENE } from '../const/const'
import { Tile } from '../objects/Tile'

export class GamePlayScene extends Phaser.Scene {
    private tileMap: Map<string, Tile>

    private firstSelectedTile: Tile | null
    private secondSelectedTile: Tile | null

    constructor() {
        super({
            key: SCENE.GAMEPLAY,
        })
    }

    public create() {
        this.tileMap = new Map<string, Tile>()

        this.firstSelectedTile = null
        this.secondSelectedTile = null

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                this.setTile(i, j, this.getRandomTile(i, j))
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
                        this.resetSelect()
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

    private getTile(i: number, j: number): Tile | undefined {
        return this.tileMap.get(i.toString() + j.toString())
    }

    private setTile(i: number, j: number, tile: Tile): void {
        this.tileMap.set(i.toString() + j.toString(), tile)
    }
}
