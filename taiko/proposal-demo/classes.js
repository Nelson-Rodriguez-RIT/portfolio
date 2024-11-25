class Beatmap {
    constructor(title = "", artist = "", mapper = "", types = [], timings = []) {
        this.title  = title;
        this.artist = artist;
        this.mapper = mapper;

        this.hitObjectTypes   = types
        this.hitObjectTimings = timings
    }
}

class HitObject {
    constructor(type, timing) {
        this.enabled = true;
        this.timing  = timing;
        this.type    = type;

        // Create drawable to be displayed
        this.drawable = document.createElement('span');
        HTML.game.self.appendChild(this.drawable);

        this.drawable.style.position = 'fixed';
        this.drawable.style.top  = '32.5vh';
        this.drawable.style.left = '110vw';

        this.drawable.style.width    = '5vh';
        this.drawable.style.height   = '5vh';
        
        switch(type) {
            case 2:
                this.drawable.style.width  = '10vh';
                this.drawable.style.height = '10vh';
            case 0:
                this.drawable.style.backgroundColor = 'rgb(255, 35, 35)';
                break;

            case 3:
                this.drawable.style.width  = '10vh';
                this.drawable.style.height = '10vh';
            case 1:
                this.drawable.style.backgroundColor = 'rgb(0, 180, 255)';
                break;
        }
    }
}