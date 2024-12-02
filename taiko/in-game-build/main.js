// This is a standalone build for gameplay features of Project 3

let BEATMAP = null;
let HTML = {};

let currentTime  = 0;
let previousTime = 0;

const GAME = {
    // Updated very offten
    timingPoints: [],
    
    hitObjects:       [], // Stores active hit objects that will be displayed and checked for during input events
    hitObjectsQueue:  [], // Inactive, contains the entire beatmap initial
    hitObjectsMissed: [], // Used for UI; allows hitobjects to move offscreen without messing up the above variables
    hitObjectsHit:    [], // Used for UI; allows hitobjects to move towards the soul bar indicator

    scoreUIQueue:  [], // UI only; used to periodically add points and show score values per input event
    timingUIQueue: [], // UI only; used to show timing result i.e. Good, Ok, and Bad
    inputQueue:    [],
    soundEffects:  [],

    score: 0, // (380 + 90 * comboBonus) * (timingIsGood ? 1 : 0.5)      
              //https://taikotime.blogspot.com/2018/08/feature-combo-scoring-visualized.html
    combo: 0, // comboBonus = 1 at 10xCombo, 2 at 30x, 4 at 50x, and 8 at 100x 
    soul:  0, // Represents percent of completion of note hit requirements in order to pass the song
    

    // Set upon beatmap load
    soulDifficulty: 0.0,    // Used to determine how much soul to gain/lose and ballon notes hit requirement
    timingGood: 0,  // +- ms window for hitting a note with a good rating, awards full points      
    timingOk:   0,  // +- ms window for hitting a note with a ok rating, awards half points  
    timingBad:  0,  // + ms window for hitting a note with a miss rating, awards no points and breaks combo. (Note only matters for early inputs since anything past - ok window is a miss anyways) 


    // Environment
    progression: 0, // ms
    delta:       0, // sec, i.e. 1 = 1 second, 0.001 = 1ms
    input: {
        lc: false, rc: false, // Center
        lr: false, rr: false, // Rim
    },

    // Changed via timing points
    BPM:          0,
    multiplierSV: 1,     // Multiplier applied to baseSV
    inKiai:       false, // Used to signal a peak/chorus/important part of a song. Increases point gain by 20% for the duration its active
    volume:       0,     // %
}

const CONFIG = {
    hitObjectBaseValue: 380,
    comboScoreBonus: 90,

    hitZoneXOffset: 200,     //px
    noteDespawnXOffset: 350, //px

    maxLoadedHitObjects: 50,

    fps: 60, // Used for BPM related features only
    scrollBGMoveSpeed: 0.5, // px

    inputDuration: 100, //ms
    doubleInputWindow: 20, //ms, length of time to hit a big note with two inputs for double points

    keybinds: {
        lc: 'j', rc: 'k', // Center
        lr: 'd', rr: 'f', // Rim
    },
    
    baseSV: 0.35,              // Controls how fast hit objects move from left to right

    defaultGoodTiming: 30, // +- ms for full points
    defaultOkTiming: 65,   // +- ms for half points
    defaultBadTiming: 75,  // +- ms for no points and broken combo (needed to prevent button mashing OK timings)

    judgementLength: 400,

    
}



let FileAudioInput = document.querySelector("#input");
let AudioURL = null;
let MusicPlayer = null;
FileAudioInput.addEventListener('change', e => {AudioURL = URL.createObjectURL(FileAudioInput.files[0])});

let FileInput = document.querySelector("#input");
FileInput.addEventListener('change', load);

window.onkeydown = e => {
    switch(e.key.toLowerCase()) {
        case CONFIG.keybinds.lc: if (!GAME.input.lc) {GAME.input.lc = true; GAME.inputQueue.push({type: 'lc', at: GAME.progression, active: true}); GAME.soundEffects.push(new Audio('./assets/audio/taiko-drum.wav'));} break;
        case CONFIG.keybinds.rc: if (!GAME.input.rc) {GAME.input.rc = true; GAME.inputQueue.push({type: 'rc', at: GAME.progression, active: true}); GAME.soundEffects.push(new Audio('./assets/audio/taiko-drum.wav'));} break;
        case CONFIG.keybinds.lr: if (!GAME.input.lr) {GAME.input.lr = true; GAME.inputQueue.push({type: 'lr', at: GAME.progression, active: true}); GAME.soundEffects.push(new Audio('./assets/audio/taiko-rim.wav'));} break;
        case CONFIG.keybinds.rr: if (!GAME.input.rr) {GAME.input.rr = true; GAME.inputQueue.push({type: 'rr', at: GAME.progression, active: true}); GAME.soundEffects.push(new Audio('./assets/audio/taiko-rim.wav'));} break;
    }
}
window.onkeyup = e => {
    switch(e.key.toLowerCase()) {
        case CONFIG.keybinds.lc: if (GAME.input.lc) GAME.input.lc = false; break;
        case CONFIG.keybinds.rc: if (GAME.input.rc) GAME.input.rc = false; break;
        case CONFIG.keybinds.lr: if (GAME.input.lr) GAME.input.lr = false; break;
        case CONFIG.keybinds.rr: if (GAME.input.rr) GAME.input.rr = false; break;
    }
}




