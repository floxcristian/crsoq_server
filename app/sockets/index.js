module.exports = (io, db) => {

    let connected_users = {};
    let loggedin_users = {};

    const numClients = (room) => {
        //return io.sockets.adapter.rooms[room] && io.sockets.adapter.rooms[room].length;
    };

    const usersInRoom = (room) => {
        let users = [];
        return users;
    };

    io.sockets.on('connection', (socket) => {

    });
    
}