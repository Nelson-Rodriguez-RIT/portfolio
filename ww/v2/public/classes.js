class Lobby {
    constructor(id, host = {id: "", socket: null}) {
        this.id = id;
        this.host = host;
        this.users = []; // socket
        this.chat = []; // {id: "", username: "", message: ""}
        this.map = [[]]; // Store a reference to the occording socket
    }
}

module.exports = this;