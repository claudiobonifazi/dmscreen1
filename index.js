const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const app = express();
const server = createServer(app);
const io = new Server(server);

const port = process.env.port || 3000;

app.use(express.static(__dirname + '/'));

app.get('/player', (req,res)=>{
	res.sendFile(join(__dirname, 'player_view.html'));
});
app.get('/master', (req,res)=>{
	res.sendFile(join(__dirname, 'master_view.html'));
});

io.on('connection', (socket) => {
	console.log('a user connected');
	socket.on("from_master_to_players", data=>{
		io.emit( "from_master_to_players", data );
	});
});

server.listen( port, () => {
	console.log('server running at http://localhost:'+port);
});