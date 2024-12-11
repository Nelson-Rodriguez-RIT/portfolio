const Taiko = {
    Beatmap: class Beatmap {
        constructor() {
            // Data that directly controls the gameplay
            this.hitObjects   = [];
            this.timingPoints = [];
            
            // Data that indirectly impacts the map's difficulty
            this.settings = {soulDifficulty: null, timingDifficulty: null, baseSV: null};

            // External info that doesn't impact the gameplay
            this.meta = {song: null, author: null, mapper: null, difficulty: null};
        }
    },

    // Idea is that will do  `<li class="${HitObjectCSSTypes[HitObject.type][gameplayStateVariable]}"></li>`    when adding this to the active hitobjects html element

    HitObjectTypes: [
        'hit-object-red-base',
        'hit-object-blue-base',
        'hit-object-big-red-base',
        'hit-object-big-blue-base',
    ],

    HitObject: class HitObject {
        constructor(type, timing) {
            this.active = true;
            
            this.html  = null;
            this.sv    = 1;

            this.inKiai = false;

            this.type   = type;   // Controls the kind of note 
            this.timing = timing; // Controls when, in ms and from the start of the song, this note should reach the hitzone
            
            // When creating note elements in HTML, make sure to set the relavent 
            // class to control the design/display properties of the note

            // General HTML formatting for any hitobject should look like this
            /*
            hitObjectContainerHTML.innerHTML += `<li class=""></li>`

            // an example of adding a don element to the playfield
            hitObjectContainerHTML.innerHTML += `<li class="_don"></li>`
            */
            
            // CSS class names for each type of hitObject (note, classes applied during JS execution start with an underscore)
            // _don-static & _don-big-static   --after reachng 50 combo--> _don-anim & _don-big-anim --after reaching 150 combo-->  _don-anim-fast & _don-big-anim-fast
            // _katsu-static & _katsu-big-static   --after reachng 50 combo--> _katsu-anim & _katsu-big-anim --after reaching 150 combo-->  _katsu-anim-fast & _katsu-big-anim-fast
        }

        applySVFromTimingPoints(timingPoints) { // Use this af

        }
    },

    TimingPoint: class TimingPoint {
        constructor(timing, sv, volume, kiai) {
            this.timing = timing; // Number (in ms)
            this.sv     = sv;     // Number ("Slider Velocity" or how fast the beats move from right to left)
            this.volume = volume; // Number
            this.kiai   = kiai;   // Bool
        }
    },
}

const Util = {
    GetRawText: function (file) {
        let reader = new FileReader();
        reader.onload = e => {
            let raw = e.target.result;
            Util.ConvertOSU(raw);
        }
        reader.readAsText(file);
    },

    ConvertOSU: function (raw) {
        BEATMAP = new Taiko.Beatmap();
        
        let lines = raw.split('\n');
        if (!lines || lines.length == 0 || !lines[0].includes("osu file format v"))
            return null;
    
        for (let index = 0; index < lines.length; index++) {
            let line = lines[index];
    
            if (line.includes("TitleUnicode:"))
                BEATMAP.meta.title = line.slice(13, line.length - 1);
    
            else if (line.includes("ArtistUnicode:"))
                BEATMAP.meta.artist = line.slice(14, line.length - 1);
    
            else if (line.includes("Creator:"))
                BEATMAP.meta.mapper = line.slice(8, line.length - 1);
    
            else if (line.includes("Version:"))
                BEATMAP.meta.difficulty = line.slice(8, line.length - 1);


            else if (line.includes("HPDrainRate:"))
                BEATMAP.settings.soulDifficulty = Number(line.slice(12, line.length - 1));
    
            else if (line.includes("OverallDifficulty:"))
                BEATMAP.settings.timingDifficulty = Number(line.slice(18, line.length - 1));

            else if (line.includes("SliderMultiplier:"))
                BEATMAP.settings.baseSV = Number(line.slice(17, line.length - 1));


            else if (line.includes("[TimingPoints]")) {
                let timingPoint;

                for (index++; lines[index].length != 1; index++) {
                    timingPoint = lines[index].split(',');
                    console.log(timingPoint[7])
                    BEATMAP.timingPoints.push(new Taiko.TimingPoint(
                        Number(timingPoint[0]),      // Timing in ms
                        
                        Number(timingPoint[1]) > 0 ? Number(timingPoint[1]) : 50 / Number(timingPoint[1]),

                        Number(timingPoint[5]) / 100, // Volumne
                        timingPoint[7] == 1));      // In kiai time
                }
            }

            else if (line.includes("[HitObjects]")) { 
                let hitObject;

                for (index++; index < lines.length && lines[index].length != 1; index++) {
                    hitObject = lines[index].split(',');
                    switch(hitObject[4]) {
                        case '0':  // don
                            BEATMAP.hitObjects.push(new Taiko.HitObject(0, Number(hitObject[2])));
                            break;
                        case '8':  // katu
                            BEATMAP.hitObjects.push(new Taiko.HitObject(1, Number(hitObject[2])));
                            break;
    
                        case '4':  // big don
                            BEATMAP.hitObjects.push(new Taiko.HitObject(2, Number(hitObject[2])));
                            break;
                        case '12': // big katu
                            BEATMAP.hitObjects.push(new Taiko.HitObject(3, Number(hitObject[2])));
                            break;
    
                        default: // Type not implemented, currently: drumrolls and dandans
                            //data.hitObjects.push(new Taiko.HitObject(-1, Number(hitObject[2])));
                            break;
                        }
                }
                    

                // No important data should be following hitObjects, so stop searching here
                break;
            }
        }

    },
    ConvertOSZ: function (rawData) {

    },

    Animation: class Animation {
        constructor(links, framesBetween, imgClass) {
            this.links  = links;
            this.framesBetween = framesBetween;

            this.html = document.createElement('img');
            this.html.className = imgClass;

            this.html.src = links[0];
            this.timer = 0;
        }

        update() {
            this.timer += GAME.delta / CONFIG.fps;

            if (this.timer >= this.links.length * this.framesBetween)
                this.timer = 0;

            this.html.src = this.links[Math.min(this.links.length , Math.floor(this.timer / this.framesBetween))]
        }
    }
}

