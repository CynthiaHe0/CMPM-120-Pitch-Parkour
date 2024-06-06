class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
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
        this.JUMP_VELOCITY = -700;
        this.MAX_SPEED = 800;
        this.score = 0;
        this.spawnX = game.config.width/5;
        this.spawnY = 5*game.config.height/6;
        this.playerStates = {};
        this.playerStates.inWater = false;
        this.playerStates.stepSounds = false;
        this.flagCount = 0;
        this.SCALE = 2;
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
            tile.collideDown = false;
        }

        //Scale up the world boundaries because we zoomed into the size of the objects
        this.physics.world.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2);


        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.spawnX, this.spawnY, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.body.setSize(15, 15);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxSpeed(this.MAX_SPEED);
        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        
        //Have camera follow player
        this.cameras.main.setZoom(1.5);
        this.cameras.main.centerOn(my.sprite.player.x, my.sprite.player.y);
        this.cameras.main.startFollow(my.sprite.player, false, 0.5, 0.5);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2);
        //this.cameras.main.setScroll(game.config.width/2, game.config.height/2);

        
        //PUT THE INIT AFTER ALL LAYERS CREATED
        this.animatedTiles.init(this.map);

        

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

    }

    update() {
        //check if coin object is visible
        //If visible, play animation
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
        }
        if(my.sprite.player.body.blocked.down) {
            if (!(this.playerStates.stepSounds) && (my.sprite.player.body.velocity.x != 0)){
                //PLAY ASSOCIATED NOTE
                /*this.playerStates.stepSounds = true;
                this.playerStepSound.play();
                this.playerStepSound.on('complete', () => {
                    this.playerStates.stepSounds = false;
                });*/
            }
            if(Phaser.Input.Keyboard.JustDown(cursors.up)){
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                //PLAY JUMP SOUND EFFECT
            }
        }
        
    }
    
    respawn(){
        //this.physics.world.gravity.y = 1500;
        my.sprite.player.x = this.spawnX;
        my.sprite.player.y = this.spawnY;
    }
    
}