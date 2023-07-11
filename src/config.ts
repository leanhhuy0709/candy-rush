import { GamePlayScene } from './scenes/GamePlayScene'
import { LoadingScene } from './scenes/LoadingScene'

export const GameConfig: Phaser.Types.Core.GameConfig = {
    title: 'Candy Rush',
    url: 'https://github.com/leanhhuy0709/candy-rush',
    version: '2.0',
    type: Phaser.AUTO,
    parent: 'Game',
    scene: [LoadingScene, GamePlayScene],
    input: {
        keyboard: true,
    },
    width: 600,
    height: 800,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.Center.CENTER_BOTH,
    },
    backgroundColor: '#63289e',
    render: { pixelArt: false, antialias: true },
}