const Setup = {
    GetGameHTML: function () {
        return { 
            game: document.querySelector("#game-window"),

            soulBar:       document.querySelector("#soul-bar"),
            soulFilled:    document.querySelector("#soul-completion"),
            soulIndicator: document.querySelector("#soul-indicator"),

            score: document.querySelector("#score"),
            combo: document.querySelector("#combo"),

            gameField: document.querySelector("#game-field"),

            lr: document.querySelector("#drum-lr"),
            rr: document.querySelector("#drum-rr"),
            lc: document.querySelector("#drum-lc"),
            rc: document.querySelector("#drum-rc"),

            scrollImage: document.querySelector("#top"),
            scrollImageOverlay: document.querySelector("#top-overlay"),
            bgImage:     document.querySelector("#bottom"),

            hitZone:     document.querySelector("#hit-zone"),
            hitZoneKiai: document.querySelector("#hit-zone-kiai"),


            music: document.querySelector("#music"),
            sounds: document.querySelector("#sound-effects"),
        }
    },
    PreloadImages: async function (links) {
        const buffer = new Image();
        for (let link of links)
            buffer.src = link;
    }
}


const Links = {
    goodJudgement: [ // Used for animation
        './assets/ui/good-judgement/taiko-hit300-0.png',
        './assets/ui/good-judgement/taiko-hit300-1.png',
        './assets/ui/good-judgement/taiko-hit300-2.png',
        './assets/ui/good-judgement/taiko-hit300-3.png',
        './assets/ui/good-judgement/taiko-hit300-4.png',
        './assets/ui/good-judgement/taiko-hit300-5.png',
        './assets/ui/good-judgement/taiko-hit300-6.png',
        './assets/ui/good-judgement/taiko-hit300-7.png',
        './assets/ui/good-judgement/taiko-hit300-8.png',
        './assets/ui/good-judgement/taiko-hit300-9.png',
        './assets/ui/good-judgement/taiko-hit300-10.png',
        './assets/ui/good-judgement/taiko-hit300-11.png',
        './assets/ui/good-judgement/taiko-hit300-12.png',
        './assets/ui/good-judgement/taiko-hit300-13.png',
        './assets/ui/good-judgement/taiko-hit300-14.png',
    ],
    okJudgement: [ // Used for animation
        './assets/ui/ok-judgement/taiko-hit100-0.png',
        './assets/ui/ok-judgement/taiko-hit100-1.png',
        './assets/ui/ok-judgement/taiko-hit100-2.png',
        './assets/ui/ok-judgement/taiko-hit100-3.png',
        './assets/ui/ok-judgement/taiko-hit100-4.png',
        './assets/ui/ok-judgement/taiko-hit100-5.png',
        './assets/ui/ok-judgement/taiko-hit100-6.png',
        './assets/ui/ok-judgement/taiko-hit100-7.png',
        './assets/ui/ok-judgement/taiko-hit100-8.png',
        './assets/ui/ok-judgement/taiko-hit100-9.png',
        './assets/ui/ok-judgement/taiko-hit100-10.png',
        './assets/ui/ok-judgement/taiko-hit100-11.png',
        './assets/ui/ok-judgement/taiko-hit100-12.png',
        './assets/ui/ok-judgement/taiko-hit100-13.png',
        './assets/ui/ok-judgement/taiko-hit100-14.png',
    ],
    poorJudgement: [
        './assets/ui/poor-judgement/poor-judgement-0.png',
        './assets/ui/poor-judgement/poor-judgement-1.png',
        './assets/ui/poor-judgement/poor-judgement-2.png',
        './assets/ui/poor-judgement/poor-judgement-3.png',
        './assets/ui/poor-judgement/poor-judgement-4.png',
        './assets/ui/poor-judgement/poor-judgement-5.png',
        './assets/ui/poor-judgement/poor-judgement-6.png',
        './assets/ui/poor-judgement/poor-judgement-7.png',
        './assets/ui/poor-judgement/poor-judgement-8.png',
        './assets/ui/poor-judgement/poor-judgement-9.png',
    ],

    goodBigJudgement: [ // Used for animation
        './assets/ui/good-big-judgement/taiko-hit300k-0.png',
        './assets/ui/good-big-judgement/taiko-hit300k-1.png',
        './assets/ui/good-big-judgement/taiko-hit300k-2.png',
        './assets/ui/good-big-judgement/taiko-hit300k-3.png',
        './assets/ui/good-big-judgement/taiko-hit300k-4.png',
        './assets/ui/good-big-judgement/taiko-hit300k-5.png',
        './assets/ui/good-big-judgement/taiko-hit300k-6.png',
        './assets/ui/good-big-judgement/taiko-hit300k-7.png',
        './assets/ui/good-big-judgement/taiko-hit300k-8.png',
        './assets/ui/good-big-judgement/taiko-hit300k-9.png',
        './assets/ui/good-big-judgement/taiko-hit300k-10.png',
        './assets/ui/good-big-judgement/taiko-hit300k-11.png',
        './assets/ui/good-big-judgement/taiko-hit300k-12.png',
        './assets/ui/good-big-judgement/taiko-hit300k-13.png',
        './assets/ui/good-big-judgement/taiko-hit300k-14.png',
        './assets/ui/good-big-judgement/taiko-hit300k-15.png',
        './assets/ui/good-big-judgement/taiko-hit300k-16.png',
        './assets/ui/good-big-judgement/taiko-hit300k-17.png',
        './assets/ui/good-big-judgement/taiko-hit300k-18.png',
        './assets/ui/good-big-judgement/taiko-hit300k-19.png',
        './assets/ui/good-big-judgement/taiko-hit300k-20.png',
        './assets/ui/good-big-judgement/taiko-hit300k-21.png',
        './assets/ui/good-big-judgement/taiko-hit300k-22.png',
        './assets/ui/good-big-judgement/taiko-hit300k-23.png',
    ],
    okBigJudgement: [ // Used for animation
        './assets/ui/ok-big-judgement/taiko-hit100k-0.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-1.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-2.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-3.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-4.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-5.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-6.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-7.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-8.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-9.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-10.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-11.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-12.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-13.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-14.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-15.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-16.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-17.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-18.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-19.png',
        './assets/ui/ok-big-judgement/taiko-hit100k-20.png',
    ],


    donWadaIdle: [
        
    ],
    donWadaClear: [

    ],
    donWadaKiai: [

    ],


    donCombo: [
        './assets/notes/red-base.png',
        './assets/notes/red-norm.png'
    ],
    donKiai: [
        './assets/notes/red-base.png',
        './assets/notes/red-kiai.png'
    ],
    katuCombo: [
        './assets/notes/blue-base.png',
        './assets/notes/blue-norm.png'
    ],
    katuKiai: [
        './assets/notes/blue-base.png',
        './assets/notes/blue-kiai.png'
    ],

    donBigCombo: [
        './assets/notes/red-big-base.png',
        './assets/notes/red-big-norm.png'
    ],
    donBigKiai: [
        './assets/notes/red-big-base.png',
        './assets/notes/red-big-kiai.png'
    ],
    katuBigCombo: [
        './assets/notes/blue-big-base.png',
        './assets/notes/blue-big-norm.png'
    ],
    katuBigKiai: [
        './assets/notes/blue-big-base.png',
        './assets/notes/blue-big-kiai.png'
    ],

    // use an apng for notes it auto syncs itself! have kiai, static and active varients
    // dumbass its bpm based
}