async function load() {
    HTML = Setup.GetGameHTML(); 
    Util.GetRawText(FileInput.files[0]);

    update();
}




function update() {
    // Request update to be called next frame
    // Works off of CSS framerates, so this is normally tied to monitor refresh rate
    window.requestAnimationFrame(update);

    // Update deltatime
    currentTime = window.performance.now();
    GAME.delta = (currentTime - previousTime); // These means that if deltatime was cumulative it would equal 1 after 1 second
    previousTime = currentTime;

    // Load content from BEATMAP to GAME and prepare environment
    if (BEATMAP && HTML.game.className != '') {
        HTML.game.className = '';
        FileInput.className = 'inactive';

        GAME.hitObjectsQueue   = Object.assign(BEATMAP.hitObjects);
        GAME.timingPoints      = Object.assign(BEATMAP.timingPoints);

        GAME.baseSV = BEATMAP.settings.baseSV;

        if (AudioURL) {
            //MusicPlayer = new Audio(`${AudioURL}.mp3`);
            //MusicPlayer.play();

            // TODO: Audio plz
        }

        HTML.music.src = './beatmap/audio.mp3';
        HTML.music.play();
    }

    if (BEATMAP) {
        // Remove deactivated hit objects
        GAME.hitObjects = GAME.hitObjects.filter(o => { if (!o.active) o.html.remove(); return o.active;});



        // Check for input
        // Remove inputs from queue if it has existed longer than the input duration
        GAME.inputQueue = GAME.inputQueue.filter(i => i.at + CONFIG.inputDuration > GAME.progression); 
        // Check for double hits
        for(let i = 0; i < GAME.inputQueue.length - 1; i++)
            if (GAME.inputQueue[i] && GAME.inputQueue[i + 1].at - GAME.inputQueue[i].at < CONFIG.doubleInputWindow)
                switch(GAME.inputQueue[i].type) {
                    case 'lc': 
                        if (GAME.inputQueue[i + 1].type == 'rc') {
                            GAME.soundEffects[i].pause();           // Stop playing regular audio
                            GAME.soundEffects[i].ended = true;      // Flag it to be removed from the audio queue

                            GAME.inputQueue[i + 1].type = 'dc';
                            GAME.soundEffects[i + 1] = new Audio('./assets/audio/taiko-drum-heavy.wav');
                        } 
                        break;
                    case 'rc': 
                        if (GAME.inputQueue[i + 1].type == 'lc')  {
                            GAME.soundEffects[i].pause();
                            GAME.soundEffects[i].ended = true;

                            GAME.inputQueue[i + 1].type = 'dc';
                            GAME.soundEffects[i + 1] = new Audio('./assets/audio/taiko-drum-heavy.wav');
                        } 
                        break;
                    case 'lr': 
                        if (GAME.inputQueue[i + 1].type == 'rr')  {
                            GAME.soundEffects[i].pause();
                            GAME.soundEffects[i].ended = true;

                            GAME.inputQueue[i + 1].type = 'dr';
                            GAME.soundEffects[i + 1] = new Audio('./assets/audio/taiko-rim-heavy.wav');
                        } 
                        break;
                    case 'rr': 
                        if (GAME.inputQueue[i + 1].type == 'lr')  {
                            GAME.soundEffects[i].pause();
                            GAME.soundEffects[i].ended = true;

                            GAME.inputQueue[i + 1].type = 'dr';
                            GAME.soundEffects[i + 1] = new Audio('./assets/audio/taiko-rim-heavy.wav');
                        } 
                        break;
            }
            

        // Drum UI hit indicators
        HTML.lr.className = "inactive"; HTML.rr.className = "inactive"; 
        HTML.lc.className = "inactive"; HTML.rc.className = "inactive";
        
        for (let input of GAME.inputQueue) {
            switch (input.type) {
                case 'lr': HTML.lr.className = ""; break;
                case 'rr': HTML.rr.className = ""; break;
                case 'lc': HTML.lc.className = ""; break;
                case 'rc': HTML.rc.className = ""; break;

                case 'dr': HTML.rr.className = ""; HTML.lr.className = ""; break;
                case 'dc': HTML.rc.className = ""; HTML.lc.className = "";break;
            }
        }


        // Audio -> Update sound effects
        GAME.soundEffects = GAME.soundEffects.filter(s => {if (s.ended) s.remove(); return !s.ended});
        for (let sound of GAME.soundEffects)
            if (sound.paused) {
                sound.play();
                sound.volume = GAME.volume;
                sound.loop = false;
            }

        // Load more hitObjects until active cap is reached or if remaining hitObject queue is less than cap, use that
        while (GAME.hitObjectsQueue.length && GAME.hitObjects.length < (GAME.hitObjectsQueue.length < CONFIG.maxLoadedHitObjects ? CONFIG.maxLoadedHitObjects : GAME.hitObjectsQueue.length)) {
            let hitObject            = GAME.hitObjectsQueue.shift();
            hitObject.html           = document.createElement('li');
            hitObject.html.className = Taiko.HitObjectTypes[hitObject.type];

            // Check if the next timing point has been reached
            if (GAME.timingPoints.length && GAME.timingPoints[0].timing <= hitObject.timing) {
                let timingPoint = GAME.timingPoints.shift();

                console.log(timingPoint.volume)

                GAME.volume = timingPoint.volume;
                GAME.inKiai = timingPoint.kiai;

                if (timingPoint.sv > 0) // Intreprete as BPM change
                    GAME.BPM = 0; // TODO
                if (timingPoint.sv < 0) // Intreprete as SV change
                    GAME.multiplierSV = -timingPoint.sv; // TODO: Use this value and store it in the hitObject itself
            }
            hitObject.sv = GAME.multiplierSV;

            HTML.gameField.insertBefore(hitObject.html, HTML.gameField.firstChild);
            GAME.hitObjects.push(hitObject);
        }
           


        



        // TODO: Do SV by adjusting a hitObjects.timing and GAME.delta (when adding to left) 
        // i.e. 2x SV would make hitObjectg.timing * 2 amd GAME.delta * 2 (for that hitObject)
        // change timing point reader to be able to read multiple timing points a head
        // perhaps display hitobjects in sudo groups created by timing points?

        // Move hit objects
        for (let o of GAME.hitObjects) {
            let position = o.timing - GAME.progression;

            //if (Math.abs(position) <= 10)
                //o.active = false;

            // Only check notes if they can be hit in the first place
            if (position > -CONFIG.defaultOkTiming && position < CONFIG.defaultBadTiming) {
                let timingDifference = null;

                for (let input of GAME.inputQueue)
                    if (input.active) {
                        // TODO: Add double note functionality
                        if ((input.type == 'lr' || input.type == 'rr') && (o.type == 1 || o.type == 3)) {
                            timingDifference = Math.abs((input.at - GAME.progression) + position);
                        }
                        if ((input.type == 'lc' || input.type == 'rc') && (o.type == 0 || o.type == 2)) {
                            timingDifference = Math.abs((input.at - GAME.progression) + position);
                        }
                            

                        if (timingDifference != null) { // (380 + 90 * comboBonus) * (timingIsGood ? 1 : 0.5) 
                            if (timingDifference <= CONFIG.defaultGoodTiming) {
                                GAME.timingUIQueue.unshift({at: GAME.progression, anim: new Util.Animation(Links.goodJudgement, 0.5, 'judgement')})
                                GAME.combo++;
                                GAME.score += (380 + 90 * ( // Higher combo higher score gained. (380 + 90 * comboBonus) combos is 0 at <10, 1 >10, 2 >30, 4 >50, and 8 >100 (combo)
                                    GAME.combo > 10 ? (GAME.combo > 30 ? (GAME.combo > 50 ? (GAME.combo > 100 ? 
                                        8 : 4) : 2) : 1) : 0))
                            }
                            else if (timingDifference <= CONFIG.defaultOkTiming) {
                                console.log('Ok')//GAME.timingUIQueue.unshift({at: GAME.progression, class: 'judgementOk', path: './assets/ui/ok-judgement.gif', html: document.createElement('li')})
                                GAME.combo++;
                                GAME.score += (380 + 90 * ( // Higher combo higher score gained. (380 + 90 * comboBonus) combos is 0 at <10, 1 >10, 2 >30, 4 >50, and 8 >100 (combo)
                                    GAME.combo > 10 ? (GAME.combo > 30 ? (GAME.combo > 50 ? (GAME.combo > 100 ? 
                                        8 : 4) : 2) : 1) : 0)) * 0.5 // half as many points rewarded for ok timing
                            }
                            else {
                                console.log('Poor')

                                GAME.combo = 0; // No points and combo is broken/reset
                            }

                            o.active = false;
                            input.active = false;
                        }
                    }
                        
            }
            
            // Break combo is note is missed (different from poor timing but same result: no points and a broken combo)
            if (position < -CONFIG.defaultOkTiming)
                GAME.combo = 0;

            if (position < -CONFIG.noteDespawnXOffset) // If note moves offscreen, despawn it {}
                o.active = false;
            else
                o.html.style.left = `${(o.timing * CONFIG.baseSV * o.sv) - (GAME.progression * CONFIG.baseSV * o.sv) + CONFIG.hitZoneXOffset}px`;
        }
            


        // Update hit objects in storage thats not active or in queue

        // Change a hit objects storage location depending if it is hit or missed via lack of input



        // Update UI
        // Move top bg, it is 2x vw so set upon moving it half distance
        HTML.scrollImage.style.left = `${
            (HTML.scrollImage.style.left > HTML.scrollImage.offsetWidth / 2) ? 
            0 : HTML.scrollImage.style.left + GAME.delta // * CONFIG.scrollBGMoveSpeed
        }px`;


        // use Util.Animation
        for (let judgement of GAME.timingUIQueue) {
            if (judgement.at == GAME.progression) { // change to https://www.w3schools.com/jsref/met_node_insertbefore.asp
                if (HTML.hitZone.children.length == 0)
                    HTML.hitZone.appendChild(judgement.anim.html);
                else
                    HTML.hitZone.insertBefore(judgement.anim.html, HTML.hitZone.firstChild);
            }

            judgement.anim.update();
        }
        GAME.timingUIQueue = GAME.timingUIQueue.filter(j => {if (j.at + CONFIG.judgementLength < GAME.progression) {j.anim.html.remove(); return false} return true})

        // Update score display
        HTML.score.innerHTML

        //debugger
        GAME.progression += GAME.delta;
    }


    // Layers
    /*
    Layer 0 top-bg, gamefield-bg, and bottom-bg
    Layer 1 soul guage
    Layer 2 soul guage completetion, hitzone
    Layer 3 notes
    Layer 4 ui bg
    Layer 5 drum, score bg 
    Layer 6 drum hit markers, score nums, combo nums
    */


    // https://osu.ppy.sh/wiki/en/Client/File_formats/osu_%28file_format%29

    // TODO: Object handling
    // Timing is done is milliseconds since osu beatmap store timings based on ms too
    
    // Note slider SVs will require increasing/decreasing the rate at which the objects appear
    // this means that I will also have to start them further back. Ill need to into the beatmap
    // data to figure out how to get a multiplier for these two things (since they are directly related)
    // https://www.youtube.com/watch?v=-7FiYZ4t2x0

    // Objects (i.e. dons and katsus) are to be spawned in a specific quantity. I initially thought 50, but if these
    // is in the browser I should probably attempt to be efficient with memory usage, specically since these
    // HAVE to be DOM objects (remmeber no CANVAS element usage is allowed)

    // Objects need to be despawned after they pass a specific threshold (i.e. the user missed the note) or when
    // they get interacted with (i.e. player attempts to hit the note)

    // Timing Points: Pos = uninherited and pos number is beat length (which is used to set bpm), Neg = uninherited and value sets SV



    // TODO: Input
    // Don's and Katu's inputs should be mutually exclusive, meaning that using the input for one doesn't impact the other
    // This will likely require reading a few notes ahead. Perhaps use a for-of loop to check for objects within hit range

    // Inputs will need to be able to last for more than one frame for big notes, since its very unlikely to hit both
    // bottoms exactly on the same frame. Perhaps I should have a queue structure for inputs instead of a boolean type on/off system

    

    // TODO: UI Handling
    // Hitting a note should involve a small animation of the note either going off screen at a curved angle (opposed to just moving straight offscreen as if you missed it)
    // or to the health bar. At 50 or 75% health bar should visually change to show this i.e. the tamashii icon should change, entire bar gets a glow

    // Hitting a note should show its accuracy animation and change for bigger varieties respectivily
    // If combo reaches 50 and above, spritesheet for combo numbers should change to golden ver

    // Score should show the number (quickly but) gradually increasing with a +### indicator underneath to show recently earned points
    // I should probably use a queue for this system

    // Hitzone and general UI elements to change to be more "active"/glowing during Kai periods

    // I definitly have to implement don chan
    // He should have idle, combo reached/special note cleared, failing, and kai time animations
    
    // Reach combo milestone should have don chan also let an exclamation of reached combo

    // Don and Katsu should become animated at 50 combo and twice as fast as at 150. This should be BPM

    // Change top background once reaching health threshold to pass
    // Maybe change it once again once full?

    
    // TODO: Ideas for calculating BPM
    // Adding measure lines (Use time sig 4/4)

    // BPM =   1 / (uninherited timing point val 1) * 1000 * (fps)
}

