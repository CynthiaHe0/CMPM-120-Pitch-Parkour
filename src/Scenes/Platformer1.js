class Platformer1 extends Phaser.Scene {
    constructor() {
        super("platformerScene1");
    }
    preload(){
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }
    init() {
        // variables and settings
        //If you have extra time, make it so you can instantly turn
        this.ACCELERATION = 800;
        this.DRAG = 2400;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.BASE_JUMP_VELOCITY = -100;
        this.MAX_Y_SPEED = 500;
        this.MAX_X_SPEED = 300;
        this.score = 0;
        this.spawnX = game.config.width/10;
        this.spawnY = 5*game.config.height/6;
        this.playerStates = {
            onGround : false,
            platform : null,
            stepSounds: false,
            jumping: false,
            falling: false,
            readSign: false,
            sign: null,
            voidDeath : false,
            health: 3,
        };
        this.flagCount = 0;
        this.SCALE = 1.5;
        this.physics.world.drawDebug = false;
    }

    create() {
        //Set up level       
        this.map = this.add.tilemap("Level1", 18, 18, 120, 25);
        
        //First parameter is the name we gave it in tiled
        //Second parameter is the name we gave it in load.js
        this.rainbowNotes = this.map.addTilesetImage("rainbow_notes", "rainbowNotes");
        this.kennyTileset = this.map.addTilesetImage("tilemap_packed", "tilemap_tiles");
        
        this.groundLayer = this.map.createLayer("Platforms", [this.rainbowNotes, this.kennyTileset], 0, 0);
        this.groundLayer.setCollisionByProperty({
            collides: true
        });
        this.groundLayer.setScale(SCALE);
        let fall_through = this.groundLayer.filterTiles((tile) => {
            if (tile.collides == true){
                return true;
            }
            return false;
        });

        for (let tile of fall_through){
            if (tile.properties.note != "rest"){
                tile.collideLeft = false;
                tile.collideRight = false;
                tile.collideDown = false;
            }
        }
        
        this.puzzleLayer = this.map.createLayer("Puzzle", this.rainbowNotes, 0, 0);
        this.puzzleLayer.setScale(SCALE);
        this.puzzleLayer.setCollisionByProperty({
            collides: true
        });
        this.fakeTileSound = this.sound.add("fake tile");
        

        //Set up checkpoints
        this.flags = this.map.createLayer("Flags", this.kennyTileset, 0, 0);
        this.flags.setScale(SCALE);
        this.flags.setCollisionByProperty({
            collides : true
        });


        //Scale up the world boundaries because we zoomed into the size of the objects
        this.physics.world.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2 + 40);


        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.spawnX, this.spawnY, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.body.setSize(15, 15);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxVelocity(this.MAX_X_SPEED, this.MAX_Y_SPEED);
        this.noteSounds = {};
        this.noteSounds.do = this.sound.add("do");
        this.noteSounds.re = this.sound.add("re");
        this.noteSounds.mi = this.sound.add("mi");
        this.noteSounds.fa = this.sound.add("fa");
        this.noteSounds.so = this.sound.add("so");
        this.noteSounds.la = this.sound.add("la");
        this.noteSounds.ti = this.sound.add("ti");
        this.noteSounds.high_do = this.sound.add("high do");
        this.noteSounds.rest = this.sound.add("rest");
        this.deathSound = this.sound.add("NOoo");
        
        //Health UI setup
        this.healthUI = [];
        this.healthUI[0] = this.add.image(270, 150, "tilemap UI", 44);
        this.healthUI[1] = this.add.image(330, 150, "tilemap UI", 171);
        this.healthUI[2] = this.add.image(330, 150, "tilemap UI", 172);
        this.healthUI[3] = this.add.image(330, 150, "tilemap UI", 173);
        this.healthUI[4] = this.add.image(330, 150, "tilemap UI", 174);
        this.healthUI[5] = this.add.image(330, 150, "tilemap UI", 175);
        this.healthUI[6] = this.add.image(330, 150, "tilemap UI", 176);
        this.healthUI[7] = this.add.image(300, 150, "tilemap UI", 158);
        for (let element of this.healthUI){
            element.setScrollFactor(0);
            element.setScale(2);
        }
        this.healthUpdate();

        // Enable collision handling
        // Ground Layer stuff
        this.physics.add.collider(my.sprite.player, this.groundLayer, (player, tile)=>{
            //This if statement resets the collision for the tiles
            if (this.playerStates.platform != null){
                this.resetCollision();
            }
            //This is for detecting what platform the player is on and eventually lets them fall through
            this.playerStates.platform = tile;
        });

        this.checkpointSound = this.sound.add("checkpoint");
        //Flags and sign handling
        this.physics.add.overlap(my.sprite.player, this.flags, (player, tile) => {
            if (tile.index == 112 || tile.index == 132){
                if (tile.x * 36 > this.spawnX){
                    this.spawnX = tile.x * 36;
                    this.spawnY = 36 * (tile.index == 112 ? tile.y : tile.y-1);
                    this.checkpointSound.play();
                }
            } else if (tile.index == 11){
                //Play whoosh sound?
                //Add some sort of transition
                this.yay.play();
                //If you can get chase sequence done, swap to platformerScene2
                this.scene.start('endingScene', { health: this.playerStates.health});
                //Start the next scene
            } else if (tile.index == 87){
                my.sprite.enter.x = (tile.x) * 36 + 18;
                my.sprite.enter.y = (tile.y - 1) * 36;
                my.sprite.enter.visible = true;
                this.playerStates.readSign = true;
                this.playerStates.sign = tile;
            }
        });
        this.signContent = {
            3: this.moveControls,
            20: this.jumpControls,
            51: this.dropControls,
            75: this.puzzleSequence,
        }
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.enterKey.on('down', ()=>{
            if (this.playerStates.readSign){
                console.log("reading sign!");
                this.signTextBackground.visible = true;
                switch(this.playerStates.sign.x){
                    case 3:
                        this.signTextBackground.setScale(3);
                        this.moveControls();
                        break;
                    case 20:
                        this.signTextBackground.setScale(3);
                        this.jumpControls();
                        break;
                    case 51:
                        this.signTextBackground.setScale(5, 3);
                        this.dropControls();
                        break;
                    case 75:
                        this.signTextBackground.setScale(5, 3);
                        this.puzzleSequence();
                        break;
                    default:
                        console.log("Where the heck did you get this mystery sign?")
                }
            }
        });
        my.sprite.enter = this.add.sprite(0, 0, "enter");
        my.sprite.enter.setScale(0.8);
        my.sprite.enter.visible = false;

        this.signTextBackground = this.add.sprite(game.config.width/2, game.config.height/4, "tip background");
        this.signTextBackground.setOrigin(0.5);
        this.signTextBackground.visible = false;
        this.signTextBackground.setScrollFactor(0);
        this.signTextBackground.setScale(3);

        this.moveControlsText = this.add.bitmapText(game.config.width/2, game.config.height/4, "text", "Use              to move!");
        this.moveControlsText.setOrigin(0.5);
        this.moveControlsText.visible = false;
        this.moveControlsText.setScrollFactor(0);

        my.sprite.left = this.add.sprite((game.config.width/2)-60, game.config.height/4, "left");
        my.sprite.left.visible = false;
        my.sprite.left.setScrollFactor(0);

        my.sprite.right = this.add.sprite(game.config.width/2   , game.config.height/4, "right");
        my.sprite.right.visible = false;
        my.sprite.right.setScrollFactor(0);

        this.jumpControlsText = this.add.bitmapText(game.config.width/2, game.config.height/4, "text", "Use        to jump!");
        this.jumpControlsText.setOrigin(0.5);
        this.jumpControlsText.visible = false;
        this.jumpControlsText.setScrollFactor(0);

        my.sprite.up = this.add.sprite(game.config.width/2 - 30, game.config.height/4, "up");
        my.sprite.up.visible = false;
        my.sprite.up.setScrollFactor(0);

        this.dropControlsText = this.add.bitmapText(game.config.width/2, game.config.height/4, "text", "Use        to drop through platforms!");
        this.dropControlsText.setOrigin(0.5);
        this.dropControlsText.visible = false;
        this.dropControlsText.setScrollFactor(0);

        my.sprite.down = this.add.sprite(game.config.width/2 - 150, game.config.height/4, "down");
        my.sprite.down.visible = false;
        my.sprite.down.setScrollFactor(0);

        //Puzzle layer handling
        this.physics.add.overlap(my.sprite.player, this.puzzleLayer, this.puzzleHandler, null, this);
        this.jumpTimer = this.time.addEvent({ delay: 250, callback: this.finishJump, callbackScope: this });
        this.puzzleSequenceText = this.add.bitmapText(game.config.width/2, game.config.height/4, "text", "Here's the secret: Re Fa La Mi So Ti Do'");
        this.puzzleSequenceText.setOrigin(0.5);
        this.puzzleSequenceText.visible = false;
        this.puzzleSequenceText.setScrollFactor(0);
        this.puzzleTune = this.sound.add("puzzle tune");
        this.yay = this.sound.add("yay");
        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        
        //Have camera follow player
        this.cameras.main.setZoom(1.5);
        this.cameras.main.centerOn(my.sprite.player.x, my.sprite.player.y);
        this.cameras.main.startFollow(my.sprite.player, false, 0.5, 0.5);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2);
        //this.cameras.main.setScroll(game.config.width/2, game.config.height/2);

        
        //PUT THE INIT AFTER ALL LAYERS CREATED
        //this.animatedTiles.init(this.map);

        

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        this.input.keyboard.on('keydown-A', () => {
            this.scene.start("platformerScene2");
        });

        this.input.keyboard.on('keydown-W', () => {
            this.playerStates.health++;
            this.healthUpdate();
        });
    }

    update() {
        //Check if the player fell off the map
        if (my.sprite.player.y >= this.map.heightInPixels*2){
            //This makes sure the game only removes 1 health at a time and plays the sound once
            if (this.playerStates.voidDeath == false){
                this.playerStates.health--;
                this.healthUpdate();
                this.deathSound.play();
                this.playerStates.voidDeath = true;
            }
            this.deathSound.on('complete', ()=>{
                if (this.playerStates.health > 0){
                    this.playerStates.voidDeath = false;
                    this.respawn();
                } else {
                    this.scene.start('endingScene', { health: this.playerStates.health});
                }
            });
        }
        if (!(this.playerStates.voidDeath)){
            if(cursors.left.isDown) {
                // TODO: have the player accelerate to the left
                //my.sprite.player.body.setVelocityX(-400);
                my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
                my.sprite.player.resetFlip();
                my.sprite.player.anims.play('walk', true);

            } else if(cursors.right.isDown) {
                // TODO: have the player accelerate to the right
                //my.sprite.player.body.setVelocityX(400);
                my.sprite.player.body.setAccelerationX(this.ACCELERATION);
                my.sprite.player.setFlip(true, false);
                my.sprite.player.anims.play('walk', true);

            } else {
                // TODO: set acceleration to 0 and have DRAG take over
                my.sprite.player.body.setAccelerationX(0);
                my.sprite.player.body.setDragX(this.DRAG);
                my.sprite.player.anims.play('idle');
            }

            // player jump
            // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
            if(!my.sprite.player.body.blocked.down) {
                my.sprite.player.anims.play('jump');
            } else {
                //This is for the walking sounds
                if (!(this.playerStates.stepSounds) && (my.sprite.player.body.velocity.x != 0)){
                    //PLAY ASSOCIATED NOTE
                    this.playNote();
                }
                //This is for the landing noise
                if (this.playerStates.falling == true){
                    this.playerStates.falling = false;
                    this.playNote();
                }
                if(Phaser.Input.Keyboard.JustDown(cursors.up)){
                    this.playerStates.jumping = true;
                    this.jumpTimer.reset({ delay: 300, callback: this.finishJump, callbackScope: this });
                    this.time.addEvent(this.jumpTimer);
                    this.JUMP_VELOCITY = this.BASE_JUMP_VELOCITY;
                    //PLAY JUMP SOUND EFFECT
                }
                if (Phaser.Input.Keyboard.JustDown(cursors.down)){
                    if (this.playerStates.platform.properties.note != "rest"){
                        this.playerStates.platform.collideUp = false;
                        //This is so if the player is stepping on 2 tiles at once, they will still be able to fall through
                        //I am kinda cheating with my design because since it's based around notes, I made sure all the same notes
                        //are at the same height
                        let sameTiles = this.groundLayer.filterTiles((tile) => {
                            //console.log(tile);
                            if (tile.y == this.playerStates.platform.y){
                                return true;
                            }
                            return false;
                        });
                        for (let tile of sameTiles){
                            tile.collideUp = false;
                        }
                    }
                }
            }
            if (this.playerStates.jumping == true){
                if (cursors.up.isDown){
                    this.JUMP_VELOCITY -= 20 + 20*(this.BASE_JUMP_VELOCITY/this.JUMP_VELOCITY);
                    my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                } else {
                    //This is in case the player wants to do a short jump;
                    this.playerStates.jumping = false;
                    this.JUMP_VELOCITY = this.BASE_JUMP_VELOCITY;
                }
            }
        }
        if (my.sprite.player.body.velocity.y > 0){
            this.playerStates.falling = true;
        }
        if (this.playerStates.readSign == true){
            if (Math.abs(my.sprite.player.body.x - (this.playerStates.sign.x * 36)) > 18 || Math.abs(my.sprite.player.body.y - (this.playerStates.sign.y * 36)) > 18){
                this.playerStates.readSign = false;
                my.sprite.enter.visible = false;
                this.signTextBackground.visible = false;
                this.moveControlsText.visible = false;
                this.dropControlsText.visible = false;
                this.jumpControlsText.visible = false;
                this.puzzleSequenceText.visible = false;
                my.sprite.up.visible = false;
                my.sprite.down.visible = false;
                my.sprite.left.visible = false;
                my.sprite.right.visible = false;
            }
        }
    }
    resetCollision(){
        let sameTiles = this.groundLayer.filterTiles((tile) => {
            if (tile.y == this.playerStates.platform.y){
                return true;
            }
            return false;
        });
        for (let tile of sameTiles){
            tile.collideUp = true;
        }
    }
    respawn(){
        //this.physics.world.gravity.y = 1500;
        this.resetCollision();
        my.sprite.player.x = this.spawnX;
        my.sprite.player.y = this.spawnY;
    }
    finishJump(){
        this.playerStates.jumping = false;
        this.JUMP_VELOCITY = this.BASE_JUMP_VELOCITY;
        console.log(this.playerStates.platform);
    }
    playNote(){
        this.playerStates.stepSounds = true;
        this.noteSounds[this.playerStates.platform.properties.note].play();
        this.noteSounds[this.playerStates.platform.properties.note].on('complete', () => {
            this.playerStates.stepSounds = false;
        });
    }
    moveControls(){
        this.moveControlsText.visible = true;
        my.sprite.left.visible = true;
        my.sprite.right.visible = true;
    }
    jumpControls(){
        this.jumpControlsText.visible = true;
        my.sprite.up.visible = true;
    }
    dropControls(){
        this.dropControlsText.visible = true;
        my.sprite.down.visible = true;
    }
    puzzleSequence(){
        this.puzzleSequenceText.visible = true;
        this.puzzleTune.play();
    }
    healthUpdate(){
        for (let i = 1; i < 7; i ++){
            let num = this.healthUI[i];
            if (i == this.playerStates.health){
                num.visible = true;
            } else {
                num.visible = false;
            }
        }
    }
    puzzleHandler(player, tile){
        //This object is a reference for me to 
        let note2y = {
            do : 24,
            re : 22,
            mi : 20,
            fa : 18,
            so : 16,
            la : 14,
            ti : 12,
        };
        if(tile.index != -1){
            //console.log(tile);
            if (tile.x <= 85 && tile.x > 80){
                if (tile.y != note2y.re){
                    tile.visible = false;
                    this.map.removeTile(tile);
                    this.fakeTileSound.play();
                } else {
                    let replace = this.groundLayer.getTileAt(78, note2y.re);
                    this.groundLayer.putTileAt(replace, tile.x, tile.y, true);
                    let note = this.groundLayer.getTileAt(tile.x, tile.y);
                    note.setCollision(true, true, true, true, false);
                    console.log(note);
                }
            } else if (tile.x < 90){
                if (tile.y != note2y.fa){
                    tile.visible = false;
                    this.map.removeTile(tile);
                    this.fakeTileSound.play();
                } else {
                    let replace = this.groundLayer.getTileAt(78, note2y.fa);
                    this.groundLayer.putTileAt(replace, tile.x, tile.y, true);
                    let note = this.groundLayer.getTileAt(tile.x, tile.y);
                    note.setCollision(true);
                    console.log(note);
                }
            } else if (tile.x < 95){
                if (tile.y != note2y.la){
                    tile.visible = false;
                    this.map.removeTile(tile);
                    this.fakeTileSound.play();
                } else {
                    let replace = this.groundLayer.getTileAt(78, note2y.la);
                    this.groundLayer.putTileAt(replace, tile.x, tile.y, true);
                    let note = this.groundLayer.getTileAt(tile.x, tile.y);
                    note.setCollision(true);
                }
            } else if (tile.x < 100){
                if (tile.y != note2y.mi){
                    tile.visible = false;
                    this.map.removeTile(tile);
                    this.fakeTileSound.play();
                } else {
                    let replace = this.groundLayer.getTileAt(78, note2y.mi);
                    this.groundLayer.putTileAt(replace, tile.x, tile.y, true);
                    let note = this.groundLayer.getTileAt(tile.x, tile.y);
                    note.setCollision(true);
                }
            } else if (tile.x < 105){
                if (tile.y != note2y.so){
                    tile.visible = false;
                    this.map.removeTile(tile);
                    this.fakeTileSound.play();
                } else {
                    let replace = this.groundLayer.getTileAt(78, note2y.so);
                    this.groundLayer.putTileAt(replace, tile.x, tile.y, true);
                    let note = this.groundLayer.getTileAt(tile.x, tile.y);
                    note.setCollision(true);
                }
            } else if (tile.x < 110){
                if (tile.y != note2y.ti){
                    tile.visible = false;
                    this.map.removeTile(tile);
                    this.fakeTileSound.play();
                } else {
                    let replace = this.groundLayer.getTileAt(78, note2y.ti);
                    this.groundLayer.putTileAt(replace, tile.x, tile.y, true);
                    let note = this.groundLayer.getTileAt(tile.x, tile.y);
                    note.setCollision(true);
                }
            } else {
                if (tile.y != 10){
                    tile.visible = false;
                    this.map.removeTile(tile);
                    this.fakeTileSound.play();
                } else {
                    let replace = this.groundLayer.getTileAt(78, note2y.do);
                    this.groundLayer.putTileAt(replace, tile.x, tile.y, true);
                    let note = this.groundLayer.getTileAt(tile.x, tile.y);
                    note.setCollision(true);
                }
            }
        }
    }
}