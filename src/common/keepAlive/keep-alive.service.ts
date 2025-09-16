import { Injectable, OnModuleInit } from '@nestjs/common';
@Injectable()
export class KeepAliveService implements OnModuleInit {
  private readonly url = 'https://your-app.onrender.com/health';

  onModuleInit() {
    console.log('KeepAliveService started...');
    setInterval(
      () => {
        void this.performHealthCheck();
      },
      5 * 60 * 1000,
    ); // প্রতি 5 মিনিটে ping
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const res = await fetch(this.url);
      console.log(
        `Self-ping success: ${res.status} at ${new Date().toISOString()}`,
      );
    } catch (err) {
      console.error(
        'Self-ping failed:',
        err instanceof Error ? err.message : 'Unknown error',
      );
    }
  }
}
