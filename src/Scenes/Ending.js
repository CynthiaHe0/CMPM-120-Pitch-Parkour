class Ending extends Phaser.Scene{
    constructor(){
        super("endingScene");
    }
    create(){
        my.sprite.player = this.add.sprite(game.config.width/2, game.config.height/2, "platformer_characters", "tile_0000.png").setScale(2);
        this.youWin = this.add.bitmapText(game.config.width/2, game.config.height/4, "text", "You Win!");
        this.youWin.setOrigin(0.5);
        this.toMainMenu = this.add.text(game.config.width - 300, 0, "Go back to main menu" );
        this.toMainMenu.setInteractive();
        this.toMainMenu.setDisplaySize(300, 75);
        this.toMainMenu.on('pointerdown', () => {
            this.scene.start("mainMenuScene");
        });
    }
}