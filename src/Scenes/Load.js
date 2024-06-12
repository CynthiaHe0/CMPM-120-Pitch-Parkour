class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.bitmapFont('text', 'bitmapfont.png', 'bitmapfont.xml');
        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");
        this.load.atlasXML("monsterParts", "sheet.png", "sheet.xml");
        this.load.image("hat", "spike_top.png");
        this.load.image("pink puff", "particle_pink.png");

        // Load tilemap information
        this.load.tilemapTiledJSON("Level1", "Level1.tmj");
        this.load.tilemapTiledJSON("Level2", "Level2.tmj");
        
        this.load.image("rainbowNotes", "tile_sheet_128px_by_128px.png");
        this.load.image("tilemap_tiles", "tilemap_packed.png");                         // Packed tilemap
       
        this.load.image("up", "keyboard_arrow_up.png");
        this.load.image("down", "keyboard_arrow_down.png");
        this.load.image("left", "keyboard_arrow_left.png");
        this.load.image("right", "keyboard_arrow_right.png");
        this.load.image("enter", "keyboard_enter.png");

        this.load.audio("do", ["do.ogg"]);
        this.load.audio("re", ["re.ogg"]);
        this.load.audio("mi", ["mi.ogg"]);
        this.load.audio("fa", ["fa.ogg"]);
        this.load.audio("so", ["so.ogg"]);
        this.load.audio("la", ["la.ogg"]);
        this.load.audio("ti", ["ti.ogg"]);
        this.load.audio("high do", ["high_do.ogg"]);
        this.load.audio("rest", ["footstep_carpet_000.ogg"]);
        this.load.audio("puzzle tune", ["Note_Puzzle_Tune.ogg"]);
        this.load.audio("boss music", ["Messing with chords.ogg"]);

    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });

        

         // ...and pass to the next Scene
         this.scene.start("mainMenuScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}