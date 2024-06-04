class Credits extends Phaser.Scene{
    constructor(){
        super("creditsScene");
    }
    create(){
        this.credit = this.add.bitmapText(0, 0, "text", "Created by Cynthia He");
        this.artAssets = this.add.bitmapText(0, 0, "text", "Art assets from Kenny's Assets collection");
        
        this.goBack = this.add.text(game.config.width - 50, 0, "Go back to main menu");
        this.goBack.setInteractive();
        this.goBack.on('pointerdown', () => {
            this.scene.start("mainMenuScene");
        });
    }
}