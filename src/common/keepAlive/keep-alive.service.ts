import { Injectable, OnModuleInit } from '@nestjs/common';
@Injectable()
export class KeepAliveService implements OnModuleInit {
  private readonly url = 'https://xynexa-nest.onrender.com/api/v1/health';

  onModuleInit() {
    console.log('KeepAliveService started...');
    setInterval(
      () => {
        void this.performHealthCheck();
      },
      5 * 60 * 1000,
    );
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
