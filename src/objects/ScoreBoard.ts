import { GamePlayScene } from '../scenes/GamePlayScene'

const levels = [0, 1000, 3000, 5500, 7000, 9000, 10000, 13000, 15000, 18000, 220000, 1000000]
export default class ScoreBoard {
    private scene: Phaser.Scene

    private score: number

    private scoreText: Phaser.GameObjects.Text
    private targetText: Phaser.GameObjects.Text

    private progressBar: Phaser.GameObjects.Graphics

    private level = 1

    public constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.score = 0

        this.scoreText = scene.add
            .text(scene.cameras.main.width / 2, 50, '0', {
                fontFamily: 'Cambria',
                fontSize: 55,
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2,
            })
            .setDepth(6)
            .setOrigin(0.5, 0.5)

        const graphics = this.scene.add.graphics()

        graphics.lineStyle(3, 0xed3896).setDepth(9).strokeRoundedRect(30, 50, 175, 20, 5)
        graphics.fillStyle(0x002d66)
        graphics.fillRoundedRect(30, 50, 175, 20, 5).setDepth(4)

        this.progressBar = this.scene.add
            .graphics()
            .fillStyle(0xf5d1b6)
            .fillRoundedRect(30, 50, 100, 20, 5)
            .setDepth(5)
        this.updateProgressBar(0)

        this.targetText = scene.add
            .text(30 + 175 / 2, 30, `${levels[this.level]}`, {
                fontFamily: 'Cambria',
                fontSize: 20,
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2,
            })
            .setDepth(6)
            .setOrigin(0.5, 0.5)
    }

    public addScore(score: number): void {
        this.score += score
        this.scoreText.setText(this.score.toString())

        this.updateProgressBar(
            (this.score - levels[this.level - 1]) / (levels[this.level] - levels[this.level - 1])
        )
    }

    public updateProgressBar(percent: number): void {
        if (percent <= 0.05) percent = 0.05
        if (percent > 1) percent = 1
        this.progressBar.clear()
        this.progressBar
            .fillStyle(0xf5d1b6)
            .fillRoundedRect(30, 50, percent * 175, 20, 5)
            .setDepth(5)
    }

    public handleGoToNextLevel(): void {
        if (this.score >= levels[this.level]) {
            this.level++
            this.targetText.setText(`${levels[this.level]}`)
            this.updateProgressBar(
                (this.score - levels[this.level - 1]) /
                    (levels[this.level] - levels[this.level - 1])
            )
            const scene = this.scene as GamePlayScene
            scene.shuffle()
        }
    }
}
