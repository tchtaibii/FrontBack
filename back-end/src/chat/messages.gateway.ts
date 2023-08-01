import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { MessagesService } from './messages.service';
import { SocketIOMIDDELWARE } from 'src/auth/auth-services/ws';

@WebSocketGateway({cors : true, namespace : 'chat'})
export class ChatGateway implements OnGatewayConnection{
    @WebSocketServer() server: Server;
    private rooms: { [roomName: string]: Socket[] } = {};
    private socketsMap: Map<string, Socket[]> = new Map();


  constructor(private readonly ChatService : MessagesService)
  {}

    afterInit(client : Socket)
    {
        client.use(SocketIOMIDDELWARE() as any);
    }

    async handleConnection(client: Socket) {
        const sockets = this.socketsMap.get(client.data.playload.userId) || [];
        sockets.push(client);
        this.socketsMap.set(client.data.playload.userId, sockets);
        console.log('chat connected');
    }

    handleDisconnect(client)
    {
        console.log('discoonected');
        const sockets = this.socketsMap.get(client.data.playload.userId);
        if (sockets) {
			const index = sockets.indexOf(client);
			if (index !== -1) {
				sockets.splice(index, 1);
				if (sockets.length === 0) {
				this.socketsMap.delete(client.data.playload.userId);
				}
			}
		}
        for (const roomName in this.rooms) {
            this.rooms[roomName] = this.rooms[roomName].filter((socket) => socket.id !== client.id);
            if (this.rooms[roomName].length === 0) {
                delete this.rooms[roomName];
            }
        }
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, roomId: string) {

        if (!this.rooms[roomId]) {
            this.rooms[roomId] = [];
        }

        const sockets = this.socketsMap.get(client.data.playload.userId);

        // sockets.forEach(socket => {
        //     this.rooms[roomId].push(socket);
        //     socket.join(roomId);
        // });
        this.rooms[roomId].push(client);

        client.join(roomId);

        console.log(`Client ${client.id} joined room ${roomId}`);
    }

    @SubscribeMessage('message')
    async handleMessage(client: Socket, payload: { RoomId: string, message: string }) {

        const message = await this.ChatService.sendMessage(payload.message, client.data.playload.userId, payload.RoomId);
        
        if (!message.ischannel || !message.blocked.length)
            this.server.to(payload.RoomId).emit('message', message.send);
        else 
        {
            console.log(message.blocked);
            var room = this.rooms[payload.RoomId].filter((socket) => !message.blocked.includes(socket.data.playload.userId));

            room.map((client) =>
            {
                console.log(client.data.playload.userId);
                this.server.to(client.id).emit('message', message.send);
            })
        }
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(client: Socket, roomId: string) {
        client.leave(roomId);
        console.log(`Client ${client.id} left room ${roomId}`);
    }

}
