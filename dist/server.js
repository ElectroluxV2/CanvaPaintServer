"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const protocol_1 = require("./protocol");
const app = express();
app.set("port", process.env.PORT || 3000);
const http = require("http").Server(app);
const io = require("socket.io")(http);
/*app.get("/", (req: any, res: any) => {
    res.send("hello world");
});*/
const server = http.listen(3000, () => {
    console.log("Listening at :3000...");
    let remote = [];
    const checkRemote = (id) => {
        if (!!remote[id])
            return;
        remote[id] = {
            currentFreeLine: { type: protocol_1.Mode.FREE, start: { x: 0, y: 0 }, parts: [] },
            freeLines: [],
            straightLines: [],
            dots: [],
        };
    };
    let dimensions = [];
    io.on("connection", (socket) => {
        console.log('New connection from ' + socket.id);
        socket.on('disconnect', () => {
            console.log('Connection drop from ' + socket.id);
            const index = dimensions.findIndex((s) => s.socketId === socket.id);
            // Remove this size from memory
            dimensions.splice(index, 1);
            // Know it sucks, it could be done in one loop (TODO)
            let localMinX = 9999999, localMinY = 9999999;
            for (const size of dimensions) {
                if (localMinX > size.x)
                    localMinX = size.x;
                if (localMinY > size.y)
                    localMinY = size.y;
            }
            const toSend = {
                x: localMinX,
                y: localMinY,
                socketId: socket.id
            };
            console.log('New max border: ' + localMinX + ' x ' + localMinY);
            socket.broadcast.emit(protocol_1.PacketType.NEWMAXSIZE, toSend);
        });
        console.log('Sending data to ' + socket.id);
        for (let id in remote) {
            const client = remote[id];
            for (const freeLine of client.freeLines) {
                // Split this monstrum to parts
                const pStart = {
                    x: freeLine.parts[0].x,
                    y: freeLine.parts[1].y,
                    socketId: id
                };
                socket.emit(protocol_1.PacketType.FREE_START, pStart);
                for (let i = 1; i < freeLine.parts.length; i++) {
                    const p = freeLine.parts[i];
                    const pDraw = {
                        x: p.x,
                        y: p.y,
                        movementX: 0,
                        movementY: 0,
                        socketId: id,
                        color: freeLine.color
                    };
                    socket.emit(protocol_1.PacketType.FREE_DRAW, pDraw);
                }
                const pEnd = {
                    color: freeLine.color,
                    socketId: id
                };
                socket.emit(protocol_1.PacketType.FREE_END, pEnd);
            }
            for (const straightLine of client.straightLines) {
                const p = {
                    start: straightLine.start,
                    end: straightLine.end,
                    color: straightLine.color,
                    socketId: id
                };
                socket.emit(protocol_1.PacketType.STRAIGHT_DRAW, p);
            }
            for (const dot of client.dots) {
                const p = {
                    x: dot.x,
                    y: dot.y,
                    color: dot.color,
                    socketId: id
                };
                socket.emit(protocol_1.PacketType.FREE_DOT, p);
            }
        }
        for (const type in protocol_1.PacketType) {
            // Only values
            if (isNaN(Number(type)))
                continue;
            // For every package resend it to the others
            socket.on(type, (packet) => {
                // Id is required to reconize diffrent clients
                if (!packet.socketId) {
                    packet.socketId = socket.id;
                }
                // No resend for Resize Packet
                if (Number(type) === 5) {
                    // Recalc max dimension
                    const resize = packet;
                    const index = dimensions.findIndex((s) => s.socketId === socket.id);
                    if (index != -1) {
                        dimensions[index].x = resize.x;
                        dimensions[index].y = resize.y;
                    }
                    else {
                        dimensions.push({
                            x: resize.x,
                            y: resize.y,
                            socketId: socket.id
                        });
                    }
                    // Know it sucks, it could be done in one loop (TODO)
                    let localMinX = 9999999, localMinY = 9999999;
                    for (const size of dimensions) {
                        if (localMinX > size.x)
                            localMinX = size.x;
                        if (localMinY > size.y)
                            localMinY = size.y;
                    }
                    const toSend = {
                        x: localMinX,
                        y: localMinY,
                        socketId: socket.id
                    };
                    console.log('New max border: ' + localMinX + ' x ' + localMinY);
                    socket.broadcast.emit(protocol_1.PacketType.NEWMAXSIZE, toSend);
                    socket.emit(protocol_1.PacketType.NEWMAXSIZE, toSend);
                }
                else {
                    checkRemote(socket.id);
                    // Save Dots, StraightLines and FreeLines
                    if (Number(type) === 4) {
                        const p = packet;
                        remote[socket.id].dots.push({
                            type: protocol_1.Mode.DOT,
                            x: p.x,
                            y: p.y,
                            color: p.color
                        });
                    }
                    else if (Number(type) === 8) {
                        const p = packet;
                        remote[socket.id].straightLines.push({
                            type: protocol_1.Mode.STRAIGHT,
                            color: p.color,
                            start: p.start,
                            end: p.end
                        });
                    }
                    else if (Number(type) === 0) {
                        const p = packet;
                        remote[socket.id].currentFreeLine.start.x = p.x;
                        remote[socket.id].currentFreeLine.start.y = p.y;
                    }
                    else if (Number(type) === 1) {
                        const p = packet;
                        // Add Part to free line
                        remote[socket.id].currentFreeLine.parts.push({
                            x: p.x,
                            y: p.y
                        });
                    }
                    else if (Number(type) === 2) {
                        const p = packet;
                        // Add FreeLine
                        remote[socket.id].currentFreeLine.color = p.color;
                        remote[socket.id].freeLines.push(JSON.parse(JSON.stringify(remote[socket.id].currentFreeLine)));
                        remote[socket.id].currentFreeLine.parts = [];
                    }
                    else if (Number(type) === 3) {
                        remote = [];
                    }
                    socket.broadcast.emit(type, packet);
                    console.log(protocol_1.PacketType[type] + ' from ' + socket.id);
                }
            });
        }
    });
});
//# sourceMappingURL=server.js.map