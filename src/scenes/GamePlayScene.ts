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
        return new Tile({
            scene: this,
            x:
                CONST.tileWidth / 2 +
                x * (CONST.tileWidth + CONST.margin) +
                (w - (CONST.tileWidth + CONST.margin) * CONST.gridWidth),
            y: CONST.tileHeight / 2 + y * (CONST.tileHeight + CONST.margin),
            texture: randomTileType,
        })
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
            this.swapTiles()
        }
    }

    private swapTiles(): void {
        if (this.firstSelectedTile && this.secondSelectedTile) {
            const x = this.firstSelectedTile.x,
                y = this.firstSelectedTile.y

            this.tweens.add({
                targets: this.firstSelectedTile,
                x: this.secondSelectedTile.x,
                y: this.secondSelectedTile.y,
                duration: 1500,
                ease: 'Linear',
                onComplete: () => {
                    this.firstSelectedTile?.unSpin()
                    this.firstSelectedTile?.hideGraphics()
                    this.firstSelectedTile = null
                    
                },
            })

            this.tweens.add({
                targets: this.secondSelectedTile,
                x: x,
                y: y,
                duration: 1500,
                ease: 'Linear',
                onComplete: () => {
                    this.secondSelectedTile?.unSpin()
                    this.secondSelectedTile?.hideGraphics()
                    this.secondSelectedTile = null
                },
            })
        }
    }

    private resetSelect(): void {
        this.firstSelectedTile = null
        this.secondSelectedTile = null
    }
}
