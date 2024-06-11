class MainMenu extends Phaser.Scene {
    constructor(){
        super("mainMenuScene");
    }
    create(){
        //Create key listeners for WASD & arrow keys
        //Create key listeners for Enter
        this.name = this.add.bitmapText(game.config.width/2, game.config.height/3, "text", "Pitch Parkour");
        this.name.setOrigin(0.5);

        this.start = this.add.text(game.config.width/2, game.config.height/3 + 50, "Start");
        this.start.setOrigin(0.5);
        this.start.setDisplaySize(300, 100);
        this.start.setInteractive();
        this.start.on('pointerdown', () => {
            this.scene.start("platformerScene1");
        });

        this.credits = this.add.text(game.config.width/2, 2*game.config.height/3, 'Credits');
        this.credits.setOrigin(0.5);
        this.credits.setDisplaySize(200, 75);
        this.credits.setInteractive();
        this.credits.on('pointerdown', () => {
            this.scene.start("creditsScene");
        });
    }
}