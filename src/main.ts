import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const session = require('express-session');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';

// Set timezone to Asia/Jakarta
process.env.TZ = 'Asia/Jakarta';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Trust proxy for Docker
  app.set('trust proxy', 1);
  
  // Cookie parser
  app.use(cookieParser());
  
  // Session configuration
  app.use(
    session({
      name: 'sobatkereta.sid',
      secret: process.env.SESSION_SECRET || 'train-booking-secret-key-2026-super-secure',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      },
    }),
  );
  
  // View engine setup with express-handlebars
  const viewsPath = join(__dirname, '..', 'src', 'views');
  const publicPath = join(__dirname, '..', 'public');
  
  app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: join(viewsPath, 'layouts'),
    partialsDir: join(viewsPath, 'partials'),
    helpers: {
      eq: function(a: any, b: any) {
        return a === b;
      },
      formatDate: function(date: Date) {
        if (!date) return '';
        return new Date(date).toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
      formatDateShort: function(date: Date) {
        if (!date) return '';
        return new Date(date).toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
      formatTime: function(date: Date) {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
      formatPrice: function(price: number) {
        if (!price && price !== 0) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(price);
      },
      formatBalance: function(balance: number) {
        if (!balance && balance !== 0) return 'Rp 0';
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(balance);
      },
      gt: function(a: any, b: any) {
        return Number(a) > Number(b);
      },
      lt: function(a: any, b: any) {
        return Number(a) < Number(b);
      },
      gte: function(a: any, b: any) {
        return Number(a) >= Number(b);
      },
      or: function(a: any, b: any) {
        return a || b;
      },
      and: function(a: any, b: any) {
        return a && b;
      },
      not: function(a: any) {
        return !a;
      },
    }
  }));
  
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('hbs');
  app.useStaticAssets(publicPath);
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running at http://localhost:${port} (Timezone: Asia/Jakarta)`);
}
bootstrap();
