class Credits extends Phaser.Scene{
    constructor(){
        super("creditsScene");
    }
    create(){
        this.credit = this.add.bitmapText(0, 0, "text", "Created by Cynthia He");
        this.artAssets = this.add.bitmapText(0, 0, "text", "Art assets from Kenny's Assets collection");
        /*
            "Music, rainbow tiles and programming done by Cynthia He"
            "Game engine - Phaser 3"
            "Editing Software Used"
            "Tiled - Level design"
            "Audacity - Sound editting"
            "MuseScore4 - Music and notes"
            "Piskel-0.14.0 - Pixel art"
            "Vscode - All the gawd darn programming"
        */
        
        this.goBack = this.add.text(game.config.width - 50, 0, "Go back to main menu");
        this.goBack.setInteractive();
        this.goBack.on('pointerdown', () => {
            this.scene.start("mainMenuScene");
        });
    }
}