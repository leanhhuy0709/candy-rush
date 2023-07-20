import { SCENE } from "../const/const"

export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({
            key: SCENE.LOADING,
        })
    }

    preload(): void {
        // set the background and create loading bar
        this.cameras.main.setBackgroundColor(0x98d687)

        // load out package
        this.load.pack('preload', './assets/pack.json', 'preload')

        this.load.spritesheet("candy", './assets/images/spritesheet.png', {
            frameWidth: 64,
            frameHeight: 72,
        })
    }

    update(): void {
        this.scene.start(SCENE.MENU)
    }
}
