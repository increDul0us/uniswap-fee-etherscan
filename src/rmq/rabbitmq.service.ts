import * as amqp from 'amqplib';

export class RabbitMQService {
  private static singleton: RabbitMQService | null = null;
  private connection: amqp.Connection | null = null;
  channel: amqp.Channel | null = null;

  private constructor() {}

  static getSingleton(): RabbitMQService {
    if (!RabbitMQService.singleton) {
      RabbitMQService.singleton = new RabbitMQService();
    }
    return RabbitMQService.singleton;
  }

  async connect(url: string): Promise<void> {
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      console.log('Connected to RabbitMQ');
    } catch (error) {
      throw error;
    }
  }

  async createQueue(queueName: string): Promise<void> {
    try {
      await this.channel?.assertQueue(queueName);
      console.log(`Queue '${queueName}' created`);
    } catch (error) {
      throw error;
    }
  }

  async sendMessage(queueName: string, message: any): Promise<void> {
    try {
      this.channel?.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
      console.log('Message sent to queue:', message);
    } catch (error) {
      throw error;
    }
  }
}
