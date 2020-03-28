import * as express from "express";
import * as socketio from "socket.io";
import * as path from "path";
import { PacketType, FreeStart, FreeDraw, FreeEnd, Packet, Resize, StraightLine, FreeLine, Dot, FreeDot, Mode, StraightDraw } from "./protocol";

const app = express();
app.set("port", process.env.PORT || 3000);

const http = require("http").Server(app);
const io = require("socket.io")(http);

/*app.get("/", (req: any, res: any) => {
    res.send("hello world");
});*/

const server = http.listen(3000, () => {
    console.log("Listening at :3000...");

    interface Storage {
        currentFreeLine: FreeLine;
        freeLines: FreeLine[];
        straightLines: StraightLine[];
        dots: Dot[];
    }

    let remote: Storage[] = [];

    const checkRemote = (id: any) => {

        if (!!remote[id]) return;
        remote[id] = {
            currentFreeLine: { type: Mode.FREE, start: { x: 0, y: 0 }, parts: [] } as FreeLine,
            freeLines: [],
            straightLines: [],
            dots: [],
        };
    }

    interface Size {
        socketId: string
        x: number;
        y: number;
    }

    let dimensions: Size[] = [];

    io.on("connection", (socket: any) => {
        console.log('New connection from ' + socket.id);

        socket.on('disconnect',  () => {
            console.log('Connection drop from ' + socket.id);
            const index = dimensions.findIndex((s: Size) => s.socketId === socket.id);

            // Remove this size from memory
            dimensions.splice(index, 1);

            // Know it sucks, it could be done in one loop (TODO)
            let localMinX = 9999999, localMinY = 9999999;
            for (const size of dimensions) {
                if (localMinX > size.x) localMinX = size.x;
                if (localMinY > size.y) localMinY = size.y;
            }

            const toSend: Resize = {
                x: localMinX,
                y: localMinY,
                socketId: socket.id
            };

            console.log('New max border: ' + localMinX + ' x ' + localMinY);
            socket.broadcast.emit(PacketType.NEWMAXSIZE, toSend);
        });

        console.log('Sending data to ' + socket.id);
        
        for (let id in remote) {
            const client = remote[id];           
            
            for (const freeLine of client.freeLines) {
                // Split this monstrum to parts
                const pStart: FreeStart = {
                    x: freeLine.parts[0].x,
                    y: freeLine.parts[1].y,
                    socketId: id
                };
                socket.emit(PacketType.FREE_START, pStart);

                for (let i = 1; i < freeLine.parts.length; i++) {
                    const p = freeLine.parts[i];
                    const pDraw: FreeDraw = {
                        x: p.x,
                        y: p.y,
                        movementX: 0,
                        movementY: 0,
                        socketId: id,
                        color: freeLine.color
                    };
                    socket.emit(PacketType.FREE_DRAW, pDraw);
                }

                const pEnd: FreeEnd = {
                    color: freeLine.color,
                    socketId: id
                }
                socket.emit(PacketType.FREE_END, pEnd);
            }
    
            for (const straightLine of client.straightLines) {
                const p: StraightDraw = {
                    start: straightLine.start,
                    end: straightLine.end,
                    color: straightLine.color,
                    socketId: id
                };
                socket.emit(PacketType.STRAIGHT_DRAW, p);
            }

            for (const dot of client.dots) {
                const p: FreeDot = {
                    x: dot.x,
                    y: dot.y,
                    color: dot.color,
                    socketId: id
                };
                socket.emit(PacketType.FREE_DOT, p);
            }
        }

        for (const type in PacketType) {
            // Only values
            if (isNaN(Number(type))) continue;

            // For every package resend it to the others
            socket.on(type, (packet: Packet) => {

                // Id is required to reconize diffrent clients
                if (!packet.socketId) {
                    packet.socketId = socket.id;
                }

                // No resend for Resize Packet
                if (Number(type) === 5) {
                    // Recalc max dimension
                    const resize: Resize = packet as Resize;
                    const index = dimensions.findIndex((s: Size) => s.socketId === socket.id);                   

                    if (index != -1) {
                        dimensions[index].x = resize.x;
                        dimensions[index].y = resize.y;
                        
                    } else {
                        dimensions.push({
                            x: resize.x,
                            y: resize.y,
                            socketId: socket.id
                        });
                    }

                    // Know it sucks, it could be done in one loop (TODO)
                    let localMinX = 9999999, localMinY = 9999999;
                    for (const size of dimensions) {
                        if (localMinX > size.x) localMinX = size.x;
                        if (localMinY > size.y) localMinY = size.y;
                    }

                    const toSend: Resize = {
                        x: localMinX,
                        y: localMinY,
                        socketId: socket.id
                    };

                    console.log('New max border: ' + localMinX + ' x ' + localMinY);
                    socket.broadcast.emit(PacketType.NEWMAXSIZE, toSend);
                    socket.emit(PacketType.NEWMAXSIZE, toSend);
                } else {

                    checkRemote(socket.id);
                    // Save Dots, StraightLines and FreeLines
                    if (Number(type) === 4) {
                        const p = packet as FreeDot;
                        remote[socket.id].dots.push({
                            type: Mode.DOT,
                            x: p.x,
                            y: p.y,
                            color: p.color
                        });
                    } else if (Number(type) === 8) {
                        const p = packet as StraightDraw;
                        remote[socket.id].straightLines.push({
                            type: Mode.STRAIGHT,
                            color: p.color,
                            start: p.start,
                            end: p.end
                        });
                    
                    } else if (Number(type) === 0) {
                        const p = packet as FreeStart;
                        remote[socket.id].currentFreeLine.start.x = p.x;
                        remote[socket.id].currentFreeLine.start.y = p.y;
                    } else if (Number(type) === 1) {
                        const p = packet as FreeDraw;
                        // Add Part to free line
                        remote[socket.id].currentFreeLine.parts.push({
                            x: p.x,
                            y: p.y
                        });
                    } else if (Number(type) === 2) {
                        const p = packet as FreeEnd;
                        // Add FreeLine
                        remote[socket.id].currentFreeLine.color = p.color;
                        remote[socket.id].freeLines.push(JSON.parse(JSON.stringify(remote[socket.id].currentFreeLine)));
                        remote[socket.id].currentFreeLine.parts = [];  
                    } else if (Number(type) === 3) {
                        remote = [];
                    }

                    socket.broadcast.emit(type, packet);
                    console.log(PacketType[type] + ' from ' + socket.id);
                }
            });
        }
    });
});