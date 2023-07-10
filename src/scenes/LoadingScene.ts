export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'LoadingScene',
        })
    }

    preload(): void {
        // set the background and create loading bar
        this.cameras.main.setBackgroundColor(0x98d687)

        // load out package
        this.load.pack('preload', './assets/pack.json', 'preload')
    }

    update(): void {
        this.scene.start('GamePlayScene')
    }
}
