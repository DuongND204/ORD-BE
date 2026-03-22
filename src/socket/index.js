const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('join:kitchen', () => {
      socket.join('kitchen');
      console.log(`   [kitchen] ${socket.id} joined`);
      socket.emit('joined', { room: 'kitchen' });
    });

    socket.on('join:waiter', () => {
      socket.join('waiter');
      console.log(`   [waiter] ${socket.id} joined`);
      socket.emit('joined', { room: 'waiter' });
    });

    socket.on('join:table', ({ tableId }) => {
      if (!tableId) return;
      const room = `table_${tableId}`;
      socket.join(room);
      console.log(`   [${room}] ${socket.id} joined`);
      socket.emit('joined', { room });
    });

    socket.on('watch:table', ({ tableId }) => {
      if (!tableId) return;
      const room = `table_${tableId}`;
      socket.join(room);
      socket.emit('joined', { room });
    });

    socket.on('leave:table', ({ tableId }) => {
      socket.leave(`table_${tableId}`);
    });

    socket.on('ping', () => socket.emit('pong'));

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} — ${reason}`);
    });
  });
};

export default initSocket;