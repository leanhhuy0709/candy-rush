export default class ScoreBoard {
    private scene: Phaser.Scene

    private score: number

    private scoreText: Phaser.GameObjects.Text

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
                strokeThickness: 2
            })
            .setDepth(6)
            .setOrigin(0.5, 0.5)
    }

    public addScore(score: number): void {
        this.score += score
        this.scoreText.setText(this.score.toString())
    }

    
}
