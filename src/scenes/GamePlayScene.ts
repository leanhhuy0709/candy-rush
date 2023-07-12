import { CONST, SCENE } from '../const/const'
import ScoreBoard from '../objects/ScoreBoard'
import { Tile } from '../objects/Tile'

export class GamePlayScene extends Phaser.Scene {
    private tileMap: Map<string, Tile>

    private firstSelectedTile: Tile | null
    private secondSelectedTile: Tile | null

    private scoreBoard: ScoreBoard

    private idleTime: number
    private isIdleTweenPlaying: boolean

    constructor() {
        super({
            key: SCENE.GAMEPLAY,
        })
    }

    public create() {
        this.tileMap = new Map<string, Tile>()

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                this.setTile(i, j, this.getRandomTile(i, j))
            }
        }
        this.firstSelectedTile = this.getTile(0, 0) as Tile
        this.secondSelectedTile = this.getTile(0, 1) as Tile
        
        this.scoreBoard = new ScoreBoard(this)

        this.input.on('gameobjectdown', this.onTileClicked, this)

        const centerX = this.cameras.main.width / 2
        const centerY = this.cameras.main.height / 2
        const R = 200

        for (let i = 0; i < CONST.gridHeight; i++) {
            for (let j = 0; j < CONST.gridWidth; j++) {
                const tile = this.getTile(i, j) as Tile
                const startAngle =
                    ((i * CONST.gridWidth + j) / (CONST.gridHeight * CONST.gridWidth)) * 360

                const tempObj = { coeff: startAngle, R: R }

                this.tweens.add({
                    targets: tempObj,
                    coeff: 360 + startAngle,
                    R: 100,
                    duration: 1500,
                    ease: 'Linear',
                    onStart: () => {
                        tempObj.coeff = startAngle
                        tempObj.R = R
                    },
                    onComplete: () => {
                        this.getTile(i, j)?.updatePositon(
                            true,
                            () => {
                                this.handleMatch(() => {
                                    this.idleTime = 0
                                    this.firstSelectedTile = null
                                    this.secondSelectedTile = null
                                })
                            },
                            Phaser.Math.Between(0, 500)
                        )
                    },
                    onUpdate: () => {
                        //(x - centerX)^2 + (x * tan - tan * centerX)^2 = R^2
                        //(x - centerX)^2 * (1 + tan^2) = R^2
                        //x = + - R/sqrt(1 + tan^2) + centerX
                        const angle = tempObj.coeff % 360
                        const R = tempObj.R

                        if (angle == 90) {
                            tile.x = centerX
                            tile.y = R + centerY
                            return
                        } else if (angle == 270) {
                            tile.x = centerX
                            tile.y = -R + centerY
                            return
                        }
                        const tan = Math.tan((angle * Math.PI) / 180)
                        if (angle < 90 && angle >= 0) {
                            tile.x = R / Math.sqrt(1 + tan ** 2) + centerX
                            tile.y = tan * (tile.x - centerX) + centerY
                        } else if (angle < 180 && angle > 90) {
                            tile.x = -R / Math.sqrt(1 + tan ** 2) + centerX
                            tile.y = tan * (tile.x - centerX) + centerY
                        } else if (angle < 270 && angle >= 180) {
                            tile.x = -R / Math.sqrt(1 + tan ** 2) + centerX
                            tile.y = tan * (tile.x - centerX) + centerY
                        } else if (angle <= 360 && angle > 270) {
                            tile.x = R / Math.sqrt(1 + tan ** 2) + centerX
                            tile.y = tan * (tile.x - centerX) + centerY
                        }
                    },
                })
            }
        }
    }

    public update(_time: number, delta: number) {
        if (this.idleTime == 0) this.isIdleTweenPlaying = false
        this.idleTime += delta
        this.handleIdleTime()
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

                        this.handleMatch(() => this.resetSelect())
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
            /*
            const temp1x = this.firstSelectedTile.gridX,
                temp1y = this.firstSelectedTile.gridY
            const temp2x = this.secondSelectedTile.gridX,
                temp2y = this.secondSelectedTile.gridY*/
            return true
            //return Math.abs(temp1x - temp2x) + Math.abs(temp1y - temp2y) === 1
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

    private removeTile(i: number, j: number): void {
        this.tileMap.delete(i.toString() + j.toString())
    }

    private handleMatch(onComplete?: Function): void {
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

                        if (
                            (tileBehind && tileBehind.getKey() === currentTile.getKey()) ||
                            (tileNext2 && tileNext2.getKey() === currentTile.getKey())
                        ) {
                            cols[currentTile.gridX]++

                            listBoom.push({ x: i, y: j, newY: -cols[currentTile.gridX] })

                            break
                        }
                    }
                }
            }
        }

        for (let i = 0; i < listBoom.length; i++) {
            const data = listBoom[i]
            const tile = this.getTile(data.x, data.y)

            if (tile) {
                const text = this.add
                    .text(tile.x, tile.y + 10, '100', {
                        fontFamily: 'Cambria',
                        fontSize: 25,
                        color: '#ffffff',
                    })
                    .setDepth(6)
                    .setOrigin(0.5, 0.5)
                    .setAlpha(0)
                    .setStroke('#000000', 2)

                const tween = this.tweens.add({
                    targets: text,
                    alpha: 1,
                    duration: 700,
                    y: tile.y,
                    onComplete: () => {
                        text.destroy()
                        tween.destroy()
                    },
                })

                this.removeTile(data.x, data.y)
                tile.gridY = data.newY
                this.setTile(data.x, data.newY, tile)
                tile.updatePositon(false)
                tile.setRandomTextures()
                tile.angle = 0
            }
        }

        if (listBoom.length) {
            for (let i = 0; i < CONST.gridWidth; i++) {
                let num = 0
                for (let j = CONST.gridHeight - 1; j >= -cols[i]; j--) {
                    const tile = this.getTile(i, j)

                    if (tile) {
                        if (num > 0) {
                            this.removeTile(i, j)
                            tile.gridY = j + num
                            this.setTile(i, j + num, tile)
                            tile.updatePositon(true, () => {
                                this.handleMatch()
                            })
                        }
                    } else num++
                }
            }
        }
        if (onComplete) onComplete()
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
        if (this.idleTime > 2000) {
            this.idleEffect()
            this.showHint()
            this.idleTime = 0
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
        for (let i = 0; i < listTile.length; i++) {
            const tile = listTile[i]
            this.onTileClicked(null, tile)
        }
    }
}
