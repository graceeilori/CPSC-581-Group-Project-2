const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// In-memory store
// { [joinCode]: { expertSocketId, students: { [socketId]: { name, bricks[] } } } }
const sessions = {};

// Generate a random 4-digit code
function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    // Expert creates a session
    socket.on("session:create", ({ className, module }, callback) => {
        const code = generateCode();
        sessions[code] = {
            expertSocketId: socket.id,
            className,
            module,
            students: {},
        };
        socket.join(code);
        socket.data.code = code;
        socket.data.role = "expert";
        console.log(`Session created: ${code} - ${className}`);
        callback({ code });
    });

    // Student joins with code
    socket.on("session:join", ({ code, studentName }, callback) => {
        const session = sessions[code];
        if (!session) {
            callback({ error: "Invalid code" });
            return;
        }
        socket.join(code);
        socket.data.code = code;
        socket.data.role = "student";
        socket.data.studentName = studentName;

        session.students[socket.id] = {
            name: studentName,
            bricks: [],
        };

        // Tell expert a new student joined
        io.to(session.expertSocketId).emit("student:joined", {
            socketId: socket.id,
            name: studentName,
        });

        // include expertSocketId so student can signal directly to the expert
        callback({ success: true, className: session.className, module: session.module, expertSocketId: session.expertSocketId });
        console.log(`${studentName} joined session ${code}`);
    });

    // Simple WebRTC signaling forwarding
    socket.on("webrtc:offer", ({ to, sdp }) => {
        if (!to) return;
        io.to(to).emit("webrtc:offer", { from: socket.id, sdp });
    });

    socket.on("webrtc:answer", ({ to, sdp }) => {
        if (!to) return;
        io.to(to).emit("webrtc:answer", { from: socket.id, sdp });
    });

    socket.on("webrtc:ice-candidate", ({ to, candidate }) => {
        if (!to) return;
        io.to(to).emit("webrtc:ice-candidate", { from: socket.id, candidate });
    });

    // Student updates their board
    socket.on("board:update", ({ bricks }) => {
        const code = socket.data.code;
        const session = sessions[code];
        if (!session || !session.students[socket.id]) return;

        // Persist latest board state
        session.students[socket.id].bricks = bricks;

        // Forward to expert only
        io.to(session.expertSocketId).emit("board:update", {
            socketId: socket.id,
            name: session.students[socket.id].name,
            bricks,
        });
    });

    // Expert ends the class
    socket.on("session:end", () => {
        const code = socket.data.code;
        if (!code || !sessions[code]) return;
        // Notify all students
        socket.to(code).emit("session:ended");
        delete sessions[code];
        console.log(`Session ${code} ended`);
    });

    // Student leaves voluntarily
    socket.on("session:leave", () => {
        handleStudentLeave(socket);
    });

    // Student requests help
    socket.on("student:help", () => {
        const code = socket.data.code;
        const session = sessions[code];
        if (!session) return;
        const student = session.students[socket.id];
        if (!student) return;

        // Forward the help event to the expert who created the session
        io.to(session.expertSocketId).emit("student:help", {
            socketId: socket.id,
            name: student.name,
        });
        console.log(`${student.name} requested help in session ${code}`);
    });

    // Handle disconnect (tab closed etc)
    socket.on("disconnect", () => {
        const { role, code } = socket.data;
        if (role === "student") handleStudentLeave(socket);
        if (role === "expert" && code && sessions[code]) {
            socket.to(code).emit("session:ended");
            delete sessions[code];
        }
        console.log("disconnected:", socket.id);
    });
});

function handleStudentLeave(socket) {
    const code = socket.data.code;
    const session = sessions[code];
    if (!session) return;
    const student = session.students[socket.id];
    if (!student) return;
    delete session.students[socket.id];
    io.to(session.expertSocketId).emit("student:left", {
        socketId: socket.id,
        name: student.name,
    });
    console.log(`${student.name} left session ${code}`);
    socket.leave(code);
}

httpServer.listen(3001, () => {
    console.log("Socket server running on http://localhost:3001");
});
