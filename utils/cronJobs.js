const cron = require('node-cron');
const amqp = require('amqplib');
const Todo = require('../models/todoModel');

// To inform user each day at 19 pm
cron.schedule('0 0 19 * * *', async () => {
  async function connectRabbitMQ() {
    try {
      const connection = await amqp.connect('amqp://localhost');
      const channel = await connection.createChannel();

      const todos = await Todo.find({ situation: 'finished' }).populate('user');

      const unfinishedTodos = todos.map((todo) => ({
        user: todo.user,
        situation: todo.situation,
        title: todo.title,
      }));

      const todosJson = JSON.stringify(unfinishedTodos);
      // console.log(todosJson);

      const exchange = 'general_exchange';

      await channel.assertExchange(
        exchange,

        'direct',
        {
          durable: true,
        },
      );

      await channel.publish(
        exchange,
        'send_notification',
        Buffer.from(todosJson),
        {
          persistent: true,
        },
      );

      console.log('Message Sent');

      await channel.close();
      await connection.close();
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
    }
  }

  connectRabbitMQ().then((channel) => {
    // Use the channel for sending/receiving messages
  });
});
