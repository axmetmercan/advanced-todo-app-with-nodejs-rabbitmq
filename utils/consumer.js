const amqp = require('amqplib/callback_api');
const mailer = require('./email');

const mapUsers = async (users) => {
  console.log(users);
  const emailPromises = users.map(async (user) => {
    const mailSender = new mailer(user);

    if (user.user && user.user.email) {
      await mailSender.sendMail(user.user.email, user.title, user.title);
    }
  });

  await Promise.all(emailPromises);
};

amqp.connect('amqp://localhost', (error0, connection) => {
  if (error0) {
    throw error0;
  }
  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }

    const exchange = 'general_exchange';

    channel.assertExchange(exchange, 'direct', { durable: true });

    channel.assertQueue(
      'Notification',
      { exclusive: false },
      (error2, q) => {
        if (error2) {
          throw error2;
        }
        console.log(' [*] Waiting for logs. To exit press CTRL+C');

        channel.bindQueue(q.queue, exchange, 'send_notification');
        channel.prefetch(1);
        channel.consume(
          q.queue,
          async (msg) => {
            console.log('Mail has been sent');
            await mapUsers(JSON.parse(msg.content.toString()));
            channel.ack(msg);
          },
          {
            noAck: false,
          },
        );
      },
    );
  });
});
